'use strict';

/**
 * SQLite schema for the coffee supply chain prototype.
 *
 * Design notes:
 *   - Liquid asset IDs are stored as TEXT (64-char hex in production).
 *     In this prototype they are UUIDs prefixed with "liq_" to make the
 *     "would be on Liquid" intent obvious while keeping the DB portable.
 *   - The transfers table mirrors the structure of a Liquid asset transfer:
 *     asset_id, from/to entity, timestamp, and arbitrary JSON metadata.
 *   - Lightning invoices are stored verbatim so status can be polled later.
 */

const CREATE_FARMS = `
CREATE TABLE IF NOT EXISTS farms (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  location    TEXT NOT NULL,
  altitude_m  INTEGER NOT NULL,
  owner_name  TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);`;

const CREATE_WORKERS = `
CREATE TABLE IF NOT EXISTS workers (
  id                TEXT PRIMARY KEY,
  farm_id           TEXT NOT NULL REFERENCES farms(id),
  name              TEXT NOT NULL,
  phone             TEXT,
  photo_url         TEXT,
  role              TEXT NOT NULL DEFAULT 'worker',  -- 'worker' | 'foreman'
  liquid_address    TEXT,
  lightning_address TEXT,
  pay_rate_sats     INTEGER NOT NULL DEFAULT 5000,
  overtime_multiplier REAL NOT NULL DEFAULT 1.5,
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);`;

const CREATE_SHIFTS = `
CREATE TABLE IF NOT EXISTS shifts (
  id          TEXT PRIMARY KEY,
  farm_id     TEXT NOT NULL REFERENCES farms(id),
  foreman_id  TEXT NOT NULL REFERENCES workers(id),
  date        TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'open',   -- 'open' | 'closed'
  qr_data     TEXT,                           -- JSON payload embedded in QR
  liquid_tx   TEXT,                           -- simulated Liquid asset ID for batch record
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  closed_at   TEXT
);`;

const CREATE_CHECKINS = `
CREATE TABLE IF NOT EXISTS checkins (
  id             TEXT PRIMARY KEY,
  shift_id       TEXT NOT NULL REFERENCES shifts(id),
  worker_id      TEXT NOT NULL REFERENCES workers(id),
  checked_in_at  TEXT NOT NULL DEFAULT (datetime('now')),
  signature      TEXT,                        -- worker's signed attestation (simulated)
  UNIQUE(shift_id, worker_id)
);`;

const CREATE_LOTS = `
CREATE TABLE IF NOT EXISTS lots (
  id         TEXT PRIMARY KEY,
  shift_id   TEXT NOT NULL REFERENCES shifts(id),
  farm_id    TEXT NOT NULL REFERENCES farms(id),
  weight_kg  REAL NOT NULL,
  grade      TEXT NOT NULL,                   -- 'A' | 'B' | 'C'
  gps_lat    REAL,
  gps_lng    REAL,
  asset_id   TEXT UNIQUE,                     -- simulated Liquid asset ID
  notes      TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);`;

const CREATE_TRANSFERS = `
CREATE TABLE IF NOT EXISTS transfers (
  id          TEXT PRIMARY KEY,
  lot_id      TEXT NOT NULL REFERENCES lots(id),
  from_entity TEXT NOT NULL,
  to_entity   TEXT NOT NULL,
  entity_type TEXT NOT NULL,   -- 'farm' | 'wet_mill' | 'dry_mill' | 'exporter' | 'roaster'
  metadata    TEXT,            -- JSON string with processing details
  timestamp   TEXT NOT NULL DEFAULT (datetime('now'))
);`;

const CREATE_PAYMENTS = `
CREATE TABLE IF NOT EXISTS payments (
  id                TEXT PRIMARY KEY,
  worker_id         TEXT NOT NULL REFERENCES workers(id),
  shift_id          TEXT NOT NULL REFERENCES shifts(id),
  amount_sats       INTEGER NOT NULL,
  lightning_invoice TEXT,
  payment_hash      TEXT,
  status            TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'paid' | 'failed'
  paid_at           TEXT,
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);`;

module.exports = {
  CREATE_FARMS,
  CREATE_WORKERS,
  CREATE_SHIFTS,
  CREATE_CHECKINS,
  CREATE_LOTS,
  CREATE_TRANSFERS,
  CREATE_PAYMENTS,
};
