# Feature: MVP — Complete Initial Implementation

**Feature Number:** 001
**Slug:** mvp

---

## Overview

This is a B2B SaaS application for German SMEs (Mittelstand) that automates CSRD/ESRS climate reporting with a deep focus on Scope 3 (supply chain emissions). The MVP delivers the complete initial implementation of the product — from the database schema and API layer through to the full Next.js UI and an exportable PDF CSRD Climate Report.

**Problem solved:**

- SMEs face growing pressure from large customers and auditors to provide Scope 3 emissions data.
- Today the process relies on Excel/PDF/email questionnaires with inconsistent supplier replies and missing data.
- Companies need proxy estimates with documented assumptions and an audit trail.

**What the MVP automates:**

1. Supplier data collection via tokenized public forms
2. Scope 3 calculation (including proxy estimates with documented assumptions)
3. Methodology notes and audit trail
4. Export of an audit-ready "CSRD Climate Report" PDF

---

## User Goals

- View aggregated KPIs for Scope 1, Scope 2, Scope 3 and total emissions on a single dashboard.
- Manage a supplier list and distribute tokenized public form links to each supplier.
- Suppliers can submit activity data through a public, no-login form.
- Record Scope 1 and Scope 2 emissions manually.
- Manage Scope 3 categories and records (from supplier forms, CSV import, or proxy).
- Document the calculation methodology and assumptions for auditors.
- Export a structured, audit-ready CSRD Climate Report as a PDF.

---

## Scope

### In Scope

- Single-company demo environment (no multi-tenancy).
- All 8 application pages listed in §Pages.
- All 8 domain models listed in §Domain Model.
- All business rules listed in §Business Rules.
- REST API routes under `app/api/*` for every domain model.
- Full Next.js App Router UI with TailwindCSS.
- SQLite database via Prisma (schema must be Postgres-migratable).
- PDF export using a server-side HTML-to-PDF rendering approach.
- Minimal unit/smoke tests using Vitest covering core API logic.
- CI/CD workflows: PR Validation, CI (versioning), Release (Docker + GHCR).
- Local run support via `docker compose` and `make dev`.

### Out of Scope

- Authentication, RBAC, or user accounts of any kind.
- Billing or subscription management.
- ERP integrations (SAP, Oracle, etc.).
- iXBRL/XBRL report generation.
- Non-climate ESRS topics (social, governance, biodiversity, etc.) — ESRS E1 only.
- Scope 2 market-based calculations (location-based only for MVP).
- Hosted/cloud deployment (local demo only).
- Real emission factor databases (a single configurable `PROXY_FACTOR` constant is sufficient).

---

## Pages

| Path | Description |
|------|-------------|
| `/dashboard` | KPI cards showing Scope 1, Scope 2, Scope 3, and Total tCO₂e for the reporting year. |
| `/suppliers` | Supplier list with CRUD operations; generate/refresh unique public form tokens; copy shareable link to clipboard. |
| `/scope-1` | Add and list Scope 1 emission records. |
| `/scope-2` | Add and list Scope 2 emission records (location-based). |
| `/scope-3` | Manage Scope 3 categories (mark as material) and view/add Scope 3 records table. |
| `/methodology` | Edit free-text methodology notes per scope (Scope 1, 2, 3). |
| `/export` | Trigger PDF export and download the CSRD Climate Report. |
| `/public/supplier/[token]` | Public supplier data-entry form (no authentication required). Accessed via unique token URL. |

---

## Domain Model

All models are implemented as Prisma schema tables and used in both the UI and API.

### Company (single demo company)

| Field | Type | Notes |
|-------|------|-------|
| id | String (uuid) | Primary key |
| name | String | |
| country | String | Default: `"DE"` |
| reportingYear | Int | The year being reported on |
| orgBoundary | Enum | `"operational_control"` \| `"financial_control"` \| `"equity_share"` |

### Supplier

| Field | Type | Notes |
|-------|------|-------|
| id | String (uuid) | Primary key |
| companyId | String | FK → Company |
| name | String | |
| country | String | |
| sector | String | |
| contactEmail | String | |
| publicFormToken | String | Unique; used in public form URL |
| status | Enum | `"active"` \| `"inactive"` |

### Scope1Record

| Field | Type | Notes |
|-------|------|-------|
| id | String (uuid) | Primary key |
| companyId | String | FK → Company |
| periodYear | Int | |
| valueTco2e | Float | Tonnes CO₂e |
| calculationMethod | String | |
| emissionFactorsSource | String | |
| dataSource | Enum | `"manual"` \| `"csv_import"` |
| assumptions | String? | Optional |
| createdAt | DateTime | |

### Scope2Record (location-based only)

| Field | Type | Notes |
|-------|------|-------|
| id | String (uuid) | Primary key |
| companyId | String | FK → Company |
| periodYear | Int | |
| valueTco2e | Float | Tonnes CO₂e |
| calculationMethod | String | |
| emissionFactorsSource | String | |
| dataSource | Enum | `"manual"` \| `"csv_import"` |
| assumptions | String? | Optional |
| createdAt | DateTime | |

### Scope3Category

| Field | Type | Notes |
|-------|------|-------|
| id | String (uuid) | Primary key |
| code | String | e.g. `"C1"` through `"C15"` |
| name | String | Human-readable category name |
| material | Boolean | Whether this category is material for reporting |
| materialityReason | String? | Optional explanation of materiality decision |

### Scope3Record

| Field | Type | Notes |
|-------|------|-------|
| id | String (uuid) | Primary key |
| companyId | String | FK → Company |
| supplierId | String? | FK → Supplier (nullable) |
| categoryId | String | FK → Scope3Category |
| periodYear | Int | |
| valueTco2e | Float | Tonnes CO₂e |
| calculationMethod | Enum | `"spend_based"` \| `"activity_based"` \| `"supplier_specific"` |
| emissionFactorSource | String | Source of emission factor used |
| dataSource | Enum | `"supplier_form"` \| `"csv_import"` \| `"proxy"` |
| assumptions | String? | Optional |
| confidence | Float | Range 0..1 (1 = highest confidence) |
| activityDataJson | Json? | Raw submitted fields (`spend_eur`, `ton_km`, `kwh`, etc.) |
| createdAt | DateTime | |
| updatedAt | DateTime | |

### MethodologyNote

| Field | Type | Notes |
|-------|------|-------|
| id | String (uuid) | Primary key |
| companyId | String | FK → Company |
| scope | Enum | `"scope_1"` \| `"scope_2"` \| `"scope_3"` |
| text | String | Free-text methodology description |
| updatedAt | DateTime | |

### AuditTrailEvent

| Field | Type | Notes |
|-------|------|-------|
| id | String (uuid) | Primary key |
| companyId | String | FK → Company |
| entityType | Enum | `"supplier"` \| `"scope1"` \| `"scope2"` \| `"scope3"` \| `"methodology"` \| `"export"` |
| entityId | String | ID of the affected entity |
| action | Enum | `"created"` \| `"updated"` \| `"submitted"` \| `"exported"` |
| actor | String | `"system"` \| `"supplier"` \| `"user"` |
| timestamp | DateTime | |
| comment | String? | Optional notes |

---

## Business Rules

### 1. Dashboard Totals

- **Scope 1 total** = sum of `Scope1Record.valueTco2e` where `periodYear = reportingYear`
- **Scope 2 total** = sum of `Scope2Record.valueTco2e` where `periodYear = reportingYear`
- **Scope 3 total** = sum of `Scope3Record.valueTco2e` where `periodYear = reportingYear`
- **Grand total** = Scope 1 + Scope 2 + Scope 3

### 2. Supplier Public Form

- URL pattern: `/public/supplier/[token]`
- The token is stored on the `Supplier` model and must be unique across all suppliers.
- A supplier submits **one** of the following activity data fields:
  - `spend_eur` — purchased goods/services proxy
  - `ton_km` — transport activity proxy
  - `waste_kg` — waste proxy
- Raw activity data is stored in `Scope3Record.activityDataJson`.
- On submission, the system creates a `Scope3Record` with `dataSource = "supplier_form"` linked to the submitting supplier.
- The record is assigned a default material Scope 3 category (e.g., "Purchased goods & services / C1") unless the supplier selects a category in the form.
- If the submitted data is insufficient to calculate exact emissions, a proxy record is created with documented assumptions and `confidence < 1.0`.

### 3. Proxy Calculation

- When a supplier provides only `spend_eur`, compute: `tCO₂e = spend_eur × PROXY_FACTOR`
- `PROXY_FACTOR` is a named constant in the application config (e.g., `src/lib/constants.ts`).
- The factor source string and assumptions must be stored on the resulting `Scope3Record`.
- `PROXY_FACTOR` is documented as a placeholder value for the demo; real-world implementation would use sector-specific factors.

### 4. Materiality

- Users can mark any `Scope3Category` as material and optionally enter a `materialityReason`.
- The PDF export includes the Scope 3 breakdown for **material categories only**.
- If non-material Scope 3 records exist, the PDF includes a note acknowledging their existence but excluding them from the breakdown table.

### 5. PDF Export — CSRD Climate Report

The exported PDF must include the following sections in order:

| Section | Content |
|---------|---------|
| **Cover page** | Company name and reporting year |
| **Executive summary table** | Scope 1, Scope 2, Scope 3, and Total tCO₂e |
| **Scope 3 breakdown** | Table of material Scope 3 categories with tCO₂e totals; note about excluded non-material categories |
| **Methodology** | Text from `MethodologyNote` for `scope_3`; brief notes for Scope 1 and Scope 2 |
| **Assumptions & Data Quality** | List of all `Scope3Record` entries where `dataSource = "proxy"` OR `confidence < 1` OR `assumptions` is non-empty; shows supplier name, category, assumptions, confidence score, and data source |

---

## API Routes

All routes are implemented as Next.js Route Handlers under `src/app/api/`.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/company` | Get the single demo company |
| PUT | `/api/company` | Update company settings |
| GET | `/api/suppliers` | List all suppliers |
| POST | `/api/suppliers` | Create a supplier |
| GET | `/api/suppliers/[id]` | Get a single supplier |
| PUT | `/api/suppliers/[id]` | Update a supplier |
| DELETE | `/api/suppliers/[id]` | Delete a supplier |
| POST | `/api/suppliers/[id]/token` | Generate/refresh public form token |
| GET | `/api/scope1` | List Scope 1 records |
| POST | `/api/scope1` | Create a Scope 1 record |
| DELETE | `/api/scope1/[id]` | Delete a Scope 1 record |
| GET | `/api/scope2` | List Scope 2 records |
| POST | `/api/scope2` | Create a Scope 2 record |
| DELETE | `/api/scope2/[id]` | Delete a Scope 2 record |
| GET | `/api/scope3/categories` | List Scope 3 categories |
| PUT | `/api/scope3/categories/[id]` | Update category materiality |
| GET | `/api/scope3/records` | List Scope 3 records |
| POST | `/api/scope3/records` | Create a Scope 3 record |
| DELETE | `/api/scope3/records/[id]` | Delete a Scope 3 record |
| POST | `/api/public/supplier/[token]` | Submit supplier form data (public, no auth) |
| GET | `/api/methodology` | List methodology notes |
| PUT | `/api/methodology/[scope]` | Upsert a methodology note |
| GET | `/api/export/pdf` | Generate and return the CSRD Climate Report PDF |
| GET | `/api/dashboard` | Aggregate KPI totals for the reporting year |
| GET | `/api/audit` | List audit trail events |

---

## Tech Stack

| Concern | Technology |
|---------|-----------|
| Framework | Next.js (App Router), TypeScript strict mode |
| Styling | TailwindCSS |
| Database | SQLite via Prisma (schema must be Postgres-migratable without changes) |
| PDF generation | Server-side HTML rendering → PDF (minimal dependencies; e.g., Puppeteer or equivalent) |
| Testing | Vitest for unit/smoke tests; `next build` as integration smoke test |
| CI/CD | GitHub Actions: PR Validation, CI (commit-and-tag-version), Release (Docker + GHCR) |
| Containerisation | Docker; `docker compose` for local development |
| Local dev | `make dev` or `docker compose up` |

### Coding Standards

- TypeScript strict mode — no `any`, no implicit types.
- Next.js App Router conventions: `layout.tsx`, `page.tsx`, `route.ts`.
- Server components by default; `"use client"` only where interactivity requires it.
- `const` over `let`; never `var`.
- Named exports preferred over default exports (except Next.js page/layout conventions).
- `async/await` preferred over raw Promises.
- Prisma for all database access — no raw SQL.
- ESLint with Next.js recommended config + Prettier.
- Husky pre-commit hooks: lint + type check.
- Files kept under 200–300 lines; refactor when approaching that limit.

### Project Layout

```
/                          # Repo root (README, LICENSE, docs/, scripts/, .github/)
src/
  package.json             # npm package definition
  Dockerfile               # Docker image build
  next.config.mjs          # Next.js config
  tsconfig.json            # TypeScript config
  eslint.config.mjs        # ESLint config
  app/                     # Next.js App Router
    api/                   # API Route Handlers
    (pages)/               # UI pages
    layout.tsx
  lib/                     # Shared logic (Prisma client, constants, utilities)
  prisma/                  # Prisma schema and migrations
  public/                  # Static assets
```

---

## 5-Minute Demo Flow

The MVP must support the following end-to-end demonstration scenario:

1. **Dashboard** — Open `/dashboard`; see Scope 1, Scope 2, Scope 3, and Total KPI cards populated with seeded data.
2. **Suppliers** — Navigate to `/suppliers`; view supplier list; click "Generate Link" for one supplier; copy the tokenized URL to clipboard.
3. **Supplier form** — Open the copied URL in a new tab (`/public/supplier/[token]`); enter `spend_eur = 50000`; submit the form.
4. **Scope 3 created** — Return to `/scope-3`; observe a new Scope 3 record with `dataSource = "supplier_form"`, proxy assumptions, and `confidence < 1.0`.
5. **Export** — Navigate to `/export`; click "Download PDF"; open the CSRD Climate Report; verify it contains the summary table, Scope 3 breakdown, methodology, and assumptions sections.

---

## Success Criteria

### Dashboard

- [ ] KPI cards display correct summed tCO₂e totals for Scope 1, 2, 3, and Total for `reportingYear`.
- [ ] Grand total equals S1 + S2 + S3.

### Suppliers

- [ ] User can create, read, update, and delete suppliers.
- [ ] Generating a token creates a unique `publicFormToken` on the supplier record.
- [ ] Refreshing a token replaces the old token.
- [ ] The shareable URL is formatted as `/public/supplier/[token]`.

### Scope 1 & Scope 2

- [ ] User can add and list Scope 1 records with all required fields.
- [ ] User can add and list Scope 2 records with all required fields.

### Scope 3

- [ ] Scope 3 categories (C1–C15) are seeded in the database.
- [ ] User can mark a category as material and provide a materiality reason.
- [ ] Scope 3 records can be created manually and via supplier form submission.
- [ ] Records created from supplier forms store raw activity data in `activityDataJson`.

### Supplier Public Form

- [ ] The form is accessible without authentication using only the supplier token.
- [ ] Submitting `spend_eur` creates a Scope 3 record with proxy calculation applied.
- [ ] The resulting record has `dataSource = "supplier_form"`, documented assumptions, and `confidence < 1.0` when proxy is used.
- [ ] An `AuditTrailEvent` with `action = "submitted"` and `actor = "supplier"` is created on submission.

### Methodology

- [ ] User can create and update methodology notes for each scope.

### PDF Export

- [ ] A downloadable PDF is generated server-side.
- [ ] The PDF contains: cover page, executive summary table, Scope 3 material breakdown, methodology section, assumptions & data quality section.
- [ ] Only material Scope 3 categories appear in the breakdown table.
- [ ] Scope 3 records with proxy data, low confidence, or assumptions are listed in the assumptions section.
- [ ] Generating the export creates an `AuditTrailEvent` with `action = "exported"`.

### Tech & Quality

- [ ] TypeScript strict mode passes with zero errors (`tsc --noEmit`).
- [ ] ESLint passes with zero errors.
- [ ] All Vitest unit/smoke tests pass.
- [ ] `next build` completes without errors.
- [ ] Application starts and serves all 8 pages with `docker compose up`.

---

## Open Questions

None — requirements are fully derived from `docs/requirements.md` which constitutes the authoritative product specification for the MVP.
