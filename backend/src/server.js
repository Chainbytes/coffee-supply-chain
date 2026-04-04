'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const express = require('express');
const cors = require('cors');
const path = require('path');

const farmRoutes = require('./routes/farm');
const workerRoutes = require('./routes/worker');
const shiftRoutes = require('./routes/shift');
const lotRoutes = require('./routes/lot');
const payrollRoutes = require('./routes/payroll');
const provenanceRoutes = require('./routes/provenance');

const app = express();
const PORT = process.env.PORT || 3000;

// ------------------------------------------------------------------ middleware
app.use(cors());
app.use(express.json());

// Serve the frontend static files
app.use(express.static(path.join(__dirname, '..', '..', 'frontend')));

// ------------------------------------------------------------------ routes
app.use('/farm', farmRoutes);
app.use('/worker', workerRoutes);
app.use('/shift', shiftRoutes);
app.use('/lot', lotRoutes);
app.use('/payroll', payrollRoutes);
app.use('/provenance', provenanceRoutes);

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
    console.log('    GET    /lot/:id/provenance');
    console.log('    POST   /payroll');
    console.log('    GET    /worker/:id/payments');
    console.log('    GET    /provenance/:lotId');
    console.log('    GET    /provenance/:lotId/data');
    console.log('    GET    /health');
    console.log('');
  });
}

module.exports = app;
