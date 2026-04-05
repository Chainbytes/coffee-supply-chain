'use strict';

const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');

const router = Router();

/**
 * POST /farm
 * Register a new farm.
 */
router.post('/', (req, res) => {
  const { name, location, altitude_m, owner_name } = req.body;

  if (!name || !location || !altitude_m || !owner_name) {
    return res.status(400).json({ error: 'name, location, altitude_m, and owner_name are required' });
  }

  const db = getDb();
  const id = uuidv4();

  db.prepare(`
    INSERT INTO farms (id, name, location, altitude_m, owner_name)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, name, location, Number(altitude_m), owner_name);

  const farm = db.prepare('SELECT * FROM farms WHERE id = ?').get(id);
  res.status(201).json(farm);
});

/**
 * GET /farm
 * List all farms.
 */
router.get('/', (req, res) => {
  const farms = getDb().prepare('SELECT * FROM farms ORDER BY created_at DESC').all();
  res.json(farms);
});

/**
 * GET /farm/:id
 * Get a single farm with worker count.
 */
router.get('/:id', (req, res) => {
  const db = getDb();
  const farm = db.prepare('SELECT * FROM farms WHERE id = ?').get(req.params.id);
  if (!farm) return res.status(404).json({ error: 'Farm not found' });

  const workerCount = db.prepare(
    "SELECT COUNT(*) as count FROM workers WHERE farm_id = ? AND role = 'worker'"
  ).get(req.params.id).count;

  res.json({ ...farm, worker_count: workerCount });
});

/**
 * GET /farm/:id/analytics
 * Farm analytics: worker count, shift count, lot count, total check-ins,
 * total payments in sats, recent shifts with per-shift worker counts, and
 * recent check-ins.
 */
router.get('/:id/analytics', (req, res) => {
  const db = getDb();
  const farm = db.prepare('SELECT * FROM farms WHERE id = ?').get(req.params.id);
  if (!farm) return res.status(404).json({ error: 'Farm not found' });

  const { id: farmId } = req.params;

  const worker_count = db.prepare(
    'SELECT COUNT(*) as count FROM workers WHERE farm_id = ?'
  ).get(farmId).count;

  const shift_count = db.prepare(
    'SELECT COUNT(*) as count FROM shifts WHERE farm_id = ?'
  ).get(farmId).count;

  const lot_count = db.prepare(
    'SELECT COUNT(*) as count FROM lots WHERE farm_id = ?'
  ).get(farmId).count;

  const total_checkins = db.prepare(`
    SELECT COUNT(*) as count
    FROM checkins c
    JOIN shifts s ON c.shift_id = s.id
    WHERE s.farm_id = ?
  `).get(farmId).count;

  const total_payments_sats = db.prepare(`
    SELECT COALESCE(SUM(p.amount_sats), 0) as total
    FROM payments p
    JOIN shifts s ON p.shift_id = s.id
    WHERE s.farm_id = ?
  `).get(farmId).total;

  // Recent shifts with a per-shift check-in count (worker_count field per spec)
  const recentShiftRows = db.prepare(
    'SELECT id, date, status, created_at, closed_at FROM shifts WHERE farm_id = ? ORDER BY created_at DESC LIMIT 5'
  ).all(farmId);

  const countCheckinsByShift = db.prepare(
    'SELECT COUNT(*) as count FROM checkins WHERE shift_id = ?'
  );

  const recent_shifts = recentShiftRows.map(s => ({
    id:           s.id,
    date:         s.date,
    status:       s.status,
    worker_count: countCheckinsByShift.get(s.id).count,
  }));

  const recent_checkins = db.prepare(`
    SELECT c.id, c.worker_id, w.name as worker_name, c.checked_in_at, c.shift_id
    FROM checkins c
    JOIN shifts s ON c.shift_id = s.id
    JOIN workers w ON c.worker_id = w.id
    WHERE s.farm_id = ?
    ORDER BY c.checked_in_at DESC LIMIT 10
  `).all(farmId);

  res.json({
    farm_id:             farmId,
    farm_name:           farm.name,
    worker_count,
    shift_count,
    lot_count,
    total_checkins,
    total_payments_sats,
    recent_shifts,
    recent_checkins,
  });
});

/**
 * GET /farm/:id/pay-rates
 * List all workers on a farm with their configured pay rates.
 */
router.get('/:id/pay-rates', (req, res) => {
  const db = getDb();
  const farm = db.prepare('SELECT id FROM farms WHERE id = ?').get(req.params.id);
  if (!farm) return res.status(404).json({ error: 'Farm not found' });

  const workers = db.prepare(`
    SELECT id, name, role, pay_rate_sats, overtime_multiplier
    FROM workers
    WHERE farm_id = ?
    ORDER BY name
  `).all(req.params.id);

  res.json({ farm_id: req.params.id, workers });
});

module.exports = router;
