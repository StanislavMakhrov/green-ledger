# GreenLedger Demo MVP — SPEC (Source of Truth)

## Goal
Build a demo-ready MVP (sales demo, not production) for a B2B SaaS called **GreenLedger**.
The demo showcases **CSRD / ESRS climate reporting** with **Scope 1, Scope 2, Scope 3** for German SMEs (Mittelstand),
with deep focus on **Scope 3 supplier data orchestration** and **audit-ready exports**.

## Non-goals (MVP)
- No authentication / no roles / no RBAC
- No billing
- No ERP/SAP integrations
- No iXBRL/XBRL generation
- No full ESG suite beyond climate (ESRS E1 only)
- No multi-tenant complexity (assume one demo company)

## Target Demo Flow (5 minutes)
1) Open app -> Dashboard shows KPIs: Scope 1, Scope 2, Scope 3, Total
2) Go to Suppliers -> add/edit suppliers
3) Copy a tokenized public supplier form link
4) Open link -> supplier submits spend/activity data
5) System creates Scope 3 record (assumptions + confidence)
6) Back to Dashboard -> totals updated
7) Export -> download “CSRD Climate Report” PDF

## Tech Stack
- Frontend: Next.js (App Router) + TailwindCSS
- Backend: FastAPI (Python)
- Database: SQLite (MVP), Postgres-friendly schema
- PDF export: HTML -> PDF library
- Local-only demo (no deployment)

## Domain Model (Core Entities)
### Company
- single demo company (seeded or hardcoded)
- id, name, country=DE, reporting_year, org_boundary

### Supplier
- id, company_id, name, country, sector, contact_email, public_form_token

### Scope 1 Record
- id, company_id, period_year, value_tco2e, calculation_method, emission_factors_source, data_source, assumptions, created_at

### Scope 2 Record (location-based only for MVP)
- id, company_id, period_year, value_tco2e, calculation_method, emission_factors_source, data_source, assumptions, created_at

### Scope 3 Category
- id, code, name, material (bool), materiality_reason (text)

### Scope 3 Record
- id, company_id, supplier_id, category_id, period_year
- value_tco2e
- calculation_method (spend_based | activity_based | supplier_specific)
- emission_factor_source (string)
- data_source (supplier_form | csv_import | proxy)
- assumptions (text)
- confidence (0.0–1.0)
- created_at, updated_at

### Methodology Note
- id, company_id, scope (scope_1|scope_2|scope_3), text, updated_at

### Audit Trail Event
- id, company_id, entity_type, entity_id, action, actor (string), timestamp, comment

## API Requirements (REST JSON)
- Simple REST JSON endpoints
- CRUD for: suppliers, scope1 records, scope2 records, scope3 categories, scope3 records, methodology notes
- Public supplier form:
  - generate/refresh supplier token
  - submit by token -> create/update Scope 3 record + audit event
- Export endpoint returns application/pdf
- Health endpoint: GET /health returns 200 JSON

## Frontend Pages (Minimum)
- /dashboard — KPI cards + links
- /suppliers — list + add/edit + copy public form link
- /scope-1 — add/list
- /scope-2 — add/list (location-based)
- /scope-3 — categories + records table (show assumptions/confidence/data_source)
- /methodology — edit methodology notes per scope
- /export — download PDF
- /public/supplier/[token] — public supplier submission form

## Seed / Demo Data
Seed:
- 1 company
- ~5 suppliers
- scope1 + scope2 values
- at least 5 scope3 categories
- scope3 records across 2–3 categories
Plausible values for a German manufacturing SME.

## PDF Export (“CSRD Climate Report”)
PDF includes:
1) Cover: Company + reporting year
2) Summary table: Scope 1, Scope 2, Scope 3, Total (tCO2e)
3) Scope 3 breakdown by material categories
4) Methodology section
5) Assumptions & Data Quality notes (proxy/estimated + confidence + assumptions)

## Quality Constraints
- Demo-oriented readable code
- Minimal validation
- Minimal dependencies
- Local run instructions in README
- All changes via PRs; human will review/approve merges