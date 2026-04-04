'use strict';

const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const { getDb } = require('../db');
const liquid = require('../lib/liquid');

const router = Router();

const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:3000';

/**
 * POST /lot
 * Create a harvest lot linked to a closed shift.
 */
router.post('/', async (req, res) => {
  const { shift_id, weight_kg, grade, gps_lat, gps_lng, notes } = req.body;

  if (!shift_id || !weight_kg || !grade) {
    return res.status(400).json({ error: 'shift_id, weight_kg, and grade are required' });
  }

  const validGrades = ['A', 'B', 'C'];
  if (!validGrades.includes(grade)) {
    return res.status(400).json({ error: `grade must be one of: ${validGrades.join(', ')}` });
  }

  const db = getDb();

  const shift = db.prepare('SELECT * FROM shifts WHERE id = ?').get(shift_id);
  if (!shift) return res.status(404).json({ error: 'Shift not found' });
  if (shift.status !== 'closed') {
    return res.status(409).json({ error: 'Shift must be closed before creating a lot' });
  }

  const id = uuidv4();

  // Issue simulated Liquid asset
  const assetResult = await liquid.issueAsset({
    lotId: id,
    farmId: shift.farm_id,
    metadata: {
      shift_id,
      weight_kg: Number(weight_kg),
      grade,
      gps_lat: gps_lat ? Number(gps_lat) : null,
      gps_lng: gps_lng ? Number(gps_lng) : null,
      notes,
    },
  });

  db.prepare(`
    INSERT INTO lots (id, shift_id, farm_id, weight_kg, grade, gps_lat, gps_lng, asset_id, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, shift_id, shift.farm_id,
    Number(weight_kg), grade,
    gps_lat ? Number(gps_lat) : null,
    gps_lng ? Number(gps_lng) : null,
    assetResult.asset_id,
    notes || null
  );

  // Record the origin transfer (farm → farm = "harvest" event)
  const farm = db.prepare('SELECT * FROM farms WHERE id = ?').get(shift.farm_id);
  const workers = db.prepare(`
    SELECT w.name FROM checkins c JOIN workers w ON w.id = c.worker_id
    WHERE c.shift_id = ?
  `).all(shift_id);

  db.prepare(`
    INSERT INTO transfers (id, lot_id, from_entity, to_entity, entity_type, metadata, timestamp)
    VALUES (?, ?, ?, ?, 'farm', ?, datetime('now'))
  `).run(
    uuidv4(), id,
    farm.name, farm.name,
    JSON.stringify({
      action: 'harvest',
      weight_kg: Number(weight_kg),
      grade,
      workers: workers.map(w => w.name),
      shift_date: shift.date,
      notes,
    })
  );

  const lot = db.prepare('SELECT * FROM lots WHERE id = ?').get(id);
  const provenanceUrl = `${APP_BASE_URL}/provenance/${id}`;
  const qrImage = await QRCode.toDataURL(provenanceUrl, { width: 300 });

  res.status(201).json({
    lot,
    asset: assetResult,
    provenance_url: provenanceUrl,
    qr_image: qrImage,
  });
});

/**
 * POST /lot/:id/transfer
 * Record a custody transfer for a lot.
 */
router.post('/:id/transfer', async (req, res) => {
  const { to_entity, entity_type, metadata } = req.body;

  if (!to_entity || !entity_type) {
    return res.status(400).json({ error: 'to_entity and entity_type are required' });
  }

  const validTypes = ['wet_mill', 'dry_mill', 'exporter', 'roaster'];
  if (!validTypes.includes(entity_type)) {
    return res.status(400).json({ error: `entity_type must be one of: ${validTypes.join(', ')}` });
  }

  const db = getDb();
  const lot = db.prepare('SELECT * FROM lots WHERE id = ?').get(req.params.id);
  if (!lot) return res.status(404).json({ error: 'Lot not found' });

  // Find the current holder (last transfer's to_entity)
  const lastTransfer = db.prepare(`
    SELECT to_entity FROM transfers WHERE lot_id = ? ORDER BY timestamp DESC LIMIT 1
  `).get(req.params.id);

  const fromEntity = lastTransfer ? lastTransfer.to_entity : 'Unknown';

  // Record simulated Liquid asset transfer
  const liquidTx = await liquid.transferAsset({
    assetId: lot.asset_id,
    fromAddress: fromEntity,
    toAddress: to_entity,
    metadata,
  });

  const transferId = uuidv4();
  db.prepare(`
    INSERT INTO transfers (id, lot_id, from_entity, to_entity, entity_type, metadata, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(
    transferId, req.params.id,
    fromEntity, to_entity,
    entity_type,
    metadata ? JSON.stringify(metadata) : null
  );

  const transfer = db.prepare('SELECT * FROM transfers WHERE id = ?').get(transferId);
  res.status(201).json({ transfer, liquid_tx: liquidTx });
});

/**
 * GET /lot/:id/provenance
 * Full chain of custody for a lot (API endpoint).
 */
router.get('/:id/provenance', (req, res) => {
  res.redirect(`/provenance/${req.params.id}`);
});

/**
 * GET /lot/:id
 * Get lot details.
 */
router.get('/:id', (req, res) => {
  const db = getDb();
  const lot = db.prepare('SELECT * FROM lots WHERE id = ?').get(req.params.id);
  if (!lot) return res.status(404).json({ error: 'Lot not found' });

  const transfers = db.prepare(
    'SELECT * FROM transfers WHERE lot_id = ? ORDER BY timestamp'
  ).all(req.params.id);

  res.json({ lot, transfers });
});

module.exports = router;
