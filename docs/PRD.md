# Chainbytes Coffee Supply Chain — Product Requirements Document

**Version:** 1.0 | **Date:** April 4, 2026 | **Status:** Draft

---

## 1. Problem Statement

Coffee farms in El Salvador and Latin America have no affordable, tamper-proof way to prove:
- Which workers harvested which beans, when
- How beans moved from farm → wet mill → dry mill → exporter → roaster → retail
- That workers were paid fairly for their labor
- That "single origin" and "fair trade" claims are real

**Current solutions fail because:**
- Paper certificates are forgeable and disconnected from payment records
- Existing blockchain traceability (IBM Food Trust, etc.) costs $50K+/year and runs on private permissioned chains nobody trusts
- Ethereum/Polygon gas fees and wallet UX are hostile to rural farm workers
- No existing system ties workforce attendance to the beans those workers actually picked

**El Salvador is Bitcoin country.** The infrastructure, regulatory environment, and cultural adoption favor Bitcoin — not Ethereum. Building on Polygon was an academic exercise. Building on Bitcoin is a real product.

---

## 2. Users & Use Cases

### User Segments

| User | Context | Tech Literacy | Primary Job |
|------|---------|---------------|-------------|
| **Farm Worker** | Rural, basic smartphone, spotty connectivity | Low | Check in to shifts, get paid, build work history |
| **Foreman** | On-site supervisor, manages 5-50 workers/shift | Medium | Create shifts, verify attendance, track harvest lots |
| **Farm Owner** | Business operator, manages 1-10 foremen | Medium-High | Payroll, compliance reporting, sell beans with provenance |
| **Mill Operator** | Processes cherries into green beans | Medium | Receive lots, record processing steps, pass custody |
| **Exporter** | Ships green beans internationally | High | Aggregate lots, generate compliance docs, prove origin |
| **Roaster** | Buys green beans, produces retail coffee | High | Verify origin claims, market provenance to consumers |
| **Consumer** | Scans QR on retail bag | Low | See where their coffee came from, who picked it |

### Core Use Cases

**UC1: Workforce Check-in (rewrite of capstone)**
- Foreman creates shift session → Workers scan QR to check in → Attendance recorded on Liquid → Foreman closes shift → Workers paid via Lightning

**UC2: Harvest Lot Creation**
- Foreman tags a harvest lot to a shift → Links which workers picked which lot → Records weight, cherry quality grade, GPS coordinates → Lot gets a Liquid asset ID

**UC3: Custody Transfer (farm → mill → exporter → roaster)**
- Each handoff scans the lot QR → Signs a Liquid transaction transferring the asset → Adds processing metadata (wet/dry mill, grade, cupping score) → Chain of custody is immutable

**UC4: Payroll via Lightning**
- Farm owner sets pay rates → System calculates based on shifts worked → Payment sent via Lightning → Workers receive sats instantly → Payment linked to specific lots they harvested

**UC5: Consumer Provenance Scan**
- Retail bag has a QR code → Consumer scans → Sees: farm name, region, altitude, workers who picked it, processing method, roast date, every custody transfer → All verifiable on-chain

---

## 3. Functional Requirements (MVP — Must Have)

### 3.1 Workforce Module (Liquid + Lightning)

| Req | Description | Acceptance Criteria |
|-----|-------------|---------------------|
| W1 | Worker registration with identity | Worker has name, phone, photo stored off-chain; Liquid address generated |
| W2 | Foreman creates shift session | QR code generated, valid for configurable duration, works offline |
| W3 | Worker QR check-in | Scan QR, sign with Liquid key, check-in recorded |
| W4 | Offline check-in with sync | Check-ins cached locally, synced when connected |
| W5 | Shift submission to Liquid | Batch attendance record issued as Liquid asset with worker list + timestamp |
| W6 | Lightning payroll | Farm owner pays workers in sats via Lightning, payment linked to shift |
| W7 | Worker payment history | Worker sees payment amounts in sats and local currency equivalent |

### 3.2 Supply Chain Module (Liquid)

| Req | Description | Acceptance Criteria |
|-----|-------------|---------------------|
| S1 | Harvest lot creation | Lot linked to shift, workers, weight, GPS, quality grade — issued as Liquid asset |
| S2 | Custody transfer | Lot asset transferred between parties on Liquid with metadata per step |
| S3 | Processing records | Mill operators add wet/dry processing data, drying time, defect count |
| S4 | Export documentation | Exporter generates ICO certificate, phyto cert data from on-chain records |
| S5 | Roaster receipt | Roaster receives lot, adds roast profile, cupping score |
| S6 | Consumer QR scan | Public page shows full provenance chain for any lot |

### 3.3 Mobile App (React Native / Expo)

| Req | Description | Acceptance Criteria |
|-----|-------------|---------------------|
| M1 | Role-based screens | Worker, Foreman, Farm Owner, Mill, Exporter, Roaster views |
| M2 | QR scanning and generation | Camera-based QR for check-in and lot tracking |
| M3 | Lightning wallet integration | Send/receive sats, show balance, tx history |
| M4 | Offline-first architecture | All core functions work without connectivity |
| M5 | Spanish as primary language | Full i18n, Spanish default |
| M6 | Works on basic Android phones | Target Android 10+, 2GB RAM minimum |

### 3.4 Backend API

| Req | Description | Acceptance Criteria |
|-----|-------------|---------------------|
| B1 | Liquid node integration | Issue assets, transfer assets, query chain |
| B2 | Lightning node integration | Generate invoices, send payments, check status |
| B3 | Off-chain data store | Worker profiles, lot metadata, processing records |
| B4 | Sync engine | Reconcile offline check-ins and lot updates |
| B5 | Public provenance API | Given lot ID, return full chain of custody |

---

## 4. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Connectivity** | App must function with 0 connectivity for check-in, lot creation, and custody transfer. Sync when connected. |
| **Latency** | Lightning payments complete in <5 seconds. Liquid transactions confirm in ~1 minute. |
| **Security** | Worker keys stored in device secure enclave. No private keys on backend. |
| **Cost** | Liquid transaction fees <$0.01. Lightning fees <1 sat. No per-user licensing. |
| **Scale** | Support 1,000 workers, 100 farms, 10,000 lots in year 1. |
| **Compliance** | Export data compatible with ICO, USDA organic, Fair Trade certification requirements. |
| **Language** | Spanish primary, English secondary. Prepared for Portuguese (Brazil). |

---

## 5. Technology Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Blockchain (traceability)** | Liquid Network (Blockstream) | Bitcoin sidechain, 1-min blocks, confidential transactions, issued assets for lot tracking. Already used in El Salvador coffee pilots. |
| **Payments** | Lightning Network | Instant, near-free worker payments in sats. El Salvador has Lightning infrastructure (Chivo, Bitcoin Beach). |
| **Mobile** | React Native + Expo | Reuse team knowledge from capstone. Cross-platform. |
| **Backend** | Node.js + Express | Reuse team knowledge. Lightweight. |
| **Database** | SQLite (mobile) + PostgreSQL (server) | Offline-first on device, relational on server. |
| **Liquid SDK** | Blockstream Jade + GDK (Green Development Kit) | Official Blockstream SDK for Liquid wallet and asset operations. |
| **Lightning SDK** | LDK (Lightning Dev Kit) or LNbits API | LDK for embedded, LNbits for hosted. Start with LNbits for prototype. |
| **Identity** | Off-chain with on-chain anchoring | Store PII off-chain, hash + anchor to Liquid for verification. |

---

## 6. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Mobile App (Expo)                      │
│  Worker │ Foreman │ Farm Owner │ Mill │ Exporter │ Roaster│
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐       │
│  │ QR Scan  │  │ Lightning│  │ Offline Cache    │       │
│  │ /Generate│  │ Wallet   │  │ (SQLite)         │       │
│  └──────────┘  └──────────┘  └──────────────────┘       │
└─────────────────────┬───────────────────────────────────┘
                      │ REST API + WebSocket
┌─────────────────────┴───────────────────────────────────┐
│                   Backend (Node/Express)                  │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │ Liquid   │  │ Lightning│  │ Sync     │  │ Public  │ │
│  │ Service  │  │ Service  │  │ Engine   │  │ Prove-  │ │
│  │ (GDK)   │  │ (LNbits) │  │          │  │ nance   │ │
│  └────┬─────┘  └────┬─────┘  └──────────┘  │ API    │ │
│       │              │                       └─────────┘ │
└───────┼──────────────┼──────────────────────────────────┘
        │              │
   ┌────▼────┐    ┌────▼────┐
   │ Liquid  │    │Lightning│
   │ Network │    │ Network │
   │ (L-BTC) │    │ (sats)  │
   └─────────┘    └─────────┘
```

---

## 7. Out of Scope (v1)

| Feature | Rationale |
|---------|-----------|
| Consumer mobile app | v1 uses a public web page for QR scans. Native consumer app is v2. |
| Automated grading (AI/ML) | Manual quality grading first. ML grading is a research project, not MVP. |
| Multi-currency payments | Lightning (sats) only for v1. Fiat off-ramp is a business integration, not a tech feature. |
| Carbon credit tracking | Interesting but orthogonal. Separate product. |
| NFT certificates | Liquid issued assets serve this purpose without the NFT overhead. |
| IoT sensor integration | Temperature/humidity sensors at mills are v2. Manual data entry for v1. |

---

## 8. Phasing

### Phase 1: Prototype (4-6 weeks)
- Workforce check-in on Liquid testnet
- Lightning testnet payroll (LNbits)
- Single farm, hardcoded roles
- Basic lot creation and custody transfer
- Consumer provenance page (static)

### Phase 2: Multi-farm MVP (6-8 weeks)
- Multi-farm registration
- Full custody chain (farm → mill → exporter → roaster)
- Offline-first mobile with sync
- Spanish localization
- Lightning mainnet payments

### Phase 3: Production (ongoing)
- Export compliance document generation
- Roaster/consumer marketplace integration
- Analytics dashboard for farm owners
- API for third-party integrations

---

## 9. Open Questions

| # | Question | Impact |
|---|----------|--------|
| 1 | LNbits hosted vs self-hosted Lightning node? | Prototype can use hosted. Production needs own node for custody. |
| 2 | Liquid Issued Assets vs OP_RETURN for lot tracking? | Issued Assets are richer but more complex. Need Blockstream guidance. |
| 3 | Worker key management — device-only or custodial backup? | Device-only is more secure but lost phone = lost identity. |
| 4 | GPS accuracy on basic phones in mountain farms? | May need to fall back to manual location entry. |
| 5 | Regulatory requirements for Lightning payments to workers in El Salvador? | Bitcoin is legal tender but labor law may require fiat equivalent documentation. |

---

## 10. Success Metrics

| Metric | Target (6 months) |
|--------|-------------------|
| Farms onboarded | 5 |
| Workers using daily | 100 |
| Lots tracked end-to-end | 500 |
| Lightning payments processed | 1,000 |
| Consumer QR scans | 5,000 |
| Average check-in time | <10 seconds |
| Offline sync reliability | >99% |
