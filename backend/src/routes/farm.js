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
 * GET /farm/:id/export
 * Export payroll CSV for a farm.
 * Query params:
 *   from — optional start date (YYYY-MM-DD)
 *   to   — optional end date (YYYY-MM-DD)
 */
router.get('/:id/export', (req, res) => {
  const db = getDb();
  const farm = db.prepare('SELECT * FROM farms WHERE id = ?').get(req.params.id);
  if (!farm) return res.status(404).json({ error: 'Farm not found' });

  const { from, to } = req.query;

  let sql = `
    SELECT w.name AS worker_name, s.date AS shift_date,
           p.amount_sats, p.status, p.paid_at
    FROM payments p
    JOIN workers w ON w.id = p.worker_id
    JOIN shifts s ON s.id = p.shift_id
    WHERE s.farm_id = ?
  `;
  const params = [req.params.id];

  if (from) {
    sql += ' AND s.date >= ?';
    params.push(from);
  }
  if (to) {
    sql += ' AND s.date <= ?';
    params.push(to);
  }

  sql += ' ORDER BY s.date, w.name';

  const rows = db.prepare(sql).all(...params);

  const header = 'worker_name,shift_date,amount_sats,status,paid_at';
  const csvRows = rows.map(r =>
    [r.worker_name, r.shift_date, r.amount_sats, r.status, r.paid_at].join(',')
  );
  const csv = [header, ...csvRows].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${farm.name}-payroll.csv"`);
  res.send(csv);
});

module.exports = router;
