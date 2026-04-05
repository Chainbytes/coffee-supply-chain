'use strict';

const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');
const lightning = require('../lib/lightning');

const router = Router();

/**
 * POST /payroll
 * Pay all workers for a given shift via Lightning.
 *
 * Body:
 *   shift_id       — required
 *   amount_sats    — optional override; when omitted each worker's
 *                    configured pay_rate_sats is used instead
 *   worker_ids     — optional array; defaults to all checked-in workers
 */
router.post('/', async (req, res) => {
  const { shift_id, amount_sats, worker_ids } = req.body;

  if (!shift_id) {
    return res.status(400).json({ error: 'shift_id is required' });
  }

  const db = getDb();

  const shift = db.prepare('SELECT * FROM shifts WHERE id = ?').get(shift_id);
  if (!shift) return res.status(404).json({ error: 'Shift not found' });
  if (shift.status !== 'closed') {
    return res.status(409).json({ error: 'Shift must be closed before processing payroll' });
  }

  // Determine which workers to pay
  let workers;
  if (worker_ids && Array.isArray(worker_ids) && worker_ids.length > 0) {
    const placeholders = worker_ids.map(() => '?').join(', ');
    workers = db.prepare(`
      SELECT w.id, w.name, w.lightning_address, w.pay_rate_sats, w.overtime_multiplier
      FROM checkins c
      JOIN workers w ON w.id = c.worker_id
      WHERE c.shift_id = ? AND w.id IN (${placeholders})
    `).all(shift_id, ...worker_ids);
  } else {
    workers = db.prepare(`
      SELECT w.id, w.name, w.lightning_address, w.pay_rate_sats, w.overtime_multiplier
      FROM checkins c
      JOIN workers w ON w.id = c.worker_id
      WHERE c.shift_id = ?
    `).all(shift_id);
  }

  if (workers.length === 0) {
    return res.status(400).json({ error: 'No eligible workers found for this shift' });
  }

  // Check for already-paid workers in this shift
  const alreadyPaid = db.prepare(`
    SELECT worker_id FROM payments WHERE shift_id = ? AND status = 'paid'
  `).all(shift_id).map(r => r.worker_id);

  const unpaidWorkers = workers.filter(w => !alreadyPaid.includes(w.id));
  if (unpaidWorkers.length === 0) {
    return res.status(409).json({ error: 'All workers for this shift have already been paid' });
  }

  const results = [];
  const farmRow = db.prepare('SELECT name FROM farms WHERE id = ?').get(shift.farm_id);
  const farmName = farmRow ? farmRow.name : 'Farm';

  const insertPayment = db.prepare(`
    INSERT INTO payments (id, worker_id, shift_id, amount_sats, lightning_invoice, payment_hash, status, paid_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const worker of unpaidWorkers) {
    try {
      // Use per-worker configured rate unless a global override was supplied
      const workerSats = amount_sats !== undefined
        ? Number(amount_sats)
        : (worker.pay_rate_sats || 5000);

      const memo = `${farmName} — shift ${shift.date} — ${worker.name}`;
      const invoice = await lightning.createInvoice({ amountSats: workerSats, memo });

      // In production, you'd wait for the worker to present a real invoice.
      // For this prototype, we immediately mark as paid.
      const paidAt = new Date().toISOString().replace('T', ' ').slice(0, 19);

      const paymentId = uuidv4();
      insertPayment.run(
        paymentId,
        worker.id,
        shift_id,
        workerSats,
        invoice.payment_request,
        invoice.payment_hash,
        'paid',
        paidAt
      );

      results.push({
        worker_id: worker.id,
        worker_name: worker.name,
        payment_id: paymentId,
        amount_sats: workerSats,
        invoice: invoice.payment_request,
        payment_hash: invoice.payment_hash,
        status: 'paid',
        demo: invoice.demo || false,
      });
    } catch (err) {
      results.push({
        worker_id: worker.id,
        worker_name: worker.name,
        status: 'failed',
        error: err.message,
      });
    }
  }

  const paid = results.filter(r => r.status === 'paid');
  const failed = results.filter(r => r.status === 'failed');
  const totalSatsPaid = paid.reduce((sum, r) => sum + r.amount_sats, 0);

  res.status(paid.length > 0 ? 201 : 500).json({
    shift_id,
    shift_date: shift.date,
    total_workers: unpaidWorkers.length,
    paid_count: paid.length,
    failed_count: failed.length,
    total_sats_paid: totalSatsPaid,
    payments: results,
    lightning_demo_mode: lightning.DEMO_MODE,
  });
});

module.exports = router;
