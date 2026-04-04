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

// Global limiter: 100 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

// Stricter limiter on write endpoints: 30 POSTs per 15 minutes per IP
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many write requests, please try again later.' },
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

app.use('/farm', farmRoutes);
app.use('/worker', workerRoutes);
app.use('/shift', shiftRoutes);
app.use('/lot', lotRoutes);
app.use('/payroll', payrollRoutes);
app.use('/provenance', provenanceRoutes);
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

// ------------------------------------------------------------------ start
if (require.main === module) {
  app.listen(PORT, () => {
    console.log('');
    console.log('  Chainbytes Coffee Supply Chain — Backend API');
    console.log(`  Listening on http://localhost:${PORT}`);
    console.log('');
    console.log('  Endpoints:');
    console.log('    POST   /farm');
    console.log('    POST   /worker');
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
    console.log('    GET    /btc-price');
    console.log('    POST   /usd-to-sats');
    console.log('    GET    /health');
    console.log('');
  });
}

module.exports = app;
