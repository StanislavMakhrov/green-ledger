# Feature: GreenLedger MVP

## Overview

GreenLedger is a B2B SaaS application for German SMEs (Mittelstand) that automates CSRD/ESRS climate reporting with a deep focus on Scope 3 (supply chain emissions). The MVP provides a complete, demo-ready implementation of the core reporting workflow: from supplier data collection through Scope 1/2/3 emission recording, all the way to generating an audit-ready "CSRD Climate Report" PDF.

**Problem Solved:**
- SMEs are pressured by large customers and auditors to provide Scope 3 emissions data
- Current process relies on Excel/PDF/email questionnaires with inconsistent supplier replies and missing data
- SMEs need proxy estimates with documented assumptions and an audit trail for credibility

**What the MVP Automates:**
Supplier data collection → Scope 3 calculation (including proxy estimates) → methodology and audit trail → export of an audit-ready "CSRD Climate Report"

---

## User Goals

- As a **sustainability manager**, I want to see a dashboard of my company's total Scope 1, 2, and 3 emissions at a glance, so that I can understand our overall climate footprint immediately
- As a **sustainability manager**, I want to manage my supplier list and send them a tokenized form link, so that I can collect their emissions data without needing them to register on any platform
- As a **supplier contact**, I want to submit my company's activity data (spend, transport, waste) via a simple public URL, so that I can respond to customer requests without creating an account
- As a **sustainability manager**, I want to manually enter Scope 1 and Scope 2 emission records, so that I can record direct and energy-related emissions alongside supply chain data
- As a **sustainability manager**, I want to manage Scope 3 categories and records (including materiality assessment), so that I can track and categorise supply chain emissions accurately
- As a **sustainability manager**, I want to document methodology notes for each scope, so that auditors can understand how emissions were calculated
- As a **sustainability manager**, I want to export a structured "CSRD Climate Report" as a PDF, so that I can share a credible, audit-ready document with customers, investors, and auditors

---

## Scope

### In Scope

**Dashboard**
- Display KPI cards for Scope 1, Scope 2, Scope 3, and Total emissions (tCO₂e) for the reporting year
- Totals computed as sums of records in each scope for the configured reporting year

**Supplier Management**
- List all suppliers with name, country, sector, contact email, and status
- Create, edit, and delete suppliers
- Generate a unique tokenized public form URL per supplier (and regenerate/refresh it)
- Copy the public form link to clipboard

**Scope 1 Data Entry**
- Add Scope 1 emission records with: period year, value (tCO₂e), calculation method, emission factors source, data source, and optional assumptions
- List all Scope 1 records for the company

**Scope 2 Data Entry**
- Add Scope 2 emission records (location-based method only) with: period year, value (tCO₂e), calculation method, emission factors source, data source, and optional assumptions
- List all Scope 2 records for the company

**Scope 3 Data Entry**
- Manage Scope 3 categories (C1–C15) including marking categories as material and adding materiality reasons
- Add Scope 3 records linked to a category and optionally a supplier, with: period year, value (tCO₂e), calculation method (spend-based/activity-based/supplier-specific), emission factor source, data source, optional assumptions, and confidence score (0–1)
- List all Scope 3 records per category and across the company

**Supplier Public Form**
- Publicly accessible (no login) form at `/public/supplier/[token]`
- Supplier can submit one or more of: `spend_eur`, `ton_km`, `waste_kg`
- System creates a Scope 3 record from the submitted data; raw fields stored in `activityDataJson`
- If only `spend_eur` is provided, system computes `tCO₂e = spend_eur × PROXY_FACTOR` (configurable constant) and sets `dataSource = "supplier_form"`, `confidence < 1.0`, with documented assumptions
- Audit trail event recorded for the submission

**Methodology Notes**
- Edit and save methodology notes per scope (Scope 1, Scope 2, Scope 3)
- Notes are free-text fields used in PDF export

**PDF Export — "CSRD Climate Report"**
- Trigger generation and download from the `/export` page
- Report sections:
  1. **Cover page** — company name, reporting year
  2. **Summary table** — Scope 1, Scope 2, Scope 3, Total (tCO₂e)
  3. **Scope 3 breakdown table** — material categories only (with note if non-material categories exist)
  4. **Methodology section** — pulled from `MethodologyNote` for Scope 3, plus brief notes on Scope 1/2
  5. **Assumptions & Data Quality** — lists Scope 3 records where `dataSource = "proxy"` OR `confidence < 1` OR `assumptions` is not empty, showing: supplier name, category, assumptions, confidence, data source
- PDF is generated server-side using HTML-to-PDF rendering (minimal dependency approach)

**Audit Trail**
- Every create/update/delete/submit/export action is recorded with: entity type, entity ID, action, actor (`"user"` / `"supplier"` / `"system"`), timestamp, and optional comment
- Audit trail stored in `AuditTrailEvent` table (viewable but no dedicated UI page required for MVP)

**Domain Model — All entities persisted via Prisma to SQLite:**
- `Company` (single demo company seeded at startup)
- `Supplier`
- `Scope1Record`
- `Scope2Record`
- `Scope3Category`
- `Scope3Record`
- `MethodologyNote`
- `AuditTrailEvent`

### Out of Scope

- Authentication, authorisation, RBAC, or multi-tenancy
- Billing or subscription management
- ERP / accounting system integrations
- iXBRL/XBRL generation or other machine-readable regulatory formats
- Non-climate ESRS topics (social, governance, biodiversity, etc.)
- Market-based Scope 2 calculation method (location-based only)
- Bulk CSV import of emission records (noted in domain model as future `dataSource` option but not implemented in MVP)
- Multi-company support (single demo company only)
- Hosted/production deployment (local demo and Docker Compose only)
- Advanced supplier portal features (history, document upload, notifications)
- Real PROXY_FACTOR values — the proxy factor is a hardcoded demo constant, explicitly documented as a placeholder

---

## User Experience

### Navigation

A persistent sidebar or top navigation links to: Dashboard, Suppliers, Scope 1, Scope 2, Scope 3, Methodology, Export.

### `/dashboard`

- Four KPI cards prominently displaying tCO₂e values: Scope 1, Scope 2, Scope 3, Total
- Values automatically reflect the configured `reportingYear`
- Empty states shown with zero values if no records exist

### `/suppliers`

- Table of all suppliers (name, country, sector, email, status, actions)
- "Add Supplier" form or modal with required fields: name, country, sector, contact email
- Per-row actions: Edit, Delete, Copy Link, Refresh Token
- Public form URL displayed or copyable per supplier row

### `/scope-1` and `/scope-2`

- "Add Record" form with fields: period year, value (tCO₂e), calculation method, emission factors source, data source (dropdown), assumptions (optional textarea)
- Table listing existing records with date added
- Delete action per record

### `/scope-3`

- **Categories view:** list of all 15 ESRS Scope 3 categories (C1–C15) with material flag toggle and materiality reason field
- **Records view:** table of all Scope 3 records showing supplier (if any), category, value, data source, confidence, created date
- "Add Record" form with fields: category (dropdown), supplier (optional dropdown), period year, value (tCO₂e), calculation method (dropdown: spend_based / activity_based / supplier_specific), emission factor source, data source (dropdown), assumptions (optional), confidence (0–1 slider or number input)

### `/methodology`

- Three tabbed or sectioned text areas: Scope 1 notes, Scope 2 notes, Scope 3 notes
- "Save" button per section; last updated timestamp shown

### `/export`

- Single "Generate Report" button
- On click, server generates the PDF and triggers download
- Shows loading state during generation

### `/public/supplier/[token]`

- Publicly accessible (no authentication)
- Simple form with supplier name pre-filled (resolved from token)
- Activity data fields: Spend (EUR), Transport (tonne-km), Waste (kg) — at least one required
- Optional category selector (defaults to C1 — Purchased goods & services)
- Submit button; success/error message displayed after submission
- Invalid or expired token shows a clear error page

### Error Handling

- Invalid form submissions show inline validation errors
- Invalid supplier token shows a "Form not found" error page
- API errors show a toast or inline error message
- Empty states (no records yet) display helpful placeholder text

---

## Business Rules

### Dashboard Totals

- Scope 1 total = `SUM(Scope1Record.valueTco2e)` WHERE `companyId = <demo company>` AND `periodYear = reportingYear`
- Scope 2 total = `SUM(Scope2Record.valueTco2e)` WHERE `companyId = <demo company>` AND `periodYear = reportingYear`
- Scope 3 total = `SUM(Scope3Record.valueTco2e)` WHERE `companyId = <demo company>` AND `periodYear = reportingYear`
- Total = Scope 1 + Scope 2 + Scope 3

### Supplier Token

- `publicFormToken` is a unique, randomly generated string (UUID or similar)
- Refreshing a token invalidates the old URL immediately (old token returns 404)
- The public form URL pattern: `/public/supplier/[token]`

### Proxy Calculation (Supplier Form)

- When `spend_eur` is provided and no direct tCO₂e is submitted:
  - `tCO₂e = spend_eur × PROXY_FACTOR`
  - `PROXY_FACTOR` is a config constant (documented as a placeholder for demo)
  - Resulting record: `dataSource = "supplier_form"`, `calculationMethod = "spend_based"`, `confidence < 1.0`, `assumptions` must document the proxy factor used and its source string
- When `ton_km` or `waste_kg` is provided but no tCO₂e:
  - System records the raw activity data in `activityDataJson` and computes an estimate using respective proxy factors (documented as placeholders), with appropriate confidence and assumptions

### Materiality

- A `Scope3Category` is considered material when `material = true`
- PDF export Scope 3 breakdown table includes material categories only
- If any non-material categories have records, a footnote appears in the PDF

### PDF Generation

- HTML is rendered server-side then converted to PDF using a minimal library (no heavyweight headless browser required for MVP)
- PDF must include all five required sections (see Scope section above)

### Audit Trail

- Every user-initiated write operation (create, update, delete) generates an `AuditTrailEvent`
- Supplier form submissions generate an event with `actor = "supplier"`
- PDF exports generate an event with `actor = "user"`, `action = "exported"`, `entityType = "export"`

---

## Non-Functional Requirements

### Performance
- Dashboard loads in under 3 seconds with up to 100 records per scope
- PDF generation completes within 15 seconds for a typical report (≤ 50 Scope 3 records)

### Compatibility
- Runs locally via `docker compose up` or `make dev`
- `next build` must succeed without errors (required by CI)
- Database schema must be Postgres-migratable (use Prisma; avoid SQLite-specific features)

### Code Quality
- TypeScript strict mode enabled
- ESLint with Next.js recommended config + Prettier
- Husky pre-commit hooks run lint and type check
- Files kept under 200–300 lines; refactor at that point
- No raw SQL; all DB access through Prisma

### Testing
- Unit/smoke tests written with Vitest covering core API logic
- `npm test` passes in CI
- `next build` passes in CI

### Security (Demo Scope)
- No authentication required for MVP
- Public supplier form accessible only via valid token (no enumeration — tokens are UUID-grade random strings)
- No secrets stored in source code

### Maintainability
- All source code in `src/` directory
- App Router conventions: `layout.tsx`, `page.tsx`, `route.ts`
- Server components by default; `"use client"` only when required
- Named exports except Next.js page/layout conventions

---

## Domain Model (Requirements)

The following entities must be implemented as Prisma schema models and used in both the UI and API:

| Model | Key Fields | Constraints |
|-------|-----------|-------------|
| `Company` | id (uuid), name, country (default "DE"), reportingYear, orgBoundary | Single seeded row for demo |
| `Supplier` | id (uuid), companyId (FK), name, country, sector, contactEmail, publicFormToken (unique), status | status: "active" \| "inactive" |
| `Scope1Record` | id, companyId (FK), periodYear, valueTco2e, calculationMethod, emissionFactorsSource, dataSource, assumptions?, createdAt | dataSource: "manual" \| "csv_import" |
| `Scope2Record` | id, companyId (FK), periodYear, valueTco2e, calculationMethod, emissionFactorsSource, dataSource, assumptions?, createdAt | dataSource: "manual" \| "csv_import" |
| `Scope3Category` | id, code ("C1"–"C15"), name, material (bool), materialityReason? | 15 standard categories seeded |
| `Scope3Record` | id, companyId (FK), supplierId? (FK), categoryId (FK), periodYear, valueTco2e, calculationMethod, emissionFactorSource, dataSource, assumptions?, confidence (0–1), activityDataJson?, createdAt, updatedAt | calculationMethod: "spend_based" \| "activity_based" \| "supplier_specific"; dataSource: "supplier_form" \| "csv_import" \| "proxy" |
| `MethodologyNote` | id, companyId (FK), scope ("scope_1" \| "scope_2" \| "scope_3"), text, updatedAt | One note per scope per company |
| `AuditTrailEvent` | id, companyId (FK), entityType, entityId, action, actor, timestamp, comment? | entityType: "supplier" \| "scope1" \| "scope2" \| "scope3" \| "methodology" \| "export"; action: "created" \| "updated" \| "submitted" \| "exported"; actor: "system" \| "supplier" \| "user" |

---

## Success Criteria

### Dashboard
- [ ] Dashboard page at `/dashboard` loads and displays four KPI cards: Scope 1, Scope 2, Scope 3, Total
- [ ] KPI values are the correct sums from the database for the configured reporting year
- [ ] Zero values are displayed (not blank/error) when no records exist

### Supplier Management
- [ ] Suppliers page lists all existing suppliers in a table
- [ ] User can create a new supplier with required fields
- [ ] User can edit an existing supplier's details
- [ ] User can delete a supplier
- [ ] Each supplier has a unique public form URL (token-based)
- [ ] User can copy the public form URL to clipboard
- [ ] User can regenerate (refresh) a supplier's token, invalidating the old URL

### Scope 1 Recording
- [ ] User can add a Scope 1 record with all required fields
- [ ] All existing Scope 1 records are listed on `/scope-1`
- [ ] Record is persisted to the database and reflected in the Dashboard total

### Scope 2 Recording
- [ ] User can add a Scope 2 record with all required fields
- [ ] All existing Scope 2 records are listed on `/scope-2`
- [ ] Record is persisted to the database and reflected in the Dashboard total

### Scope 3 Recording
- [ ] All 15 Scope 3 categories are seeded and visible on `/scope-3`
- [ ] User can mark a category as material and add a materiality reason
- [ ] User can add a Scope 3 record linked to a category
- [ ] Scope 3 records are listed with supplier name (if linked), category, value, confidence
- [ ] Records are reflected in the Dashboard Scope 3 total

### Supplier Public Form
- [ ] Form is accessible at `/public/supplier/[token]` without authentication
- [ ] Supplier can submit spend_eur, ton_km, or waste_kg (at least one required)
- [ ] Submission creates a Scope 3 record with correct `dataSource = "supplier_form"`
- [ ] Proxy calculation applies when only `spend_eur` is submitted (tCO₂e = spend × PROXY_FACTOR)
- [ ] Raw activity data is stored in `activityDataJson`
- [ ] Invalid/expired token returns an error page
- [ ] Submission generates an AuditTrailEvent with `actor = "supplier"`

### Methodology Notes
- [ ] User can view and edit methodology notes for each scope on `/methodology`
- [ ] Notes are saved and persisted to the database
- [ ] Last updated timestamp is displayed

### PDF Export
- [ ] Export page at `/export` has a "Generate Report" button
- [ ] PDF download is triggered on button click
- [ ] PDF contains all five required sections: cover page, summary table, Scope 3 breakdown (material categories), methodology section, assumptions & data quality table
- [ ] Scope 3 breakdown shows only material categories; footnote appears if non-material records exist
- [ ] Assumptions & data quality table lists records where `confidence < 1` OR `dataSource = "proxy"` OR `assumptions` is not empty
- [ ] Export generates an AuditTrailEvent with `action = "exported"`

### Audit Trail
- [ ] AuditTrailEvent records are created for all create/update/delete/submit/export operations
- [ ] Events include correct actor, action, entityType, entityId, and timestamp

### Technical
- [ ] `npm test` passes (Vitest unit/smoke tests)
- [ ] `next build` succeeds without errors
- [ ] Docker image builds and app runs via `docker compose up`
- [ ] Database schema is Prisma-managed and Postgres-migratable (no SQLite-specific features)
- [ ] TypeScript strict mode enabled with no type errors
- [ ] ESLint passes with no errors

---

## Open Questions

1. **Demo Company Seed Data:** Should the Prisma seed script populate sample Scope 1/2/3 records (to make the dashboard non-empty on first run), or start with a blank database? A pre-populated demo is more compelling for a 5-minute demo flow.
2. **Reporting Year Configuration:** How is the demo company's `reportingYear` set — is it hardcoded in the seed, configurable via environment variable, or editable in the UI?
3. **PROXY_FACTOR value:** What placeholder value should be used for the spend-based proxy (e.g., 0.5 kgCO₂e/EUR)? This should be clearly documented as a non-authoritative demo value.
4. **Scope 3 Category Seeding:** Should all 15 ESRS Scope 3 categories (C1–C15) be pre-seeded with standard names? Which, if any, should be pre-marked as material for the demo?
5. **PDF Library Choice:** Is there a preferred minimal HTML-to-PDF library (e.g., `@react-pdf/renderer`, `puppeteer`, `html-pdf-node`)? The spec says "minimal dependency approach" — confirm the acceptable approach.
