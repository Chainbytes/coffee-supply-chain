'use strict';

/**
 * SQLite database layer — uses the built-in node:sqlite module (Node >= 22.5).
 * No native compilation required.
 *
 * node:sqlite API: https://nodejs.org/api/sqlite.html
 */

const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const schema = require('./schema');

const DB_PATH = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(__dirname, '..', '..', 'coffee.db');

let _db = null;

/**
 * Return (and lazily initialise) the singleton SQLite connection.
 */
function getDb() {
  if (_db) return _db;

  _db = new DatabaseSync(DB_PATH);

  // WAL mode for better concurrent reads; enforce foreign keys
  _db.exec('PRAGMA journal_mode = WAL');
  _db.exec('PRAGMA foreign_keys = ON');

  // Initialise schema
  _db.exec(schema.CREATE_FARMS);
  _db.exec(schema.CREATE_WORKERS);
  _db.exec(schema.CREATE_SHIFTS);
  _db.exec(schema.CREATE_CHECKINS);
  _db.exec(schema.CREATE_LOTS);
  _db.exec(schema.CREATE_TRANSFERS);
  _db.exec(schema.CREATE_PAYMENTS);

  return _db;
}

/** Close the connection — primarily used in tests. */
function closeDb() {
  if (_db) {
    _db.close();
    _db = null;
  }
}

module.exports = { getDb, closeDb };
