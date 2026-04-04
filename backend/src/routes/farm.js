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
 * GET /farm/:id/export?format=csv&shift_id=...
 * Export payroll data as CSV for labor compliance.
 *
 * Query params:
 *   format   — 'csv' (default, only option for now)
 *   shift_id — optional; filter to a single shift
 */
router.get('/:id/export', (req, res) => {
  const db = getDb();
  const farm = db.prepare('SELECT * FROM farms WHERE id = ?').get(req.params.id);
  if (!farm) return res.status(404).json({ error: 'Farm not found' });

  const format = (req.query.format || 'csv').toLowerCase();
  if (format !== 'csv') {
    return res.status(400).json({ error: 'Unsupported format. Use csv.' });
  }

  let query = `
    SELECT
      w.name       AS worker_name,
      w.phone      AS worker_phone,
      s.date       AS shift_date,
      s.id         AS shift_id,
      c.checked_in_at,
      p.amount_sats,
      p.status     AS payment_status,
      p.paid_at
    FROM checkins c
    JOIN workers w ON w.id = c.worker_id
    JOIN shifts  s ON s.id = c.shift_id
    LEFT JOIN payments p ON p.worker_id = c.worker_id AND p.shift_id = c.shift_id
    WHERE s.farm_id = ?
  `;
  const params = [req.params.id];

  if (req.query.shift_id) {
    query += ' AND s.id = ?';
    params.push(req.query.shift_id);
  }

  query += ' ORDER BY s.date DESC, w.name ASC';

  const rows = db.prepare(query).all(...params);

  if (rows.length === 0) {
    return res.status(200)
      .set('Content-Type', 'text/csv')
      .set('Content-Disposition', `attachment; filename="${farm.name}_payroll.csv"`)
      .send('worker_name,worker_phone,shift_date,shift_id,checked_in_at,amount_sats,payment_status,paid_at\n');
  }

  const header = 'worker_name,worker_phone,shift_date,shift_id,checked_in_at,amount_sats,payment_status,paid_at';
  const csvRows = rows.map(r => {
    const escapeCsv = (val) => {
      if (val == null) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    };
    return [
      escapeCsv(r.worker_name),
      escapeCsv(r.worker_phone),
      escapeCsv(r.shift_date),
      escapeCsv(r.shift_id),
      escapeCsv(r.checked_in_at),
      escapeCsv(r.amount_sats),
      escapeCsv(r.payment_status),
      escapeCsv(r.paid_at),
    ].join(',');
  });

  const csv = [header, ...csvRows].join('\n') + '\n';

  res.status(200)
    .set('Content-Type', 'text/csv')
    .set('Content-Disposition', `attachment; filename="${farm.name}_payroll.csv"`)
    .send(csv);
});

module.exports = router;
