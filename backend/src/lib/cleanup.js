'use strict';

const { getDb } = require('../db');

const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
const MAX_AGE_HOURS = 24;

/**
 * Delete closed shifts (and their checkins) older than MAX_AGE_HOURS.
 * Returns the number of shifts removed.
 */
function cleanupOldShifts() {
  const db = getDb();
  const cutoff = new Date(Date.now() - MAX_AGE_HOURS * 3600000).toISOString();

  const oldShifts = db.prepare(`
    SELECT id FROM shifts
    WHERE status = 'closed' AND closed_at < ?
  `).all(cutoff);

  if (oldShifts.length === 0) return 0;

  const ids = oldShifts.map(s => s.id);

  const deleteCheckins = db.prepare('DELETE FROM checkins WHERE shift_id = ?');
  const deletePayments = db.prepare('DELETE FROM payments WHERE shift_id = ?');
  const deleteShift = db.prepare('DELETE FROM shifts WHERE id = ?');

  const cleanup = db.transaction((shiftIds) => {
    for (const id of shiftIds) {
      deleteCheckins.run(id);
      deletePayments.run(id);
      deleteShift.run(id);
    }
  });

  cleanup(ids);
  console.log(`[cleanup] Removed ${ids.length} closed shift(s) older than ${MAX_AGE_HOURS}h`);
  return ids.length;
}

/**
 * Start the periodic cleanup timer. Returns the interval handle.
 */
function startCleanupCron() {
  // Run once on startup
  cleanupOldShifts();
  return setInterval(cleanupOldShifts, CLEANUP_INTERVAL_MS);
}

module.exports = { cleanupOldShifts, startCleanupCron, CLEANUP_INTERVAL_MS, MAX_AGE_HOURS };
