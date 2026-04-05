'use strict';

/**
 * Database backup utility.
 *
 * - Copies coffee.db to backups/coffee-YYYY-MM-DD-HHmmss.db
 * - Keeps the 7 most recent backups; deletes older ones
 *
 * Can be run directly:  node src/scripts/backup.js
 * Or via npm script:    npm run backup
 */

const fs   = require('fs');
const path = require('path');

const BACKUP_KEEP = 7;

/** Resolve the source DB path the same way db/index.js does. */
function getDbPath() {
  if (process.env.DB_PATH) return path.resolve(process.env.DB_PATH);
  return path.join(__dirname, '..', '..', 'coffee.db');
}

/** backups/ directory sits next to the backend package root. */
function getBackupDir() {
  return path.join(__dirname, '..', '..', 'backups');
}

/**
 * Copy source → dest using streams so we never load the whole file into RAM.
 * @param {string} src
 * @param {string} dest
 * @returns {Promise<void>}
 */
function copyFile(src, dest) {
  return new Promise((resolve, reject) => {
    const rd = fs.createReadStream(src);
    const wr = fs.createWriteStream(dest);
    rd.on('error', reject);
    wr.on('error', reject);
    wr.on('finish', resolve);
    rd.pipe(wr);
  });
}

/**
 * Perform a backup and prune old backups.
 *
 * @returns {Promise<{ dest: string, pruned: string[] }>}
 */
async function runBackup() {
  const dbPath    = getDbPath();
  const backupDir = getBackupDir();

  if (!fs.existsSync(dbPath)) {
    throw new Error(`Source database not found: ${dbPath}`);
  }

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // Build timestamp: YYYY-MM-DD-HHmmss (no colons — safe on all file systems)
  const now = new Date();
  const ts  = now.toISOString()
    .replace('T', '-')
    .replace(/:/g, '')
    .slice(0, 17); // "2026-04-04-120000"

  const dest = path.join(backupDir, `coffee-${ts}.db`);
  await copyFile(dbPath, dest);

  // Prune: keep only the BACKUP_KEEP most recent .db files
  const files = fs.readdirSync(backupDir)
    .filter(f => f.startsWith('coffee-') && f.endsWith('.db'))
    .map(f => ({ name: f, full: path.join(backupDir, f) }))
    .sort((a, b) => b.name.localeCompare(a.name)); // newest first (lexicographic on ts)

  const pruned = [];
  for (const file of files.slice(BACKUP_KEEP)) {
    fs.unlinkSync(file.full);
    pruned.push(file.name);
  }

  return { dest, pruned };
}

// ------------------------------------------------------------------ CLI entry
if (require.main === module) {
  require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '.env') });

  runBackup()
    .then(({ dest, pruned }) => {
      console.log(`[backup] Saved: ${dest}`);
      if (pruned.length > 0) {
        console.log(`[backup] Pruned ${pruned.length} old backup(s): ${pruned.join(', ')}`);
      }
      process.exit(0);
    })
    .catch(err => {
      console.error('[backup] Error:', err.message);
      process.exit(1);
    });
}

module.exports = { runBackup };
