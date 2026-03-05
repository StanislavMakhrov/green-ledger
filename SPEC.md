# GreenLedger Demo MVP — SPEC (Source of Truth)

## Goal
Build a **demo-ready MVP** (for sales presentations, not production) for a B2B SaaS called **GreenLedger**.
The demo should showcase **CSRD / ESRS climate reporting** with **Scope 1, Scope 2, Scope 3** for German SMEs (Mittelstand),
with **deep focus on Scope 3 supplier data orchestration** and **audit-ready exports**.

## Non-goals (MVP)
- No authentication / no roles / no RBAC
- No billing
- No ERP/SAP integrations
- No iXBRL/XBRL generation (only provide structured exports)
- No full ESG suite beyond climate (ESRS E1 only for MVP)
- No multi-tenant complexity (assume one demo company)

## Target Demo Flow (5 minutes)
1) Open app -> **Dashboard** shows KPIs: Scope 1, Scope 2, Scope 3, Total
2) Go to **Suppliers** -> add/edit suppliers
3) Copy a **tokenized public supplier form link**
4) Open the link -> supplier submits spend/activity data
5) System creates a **Scope 3 record** (with assumptions + confidence)
6) Go back to Dashboard -> totals updated
7) Click **Export** -> download **CSRD Climate Report (PDF)**

## Tech Stack
- Frontend: **Next.js (App Router) + TailwindCSS**
- Backend: **FastAPI (Python)**
- Database: **SQLite** (MVP), designed to migrate to Postgres later
- PDF export: **HTML -> PDF** library
- File storage: local filesystem is OK for MVP (optional)

## Domain Model (Core Entities)
### Company
- single demo company (hardcoded or seeded)
- fields: id, name, country=DE, reporting_year, org_boundary

### Supplier
- fields: id, company_id, name, country, sector, contact_email, public_form_token

### Scope 1 Record
- fields: id, company_id, period_year, value_tco2e, calculation_method, emission_factors_source, data_source, assumptions, created_at

### Scope 2 Record (location-based only for MVP)
- fields: id, company_id, period_year, value_tco2e, calculation_method, emission_factors_source, data_source, assumptions, created_at

### Scope 3 Category
- fields: id, code, name, material (bool), materiality_reason (text)

### Scope 3 Record
- fields:
  - id, company_id, supplier_id, category_id, period_year
  - value_tco2e
  - calculation_method (e.g., spend_based | activity_based | supplier_specific)
  - emission_factor_source (string)
  - data_source (supplier_form | csv_import | proxy)
  - assumptions (text)
  - confidence (0.0–1.0)
  - created_at, updated_at

### Methodology Note
- fields: id, company_id, scope (scope_1|scope_2|scope_3), text, updated_at

### Audit Trail Event
- fields: id, company_id, entity_type, entity_id, action, actor (string), timestamp, comment

## API Requirements (REST JSON)
- Simple REST endpoints returning JSON
- CRUD for:
  - suppliers
  - scope1 records
  - scope2 records
  - scope3 categories
  - scope3 records
  - methodology notes
- Public supplier form endpoints:
  - generate/refresh supplier token
  - submit supplier form by token (creates/updates Scope 3 record + audit event)
- Export endpoint:
  - GET/POST that returns `application/pdf`
- Health endpoint:
  - GET /health returns 200 JSON

## Frontend Pages (Minimum)
- `/dashboard` — KPI cards and quick links
- `/suppliers` — list + add/edit + copy public form link
- `/scope-1` — add/list
- `/scope-2` — add/list (location-based only)
- `/scope-3` — categories + records table (show assumptions/confidence/data_source)
- `/methodology` — edit methodology notes per scope
- `/export` — download PDF
- `/public/supplier/[token]` — supplier submission form (public)

## Seed / Demo Data
Provide a seed script or endpoint to create:
- 1 demo company
- ~5 suppliers
- scope 1 and scope 2 values
- scope 3 categories (at least 5)
- scope 3 records across 2–3 categories
Values should look plausible for a German manufacturing SME.

## PDF Export Requirements (“CSRD Climate Report”)
PDF must include:
1) Cover: Company name + reporting year
2) Summary table: Scope 1, Scope 2, Scope 3, Total (tCO2e)
3) Scope 3 breakdown by **material categories**
4) Methodology section (from Methodology Notes)
5) Assumptions & Data Quality notes:
   - list records marked as proxy/estimated
   - show confidence and assumptions

## Quality Constraints
- Demo-oriented and readable code
- Minimal validation (required fields + numeric types)
- Minimal dependencies
- Provide local run instructions in README
- All changes via PRs; human reviews/approves merges