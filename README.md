# Chainbytes Coffee Supply Chain — Phase 1 Prototype

Bitcoin-native traceability for coffee farms. Workers check in via QR codes,
lots are tracked from farm to roaster via simulated Liquid Network assets,
and workers are paid instantly via Lightning Network.

## Architecture

```
Consumer (QR scan)
    └─► GET /provenance/:lotId  ──► Beautiful provenance page
                                        │
                                        └── /provenance/:lotId/data (JSON API)

Foreman / Farm Owner
    └─► POST /shift            — create shift + QR code
    └─► POST /shift/:id/close  — close shift, record to "Liquid"
    └─► POST /lot              — create harvest lot (issues Liquid asset)
    └─► POST /lot/:id/transfer — custody transfer (mill / exporter / roaster)
    └─► POST /payroll          — pay workers via Lightning

Worker
    └─► POST /shift/:id/checkin — scan QR, check in to shift
    └─► GET  /worker/:id/payments — payment history
```

## Quick Start

### 1. Prerequisites

- Node.js >= 20 (`nvm use`)
- No database setup required — SQLite is bundled

### 2. Install

```bash
cd backend
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env — at minimum set APP_BASE_URL
# LNbits keys are optional — demo mode works without them
```

### 4. Seed the database

```bash
npm run seed
```

This creates:
- **Finca El Salvador** farm (Santa Ana, 1400m altitude)
- 1 foreman + 5 workers
- 2 completed shifts with check-ins
- 1 harvest lot with full custody chain (farm → wet mill → dry mill → exporter)
- Payment records for all workers

### 5. Start the server

```bash
npm start
```

Server runs on http://localhost:3000

### 6. View the provenance page

The seed script prints the provenance URL. It looks like:

```
http://localhost:3000/provenance/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

Open it in a browser to see the full provenance page.

## API Reference

### Farm

| Method | Path | Description |
|--------|------|-------------|
| POST | `/farm` | Register a farm |
| GET | `/farm` | List all farms |
| GET | `/farm/:id` | Get farm details |

**POST /farm body:**
```json
{
  "name": "Finca El Salvador",
  "location": "Santa Ana, El Salvador",
  "altitude_m": 1400,
  "owner_name": "Carlos Mendoza"
}
```

### Worker

| Method | Path | Description |
|--------|------|-------------|
| POST | `/worker` | Register a worker or foreman |
| GET | `/worker/:id` | Get worker profile |
| GET | `/worker/:id/payments` | Payment history |
| GET | `/worker?farm_id=` | List workers by farm |

**POST /worker body:**
```json
{
  "farm_id": "uuid",
  "name": "Ana García",
  "phone": "+503-7111-0001",
  "role": "worker"
}
```

### Shift

| Method | Path | Description |
|--------|------|-------------|
| POST | `/shift` | Create shift session (returns QR) |
| POST | `/shift/:id/checkin` | Worker checks in |
| POST | `/shift/:id/close` | Close shift, record to Liquid |
| GET | `/shift/:id` | Shift details with check-ins |

**POST /shift body:**
```json
{
  "farm_id": "uuid",
  "foreman_id": "uuid",
  "date": "2026-04-02"
}
```

**POST /shift/:id/checkin body:**
```json
{
  "worker_id": "uuid",
  "signature": "optional_signed_attestation"
}
```

### Lot

| Method | Path | Description |
|--------|------|-------------|
| POST | `/lot` | Create harvest lot (issues Liquid asset) |
| POST | `/lot/:id/transfer` | Custody transfer |
| GET | `/lot/:id` | Lot details + transfers |
| GET | `/lot/:id/provenance` | Redirect to provenance page |

**POST /lot body:**
```json
{
  "shift_id": "uuid",
  "weight_kg": 380.5,
  "grade": "A",
  "gps_lat": 13.9942,
  "gps_lng": -89.5469,
  "notes": "Hand-picked red cherries"
}
```

**POST /lot/:id/transfer body:**
```json
{
  "to_entity": "Beneficio Húmedo Santa Ana",
  "entity_type": "wet_mill",
  "metadata": {
    "processing_method": "washed",
    "fermentation_hours": 36
  }
}
```

Valid `entity_type` values: `wet_mill`, `dry_mill`, `exporter`, `roaster`

### Payroll

**POST /payroll**
```json
{
  "shift_id": "uuid",
  "amount_sats": 5000
}
```

### Provenance (Public)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/provenance/:lotId` | Consumer HTML page |
| GET | `/provenance/:lotId/data` | JSON API for provenance data |

## Lightning Integration

The app uses [LNbits](https://legend.lnbits.com) for Lightning payments.

**Demo mode** (no `.env` keys required): invoices are generated as mock objects,
payments are immediately marked as paid. The full flow works end-to-end for demos.

**Production mode**: set `LNBITS_URL`, `LNBITS_ADMIN_KEY`, and `LNBITS_INVOICE_KEY`
in `.env`. The app will create real invoices and pay them via LNbits API.

To get LNbits keys:
1. Go to https://legend.lnbits.com
2. Create a wallet
3. Copy the Admin key and Invoice/read key

## Liquid Integration

Phase 1 simulates Liquid Network asset issuance and transfer. Each harvest lot
gets an `asset_id` that mirrors the format of a real Liquid issued asset. The
data structure is designed so that replacing the simulation with real GDK calls
in Phase 2 requires only changes to `backend/src/lib/liquid.js`.

Real Liquid testnet API: https://blockstream.info/liquidtestnet/api

## Running Tests

```bash
cd backend
npm test
```

Tests use Node.js built-in test runner. No extra dependencies required.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `NODE_ENV` | `development` | Environment |
| `LNBITS_URL` | `https://legend.lnbits.com` | LNbits instance URL |
| `LNBITS_ADMIN_KEY` | — | LNbits admin key (optional for demo) |
| `LNBITS_INVOICE_KEY` | — | LNbits invoice key (optional for demo) |
| `LIQUID_API_URL` | Blockstream testnet API | Liquid REST API base URL |
| `APP_BASE_URL` | `http://localhost:3000` | Base URL for QR code links |
| `DB_PATH` | `./coffee.db` | SQLite database path |

## Project Structure

```
coffee-supply-chain/
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── index.js      — SQLite connection + schema init
│   │   │   ├── schema.js     — Table definitions
│   │   │   └── seed.js       — Demo data seed script
│   │   ├── lib/
│   │   │   ├── liquid.js     — Liquid Network service (simulated)
│   │   │   └── lightning.js  — Lightning / LNbits service
│   │   ├── routes/
│   │   │   ├── farm.js
│   │   │   ├── worker.js
│   │   │   ├── shift.js
│   │   │   ├── lot.js
│   │   │   ├── payroll.js
│   │   │   └── provenance.js
│   │   └── server.js         — Express app + entry point
│   ├── test/
│   │   └── api.test.js       — Integration tests
│   └── package.json
├── frontend/
│   └── index.html            — Consumer provenance page
├── docs/
│   └── PRD.md
├── .env.example
├── .gitignore
├── .nvmrc
├── package.json
└── README.md
```

## Phase 2 Roadmap

- Real Liquid GDK integration (swap `lib/liquid.js`)
- Multi-farm registration
- Mobile app (React Native / Expo)
- Offline-first check-in with sync
- Spanish localization
- Lightning mainnet payments
- Export compliance document generation (ICO, USDA, Fair Trade)
