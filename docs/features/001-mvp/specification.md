# Feature: GreenLedger MVP

## Overview

GreenLedger is a B2B SaaS application for German SMEs (Mittelstand) that automates CSRD/ESRS E1 (climate) reporting with a deep focus on Scope 3 (supply chain) emissions. The MVP implements a complete, demo-ready application that takes a user through supplier data collection, emissions recording, methodology documentation, and PDF export — producing an audit-ready "CSRD Climate Report".

**Core problem solved:** SMEs are pressured by large customers and auditors to provide Scope 3 emissions data. Today this means Excel/PDF/email questionnaires, inconsistent supplier replies, and missing data. GreenLedger automates supplier data collection → Scope 3 calculation (including proxy estimates) → methodology + audit trail → export of an audit-ready report.

---

## User Goals

- As a sustainability officer at an SME, I want a single application where I can enter Scope 1, Scope 2, and Scope 3 emissions data so that I don't manage multiple spreadsheets.
- As a sustainability officer, I want to generate a tokenized link I can send to suppliers, so they can submit their own emissions data directly without needing an account.
- As a sustainability officer, I want the system to use a proxy estimate when a supplier's submission is incomplete, so that no data gap stalls the report.
- As a sustainability officer, I want to document methodology and assumptions per scope, so that auditors can understand how figures were derived.
- As a sustainability officer, I want to download a single PDF "CSRD Climate Report" covering all scopes, methodology, and data quality notes, so that I can share it with customers, auditors, or regulators.
- As a supplier, I want a simple public form (no login required) where I can submit my activity data in a few fields, so that the process is friction-free.

---

## Scope

### In Scope

- **Dashboard** — KPI overview cards for Scope 1, Scope 2, Scope 3 (total), and Grand Total emissions for the configured reporting year.
- **Supplier Management** — Full CRUD for suppliers (create, read, update, soft-delete / status toggle). Generation and refresh of a unique `publicFormToken` per supplier. Copy-to-clipboard of the tokenized public form URL.
- **Scope 1 Recording** — Manual entry and listing of Scope 1 emission records for the reporting company.
- **Scope 2 Recording** — Manual entry and listing of Scope 2 emission records (location-based method only).
- **Scope 3 Recording** — Management of Scope 3 categories (materiality flagging) and records. Records link optionally to a supplier and always to a category.
- **Supplier Public Form** — Unauthenticated public page at `/public/supplier/[token]` where a supplier submits activity data (spend, transport, or waste). System auto-creates a `Scope3Record` from the submission.
- **Proxy Calculation** — When only `spend_eur` is submitted, the system computes `tCO2e = spend_eur × PROXY_FACTOR` (configurable constant), stores the factor source, assumptions, and sets `confidence < 1.0`.
- **Methodology Notes** — Per-scope (Scope 1, Scope 2, Scope 3) free-text methodology notes that can be edited in the UI.
- **Materiality Assessment** — UI to mark each Scope 3 category as material or non-material, with an optional reason field.
- **PDF Export** — Download a "CSRD Climate Report" PDF including cover page, summary table, Scope 3 breakdown by material category, methodology section, and assumptions/data quality notes.
- **Audit Trail** — Every significant data change (supplier created/updated, record submitted/created/exported, methodology edited) is logged to `AuditTrailEvent`.
- **Single-company demo** — One Company record is pre-seeded via Prisma seed; no company-management UI is required.
- **Tech stack:** Next.js 14+ App Router, TypeScript strict mode, TailwindCSS, SQLite via Prisma (schema Postgres-migratable), Vitest unit/smoke tests, `next build` must pass.

### Out of Scope

- Authentication, authorisation, or role-based access control (RBAC).
- Multi-tenancy or multi-company support in the UI (single demo company only).
- Billing, subscription management, or payment flows.
- ERP integrations (SAP, DATEV, etc.).
- iXBRL / XBRL generation.
- Scope 3 categories beyond what the demo data covers (all 15 categories are modelled but only a subset needs demo records).
- Market-based Scope 2 calculation.
- Automated emission factor lookups (factors are constants/config for demo).
- Real hosted deployment (local `docker compose` / `make dev` only for MVP).
- CSV import (the data model supports it, but the UI import flow is deferred post-MVP).

---

## Domain Model

All models are implemented as Prisma schema tables and used in both UI and API.

### Company

Represents the single reporting company. Pre-seeded; no CRUD UI required.

| Field | Type | Notes |
|---|---|---|
| id | String (UUID) | Primary key |
| name | String | Company name |
| country | String | Default `"DE"` |
| reportingYear | Int | The year emissions are reported for |
| orgBoundary | Enum | `"operational_control"` \| `"financial_control"` \| `"equity_share"` |

### Supplier

Represents a supply-chain company from whom emissions data is collected.

| Field | Type | Notes |
|---|---|---|
| id | String (UUID) | Primary key |
| companyId | String | FK → Company |
| name | String | Supplier company name |
| country | String | Country code (e.g. `"DE"`) |
| sector | String | Industry sector |
| contactEmail | String | Contact e-mail for the supplier |
| publicFormToken | String | Unique token; used in the public form URL |
| status | Enum | `"active"` \| `"inactive"` |

**Token generation rule:** On supplier creation (or on explicit refresh), the system generates a cryptographically random unique token and stores it. The public URL is `/public/supplier/[token]`.

### Scope1Record

| Field | Type | Notes |
|---|---|---|
| id | String (UUID) | Primary key |
| companyId | String | FK → Company |
| periodYear | Int | Reporting year |
| valueTco2e | Float | Emissions in tonnes CO₂e |
| calculationMethod | String | Description of calculation method used |
| emissionFactorsSource | String | Source of emission factors (e.g. "DEFRA 2023") |
| dataSource | Enum | `"manual"` \| `"csv_import"` |
| assumptions | String? | Optional free-text assumptions |
| createdAt | DateTime | Auto-set on creation |

### Scope2Record (location-based only)

Same structure as Scope1Record.

| Field | Type | Notes |
|---|---|---|
| id | String (UUID) | Primary key |
| companyId | String | FK → Company |
| periodYear | Int | Reporting year |
| valueTco2e | Float | Emissions in tonnes CO₂e |
| calculationMethod | String | |
| emissionFactorsSource | String | |
| dataSource | Enum | `"manual"` \| `"csv_import"` |
| assumptions | String? | |
| createdAt | DateTime | Auto-set |

### Scope3Category

Pre-seeded with GHG Protocol categories C1–C15. Managed (materiality) via UI.

| Field | Type | Notes |
|---|---|---|
| id | String (UUID) | Primary key |
| code | String | `"C1"` … `"C15"` |
| name | String | Human-readable category name |
| material | Boolean | Default `false`; set by user |
| materialityReason | String? | Optional explanation |

### Scope3Record

| Field | Type | Notes |
|---|---|---|
| id | String (UUID) | Primary key |
| companyId | String | FK → Company |
| supplierId | String? | FK → Supplier (nullable) |
| categoryId | String | FK → Scope3Category |
| periodYear | Int | Reporting year |
| valueTco2e | Float | Emissions in tonnes CO₂e |
| calculationMethod | Enum | `"spend_based"` \| `"activity_based"` \| `"supplier_specific"` |
| emissionFactorSource | String | Source string for the emission factor used |
| dataSource | Enum | `"supplier_form"` \| `"csv_import"` \| `"proxy"` |
| assumptions | String? | Free-text assumptions / notes |
| confidence | Float | `0.0` – `1.0`; `1.0` = fully verified |
| activityDataJson | Json? | Raw submitted fields (`spend_eur`, `ton_km`, `waste_kg`, etc.) |
| createdAt | DateTime | Auto-set |
| updatedAt | DateTime | Auto-updated |

### MethodologyNote

One record per scope per company, editable via the `/methodology` page.

| Field | Type | Notes |
|---|---|---|
| id | String (UUID) | Primary key |
| companyId | String | FK → Company |
| scope | Enum | `"scope_1"` \| `"scope_2"` \| `"scope_3"` |
| text | String | Free-text methodology description |
| updatedAt | DateTime | Auto-updated |

### AuditTrailEvent

Append-only log. No update or delete allowed.

| Field | Type | Notes |
|---|---|---|
| id | String (UUID) | Primary key |
| companyId | String | FK → Company |
| entityType | Enum | `"supplier"` \| `"scope1"` \| `"scope2"` \| `"scope3"` \| `"methodology"` \| `"export"` |
| entityId | String | ID of the affected entity |
| action | Enum | `"created"` \| `"updated"` \| `"submitted"` \| `"exported"` |
| actor | String | `"system"` \| `"supplier"` \| `"user"` |
| timestamp | DateTime | When the event occurred |
| comment | String? | Optional human-readable context |

---

## Pages and User Experience

### `/dashboard`

- Displays four KPI cards: **Scope 1**, **Scope 2**, **Scope 3**, **Total**
- Each card shows the sum of `valueTco2e` for the company's `reportingYear`
- Total = Scope 1 + Scope 2 + Scope 3
- Values shown in **tCO₂e** (tonnes CO₂ equivalent) with two decimal places
- If no records exist for a scope, the card shows `0.00 tCO₂e`
- Navigation links to all other pages are accessible from a persistent sidebar or top navigation

### `/suppliers`

- Lists all suppliers for the company (name, country, sector, status, contact email)
- **Create** supplier via an inline form or modal: name, country, sector, contactEmail, status
  - On creation, a `publicFormToken` is auto-generated and an `AuditTrailEvent` (action: `created`, entityType: `supplier`) is created
- **Edit** supplier: update any field except `publicFormToken`
- **Toggle status** (active ↔ inactive)
- **Generate / refresh token**: regenerates `publicFormToken` (previous link becomes invalid); prompts user to confirm before refreshing
- **Copy link**: copies the full public form URL (`/public/supplier/[token]`) to the clipboard
- The public form URL is displayed inline next to each supplier entry

### `/scope-1`

- Lists all Scope 1 records for the company (period year, value tCO₂e, calculation method, data source, created date)
- **Add record** via form: periodYear, valueTco2e, calculationMethod, emissionFactorsSource, dataSource (`manual`), optional assumptions
  - On save, an `AuditTrailEvent` (action: `created`, entityType: `scope1`) is created
- Records are displayed sorted by periodYear descending, then createdAt descending

### `/scope-2`

- Identical structure to `/scope-1` but for Scope 2 records
- Location-based method only (no market-based option in MVP)
- Same audit trail behaviour

### `/scope-3`

Split into two sub-sections on one page:

**Categories panel:**
- Lists all 15 GHG Protocol Scope 3 categories (code, name, material status, materialityReason)
- Toggle `material` flag per category
- Edit `materialityReason` inline
- Changes trigger an `AuditTrailEvent` (action: `updated`, entityType: `scope3`)

**Records panel:**
- Lists all Scope 3 records (category, supplier name if linked, period year, value, calculationMethod, dataSource, confidence)
- **Add record** via form: categoryId, optional supplierId, periodYear, valueTco2e, calculationMethod, emissionFactorSource, dataSource, optional assumptions, confidence
  - On save, an `AuditTrailEvent` (action: `created`, entityType: `scope3`) is created
- Records sorted by periodYear descending, then category code

### `/methodology`

- Displays three editable text areas, one per scope (`scope_1`, `scope_2`, `scope_3`)
- Each text area is pre-populated from the corresponding `MethodologyNote` record
- On save (per scope or all at once), the note is upserted and an `AuditTrailEvent` (action: `updated`, entityType: `methodology`) is created

### `/export`

- Displays a "Download CSRD Climate Report" button
- On click, triggers PDF generation and download
- Shows a loading indicator during generation
- After download, creates an `AuditTrailEvent` (action: `exported`, entityType: `export`)
- The PDF filename includes the company name and reporting year, e.g. `GreenLedger_CSRD_Report_2024.pdf`

**PDF contents (in order):**

1. **Cover page** — Company name, reporting year, generation date
2. **Summary table** — Scope 1, Scope 2, Scope 3, Grand Total in tCO₂e
3. **Scope 3 breakdown** — Table of material Scope 3 categories with tCO₂e per category; if non-material categories exist with records, show a note with their aggregate
4. **Methodology section** — Pull from `MethodologyNote` for each scope; headings per scope
5. **Assumptions & Data Quality** — Table listing every `Scope3Record` where `dataSource = "proxy"` OR `confidence < 1.0` OR `assumptions` is non-empty; columns: Supplier, Category, Data Source, Assumptions, Confidence

### `/public/supplier/[token]`

Public, unauthenticated page — no navigation sidebar shown.

**If the token is invalid or supplier is inactive:**
- Show a clear error message: "This link is invalid or has expired."

**If the token is valid and supplier is active:**
- Show the supplier name and a brief instruction paragraph
- Form fields (user provides at least one of the following):
  - `spend_eur` — Spend in EUR on purchased goods/services (numeric)
  - `ton_km` — Transport in tonne-kilometres (numeric)
  - `waste_kg` — Waste in kilograms (numeric)
- Optional: a category selector showing material Scope 3 categories (defaults to "C1 – Purchased goods & services" if not chosen)
- **Submit** button

**On valid submission:**
- Store all provided fields in `activityDataJson`
- Apply proxy calculation (see Business Rules § Proxy)
- Create a `Scope3Record` with `dataSource = "supplier_form"` or `"proxy"` as appropriate
- Create an `AuditTrailEvent` (action: `submitted`, entityType: `scope3`, actor: `"supplier"`)
- Show a success confirmation message to the supplier; form is cleared

**On invalid submission (no fields provided):**
- Show inline validation error: "Please enter at least one activity value."

---

## Business Rules

### 1. Dashboard Totals

```
Scope1Total  = SUM(Scope1Record.valueTco2e WHERE companyId = X AND periodYear = reportingYear)
Scope2Total  = SUM(Scope2Record.valueTco2e WHERE companyId = X AND periodYear = reportingYear)
Scope3Total  = SUM(Scope3Record.valueTco2e WHERE companyId = X AND periodYear = reportingYear)
GrandTotal   = Scope1Total + Scope2Total + Scope3Total
```

### 2. Supplier Token Generation

- Token must be cryptographically random (e.g. UUID v4 or `crypto.randomBytes`)
- Token must be globally unique (enforced via DB unique constraint)
- On refresh, the old token is immediately invalid; the new token must be persisted before the URL is shown

### 3. Proxy Calculation

When a supplier submission contains `spend_eur` (and no more specific data):

```
tCO2e = spend_eur × PROXY_FACTOR
```

- `PROXY_FACTOR` is a named constant in application config (e.g. `lib/constants.ts`), documented as a placeholder value
- The `emissionFactorSource` field stores a human-readable string identifying the proxy factor origin (e.g. `"DEFRA spend-based proxy 2023 – placeholder"`)
- `dataSource` is set to `"proxy"`
- `assumptions` is populated with a standard text describing the proxy method
- `confidence` is set to `0.5` (configurable constant) to flag data quality

When `ton_km` or `waste_kg` are provided, the system still uses a configurable factor per unit type, following the same pattern.

If multiple activity fields are submitted, use the most specific one available (supplier-specific > activity-based > spend-based).

### 4. Materiality Assessment

- By default, all 15 Scope 3 categories are pre-seeded with `material = false`
- The user can toggle any category to `material = true` and optionally provide a `materialityReason`
- The PDF export uses only `material = true` categories in the Scope 3 breakdown table
- A summary note is appended if non-material categories have associated records

### 5. PDF "CSRD Climate Report"

- PDF is generated server-side by rendering an HTML template and converting it to PDF
- The approach should minimise external dependencies (e.g. use `puppeteer` in headless mode, or a lightweight HTML-to-PDF library)
- The report must be self-contained: all data is fetched at generation time; no external URLs embedded
- Numbers are formatted to 2 decimal places
- All section headings reference the reporting year

### 6. Audit Trail

An `AuditTrailEvent` must be created for every:

| Trigger | entityType | action | actor |
|---|---|---|---|
| Supplier created via UI | `supplier` | `created` | `user` |
| Supplier updated via UI | `supplier` | `updated` | `user` |
| Scope 1 record created | `scope1` | `created` | `user` |
| Scope 2 record created | `scope2` | `created` | `user` |
| Scope 3 record created via UI | `scope3` | `created` | `user` |
| Scope 3 record created via supplier form | `scope3` | `submitted` | `supplier` |
| Methodology note updated | `methodology` | `updated` | `user` |
| PDF exported | `export` | `exported` | `user` |

Audit trail is not visible in the MVP UI (data is in DB for auditors), but the records must be written correctly.

---

## Tech Stack Requirements

| Concern | Technology / Approach |
|---|---|
| Framework | Next.js 14+ with App Router |
| Language | TypeScript (strict mode) |
| Styling | TailwindCSS |
| Database | SQLite via Prisma ORM (schema must be Postgres-migratable — avoid SQLite-specific types) |
| API | Next.js Route Handlers under `app/api/*` |
| PDF generation | Server-side HTML-to-PDF (minimal deps; e.g. `puppeteer` or equivalent) |
| Testing | Vitest (unit + smoke tests for API logic) |
| Build validation | `next build` must succeed in CI |
| Linting | ESLint with Next.js recommended config + Prettier |
| Pre-commit hooks | Husky (lint + type check) |
| Local run | `docker compose` or `make dev` |

**Source layout** (all application code under `src/`):

```
src/
  package.json
  Dockerfile
  next.config.mjs
  tsconfig.json
  eslint.config.mjs
  app/              # Next.js App Router (pages, layouts, API routes)
  lib/              # Shared logic (Prisma client, utilities, constants)
  prisma/           # Prisma schema and migrations
  public/           # Static assets
```

### Coding Conventions

- TypeScript strict mode enabled
- Functional components with hooks
- Server components by default; `"use client"` only when required (event handlers, browser APIs)
- Named exports everywhere except Next.js page/layout conventions
- `const` over `let`; never `var`
- Async/await over raw Promises
- Prisma for all DB access (no raw SQL)
- Files kept under 200–300 lines; refactor when approaching the limit

---

## Success Criteria

- [ ] `GET /dashboard` renders Scope 1, 2, 3, and Total KPI cards with correct summed values from the database
- [ ] `GET /suppliers` lists all suppliers; user can create a new supplier and the public form token is generated automatically
- [ ] "Copy link" on a supplier copies `/public/supplier/[token]` to the clipboard
- [ ] "Refresh token" invalidates the old link and generates a new one (with confirmation prompt)
- [ ] `GET /public/supplier/[token]` with a valid token renders the supplier submission form
- [ ] Supplier submits `spend_eur`; system creates a `Scope3Record` with `dataSource = "proxy"`, `confidence < 1.0`, and populated `assumptions`
- [ ] Dashboard Scope 3 total updates after the supplier submission
- [ ] `GET /scope-1` allows adding a Scope 1 record; it appears in the list and updates the dashboard
- [ ] `GET /scope-2` allows adding a Scope 2 record; it appears in the list and updates the dashboard
- [ ] `GET /scope-3` shows all 15 categories; user can toggle materiality on any category
- [ ] `GET /scope-3` allows adding a Scope 3 record manually
- [ ] `GET /methodology` allows editing and saving methodology notes per scope
- [ ] `GET /export` triggers download of a PDF containing: cover page, summary table, Scope 3 breakdown (material categories only), methodology section, assumptions/data quality section
- [ ] All significant data changes generate corresponding `AuditTrailEvent` rows in the database
- [ ] `next build` completes without errors
- [ ] Vitest unit/smoke tests pass
- [ ] Public form at an invalid token URL shows a clear error message
- [ ] No login or authentication is required for any page except the public supplier form (which is always accessible)
- [ ] `docker compose up` starts the application locally

---

## Open Questions

1. **Proxy factor values** — What numeric values should `PROXY_FACTOR` (spend-based), transport (per tonne-km), and waste (per kg) constants use for the demo? The architecture should make these easy to update; the Requirements Engineer recommends documenting them clearly as placeholders in `lib/constants.ts`.

2. **Scope 3 category pre-seed data** — Should all 15 GHG Protocol categories be pre-seeded with the standard names, or only the subset most relevant to a German Mittelstand demo? Recommendation: seed all 15 with standard names; demo data uses C1 and C4 as material categories.

3. **PDF library choice** — `puppeteer` adds ~200 MB to the Docker image. Is a lighter alternative (e.g., `@react-pdf/renderer` or `html-pdf-node`) acceptable, or is puppeteer preferred for fidelity? This is an architectural decision deferred to the Architect.

4. **Navigation structure** — Should the dashboard be the default `/` route (with redirect) or should the app root render a landing/splash screen? Recommendation: `/` redirects to `/dashboard`.

5. **Demo seed data** — Should the Prisma seed script include sample suppliers and emissions records for a richer demo, or start empty? Recommendation: seed one company, 15 Scope 3 categories, 2–3 suppliers with tokens, and a few Scope 1/2/3 records.
