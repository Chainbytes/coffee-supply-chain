'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '..', '.env') });

const { v4: uuidv4 } = require('uuid');
const { getDb, closeDb } = require('./index');

/**
 * Seed the database with demo data for Finca El Salvador.
 *
 * Running this script multiple times is safe — it checks for the presence
 * of the demo farm before inserting and exits early if already seeded.
 */
function seed() {
  const db = getDb();

  // ------------------------------------------------------------------ guard
  const existing = db.prepare('SELECT id FROM farms WHERE name = ?').get('Finca El Salvador');
  if (existing) {
    console.log('Database already seeded. Remove coffee.db to re-seed.');
    closeDb();
    return;
  }

  console.log('Seeding database...');

  const now = new Date();
  const yesterday = new Date(now - 86400000);
  const twoDaysAgo = new Date(now - 2 * 86400000);

  const fmt = (d) => d.toISOString().replace('T', ' ').slice(0, 19);

  // ------------------------------------------------------------------ farm
  const farmId = uuidv4();
  db.prepare(`
    INSERT INTO farms (id, name, location, altitude_m, owner_name, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(farmId, 'Finca El Salvador', 'Santa Ana, El Salvador', 1400, 'Carlos Mendoza', fmt(twoDaysAgo));

  // ------------------------------------------------------------------ foreman
  const foremanId = uuidv4();
  db.prepare(`
    INSERT INTO workers (id, farm_id, name, phone, role, liquid_address, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(foremanId, farmId, 'Miguel Ángel Torres', '+503-7234-5678', 'foreman',
    'tex1qforeman0000000000000000000000000000000', fmt(twoDaysAgo));

  // ------------------------------------------------------------------ workers (5)
  const workerData = [
    ['Ana García',       '+503-7111-0001', 'liq1qworker000000000000000000000000000001'],
    ['Roberto Hernández','+503-7111-0002', 'liq1qworker000000000000000000000000000002'],
    ['María López',      '+503-7111-0003', 'liq1qworker000000000000000000000000000003'],
    ['José Martínez',    '+503-7111-0004', 'liq1qworker000000000000000000000000000004'],
    ['Carmen Rodríguez', '+503-7111-0005', 'liq1qworker000000000000000000000000000005'],
  ];

  const workerIds = workerData.map(() => uuidv4());

  const insertWorker = db.prepare(`
    INSERT INTO workers (id, farm_id, name, phone, role, liquid_address, created_at)
    VALUES (?, ?, ?, ?, 'worker', ?, ?)
  `);

  workerIds.forEach((wid, i) => {
    const [name, phone, addr] = workerData[i];
    insertWorker.run(wid, farmId, name, phone, addr, fmt(twoDaysAgo));
  });

  // ------------------------------------------------------------------ shift 1 (2 days ago, closed)
  const shift1Id = uuidv4();
  const shift1QrData = JSON.stringify({ shiftId: shift1Id, farmId, foremanId, expiresAt: fmt(twoDaysAgo) });
  db.prepare(`
    INSERT INTO shifts (id, farm_id, foreman_id, date, status, qr_data, liquid_tx, created_at, closed_at)
    VALUES (?, ?, ?, ?, 'closed', ?, ?, ?, ?)
  `).run(
    shift1Id, farmId, foremanId,
    twoDaysAgo.toISOString().slice(0, 10),
    shift1QrData,
    'liq_asset_shift_' + shift1Id.slice(0, 8),
    fmt(twoDaysAgo),
    fmt(new Date(twoDaysAgo.getTime() + 8 * 3600000))
  );

  // All 5 workers checked in to shift 1
  const insertCheckin = db.prepare(`
    INSERT INTO checkins (id, shift_id, worker_id, checked_in_at, signature)
    VALUES (?, ?, ?, ?, ?)
  `);
  workerIds.forEach((wid, i) => {
    insertCheckin.run(
      uuidv4(), shift1Id, wid,
      fmt(new Date(twoDaysAgo.getTime() + (i + 1) * 5 * 60000)),
      'sig_simulated_' + wid.slice(0, 8)
    );
  });

  // ------------------------------------------------------------------ shift 2 (yesterday, closed)
  const shift2Id = uuidv4();
  const shift2QrData = JSON.stringify({ shiftId: shift2Id, farmId, foremanId, expiresAt: fmt(yesterday) });
  db.prepare(`
    INSERT INTO shifts (id, farm_id, foreman_id, date, status, qr_data, liquid_tx, created_at, closed_at)
    VALUES (?, ?, ?, ?, 'closed', ?, ?, ?, ?)
  `).run(
    shift2Id, farmId, foremanId,
    yesterday.toISOString().slice(0, 10),
    shift2QrData,
    'liq_asset_shift_' + shift2Id.slice(0, 8),
    fmt(yesterday),
    fmt(new Date(yesterday.getTime() + 8 * 3600000))
  );

  // Workers 0-3 checked in to shift 2 (worker 4 absent)
  workerIds.slice(0, 4).forEach((wid, i) => {
    insertCheckin.run(
      uuidv4(), shift2Id, wid,
      fmt(new Date(yesterday.getTime() + (i + 1) * 5 * 60000)),
      'sig_simulated_' + wid.slice(0, 8)
    );
  });

  // ------------------------------------------------------------------ lot (linked to shift 1)
  const lotId = uuidv4();
  const assetId = 'liq_' + lotId.replace(/-/g, '').slice(0, 32);
  db.prepare(`
    INSERT INTO lots (id, shift_id, farm_id, weight_kg, grade, gps_lat, gps_lng, asset_id, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    lotId, shift1Id, farmId,
    380.5, 'A',
    13.9942, -89.5469,
    assetId,
    'Primera cosecha de la temporada. Cerezas rojas maduras.',
    fmt(new Date(twoDaysAgo.getTime() + 9 * 3600000))
  );

  // ------------------------------------------------------------------ custody chain: farm → wet mill → dry mill → exporter
  const insertTransfer = db.prepare(`
    INSERT INTO transfers (id, lot_id, from_entity, to_entity, entity_type, metadata, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  // Step 1: farm creates lot (origin record)
  insertTransfer.run(
    uuidv4(), lotId,
    'Finca El Salvador', 'Finca El Salvador',
    'farm',
    JSON.stringify({
      action: 'harvest',
      weight_kg: 380.5,
      grade: 'A',
      workers: workerData.map(w => w[0]),
      notes: 'Hand-picked, red cherries only',
    }),
    fmt(new Date(twoDaysAgo.getTime() + 9 * 3600000))
  );

  // Step 2: farm → wet mill
  insertTransfer.run(
    uuidv4(), lotId,
    'Finca El Salvador', 'Beneficio Húmedo Santa Ana',
    'wet_mill',
    JSON.stringify({
      action: 'wet_processing',
      received_weight_kg: 380.5,
      processing_method: 'washed',
      fermentation_hours: 36,
      notes: 'Clean fermentation, no off-flavors',
    }),
    fmt(new Date(twoDaysAgo.getTime() + 24 * 3600000))
  );

  // Step 3: wet mill → dry mill
  insertTransfer.run(
    uuidv4(), lotId,
    'Beneficio Húmedo Santa Ana', 'Beneficio Seco Las Flores',
    'dry_mill',
    JSON.stringify({
      action: 'dry_processing',
      received_weight_kg: 76.1,   // green bean equivalent after wet processing
      drying_method: 'raised_beds',
      drying_days: 14,
      final_moisture_pct: 11.5,
      defect_count: 3,
      screen_size: '17/18',
    }),
    fmt(new Date(twoDaysAgo.getTime() + 20 * 86400000))
  );

  // Step 4: dry mill → exporter
  insertTransfer.run(
    uuidv4(), lotId,
    'Beneficio Seco Las Flores', 'Caravela Coffee El Salvador',
    'exporter',
    JSON.stringify({
      action: 'export_preparation',
      received_weight_kg: 75.0,
      export_weight_kg: 69.0,
      ico_certificate: 'ICO-SLV-2026-' + lotId.slice(0, 6).toUpperCase(),
      destination: 'Portland, OR, USA',
      shipping_date: new Date(twoDaysAgo.getTime() + 35 * 86400000).toISOString().slice(0, 10),
    }),
    fmt(new Date(twoDaysAgo.getTime() + 25 * 86400000))
  );

  // ------------------------------------------------------------------ payments for shift 1 (all 5 workers)
  const PAY_RATE_SATS = 5000; // 5,000 sats per shift (~$3 at $60k BTC)
  const insertPayment = db.prepare(`
    INSERT INTO payments (id, worker_id, shift_id, amount_sats, lightning_invoice, payment_hash, status, paid_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  workerIds.forEach((wid, i) => {
    insertPayment.run(
      uuidv4(), wid, shift1Id,
      PAY_RATE_SATS,
      'lnbc50u1demo_invoice_' + wid.slice(0, 8),
      'payment_hash_' + wid.slice(0, 8),
      'paid',
      fmt(new Date(twoDaysAgo.getTime() + 9 * 3600000 + i * 60000)),
      fmt(twoDaysAgo)
    );
  });

  // Payments for shift 2 (4 workers, pending — not yet paid)
  workerIds.slice(0, 4).forEach((wid) => {
    insertPayment.run(
      uuidv4(), wid, shift2Id,
      PAY_RATE_SATS,
      null, null,
      'pending',
      null,
      fmt(yesterday)
    );
  });

  closeDb();

  console.log('');
  console.log('Seed complete!');
  console.log('');
  console.log('  Farm:    Finca El Salvador');
  console.log('  Foreman: Miguel Ángel Torres');
  console.log('  Workers: 5');
  console.log('  Shifts:  2 (both closed)');
  console.log('  Lot:     1 harvest lot with full custody chain');
  console.log('  Lot ID:  ' + lotId);
  console.log('');
  console.log('  Provenance page: http://localhost:3000/provenance/' + lotId);
  console.log('');
}

seed();
