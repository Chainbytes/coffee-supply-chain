'use strict';

const { getDb } = require('../db');

const ONE_HOUR_MS = 60 * 60 * 1000;

/**
 * Delete closed shifts (and their checkins/payments) older than 24 hours.
 * Keeps the database lean — mirrors the old app's cleanup behavior.
 */
function cleanupOldShifts() {
  const db = getDb();
  const cutoff = new Date(Date.now() - 24 * ONE_HOUR_MS).toISOString();

  const stale = db.prepare(
    `SELECT id FROM shifts WHERE status = 'closed' AND closed_at < ?`
  ).all(cutoff);

  if (stale.length === 0) return 0;

  const ids = stale.map(r => r.id);
  const placeholders = ids.map(() => '?').join(',');

  db.prepare(`DELETE FROM checkins WHERE shift_id IN (${placeholders})`).run(...ids);
  db.prepare(`DELETE FROM payments WHERE shift_id IN (${placeholders})`).run(...ids);
  const result = db.prepare(`DELETE FROM shifts WHERE id IN (${placeholders})`).run(...ids);

  console.log(`[shift-cleanup] Removed ${result.changes} stale shift(s) closed before ${cutoff}`);
  return result.changes;
}

let timer = null;

function startShiftCleanup() {
  cleanupOldShifts(); // run once on boot
  timer = setInterval(cleanupOldShifts, ONE_HOUR_MS);
  console.log('[shift-cleanup] Hourly cleanup scheduled');
}

function stopShiftCleanup() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

module.exports = { cleanupOldShifts, startShiftCleanup, stopShiftCleanup };
