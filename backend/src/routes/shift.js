'use strict';

const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const { getDb } = require('../db');
const liquid = require('../lib/liquid');

const router = Router();

const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:3000';

/**
 * POST /shift
 * Create a new shift session. Returns QR data and a base64 QR image.
 */
router.post('/', async (req, res) => {
  const { farm_id, foreman_id, date } = req.body;

  if (!farm_id || !foreman_id) {
    return res.status(400).json({ error: 'farm_id and foreman_id are required' });
  }

  const db = getDb();

  const farm = db.prepare('SELECT id FROM farms WHERE id = ?').get(farm_id);
  if (!farm) return res.status(404).json({ error: 'Farm not found' });

  const foreman = db.prepare("SELECT id FROM workers WHERE id = ? AND role = 'foreman'").get(foreman_id);
  if (!foreman) return res.status(404).json({ error: 'Foreman not found' });

  const shiftDate = date || new Date().toISOString().slice(0, 10);
  const id = uuidv4();

  // QR payload: includes checkin URL so workers scanning get the right endpoint
  const qrPayload = {
    shiftId: id,
    farmId: farm_id,
    foremanId: foreman_id,
    date: shiftDate,
    checkinUrl: `${APP_BASE_URL}/shift/${id}/checkin`,
    expiresAt: new Date(Date.now() + 8 * 3600000).toISOString(),
  };
  const qrData = JSON.stringify(qrPayload);

  // Generate QR image (data URL)
  const qrImage = await QRCode.toDataURL(JSON.stringify(qrPayload), {
    errorCorrectionLevel: 'M',
    width: 300,
  });

  db.prepare(`
    INSERT INTO shifts (id, farm_id, foreman_id, date, status, qr_data)
    VALUES (?, ?, ?, ?, 'open', ?)
  `).run(id, farm_id, foreman_id, shiftDate, qrData);

  const shift = db.prepare('SELECT * FROM shifts WHERE id = ?').get(id);
  res.status(201).json({ ...shift, qr_image: qrImage, qr_payload: qrPayload });
});

/**
 * POST /shift/:id/checkin
 * Worker checks in to a shift.
 */
router.post('/:id/checkin', (req, res) => {
  const { worker_id, signature } = req.body;

  if (!worker_id) {
    return res.status(400).json({ error: 'worker_id is required' });
  }

  const db = getDb();

  const shift = db.prepare('SELECT * FROM shifts WHERE id = ?').get(req.params.id);
  if (!shift) return res.status(404).json({ error: 'Shift not found' });
  if (shift.status === 'closed') return res.status(409).json({ error: 'Shift is closed' });

  let worker = db.prepare('SELECT * FROM workers WHERE id = ?').get(worker_id);

  // Auto-register unknown worker so mobile self-check-in flows work without
  // a prior registration step.
  if (!worker) {
    const autoName = `Worker ${worker_id.slice(0, 6)}`;
    const liqAddr = 'liq1q' + worker_id.replace(/-/g, '').slice(0, 38);
    db.prepare(`
      INSERT INTO workers (id, farm_id, name, role, liquid_address)
      VALUES (?, ?, ?, 'worker', ?)
    `).run(worker_id, shift.farm_id, autoName, liqAddr);
    worker = db.prepare('SELECT * FROM workers WHERE id = ?').get(worker_id);
    console.log(`[checkin] auto-registered worker ${worker_id} as "${autoName}" on farm ${shift.farm_id}`);
  }

  // Check for duplicate
  const existing = db.prepare(
    'SELECT id FROM checkins WHERE shift_id = ? AND worker_id = ?'
  ).get(req.params.id, worker_id);
  if (existing) return res.status(409).json({ error: 'Worker already checked in', checkin_id: existing.id });

  const id = uuidv4();
  db.prepare(`
    INSERT INTO checkins (id, shift_id, worker_id, signature)
    VALUES (?, ?, ?, ?)
  `).run(id, req.params.id, worker_id, signature || null);

  const checkin = db.prepare('SELECT * FROM checkins WHERE id = ?').get(id);
  res.status(201).json({ checkin, worker: { id: worker.id, name: worker.name } });
});

/**
 * POST /shift/:id/close
 * Foreman closes a shift. Attendance batch is recorded to "Liquid".
 */
router.post('/:id/close', async (req, res) => {
  const db = getDb();

  const shift = db.prepare('SELECT * FROM shifts WHERE id = ?').get(req.params.id);
  if (!shift) return res.status(404).json({ error: 'Shift not found' });
  if (shift.status === 'closed') return res.status(409).json({ error: 'Shift already closed' });

  // Gather checked-in workers
  const checkins = db.prepare(`
    SELECT c.*, w.liquid_address, w.name
    FROM checkins c
    JOIN workers w ON w.id = c.worker_id
    WHERE c.shift_id = ?
  `).all(req.params.id);

  if (checkins.length === 0) {
    return res.status(400).json({ error: 'No workers checked in to this shift' });
  }

  // Record to Liquid (simulated)
  const liquidRecord = await liquid.recordShiftOnLiquid({
    shiftId: shift.id,
    farmId: shift.farm_id,
    workerAddresses: checkins.map(c => c.liquid_address),
    timestamp: new Date().toISOString(),
  });

  const closedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
  db.prepare(`
    UPDATE shifts
    SET status = 'closed', liquid_tx = ?, closed_at = ?
    WHERE id = ?
  `).run(liquidRecord.asset_id, closedAt, req.params.id);

  const updated = db.prepare('SELECT * FROM shifts WHERE id = ?').get(req.params.id);
  res.json({
    shift: updated,
    checkin_count: checkins.length,
    liquid_record: liquidRecord,
    workers: checkins.map(c => ({ id: c.worker_id, name: c.name })),
  });
});

/**
 * GET /shift/:id
 * Get shift details with check-ins.
 */
router.get('/:id', (req, res) => {
  const db = getDb();
  const shift = db.prepare('SELECT * FROM shifts WHERE id = ?').get(req.params.id);
  if (!shift) return res.status(404).json({ error: 'Shift not found' });

  const checkins = db.prepare(`
    SELECT c.id, c.checked_in_at, c.signature,
           w.id as worker_id, w.name, w.liquid_address
    FROM checkins c
    JOIN workers w ON w.id = c.worker_id
    WHERE c.shift_id = ?
    ORDER BY c.checked_in_at
  `).all(req.params.id);

  res.json({ ...shift, checkins });
});

module.exports = router;
