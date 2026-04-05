'use strict';

const { Router } = require('express');
const { getDb } = require('../db');

const router = Router();

/**
 * GET /farm/:id/export
 * Export payroll data for a farm.
 *
 * Query params:
 *   format  — "csv" (default) | "json"
 *
 * CSV columns: worker_name, shift_date, checked_in_at, amount_sats, payment_status
 * Rows are workers × shifts where a check-in exists, with payment data joined in
 * (payment columns are empty strings / null when no payment record exists yet).
 */
router.get('/:id/export', (req, res) => {
  const db = getDb();
  const farm = db.prepare('SELECT id, name FROM farms WHERE id = ?').get(req.params.id);
  if (!farm) return res.status(404).json({ error: 'Farm not found' });

  const format = (req.query.format || 'csv').toLowerCase();
  if (format !== 'csv' && format !== 'json') {
    return res.status(400).json({ error: 'Invalid format. Must be "csv" or "json".' });
  }

  // Join workers → checkins → shifts → payments for this farm.
  // LEFT JOIN payments so rows without a payment record are still included.
  const rows = db.prepare(`
    SELECT
      w.name            AS worker_name,
      s.date            AS shift_date,
      c.checked_in_at,
      p.amount_sats,
      COALESCE(p.status, 'unpaid') AS payment_status
    FROM checkins c
    JOIN workers w  ON w.id = c.worker_id
    JOIN shifts  s  ON s.id = c.shift_id
    LEFT JOIN payments p ON p.worker_id = c.worker_id AND p.shift_id = c.shift_id
    WHERE s.farm_id = ?
    ORDER BY s.date DESC, c.checked_in_at ASC
  `).all(req.params.id);

  if (format === 'json') {
    return res.json(rows);
  }

  // ---- CSV output --------------------------------------------------------
  const HEADERS = ['worker_name', 'shift_date', 'checked_in_at', 'amount_sats', 'payment_status'];

  /**
   * Escape a single CSV field value.
   * Fields containing commas, double-quotes, or newlines are wrapped in quotes.
   */
  function escapeCsvField(value) {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  const lines = [
    HEADERS.join(','),
    ...rows.map(row =>
      HEADERS.map(h => escapeCsvField(row[h])).join(',')
    ),
  ];

  const csv = lines.join('\r\n');

  res.set('Content-Type', 'text/csv');
  res.set('Content-Disposition', 'attachment; filename=payroll-export.csv');
  res.send(csv);
});

module.exports = router;
