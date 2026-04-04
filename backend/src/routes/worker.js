'use strict';

const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');

const router = Router();

/**
 * POST /worker
 * Register a new worker (or foreman).
 */
router.post('/', (req, res) => {
  const { farm_id, name, phone, photo_url, role, liquid_address, lightning_address } = req.body;

  if (!farm_id || !name) {
    return res.status(400).json({ error: 'farm_id and name are required' });
  }

  const db = getDb();

  // Verify farm exists
  const farm = db.prepare('SELECT id FROM farms WHERE id = ?').get(farm_id);
  if (!farm) return res.status(404).json({ error: 'Farm not found' });

  const validRoles = ['worker', 'foreman'];
  const workerRole = validRoles.includes(role) ? role : 'worker';

  // Generate simulated Liquid address if not provided
  const liqAddr = liquid_address || ('liq1q' + uuidv4().replace(/-/g, '').slice(0, 38));

  const id = uuidv4();
  db.prepare(`
    INSERT INTO workers (id, farm_id, name, phone, photo_url, role, liquid_address, lightning_address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, farm_id, name, phone || null, photo_url || null, workerRole, liqAddr, lightning_address || null);

  const worker = db.prepare('SELECT * FROM workers WHERE id = ?').get(id);
  res.status(201).json(worker);
});

/**
 * GET /worker/:id
 * Get a worker's profile.
 */
router.get('/:id', (req, res) => {
  const worker = getDb().prepare('SELECT * FROM workers WHERE id = ?').get(req.params.id);
  if (!worker) return res.status(404).json({ error: 'Worker not found' });
  res.json(worker);
});

/**
 * GET /worker/:id/payments
 * Payment history for a worker.
 */
router.get('/:id/payments', (req, res) => {
  const db = getDb();
  const worker = db.prepare('SELECT id, name FROM workers WHERE id = ?').get(req.params.id);
  if (!worker) return res.status(404).json({ error: 'Worker not found' });

  const payments = db.prepare(`
    SELECT p.*, s.date as shift_date
    FROM payments p
    JOIN shifts s ON s.id = p.shift_id
    WHERE p.worker_id = ?
    ORDER BY p.created_at DESC
  `).all(req.params.id);

  const totalPaid = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount_sats, 0);

  res.json({ worker, payments, total_paid_sats: totalPaid });
});

/**
 * GET /worker
 * List workers (optionally filtered by farm_id).
 */
router.get('/', (req, res) => {
  const { farm_id } = req.query;
  const db = getDb();

  const workers = farm_id
    ? db.prepare('SELECT * FROM workers WHERE farm_id = ? ORDER BY name').all(farm_id)
    : db.prepare('SELECT * FROM workers ORDER BY name').all();

  res.json(workers);
});

module.exports = router;
