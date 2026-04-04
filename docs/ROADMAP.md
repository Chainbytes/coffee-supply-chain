# Chainbytes Coffee Supply Chain — Roadmap

**Goal:** Worker shows up to farm → checks in → picks coffee → lot tracked through processing → bag hits shelf with QR code → consumer scans and sees everything.

---

## The Full Journey (what needs to work end-to-end)

```
WORKER ARRIVES        HARVEST              PROCESSING           EXPORT & ROAST        CONSUMER
──────────────        ───────              ──────────           ──────────────        ────────
Worker opens app      Foreman creates      Lot transferred      Exporter receives    Consumer picks up
  ↓                   harvest lot            ↓                  green beans          bag of coffee
Scans foreman's       linked to shift      Wet mill records       ↓                    ↓
QR code                 ↓                  fermentation time    Ships with ICO       Scans QR code
  ↓                   Weight, grade,         ↓                  certificate            ↓
Check-in recorded     GPS captured         Dry mill records       ↓                  Sees: farm, altitude,
  ↓                     ↓                  drying, moisture     Roaster receives     workers who picked,
Shift closes          Lot gets Liquid      defect count         roasts, cups         processing steps,
  ↓                   asset ID               ↓                    ↓                  payment proof,
Workers paid via        ↓                  Each step =          Bags with QR         every hand that
Lightning             Workers linked       Liquid transfer      code printed         touched their coffee
                      to specific lot
```

---

## Phase 1: DONE ✅

What exists today and works:

| # | Feature | Status |
|---|---------|--------|
| 1 | Worker registration (name, phone) | ✅ Backend + mobile |
| 2 | Foreman creates shift, generates QR | ✅ Backend + mobile |
| 3 | Worker scans QR to check in | ✅ Backend + mobile (camera) |
| 4 | Auto-register unknown workers on first scan | ✅ Backend |
| 5 | Foreman closes shift, records to Liquid (simulated) | ✅ Backend + mobile |
| 6 | Harvest lot creation linked to shift + workers | ✅ Backend + mobile |
| 7 | Custody transfer (farm → mill → exporter → roaster) | ✅ Backend + mobile |
| 8 | Lightning payroll (demo mode) | ✅ Backend + mobile |
| 9 | Consumer provenance page (HTML) | ✅ Frontend |
| 10 | BTC price + USD/sats conversion | ✅ Backend |
| 11 | Worker today status endpoint | ✅ Backend |
| 12 | Rate limiting + CORS | ✅ Backend |
| 13 | Backend deployed on DigitalOcean | ✅ 134.122.8.237:3002 |
| 14 | 39 backend tests passing | ✅ |
| 15 | Dev mode role picker (no wallet needed) | ✅ Mobile |

---

## Phase 2: FUNCTIONAL DEMO (target: Monday April 7)

Make the demo end-to-end compelling. A person should be able to walk through the entire flow.

| # | Task | What | Priority | Effort |
|---|------|------|----------|--------|
| 1 | **EAS Build working** | Students install on phones via link | P0 | In progress |
| 2 | **Mobile connects to live backend** | Point API URL to 134.122.8.237:3002 | P0 | 5 min |
| 3 | **Worker home shows today's shift status** | Call GET /worker/:id/today, display card | P0 | 1 hr |
| 4 | **Payment history shows USD equivalent** | Call GET /btc-price, calculate USD | P0 | 30 min |
| 5 | **Farm analytics endpoint** | Worker count, shift count, lot count | P0 | 1 hr |
| 6 | **Printable QR code for demo** | Generate SVG/PDF QR linking to provenance page | P0 | 30 min |
| 7 | **Seed data for live demo** | Pre-populate server with realistic farm, workers, completed lot chain | P0 | 30 min |
| 8 | **GPS capture on lot creation** | expo-location, capture coords on mobile | P1 | 1 hr |
| 9 | **Worker photo capture** | expo-image-picker, upload to backend | P1 | 2 hr |
| 10 | **PUT /worker/:id for name/photo updates** | Update endpoint | P1 | 30 min |

---

## Phase 3: PRODUCTION READY (target: April 15-30)

Security, reliability, and real Bitcoin integration.

| # | Task | What | Priority | Effort |
|---|------|------|----------|--------|
| 11 | **API authentication** | JWT or API key per role — workers can't close shifts, foremen can't payroll | P0 | 4 hr |
| 12 | **Real Lightning payments (LNbits)** | Configure LNbits keys, test real sats on testnet | P0 | 4 hr |
| 13 | **100% test coverage** | Backend + mobile — all endpoints, all screens | P0 | 8 hr |
| 14 | **Worker update endpoint** | PUT /worker/:id — name, phone, photo | P0 | 1 hr |
| 15 | **Payroll CSV/PDF export** | GET /farm/:id/export — downloadable records | P1 | 3 hr |
| 16 | **Session auto-cleanup** | Cron to prune old closed sessions | P1 | 1 hr |
| 17 | **Error handling hardening** | Friendly error messages on mobile, retry logic | P1 | 3 hr |
| 18 | **HTTPS for backend** | nginx reverse proxy with SSL cert on DigitalOcean | P1 | 2 hr |
| 19 | **Database backups** | Cron job to backup SQLite to S3/DO Spaces | P1 | 2 hr |

---

## Phase 4: FULL PLATFORM (target: May-June)

Complete feature set for a real deployment.

| # | Task | What | Priority | Effort |
|---|------|------|----------|--------|
| 20 | **Web dashboard** | React app for farm owners — Dashboard, Employees, Payroll, Lots, Provenance | P0 | 20 hr |
| 21 | **Real Liquid SDK (GDK)** | Replace simulated assets with Blockstream GDK calls | P0 | 8 hr |
| 22 | **Offline-first mobile** | SQLite on device, sync engine, works without connectivity | P0 | 16 hr |
| 23 | **Push notifications** | Expo push — session created, check-in, payment sent | P1 | 4 hr |
| 24 | **WebSocket real-time updates** | Socket.io for live check-in feed | P1 | 4 hr |
| 25 | **Liquid attestation** | On-chain attendance proof (replaces NFTs) | P1 | 8 hr |
| 26 | **Multi-farm support** | Multiple farms, each with own foremen/workers/lots | P1 | 4 hr |
| 27 | **Configurable pay rates** | Per-worker daily rate, overtime, deductions | P1 | 4 hr |
| 28 | **Dispute resolution** | Flag missed check-ins, manual overrides, audit trail | P2 | 8 hr |
| 29 | **Export compliance docs** | ICO certificate, phyto cert from on-chain data | P2 | 4 hr |
| 30 | **Spanish localization complete** | Full i18n with locale files, not inline strings | P2 | 4 hr |

---

## Phase 5: MARKET READY (target: June+)

Polish, scale, and go to market.

| # | Task | What | Priority | Effort |
|---|------|------|----------|--------|
| 31 | **Consumer mobile app** | Standalone app for scanning bags (not just web page) | P2 | 12 hr |
| 32 | **Roaster portal** | Web UI for roasters to manage received lots | P2 | 8 hr |
| 33 | **QR code design + print integration** | Branded QR stickers for bags with lot ID | P2 | 4 hr |
| 34 | **Analytics dashboard** | Farm performance, worker attendance trends, payment history | P2 | 8 hr |
| 35 | **Lightning mainnet** | Move from testnet to mainnet payments | P1 | 4 hr |
| 36 | **Liquid mainnet** | Move from testnet to mainnet asset issuance | P1 | 4 hr |
| 37 | **App Store / Play Store** | EAS Submit for public distribution | P2 | 4 hr |
| 38 | **IoT sensor integration** | Temperature/humidity at mill (future) | P3 | 16 hr |
| 39 | **Carbon credit tracking** | Sustainability metrics from farm data (future) | P3 | 16 hr |
| 40 | **Multi-language** | Portuguese (Brazil), French (West Africa) | P3 | 8 hr |

---

## Critical Path to "Shelf-Ready"

The minimum path from worker check-in to scannable bag on shelf:

```
1. Worker checks in via QR           [DONE]
2. Foreman closes shift              [DONE]
3. Lot created, linked to workers    [DONE]
4. Custody: farm → wet mill          [DONE]
5. Custody: wet mill → dry mill      [DONE]
6. Custody: dry mill → exporter      [DONE]
7. Custody: exporter → roaster       [DONE]
8. Provenance page renders           [DONE]
9. QR code printed on bag            [Phase 2 #6]
10. Real Liquid asset tracking       [Phase 4 #21]
11. Real Lightning payments          [Phase 3 #12]
12. Consumer scans, sees everything  [DONE — web page]
```

**10 of 12 steps are done.** The demo flow works end-to-end with simulated blockchain. Real Liquid + Lightning are Phase 3-4 upgrades that don't change the UX — just make the data immutable and the payments real.

---

## Repo Map

| Repo | What | URL |
|------|------|-----|
| coffee-supply-chain | Backend API + consumer frontend + docs | github.com/Chainbytes/coffee-supply-chain |
| coffee-mobile | Standalone mobile app | github.com/Chainbytes/coffee-mobile |
| ChainbytesCapstone2026 | Legacy capstone (ETH) + JustoBot | github.com/Chainbytes/ChainbytesCapstone2026 |
