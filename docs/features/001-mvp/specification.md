# Feature Specification: GreenLedger MVP

## Feature ID

001-mvp

## Summary

GreenLedger is a B2B SaaS application targeting German SMEs (Mittelstand) that automates CSRD/ESRS climate reporting with a deep focus on Scope 3 (supply chain emissions). The MVP delivers a complete demo-ready flow: a dashboard showing emission KPIs, supplier management with a tokenized public data-collection form, automated Scope 3 record creation (including proxy estimates), and a PDF export of an audit-ready "CSRD Climate Report". The application is a mono-repo Next.js full-stack app using SQLite/Prisma, TailwindCSS, and Vitest for tests, runnable locally via Docker Compose.

## Problem Statement

German SMEs are under increasing pressure from large customers and auditors to supply Scope 3 emissions data as part of CSRD/ESRS climate reporting obligations. Today's process relies on ad-hoc Excel/PDF/email questionnaires, yielding inconsistent supplier responses, missing data, and no documented audit trail. SMEs need a tool that automates supplier data collection, handles missing data with proxy estimates, records all assumptions and data-quality metadata, and ultimately generates an audit-ready climate report — without requiring complex ERP integrations, external billing infrastructure, or iXBRL generation for the MVP stage.

## Goals

- Provide a 5-minute end-to-end demo flow that showcases the full value proposition
- Automate supplier data collection via a tokenized, public-facing web form
- Calculate Scope 1, Scope 2, and Scope 3 emission totals (including proxy estimates for incomplete supplier data)
- Maintain a documented methodology and full audit trail for every data point
- Export a credible, PDF-format "CSRD Climate Report" with cover, summary, breakdown, methodology, and data-quality sections
- Run entirely locally via `docker compose` for demo purposes

## Non-Goals

- No user authentication, RBAC, or session management
- No billing or subscription management
- No ERP or third-party system integrations
- No iXBRL/XBRL generation
- Only ESRS E1 climate reporting (no social/governance/other environmental topics)
- No hosted/cloud deployment for the MVP
- No market-based Scope 2 accounting (location-based only)
- No CSV import (data entry is manual or via supplier form only in MVP)

> **Note:** The domain model includes `dataSource` enum values for `csv_import` to be Postgres-migratable and future-proof, but CSV import is not a functional requirement of the MVP.

## User Stories

- As a **sustainability manager**, I want to see Scope 1, Scope 2, Scope 3, and Total emission KPIs on a dashboard so that I can quickly assess the company's climate footprint.
- As a **sustainability manager**, I want to add, edit, and remove suppliers so that I can manage the companies in my supply chain.
- As a **sustainability manager**, I want to generate a unique, tokenized public form link for each supplier so that I can request emissions data without requiring them to create an account.
- As a **supplier contact**, I want to submit my emissions-related activity data (spend, transport, or waste) via a simple public form so that my customer can include it in their climate report.
- As a **sustainability manager**, I want the system to automatically create a Scope 3 record from a supplier's form submission (using proxy calculation if needed) so that I don't have to manually process responses.
- As a **sustainability manager**, I want to manually add Scope 1 and Scope 2 emission records so that I can complete the full emissions picture.
- As a **sustainability manager**, I want to manage Scope 3 categories and mark which are material to my business so that the report focuses on the most important emissions sources.
- As a **sustainability manager**, I want to edit methodology notes per scope so that the report accurately describes how each figure was calculated.
- As a **sustainability manager**, I want to download a PDF "CSRD Climate Report" so that I can share it with customers, auditors, and stakeholders.
- As an **auditor**, I want to see the data source, assumptions, and confidence level for every Scope 3 record so that I can assess data quality and trace provenance.

## Functional Requirements

### FR-001: Dashboard — Emission KPI Cards

The `/dashboard` page must display four KPI cards: Scope 1 total, Scope 2 total, Scope 3 total, and Grand Total (S1 + S2 + S3), all in tCO₂e for the current `reportingYear` configured on the Company record.

### FR-002: Supplier CRUD

The `/suppliers` page must allow creating, reading, updating, and deleting Supplier records (name, country, sector, contactEmail, status).

### FR-003: Supplier Token Generation

Each Supplier must have a unique `publicFormToken`. The UI must provide a "Generate / Refresh token" action and a "Copy link" action that copies the full public form URL to the clipboard. The URL format is `/public/supplier/[token]`.

### FR-004: Public Supplier Form

The `/public/supplier/[token]` page must be publicly accessible (no authentication). It must present a minimal form allowing the supplier to submit one or more of: `spend_eur`, `ton_km`, `waste_kg`. Raw fields are stored in `activityDataJson`.

### FR-005: Automatic Scope 3 Record Creation from Form Submission

On supplier form submission, the system must create a `Scope3Record` with `dataSource = "supplier_form"` linked to the supplier and a default material category (Purchased Goods & Services, C1). If only `spend_eur` is provided, the system must apply a proxy calculation: `valueTco2e = spend_eur × PROXY_FACTOR` (configurable constant), set `confidence < 1.0`, and record the factor source and assumptions. A corresponding `AuditTrailEvent` must be created with `actor = "supplier"`.

### FR-006: Proxy Calculation Configuration

`PROXY_FACTOR` must be defined as a named constant (not a magic number) in application configuration, documented as a placeholder value for demo purposes, with the emission factor source string stored on the Scope 3 record.

### FR-007: Scope 1 Recording

The `/scope-1` page must allow manually adding Scope 1 emission records (periodYear, valueTco2e, calculationMethod, emissionFactorsSource, assumptions) and listing all records for the company.

### FR-008: Scope 2 Recording

The `/scope-2` page must allow manually adding Scope 2 emission records (location-based only; same fields as Scope 1) and listing all records for the company.

### FR-009: Scope 3 Categories and Records

The `/scope-3` page must display Scope 3 categories (C1–C15) with their materiality status. It must allow marking a category as material/non-material and providing a `materialityReason`. It must list all Scope 3 records with supplier, category, value, data source, confidence, and assumptions.

### FR-010: Methodology Notes

The `/methodology` page must allow editing freetext methodology notes for each scope (`scope_1`, `scope_2`, `scope_3`) stored in `MethodologyNote`. Changes must be persisted and reflected in the PDF export.

### FR-011: PDF Export — CSRD Climate Report

The `/export` page must provide a download action that generates a PDF containing:

1. **Cover page** — company name and reporting year
2. **Summary table** — Scope 1, Scope 2, Scope 3, Total in tCO₂e
3. **Scope 3 breakdown table** — one row per material category with tCO₂e; a note if non-material categories exist
4. **Methodology section** — pulled from `MethodologyNote` for all scopes
5. **Assumptions & Data Quality section** — rows for all Scope 3 records where `dataSource = "proxy"` OR `confidence < 1` OR `assumptions` is non-empty; each row shows supplier name, category, assumptions, confidence, dataSource

The PDF is generated server-side by rendering HTML and converting to PDF.

### FR-012: Audit Trail

Every significant data-mutation event (supplier creation/update, Scope 1/2/3 record creation/update, form submission, PDF export) must create an `AuditTrailEvent` record with `entityType`, `entityId`, `action`, `actor`, `timestamp`, and optional `comment`.

## Non-Functional Requirements

### NFR-001: Tech Stack Compliance

The application must be implemented as a single Next.js (App Router) application with TailwindCSS for styling, Prisma with SQLite for persistence, TypeScript strict mode throughout, and Vitest for unit/smoke tests.

### NFR-002: Database Portability

The Prisma schema must be authored to be Postgres-migratable (use UUID primary keys, avoid SQLite-only types) so that a future hosted deployment can switch databases without schema redesign.

### NFR-003: Local Runability

The application must be runnable locally via `docker compose up` (using the `docker-compose.yml` at the repo root) and via `make dev` or `npm run dev` from `src/`.

### NFR-004: CI/CD Pipeline

The repository must have three GitHub Actions workflows:

- **PR Validation** (`pr-validation.yml`): runs ESLint, TypeScript type-check, Vitest tests, `next build`, and markdownlint on every pull request to `main`.
- **CI** (`ci.yml`): runs `commit-and-tag-version` to bump the version and create a tag on every push to `main`.
- **Release** (`release.yml`): creates a GitHub Release and builds/pushes a Docker image to GHCR on every `v*` tag.

### NFR-005: Code Quality

All TypeScript files must pass ESLint with the Next.js recommended config. Files must be kept under 200–300 lines; larger files must be refactored. Pre-commit hooks (Husky) must run lint and type-check before every commit.

### NFR-006: TypeScript Conventions

Use TypeScript strict mode, prefer functional components with hooks, use `const` over `let`, use named exports (except Next.js page/layout conventions), prefer `async/await` over raw Promises, and use Prisma for all database access (no raw SQL).

### NFR-007: Performance (Demo-Level)

The dashboard must load within 3 seconds on a local machine with seed data. PDF generation must complete within 10 seconds for a typical dataset.

### NFR-008: Test Coverage

At a minimum, unit/smoke tests must cover: dashboard KPI calculation logic, proxy calculation (spend-based Scope 3), PDF report content assembly, and API route happy-path smoke tests. All tests must pass and `next build` must succeed in CI.

### NFR-009: Project Structure

All application source code must reside in `src/`. The repo root contains only project-level files. Documentation lives in `docs/`. Key architecture decisions are documented as ADRs in `docs/adr-NNN-title.md`.

## Domain Model

The following entities are persisted via Prisma (SQLite for MVP, Postgres-migratable):

| Entity | Key Fields | Relationships |
|---|---|---|
| **Company** | id, name, country (DE), reportingYear, orgBoundary | Root aggregate; all records belong to one Company (single demo company) |
| **Supplier** | id, name, country, sector, contactEmail, publicFormToken (unique), status | Belongs to Company; has many Scope3Records |
| **Scope1Record** | id, periodYear, valueTco2e, calculationMethod, emissionFactorsSource, dataSource, assumptions, createdAt | Belongs to Company |
| **Scope2Record** | id, periodYear, valueTco2e, calculationMethod, emissionFactorsSource, dataSource, assumptions, createdAt | Belongs to Company |
| **Scope3Category** | id, code (C1–C15), name, material, materialityReason | Static lookup table; referenced by Scope3Records |
| **Scope3Record** | id, periodYear, valueTco2e, calculationMethod, emissionFactorSource, dataSource, confidence (0–1), assumptions, activityDataJson, createdAt, updatedAt | Belongs to Company; optionally linked to Supplier; linked to Scope3Category |
| **MethodologyNote** | id, scope (scope_1/2/3), text, updatedAt | Belongs to Company; one note per scope |
| **AuditTrailEvent** | id, entityType, entityId, action, actor, timestamp, comment | Belongs to Company; immutable append-only log |

**Key enumerations:**

- `orgBoundary`: `operational_control` | `financial_control` | `equity_share`
- `Supplier.status`: `active` | `inactive`
- `Scope1Record.dataSource` / `Scope2Record.dataSource`: `manual` | `csv_import`
- `Scope3Record.calculationMethod`: `spend_based` | `activity_based` | `supplier_specific`
- `Scope3Record.dataSource`: `supplier_form` | `csv_import` | `proxy`
- `MethodologyNote.scope`: `scope_1` | `scope_2` | `scope_3`
- `AuditTrailEvent.entityType`: `supplier` | `scope1` | `scope2` | `scope3` | `methodology` | `export`
- `AuditTrailEvent.action`: `created` | `updated` | `submitted` | `exported`
- `AuditTrailEvent.actor`: `system` | `supplier` | `user`

## UI/UX Requirements

| Route | Page | Key Interactions |
|---|---|---|
| `/dashboard` | Dashboard | KPI cards: Scope 1, Scope 2, Scope 3, Total (tCO₂e). Read-only overview. |
| `/suppliers` | Supplier Management | Table of suppliers; Add/Edit/Delete; Generate/Refresh token; Copy link button. |
| `/scope-1` | Scope 1 Records | Add form (periodYear, valueTco2e, calculationMethod, emissionFactorsSource, assumptions); List table. |
| `/scope-2` | Scope 2 Records | Same as Scope 1. |
| `/scope-3` | Scope 3 | Two sections: (1) Categories table with materiality toggles; (2) Records table (supplier, category, value, dataSource, confidence, assumptions). |
| `/methodology` | Methodology Notes | Three text areas (one per scope); Save button per note. |
| `/export` | Export | Single "Download PDF Report" button; shows last exported timestamp if available. |
| `/public/supplier/[token]` | Supplier Form | Public (no nav/auth). Fields: spend_eur, ton_km, waste_kg (all optional; at least one required). Submit confirmation message. |

**Styling:** TailwindCSS. Clean, professional, neutral colour palette appropriate for a B2B sustainability tool. Responsive layout is a nice-to-have for MVP; desktop-first is acceptable.

**Navigation:** A persistent sidebar or top nav links to all internal pages (`/dashboard`, `/suppliers`, `/scope-1`, `/scope-2`, `/scope-3`, `/methodology`, `/export`).

## API Requirements

All API routes are Next.js Route Handlers under `src/app/api/`. JSON request/response bodies. No authentication for MVP.

| Method | Path | Description |
|---|---|---|
| GET | `/api/dashboard` | Returns Scope 1 total, Scope 2 total, Scope 3 total, Grand Total for current reportingYear |
| GET | `/api/suppliers` | List all suppliers |
| POST | `/api/suppliers` | Create supplier |
| PUT | `/api/suppliers/[id]` | Update supplier |
| DELETE | `/api/suppliers/[id]` | Delete supplier |
| POST | `/api/suppliers/[id]/token` | Generate / refresh `publicFormToken` |
| GET | `/api/scope1` | List Scope 1 records |
| POST | `/api/scope1` | Create Scope 1 record |
| DELETE | `/api/scope1/[id]` | Delete Scope 1 record |
| GET | `/api/scope2` | List Scope 2 records |
| POST | `/api/scope2` | Create Scope 2 record |
| DELETE | `/api/scope2/[id]` | Delete Scope 2 record |
| GET | `/api/scope3/categories` | List Scope 3 categories |
| PUT | `/api/scope3/categories/[id]` | Update materiality of a category |
| GET | `/api/scope3/records` | List Scope 3 records |
| DELETE | `/api/scope3/records/[id]` | Delete Scope 3 record |
| GET | `/api/methodology` | List methodology notes (all scopes) |
| PUT | `/api/methodology/[scope]` | Upsert methodology note for a scope |
| POST | `/api/export/pdf` | Generate and return PDF binary (Content-Type: application/pdf) |
| GET | `/api/public/supplier/[token]` | Get supplier info for the public form |
| POST | `/api/public/supplier/[token]/submit` | Submit supplier form data; creates Scope3Record + AuditTrailEvent |

## Acceptance Criteria

- [ ] `docker compose up` starts the application and it is accessible at `http://localhost:3000`
- [ ] `/dashboard` displays Scope 1, Scope 2, Scope 3, and Total KPI cards populated from the database
- [ ] A new supplier can be created, edited, and deleted via `/suppliers`
- [ ] A `publicFormToken` can be generated/refreshed and the public form URL can be copied for each supplier
- [ ] The public form at `/public/supplier/[token]` is accessible without authentication and accepts `spend_eur`, `ton_km`, or `waste_kg`
- [ ] Submitting the public form creates a `Scope3Record` linked to the supplier with correct `dataSource`, `assumptions`, `confidence`, and `activityDataJson`
- [ ] When only `spend_eur` is submitted, `valueTco2e` equals `spend_eur × PROXY_FACTOR` and `confidence < 1.0`
- [ ] Scope 1 and Scope 2 records can be added and listed on their respective pages
- [ ] Scope 3 category materiality can be toggled and the reason can be entered
- [ ] Methodology notes can be edited and saved for all three scopes
- [ ] The exported PDF contains: cover page, summary table, Scope 3 material breakdown, methodology section, and assumptions/data-quality section
- [ ] The PDF assumptions section lists all Scope 3 records where `dataSource = "proxy"` OR `confidence < 1` OR `assumptions` is non-empty
- [ ] An `AuditTrailEvent` is recorded for supplier form submission, record creation, and PDF export
- [ ] All Vitest tests pass and `next build` succeeds in CI (`pr-validation.yml`)
- [ ] The ESLint check and TypeScript type-check pass with no errors
- [ ] The `release.yml` workflow builds and pushes a Docker image to GHCR on a `v*` tag

## Open Questions

1. **Seed data:** Should the repository include a database seed script with demo Company, Suppliers, and Scope 1/2/3 records to enable a one-command demo? If so, should seed data be loaded automatically on first run or via an explicit `npm run seed` command?

2. **Single-company assumption:** The spec describes a single demo company. Should the application require a setup/onboarding step (e.g., a Company settings page) to configure the Company name and reporting year, or should this be pre-seeded only?

3. **Scope 3 category initialisation:** The 15 ESRS/GHG Protocol Scope 3 categories (C1–C15) must exist in the database. Should these be created via a Prisma seed or via a migration with static data?

4. **PDF rendering library:** The spec says "generate HTML then render to PDF (minimal dependency approach)". Should this use a headless Chromium approach (e.g., Puppeteer/Playwright) or a pure-JS HTML-to-PDF library (e.g., `html-pdf-node`, `jspdf`)? This affects the Docker image size and build complexity.

5. **PROXY_FACTOR value:** What spend-based emission factor (kgCO₂e/€) should be used as the demo placeholder? A common value for purchased goods (DEFRA/Exiobase) is approximately 0.3–0.5 kgCO₂e/€. Confirmation needed before implementation.

6. **Navigation root redirect:** Should navigating to `/` redirect to `/dashboard`, or show a landing/marketing page?
