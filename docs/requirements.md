# Project Requirements

## Project Overview

**GreenLedger** is a B2B SaaS application for German SMEs (Mittelstand) that automates CSRD/ESRS climate reporting with a deep focus on Scope 3 (supply chain emissions).

**Pain points solved:**

- SMEs are pressured by large customers and auditors to provide Scope 3 emissions data
- Today it's Excel/PDF/email questionnaires, inconsistent supplier replies, missing data
- They need proxy estimates, but with documented assumptions and audit trail

**What we automate:** Supplier data collection → Scope 3 calculation (incl. proxy) → methodology + audit trail → export of an audit-ready "CSRD Climate Report"

## MVP Demo Goal

A 5-minute demo flow:

1. Dashboard shows KPIs: Scope 1, Scope 2, Scope 3, Total
2. Suppliers list + generate/copy tokenized public supplier form link
3. Supplier submits data via public form
4. System creates a Scope 3 record with data_source, assumptions, confidence
5. Export a credible PDF "CSRD Climate Report" (summary + scope 3 breakdown + methodology + assumptions/data quality notes)

## Strict Scope / Non-Goals

- No auth/RBAC, no billing, no ERP integrations
- No iXBRL/XBRL generation
- Climate only (ESRS E1 focus)
- Local demo only (no hosted deployment)

## Tech Stack (Mono-Repo, Next.js Full-Stack)

- One Next.js app (App Router) for both UI and API (Route Handlers under `app/api/*`)
- TailwindCSS for styling
- Database: SQLite via Prisma (schema must be Postgres-migratable)
- PDF export: generate HTML then render to PDF (minimal dependency approach)
- Tests: minimal unit/smoke tests (Vitest for API logic); also ensure `next build` works
- CI: PR validation runs tests + `next build`
- Release: tags `v*` create GitHub Release and build/push Docker image to GHCR
- Local run: `docker compose` or `make dev`

## Project Organization

- Use a mono-repo structure with a single Next.js app
- Root namespace / package name: `green-ledger`
- All application source code lives in the `src/` directory, including `package.json`, `Dockerfile`, Next.js config, Prisma schema, TypeScript source, etc.
- The repo root contains only project-level files: `README.md`, `LICENSE`, `CONTRIBUTING.md`, `CHANGELOG.md`, and directories `docs/`, `scripts/`, `.github/`
- `src/` directory layout (Next.js convention inside `src/`):
  - `src/package.json` — npm package definition
  - `src/Dockerfile` — Docker image build
  - `src/next.config.mjs`, `src/tsconfig.json`, `src/eslint.config.mjs` — config files
  - `src/app/` — Next.js App Router (pages, layouts, API routes)
  - `src/lib/` — shared logic (Prisma client, utilities, constants)
  - `src/prisma/` — Prisma schema and migrations
  - `src/public/` — static assets
- Place all documentation in the `/docs` folder, except for `README.md` at the root
- Key architecture decisions must be documented in separate files per decision: `/docs/adr-NNN-title.md`
- Documentation subfolders under `/docs/features`, `/docs/issues`, and `/docs/workflow` use a global numeric prefix: `NNN-<topic-slug>`
  - **Parallel work rule:** If two branches chose the same next `NNN`, the first PR to merge keeps it; later PRs must renumber before merge.
- The testing strategy is described in `/docs/testing-strategy.md`
- Features of the application (from a user perspective) are described in `/docs/features.md`
- Contribution guidelines are in `/CONTRIBUTING.md`

## Domain Model

All models must be implemented as Prisma schema tables and used in both UI and API.

### Company (single demo company)

| Field | Type | Notes |
|-------|------|-------|
| id | String (uuid) | Primary key |
| name | String | |
| country | String | Default: "DE" |
| reportingYear | Int | |
| orgBoundary | Enum | "operational_control" \| "financial_control" \| "equity_share" |

### Supplier

| Field | Type | Notes |
|-------|------|-------|
| id | String (uuid) | Primary key |
| companyId | String | FK → Company |
| name | String | |
| country | String | |
| sector | String | |
| contactEmail | String | |
| publicFormToken | String | Unique, for public form URL |
| status | Enum | "active" \| "inactive" |

### Scope1Record

| Field | Type | Notes |
|-------|------|-------|
| id | String (uuid) | Primary key |
| companyId | String | FK → Company |
| periodYear | Int | |
| valueTco2e | Float | tonnes CO₂e |
| calculationMethod | String | |
| emissionFactorsSource | String | |
| dataSource | Enum | "manual" \| "csv_import" |
| assumptions | String? | Optional |
| createdAt | DateTime | |

### Scope2Record (location-based only for MVP)

| Field | Type | Notes |
|-------|------|-------|
| id | String (uuid) | Primary key |
| companyId | String | FK → Company |
| periodYear | Int | |
| valueTco2e | Float | |
| calculationMethod | String | |
| emissionFactorsSource | String | |
| dataSource | Enum | "manual" \| "csv_import" |
| assumptions | String? | |
| createdAt | DateTime | |

### Scope3Category

| Field | Type | Notes |
|-------|------|-------|
| id | String (uuid) | Primary key |
| code | String | e.g. "C1".."C15" |
| name | String | |
| material | Boolean | |
| materialityReason | String? | |

### Scope3Record

| Field | Type | Notes |
|-------|------|-------|
| id | String (uuid) | Primary key |
| companyId | String | FK → Company |
| supplierId | String? | FK → Supplier (nullable) |
| categoryId | String | FK → Scope3Category |
| periodYear | Int | |
| valueTco2e | Float | |
| calculationMethod | Enum | "spend_based" \| "activity_based" \| "supplier_specific" |
| emissionFactorSource | String | |
| dataSource | Enum | "supplier_form" \| "csv_import" \| "proxy" |
| assumptions | String? | |
| confidence | Float | 0..1 |
| activityDataJson | Json? | Raw submitted fields (spend_eur, ton_km, kwh, etc.) |
| createdAt | DateTime | |
| updatedAt | DateTime | |

### MethodologyNote

| Field | Type | Notes |
|-------|------|-------|
| id | String (uuid) | Primary key |
| companyId | String | FK → Company |
| scope | Enum | "scope_1" \| "scope_2" \| "scope_3" |
| text | String | |
| updatedAt | DateTime | |

### AuditTrailEvent

| Field | Type | Notes |
|-------|------|-------|
| id | String (uuid) | Primary key |
| companyId | String | FK → Company |
| entityType | Enum | "supplier" \| "scope1" \| "scope2" \| "scope3" \| "methodology" \| "export" |
| entityId | String | |
| action | Enum | "created" \| "updated" \| "submitted" \| "exported" |
| actor | String | "system" \| "supplier" \| "user" |
| timestamp | DateTime | |
| comment | String? | |

## Business Rules (Demo-Level but Explicit)

### 1. Dashboard Totals

- Scope 1 total = sum of `Scope1Record.valueTco2e` for `reportingYear`
- Scope 2 total = sum of `Scope2Record.valueTco2e` for `reportingYear`
- Scope 3 total = sum of `Scope3Record.valueTco2e` for `reportingYear`
- Total = S1 + S2 + S3

### 2. Supplier Public Form

- URL: `/public/supplier/[token]`
- Supplier submits one of:
  - `spend_eur` (purchased goods/services proxy)
  - `ton_km` (transport proxy)
  - `waste_kg` (waste proxy)
- Keep form minimal; store raw fields in `activityDataJson`
- System creates a `Scope3Record` (dataSource = "supplier_form") for a default material category (e.g., Purchased goods & services) unless category is chosen in the form
- If the form lacks enough data, create record using proxy with assumptions + confidence < 1.0

### 3. Proxy & Assumptions

- If supplier provides only `spend_eur`, compute `tCO2e = spend_eur * PROXY_FACTOR` (store factor source string and assumptions)
- Keep `PROXY_FACTOR` as a config constant for demo (document it as placeholder)

### 4. Materiality

- Allow marking `Scope3Category.material` and `materialityReason` in UI
- PDF export should include Scope 3 breakdown by material categories only (and show note if non-material exists)

### 5. PDF Export "CSRD Climate Report"

Sections required:

- **Cover page:** company, reportingYear
- **Summary table:** Scope 1, Scope 2, Scope 3, Total
- **Scope 3 breakdown table by category** (material categories)
- **Methodology section:** pull from `MethodologyNote` scope_3 + brief notes on Scope 1/2
- **Assumptions & Data Quality:**
  - List Scope3Records where `dataSource = "proxy"` OR `confidence < 1` OR `assumptions` not empty
  - Show supplier name, category, assumptions, confidence, dataSource

## Pages (Minimum UI)

| Path | Description |
|------|-------------|
| `/dashboard` | KPI cards for Scope 1, 2, 3, Total |
| `/suppliers` | CRUD + generate/refresh token + copy link |
| `/scope-1` | Simple add/list |
| `/scope-2` | Simple add/list |
| `/scope-3` | Categories + records table |
| `/methodology` | Edit notes |
| `/export` | Download PDF |
| `/public/supplier/[token]` | Public supplier form |
