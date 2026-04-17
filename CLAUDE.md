# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repo layout

Monorepo with four independent Node/JS apps:

- `backend/` — Express + better-sqlite3 API (the main product). Root-level npm scripts delegate here.
- `web/` — React 19 + Vite + Tailwind v4 admin dashboard (TS). See `web/package.json`.
- `mobile/` — Expo / React Native app for foremen and workers. `screens/` is split by role: `farm/`, `foreman/`, `worker/`, `supply/`.
- `frontend/` — Single static `index.html` served by the backend at `/` for the consumer-facing provenance page. Do **not** confuse with `web/`.

Root `package.json` scripts all `cd backend && ...` — running `npm start` / `npm test` / `npm run seed` from the repo root always targets the backend.

## Common commands

Backend (run from `backend/` or root):
- `npm run dev` — hot-reload server via `node --watch`
- `npm start` — plain server
- `npm run seed` — wipes and re-seeds SQLite with a full demo dataset; prints the provenance URL
- `npm run backup` — writes a timestamped SQLite backup via `src/scripts/backup.js`
- `npm test` — `node --test test/api.test.js` (Node built-in runner, no extra deps). Run a single test with `node --test --test-name-pattern='<regex>' test/api.test.js`. `NODE_ENV=test` disables rate limiting (see `server.js`).

Web dashboard (`web/`):
- `npm run dev` / `npm run build` (runs `tsc -b` first) / `npm run lint` (ESLint flat config) / `npm run preview`

Mobile (`mobile/`):
- `npm start` (Expo), `npm run ios`, `npm run android`. No test suite.

Environment setup: copy `.env.example` to `.env` at the repo root — `backend/src/server.js` resolves it via `path.join(__dirname, '..', '..', '.env')`, **not** `backend/.env`.

## Backend architecture

**SQLite singleton.** `backend/src/db/index.js` exposes `getDb()` which lazily opens the DB, enables WAL + foreign keys, and runs `CREATE TABLE IF NOT EXISTS` for every schema. Adding a column to an existing table: append an idempotent `try { db.exec("ALTER TABLE ... ADD COLUMN ...") } catch {}` in `getDb()` — this is the project's migration pattern (see `pay_rate_sats`, `overtime_multiplier`). Full schema lives in `backend/src/db/schema.js`.

**Route mounting + auth in `server.js`.** Per-route `requireAuth(minRole)` middleware is registered **before** the router mounts so GET endpoints stay public while specific POSTs are gated. When adding a new write endpoint, follow the existing pattern:

```js
app.post('/resource', requireAuth('foreman'), (req, res, next) => next());
app.use('/resource', resourceRoutes);
```

Role hierarchy is `admin > foreman > worker`. `backend/src/middleware/auth.js` auto-disables auth when **none** of `ADMIN_KEY` / `FOREMAN_KEY` / `WORKER_KEY` are set — this is intentional dev-mode behavior; don't add explicit dev bypasses elsewhere.

**Rate limiting.** A global limiter wraps all routes and a `writeLimiter` wraps every `POST` via a method-checking middleware. Both skip when `NODE_ENV === 'test'`.

**Cron jobs.** Registered in `server.js` but only when `require.main === module` (so tests and imports don't schedule them): hourly cleanup of closed shifts older than 24h (also deletes their checkins), and daily SQLite backup at midnight.

**Liquid / Lightning are simulated by default.**
- `backend/src/lib/liquid.js` — all functions return mock shapes that mirror Liquid GDK output. This file is the designated Phase-2 swap point; replacing simulation with real GDK should not require route changes.
- `backend/src/lib/lightning.js` — `DEMO_MODE` triggers automatically when `LNBITS_ADMIN_KEY` is unset or still the placeholder. When extending Lightning flows, always branch on `DEMO_MODE` and return a mock shape, matching the existing `mockInvoice` / `mockPayment` pattern.

**Route modules** under `backend/src/routes/` are domain-sliced: `farm`, `worker`, `shift`, `lot`, `payroll`, `provenance`, `price`, `export`. The consumer provenance HTML in `frontend/index.html` is served via `express.static` and fetches JSON from `/provenance/:lotId/data`.

**CORS.** Allow-list uses regex patterns (`localhost` any port + `*.chainbytes.io` / `*.chainbytes.com`). Requests with no `Origin` (curl, server-to-server, tests) are permitted. Update the `ALLOWED_ORIGINS` array in `server.js` for new domains.

## Testing notes

The test suite boots the real Express app against a temp SQLite DB. Because `NODE_ENV=test` short-circuits rate limiters and `AUTH_ENABLED` is false without env keys, tests hit write endpoints without auth headers. If you add middleware that should also be skipped in tests, gate it on `process.env.NODE_ENV === 'test'` to match the existing convention.
