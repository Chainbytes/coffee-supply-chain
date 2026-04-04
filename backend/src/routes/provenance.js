'use strict';

const { Router } = require('express');
const path = require('path');
const { getDb } = require('../db');

const router = Router();

/**
 * GET /provenance/:lotId
 * Public provenance data for a lot — consumed by both the API and the frontend page.
 *
 * Returns everything needed to render the consumer provenance page:
 *   - farm info
 *   - lot details
 *   - workers who picked this lot (from the linked shift's checkins)
 *   - full custody chain (transfers)
 *   - payment summary
 */
router.get('/:lotId/data', (req, res) => {
  const db = getDb();

  const lot = db.prepare('SELECT * FROM lots WHERE id = ?').get(req.params.lotId);
  if (!lot) return res.status(404).json({ error: 'Lot not found' });

  const farm = db.prepare('SELECT * FROM farms WHERE id = ?').get(lot.farm_id);
  const shift = db.prepare('SELECT * FROM shifts WHERE id = ?').get(lot.shift_id);

  // Workers who picked this lot (via the linked shift)
  const workers = db.prepare(`
    SELECT w.name, w.photo_url,
           c.checked_in_at
    FROM checkins c
    JOIN workers w ON w.id = c.worker_id
    WHERE c.shift_id = ?
    ORDER BY c.checked_in_at
  `).all(lot.shift_id);

  // Full custody chain
  const transfers = db.prepare(`
    SELECT * FROM transfers WHERE lot_id = ? ORDER BY timestamp
  `).all(req.params.lotId).map(t => ({
    ...t,
    metadata: t.metadata ? JSON.parse(t.metadata) : null,
  }));

  // Payment summary (how many workers were paid, total sats)
  const paymentSummary = db.prepare(`
    SELECT COUNT(*) as worker_count, SUM(amount_sats) as total_sats
    FROM payments
    WHERE shift_id = ? AND status = 'paid'
  `).get(lot.shift_id);

  res.json({
    lot,
    farm,
    shift,
    workers,
    transfers,
    payment_summary: paymentSummary,
  });
});

/**
 * GET /provenance/:lotId
 * Serve the consumer provenance HTML page.
 */
router.get('/:lotId', (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', '..', 'frontend', 'index.html'));
});

module.exports = router;
