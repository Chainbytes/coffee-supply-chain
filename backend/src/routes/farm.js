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

module.exports = router;
