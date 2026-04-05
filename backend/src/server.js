'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');

const farmRoutes = require('./routes/farm');
const workerRoutes = require('./routes/worker');
const shiftRoutes = require('./routes/shift');
const lotRoutes = require('./routes/lot');
const payrollRoutes = require('./routes/payroll');
const provenanceRoutes = require('./routes/provenance');
const priceRoutes = require('./routes/price');
const exportRoutes = require('./routes/export');

const { requireAuth } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// ------------------------------------------------------------------ CORS
const ALLOWED_ORIGINS = [
  // Dev: any localhost port
  /^http:\/\/localhost(:\d+)?$/,
  // Prod: chainbytes.io and chainbytes.com subdomains
  /^https:\/\/[a-zA-Z0-9-]+\.chainbytes\.io$/,
  /^https:\/\/[a-zA-Z0-9-]+\.chainbytes\.com$/,
];

app.use(cors({
  origin(origin, callback) {
    // Allow requests with no origin (e.g. server-to-server, curl, tests)
    if (!origin) return callback(null, true);
    const allowed = ALLOWED_ORIGINS.some(pattern => pattern.test(origin));
    if (allowed) return callback(null, true);
    callback(new Error(`CORS: origin not allowed — ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ------------------------------------------------------------------ rate limiting

const IS_TEST = process.env.NODE_ENV === 'test';

// Global limiter: 100 requests per 15 minutes per IP (disabled in tests)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: IS_TEST ? 0 : 100,   // 0 = unlimited
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
  skip: () => IS_TEST,
});

// Stricter limiter on write endpoints: 30 POSTs per 15 minutes per IP (disabled in tests)
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: IS_TEST ? 0 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many write requests, please try again later.' },
  skip: () => IS_TEST,
});

app.use(globalLimiter);

// ------------------------------------------------------------------ middleware
app.use(express.json());

// Serve the frontend static files
app.use(express.static(path.join(__dirname, '..', '..', 'frontend')));

// ------------------------------------------------------------------ routes

// Apply write limiter to all POST requests
app.use((req, res, next) => {
  if (req.method === 'POST') return writeLimiter(req, res, next);
  next();
});

// Protected write endpoints — auth applied per-route so GET endpoints remain public

app.use('/farm', farmRoutes);
app.use('/worker', workerRoutes);

// Shift writes: POST /shift (foreman+admin), POST /shift/:id/close (foreman+admin)
app.post('/shift', requireAuth('foreman'), (req, res, next) => next());
app.post('/shift/:id/close', requireAuth('foreman'), (req, res, next) => next());
app.use('/shift', shiftRoutes);

// Lot writes: POST /lot (foreman+admin), POST /lot/:id/transfer (any authenticated)
app.post('/lot', requireAuth('foreman'), (req, res, next) => next());
app.post('/lot/:id/transfer', requireAuth('worker'), (req, res, next) => next());
app.use('/lot', lotRoutes);

// Payroll: admin only
app.post('/payroll', requireAuth('admin'), (req, res, next) => next());
app.use('/payroll', payrollRoutes);

app.use('/provenance', provenanceRoutes);
app.use('/farm', exportRoutes);
app.use('/', priceRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ------------------------------------------------------------------ 404 / error handlers
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // CORS errors surface here
  if (err.message && err.message.startsWith('CORS:')) {
    return res.status(403).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// ------------------------------------------------------------------ cron jobs (only when running as main process)
if (require.main === module) {
  const cron = require('node-cron');
  const { getDb } = require('./db');
  const { runBackup } = require('./scripts/backup');

  // --- Session auto-cleanup: runs every hour
  // Deletes checkins and shifts that were closed more than 24 hours ago.
  cron.schedule('0 * * * *', () => {
    try {
      const db = getDb();
      const cutoff = new Date(Date.now() - 24 * 3600 * 1000)
        .toISOString().replace('T', ' ').slice(0, 19);

      // First, capture the IDs to be deleted so we can also remove checkins
      const staleShifts = db.prepare(`
        SELECT id FROM shifts
        WHERE status = 'closed' AND closed_at < ?
      `).all(cutoff);

      if (staleShifts.length === 0) {
        console.log('[cron] cleanup: no stale sessions found');
        return;
      }

      const ids = staleShifts.map(s => s.id);
      const placeholders = ids.map(() => '?').join(', ');

      const { changes: checkinChanges } = db.prepare(
        `DELETE FROM checkins WHERE shift_id IN (${placeholders})`
      ).run(...ids);

      const { changes: shiftChanges } = db.prepare(
        `DELETE FROM shifts WHERE id IN (${placeholders})`
      ).run(...ids);

      console.log(
        `[cron] cleanup: removed ${shiftChanges} closed shift(s) ` +
        `and ${checkinChanges} related checkin(s) (closed > 24h ago)`
      );
    } catch (err) {
      console.error('[cron] cleanup error:', err.message);
    }
  });

  // --- Daily database backup: runs at midnight
  cron.schedule('0 0 * * *', async () => {
    try {
      const { dest, pruned } = await runBackup();
      console.log(`[cron] backup: saved ${dest}`);
      if (pruned.length > 0) {
        console.log(`[cron] backup: pruned ${pruned.length} old backup(s)`);
      }
    } catch (err) {
      console.error('[cron] backup error:', err.message);
    }
  });
}

// ------------------------------------------------------------------ start
if (require.main === module) {
  app.listen(PORT, () => {
    console.log('');
    console.log('  Chainbytes Coffee Supply Chain — Backend API');
    console.log(`  Listening on http://localhost:${PORT}`);
    console.log('');
    console.log('  Endpoints:');
    console.log('    POST   /farm');
    console.log('    GET    /farm');
    console.log('    GET    /farm/:id/pay-rates');
    console.log('    POST   /worker');
    console.log('    PUT    /worker/:id/pay-rate');
    console.log('    POST   /shift');
    console.log('    POST   /shift/:id/checkin');
    console.log('    POST   /shift/:id/close');
    console.log('    POST   /lot');
    console.log('    POST   /lot/:id/transfer');
    console.log('    GET    /lot/:id/qr');
    console.log('    GET    /lot/:id/provenance');
    console.log('    POST   /payroll');
    console.log('    GET    /worker/:id/payments');
    console.log('    GET    /worker/:id/today');
    console.log('    GET    /provenance/:lotId');
    console.log('    GET    /provenance/:lotId/data');
    console.log('    GET    /farm/:id/analytics');
    console.log('    PUT    /worker/:id');
    console.log('    GET    /farm/:id/export?format=csv|json');
    console.log('    GET    /btc-price');
    console.log('    POST   /usd-to-sats');
    console.log('    GET    /health');
    console.log('');
  });
}

module.exports = app;
