'use strict';

/**
 * API key authentication middleware.
 *
 * Keys are loaded from environment variables:
 *   ADMIN_KEY   — full access
 *   FOREMAN_KEY — foreman-level write access
 *   WORKER_KEY  — worker-level write access (e.g. lot transfers)
 *
 * If none of the keys are configured (dev mode), auth is skipped so the
 * server works out of the box without any configuration.
 *
 * Clients must send:
 *   Authorization: Bearer <key>
 */

const ADMIN_KEY   = process.env.ADMIN_KEY   || null;
const FOREMAN_KEY = process.env.FOREMAN_KEY || null;
const WORKER_KEY  = process.env.WORKER_KEY  || null;

/** True when at least one key is configured. */
const AUTH_ENABLED = !!(ADMIN_KEY || FOREMAN_KEY || WORKER_KEY);

/**
 * Build a set of valid keys for a given minimum role level.
 *
 * Role hierarchy (highest first): admin > foreman > worker
 *
 * @param {'admin'|'foreman'|'worker'} minRole
 * @returns {Set<string>}
 */
function allowedKeys(minRole) {
  const keys = new Set();
  if (ADMIN_KEY) keys.add(ADMIN_KEY);
  if (minRole === 'foreman' || minRole === 'worker') {
    if (FOREMAN_KEY) keys.add(FOREMAN_KEY);
  }
  if (minRole === 'worker') {
    if (WORKER_KEY) keys.add(WORKER_KEY);
  }
  return keys;
}

/**
 * Extract the Bearer token from the Authorization header, or null.
 * @param {import('express').Request} req
 * @returns {string|null}
 */
function extractToken(req) {
  const header = req.headers['authorization'] || '';
  const match = header.match(/^Bearer\s+(\S+)$/i);
  return match ? match[1] : null;
}

/**
 * Middleware factory — returns an Express middleware that enforces auth for
 * the specified minimum role.
 *
 * Usage:
 *   router.post('/', requireAuth('foreman'), handler)
 *   router.post('/payroll', requireAuth('admin'), handler)
 *
 * @param {'admin'|'foreman'|'worker'} minRole
 */
function requireAuth(minRole = 'worker') {
  return function authMiddleware(req, res, next) {
    // Skip auth entirely if no keys are configured (dev / test mode)
    if (!AUTH_ENABLED) return next();

    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({
        error: 'Authorization header required. Use: Authorization: Bearer <key>',
      });
    }

    const valid = allowedKeys(minRole);
    if (!valid.has(token)) {
      return res.status(403).json({ error: 'Invalid or insufficient API key' });
    }

    next();
  };
}

module.exports = { requireAuth, AUTH_ENABLED };
