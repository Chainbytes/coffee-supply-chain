'use strict';

/**
 * Integration tests for the Coffee Supply Chain API.
 *
 * Uses Node.js built-in test runner (node --test) and supertest.
 * A temporary in-memory DB path is set per test so tests are isolated.
 */

const { test, before, after, describe } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const os = require('os');
const fs = require('fs');

// Point to a temp DB before loading the app
const tmpDb = path.join(os.tmpdir(), `test_coffee_${Date.now()}.db`);
process.env.DB_PATH = tmpDb;
process.env.NODE_ENV = 'test';

// Lazy-load app AFTER setting env
const app = require('../src/server');
const { closeDb } = require('../src/db');

// Minimal supertest replacement using built-in http
const http = require('http');

let server;
let baseUrl;

function request(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, baseUrl);
    const payload = body ? JSON.stringify(body) : null;

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

const get = (p) => request('GET', p);
const post = (p, b) => request('POST', p, b);

// ------------------------------------------------------------------ lifecycle

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  closeDb();
  try { fs.unlinkSync(tmpDb); } catch {}
  try { fs.unlinkSync(tmpDb + '-wal'); } catch {}
  try { fs.unlinkSync(tmpDb + '-shm'); } catch {}
});

// ------------------------------------------------------------------ state shared across tests
let farmId, foremanId, workerId, shiftId, lotId;

// ------------------------------------------------------------------ tests

describe('Health', () => {
  test('GET /health returns 200', async () => {
    const res = await get('/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
  });
});

describe('Farm', () => {
  test('POST /farm creates a farm', async () => {
    const res = await post('/farm', {
      name: 'Test Farm',
      location: 'Santa Ana, El Salvador',
      altitude_m: 1200,
      owner_name: 'Test Owner',
    });
    assert.equal(res.status, 201);
    assert.ok(res.body.id);
    assert.equal(res.body.name, 'Test Farm');
    farmId = res.body.id;
  });

  test('POST /farm returns 400 when fields missing', async () => {
    const res = await post('/farm', { name: 'Incomplete' });
    assert.equal(res.status, 400);
  });

  test('GET /farm lists farms', async () => {
    const res = await get('/farm');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
    assert.ok(res.body.length >= 1);
  });

  test('GET /farm/:id returns the farm', async () => {
    const res = await get(`/farm/${farmId}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.id, farmId);
  });

  test('GET /farm/:id returns 404 for unknown id', async () => {
    const res = await get('/farm/nonexistent-id');
    assert.equal(res.status, 404);
  });
});

describe('Worker', () => {
  test('POST /worker creates a foreman', async () => {
    const res = await post('/worker', {
      farm_id: farmId,
      name: 'Test Foreman',
      phone: '+503-1234-5678',
      role: 'foreman',
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.role, 'foreman');
    foremanId = res.body.id;
  });

  test('POST /worker creates a worker', async () => {
    const res = await post('/worker', {
      farm_id: farmId,
      name: 'Test Worker',
      phone: '+503-9876-5432',
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.role, 'worker');
    assert.ok(res.body.liquid_address, 'should auto-generate liquid address');
    workerId = res.body.id;
  });

  test('POST /worker returns 400 when fields missing', async () => {
    const res = await post('/worker', { name: 'No Farm' });
    assert.equal(res.status, 400);
  });

  test('GET /worker/:id returns the worker', async () => {
    const res = await get(`/worker/${workerId}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.id, workerId);
  });

  test('GET /worker?farm_id= filters by farm', async () => {
    const res = await get(`/worker?farm_id=${farmId}`);
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
    assert.ok(res.body.length >= 2);
  });

  test('GET /worker/:id/payments returns empty list initially', async () => {
    const res = await get(`/worker/${workerId}/payments`);
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.payments));
    assert.equal(res.body.payments.length, 0);
  });
});

describe('Shift', () => {
  test('POST /shift creates a shift with QR', async () => {
    const res = await post('/shift', {
      farm_id: farmId,
      foreman_id: foremanId,
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.status, 'open');
    assert.ok(res.body.qr_image, 'should include qr_image data URL');
    assert.ok(res.body.qr_payload, 'should include qr_payload');
    shiftId = res.body.id;
  });

  test('POST /shift returns 400 when fields missing', async () => {
    const res = await post('/shift', { farm_id: farmId });
    assert.equal(res.status, 400);
  });

  test('POST /shift/:id/checkin checks in a worker', async () => {
    const res = await post(`/shift/${shiftId}/checkin`, {
      worker_id: workerId,
      signature: 'test_sig_abc',
    });
    assert.equal(res.status, 201);
    assert.ok(res.body.checkin.id);
  });

  test('POST /shift/:id/checkin returns 409 on duplicate', async () => {
    const res = await post(`/shift/${shiftId}/checkin`, { worker_id: workerId });
    assert.equal(res.status, 409);
  });

  test('GET /shift/:id returns shift with checkins', async () => {
    const res = await get(`/shift/${shiftId}`);
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.checkins));
    assert.equal(res.body.checkins.length, 1);
  });

  test('POST /shift/:id/close closes the shift and records to Liquid', async () => {
    const res = await post(`/shift/${shiftId}/close`, {});
    assert.equal(res.status, 200);
    assert.equal(res.body.shift.status, 'closed');
    assert.ok(res.body.liquid_record, 'should return liquid record');
    assert.equal(res.body.checkin_count, 1);
  });

  test('POST /shift/:id/close returns 409 on second close', async () => {
    const res = await post(`/shift/${shiftId}/close`, {});
    assert.equal(res.status, 409);
  });
});

describe('Lot', () => {
  test('POST /lot creates a lot and issues Liquid asset', async () => {
    const res = await post('/lot', {
      shift_id: shiftId,
      weight_kg: 150.5,
      grade: 'A',
      gps_lat: 13.9942,
      gps_lng: -89.5469,
      notes: 'Test harvest lot',
    });
    assert.equal(res.status, 201);
    assert.ok(res.body.lot.id);
    assert.ok(res.body.lot.asset_id, 'should have Liquid asset_id');
    assert.ok(res.body.provenance_url, 'should include provenance_url');
    assert.ok(res.body.qr_image, 'should include qr_image');
    lotId = res.body.lot.id;
  });

  test('POST /lot returns 400 for invalid grade', async () => {
    const res = await post('/lot', {
      shift_id: shiftId,
      weight_kg: 100,
      grade: 'Z',
    });
    assert.equal(res.status, 400);
  });

  test('POST /lot/:id/transfer records a custody transfer', async () => {
    const res = await post(`/lot/${lotId}/transfer`, {
      to_entity: 'Test Wet Mill',
      entity_type: 'wet_mill',
      metadata: {
        processing_method: 'washed',
        fermentation_hours: 36,
      },
    });
    assert.equal(res.status, 201);
    assert.ok(res.body.transfer.id);
    assert.equal(res.body.transfer.entity_type, 'wet_mill');
  });

  test('GET /lot/:id/qr returns printable SVG QR code', async () => {
    const res = await get(`/lot/${lotId}/qr`);
    assert.equal(res.status, 200);
    // Response is SVG string (not JSON)
    assert.ok(typeof res.body === 'string', 'should return SVG string');
    assert.ok(res.body.includes('<svg'), 'should contain SVG element');
    assert.ok(res.body.includes('Grade'), 'SVG should contain lot grade label');
  });

  test('GET /lot/:id/qr?format=png returns data URL', async () => {
    const res = await get(`/lot/${lotId}/qr?format=png`);
    assert.equal(res.status, 200);
    assert.ok(res.body.qr_image.startsWith('data:image/png'), 'should be PNG data URL');
    assert.ok(res.body.provenance_url.includes(lotId));
  });

  test('GET /lot/nonexistent/qr returns 404', async () => {
    const res = await get('/lot/nonexistent-id/qr');
    assert.equal(res.status, 404);
  });

  test('GET /lot/:id returns lot with transfers', async () => {
    const res = await get(`/lot/${lotId}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.lot.id, lotId);
    assert.ok(Array.isArray(res.body.transfers));
    assert.ok(res.body.transfers.length >= 2); // harvest + wet_mill
  });
});

describe('Provenance', () => {
  test('GET /provenance/:lotId/data returns full chain', async () => {
    const res = await get(`/provenance/${lotId}/data`);
    assert.equal(res.status, 200);
    assert.ok(res.body.lot);
    assert.ok(res.body.farm);
    assert.ok(res.body.shift);
    assert.ok(Array.isArray(res.body.workers));
    assert.ok(Array.isArray(res.body.transfers));
    assert.ok(res.body.transfers.length >= 2);
    // Verify metadata is parsed from JSON
    assert.equal(typeof res.body.transfers[0].metadata, 'object');
  });

  test('GET /provenance/nonexistent/data returns 404', async () => {
    const res = await get('/provenance/nonexistent-lot-id/data');
    assert.equal(res.status, 404);
  });
});

describe('Payroll', () => {
  test('POST /payroll pays workers for a shift', async () => {
    const res = await post('/payroll', {
      shift_id: shiftId,
      amount_sats: 5000,
    });
    assert.equal(res.status, 201);
    assert.ok(res.body.paid_count >= 1);
    assert.equal(res.body.total_sats_paid, 5000);
    assert.ok(res.body.payments[0].status === 'paid');
  });

  test('POST /payroll returns 409 when all workers already paid', async () => {
    const res = await post('/payroll', { shift_id: shiftId });
    assert.equal(res.status, 409);
  });

  test('GET /worker/:id/payments shows payment after payroll', async () => {
    const res = await get(`/worker/${workerId}/payments`);
    assert.equal(res.status, 200);
    assert.ok(res.body.payments.length >= 1);
    assert.ok(res.body.total_paid_sats >= 5000);
  });

  test('POST /payroll returns 400 when shift_id missing', async () => {
    const res = await post('/payroll', { amount_sats: 1000 });
    assert.equal(res.status, 400);
  });
});

// ------------------------------------------------------------------ Feature 1: BTC Price

describe('BTC Price', () => {
  test('GET /btc-price returns usd and timestamp', async () => {
    const res = await get('/btc-price');
    // CoinGecko may be unavailable in CI; accept 200 or 502
    if (res.status === 200) {
      assert.equal(typeof res.body.usd, 'number');
      assert.ok(res.body.usd > 0, 'price should be positive');
      assert.ok(typeof res.body.timestamp === 'string', 'should have timestamp');
      // Timestamp should be a valid ISO string
      assert.ok(!isNaN(Date.parse(res.body.timestamp)), 'timestamp must be ISO-8601');
    } else {
      assert.equal(res.status, 502);
      assert.ok(res.body.error);
    }
  });

  test('POST /usd-to-sats converts amount when price available', async () => {
    const priceRes = await get('/btc-price');
    if (priceRes.status !== 200) return; // skip if CoinGecko down

    const res = await post('/usd-to-sats', { usd: 10 });
    assert.equal(res.status, 200);
    assert.equal(typeof res.body.sats, 'number');
    assert.ok(res.body.sats > 0);
    assert.equal(typeof res.body.btc_price, 'number');
    // Rough sanity: 10 USD should be more than 100 sats at any real BTC price
    assert.ok(res.body.sats > 100);
  });

  test('POST /usd-to-sats returns 400 when usd missing', async () => {
    const res = await post('/usd-to-sats', {});
    assert.equal(res.status, 400);
    assert.ok(res.body.error);
  });

  test('POST /usd-to-sats returns 400 for negative amount', async () => {
    const res = await post('/usd-to-sats', { usd: -5 });
    assert.equal(res.status, 400);
    assert.ok(res.body.error);
  });

  test('POST /usd-to-sats returns 400 for non-numeric value', async () => {
    const res = await post('/usd-to-sats', { usd: 'lots' });
    assert.equal(res.status, 400);
    assert.ok(res.body.error);
  });
});

// ------------------------------------------------------------------ Feature 2: Worker today status

describe('Worker today status', () => {
  // farmId, foremanId, workerId and shiftId are populated by earlier test groups
  let todayShiftId;
  let todayWorkerId;

  test('GET /worker/:id/today returns not checked in before check-in', async () => {
    // Create a fresh worker and shift for today
    const shiftRes = await post('/shift', { farm_id: farmId, foreman_id: foremanId });
    assert.equal(shiftRes.status, 201);
    todayShiftId = shiftRes.body.id;

    const workerRes = await post('/worker', { farm_id: farmId, name: 'Today Test Worker' });
    assert.equal(workerRes.status, 201);
    todayWorkerId = workerRes.body.id;

    const res = await get(`/worker/${todayWorkerId}/today`);
    assert.equal(res.status, 200);
    assert.equal(res.body.checked_in, false);
  });

  test('GET /worker/:id/today returns checked_in true after check-in', async () => {
    const checkinRes = await post(`/shift/${todayShiftId}/checkin`, { worker_id: todayWorkerId });
    assert.equal(checkinRes.status, 201);

    const res = await get(`/worker/${todayWorkerId}/today`);
    assert.equal(res.status, 200);
    assert.equal(res.body.checked_in, true);
    assert.equal(res.body.shift_id, todayShiftId);
    assert.ok(typeof res.body.checked_in_at === 'string');
    assert.equal(res.body.shift_status, 'open');
  });

  test('GET /worker/:id/today returns 404 for unknown worker', async () => {
    const res = await get('/worker/nonexistent-worker-id/today');
    assert.equal(res.status, 404);
  });
});

// ------------------------------------------------------------------ Feature 3: Auto-registration on check-in

describe('Worker auto-registration on check-in', () => {
  test('POST /shift/:id/checkin auto-creates unknown worker', async () => {
    // Create a fresh open shift
    const shiftRes = await post('/shift', { farm_id: farmId, foreman_id: foremanId });
    assert.equal(shiftRes.status, 201);
    const newShiftId = shiftRes.body.id;

    // Use a worker_id that does not exist in the DB
    const ghostWorkerId = 'abcdef-ghost-worker-00000000-0000';

    const checkinRes = await post(`/shift/${newShiftId}/checkin`, {
      worker_id: ghostWorkerId,
      signature: 'auto_reg_test',
    });
    assert.equal(checkinRes.status, 201, 'should succeed via auto-registration');
    assert.ok(checkinRes.body.checkin.id);
    assert.equal(checkinRes.body.worker.id, ghostWorkerId);
    // Auto-generated name uses first 6 chars of the id
    assert.ok(
      checkinRes.body.worker.name.startsWith('Worker '),
      `name should start with "Worker ", got: ${checkinRes.body.worker.name}`
    );
  });

  test('auto-registered worker is retrievable via GET /worker/:id', async () => {
    const ghostWorkerId = 'abcdef-ghost-worker-00000000-0000';
    const res = await get(`/worker/${ghostWorkerId}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.id, ghostWorkerId);
    assert.equal(res.body.name, 'Worker abcdef');
  });
});
