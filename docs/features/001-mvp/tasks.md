# Tasks: GreenLedger MVP — Complete Initial Implementation

## Overview

This document breaks the GreenLedger MVP feature (001) into prioritised, independently implementable
tasks for the Developer agent. The MVP delivers a complete Next.js (App Router) application with
Prisma/SQLite, a REST API, a full TailwindCSS UI, proxy Scope 3 calculations, PDF CSRD Climate Report
export via Puppeteer, and Vitest unit/smoke tests — all from a greenfield `src/` directory.

Reference documents:

- Specification: [`specification.md`](./specification.md)
- Architecture: [`architecture.md`](./architecture.md)
- Test Plan: [`test-plan.md`](./test-plan.md)

---

## Notes for Developer

> **Read these before touching any code.**

1. **Group 1 (T01–T07) must be completed before any other group.** Everything else depends on a
   working Next.js project with Prisma schema, constants, and seed data.

2. **`DEMO_COMPANY_ID` everywhere.** Import from `src/lib/constants.ts`. Never hardcode
   `"00000000-0000-0000-0000-000000000001"` directly anywhere outside `constants.ts`.

3. **Prisma for all database access.** No raw SQL (`$queryRaw` / `$executeRaw`) anywhere.

4. **All API routes return JSON.** Wrap successful payloads in `{ "data": ... }` and errors in
   `{ "error": "..." }`. Use correct HTTP status codes (200 OK, 201 Created, 400 Bad Request,
   404 Not Found, 500 Internal Server Error).

5. **Server components by default.** Mark only interactive forms/buttons with `"use client"`.
   `page.tsx` files fetch data directly (via Prisma or internal fetch) and are server components.

6. **Files ≤ 200–300 lines.** Split at that limit. For example, split large route handlers into a
   `route.ts` (handler only) and a `queries.ts` or `actions.ts` sibling.

7. **Vitest test infrastructure.** The test runner (`vitest.config.ts` or config in `package.json`)
   must be set up as part of T01/T02 so tests can be added in Group 5 without reconfiguring.

8. **Puppeteer dependency.** Install `puppeteer` as a production dependency during T01. It requires
   Chromium and must be available in the Docker image (see T07 Dockerfile notes).

9. **Architecture file paths.** Follow the directory structure in `architecture.md` exactly.
   Notable mapping: the spec mentions `src/lib/proxy.ts` but the architecture names it
   `src/lib/calculations.ts`. Use `src/lib/calculations.ts`.

10. **Prisma schema provider.** Use `provider = "sqlite"` with `url = env("DATABASE_URL")`.
    Do not use any SQLite-specific Prisma features so the schema stays Postgres-migratable.

11. **Token generation.** Use `crypto.randomUUID()` (built-in Node.js) — no external UUID package
    needed.

12. **API route naming conventions.** The spec uses `/api/scope-1` and `/api/scope-2` (with hyphen)
    in some places, but the architecture shows `scope1` and `scope2` (no hyphen) as the directory
    names under `app/api/`. Follow the architecture: `src/app/api/scope1/` and `src/app/api/scope2/`.

---

## Tasks

### T01: Initialize Next.js Project in `src/`

**Priority:** P1 (critical path — everything depends on this)

**Description:**
Bootstrap a new Next.js 14+ App Router project inside `src/` with TypeScript strict mode,
TailwindCSS, ESLint (Next.js recommended config), Prettier, and Vitest. Configure `tsconfig.json`
with `"strict": true` and `"paths": { "@/*": ["./src/*"] }` (or `"./*"` depending on root).
Set up `package.json` scripts: `dev`, `build`, `start`, `lint`, `type-check` (`tsc --noEmit`),
`test` (Vitest).

**Files to create / modify:**

- `src/package.json`
- `src/next.config.mjs`
- `src/tsconfig.json`
- `src/eslint.config.mjs`
- `src/tailwind.config.ts`
- `src/postcss.config.mjs`
- `src/vitest.config.ts` (or Vitest config in `package.json`)
- `src/app/layout.tsx` (minimal shell — full navigation added in T20)
- `src/app/page.tsx` (redirect to `/dashboard` — full layout in T20)

**Acceptance Criteria:**

- [ ] `cd src && npm install` completes without errors.
- [ ] `cd src && npm run dev` starts the development server on port 3000.
- [ ] `cd src && npm run lint` passes with zero errors.
- [ ] `cd src && npm run type-check` passes with zero TypeScript errors.
- [ ] `cd src && npm test` runs (even if no test files exist yet — zero tests is acceptable).
- [ ] `cd src && npm run build` succeeds.
- [ ] TailwindCSS is active (a test class like `bg-green-600` in `layout.tsx` is rendered).

**Dependencies:** None

**Notes:**
Use `create-next-app` flags or manual scaffolding — either is fine.
Install `puppeteer` as a production dep now so the Dockerfile can cache it efficiently.
Puppeteer in Docker requires `--no-sandbox` Chrome flags — plan for this in T07.
Install `vitest`, `@vitejs/plugin-react`, and `@testing-library/react` as dev deps.

---

### T02: Configure Prisma with SQLite — All 8 Domain Models

**Priority:** P1 (critical path)

**Description:**
Install Prisma (`@prisma/client`, `prisma`) and configure `src/prisma/schema.prisma` with the
SQLite datasource and all 8 domain models exactly as specified: `Company`, `Supplier`,
`Scope1Record`, `Scope2Record`, `Scope3Category`, `Scope3Record`, `MethodologyNote`,
`AuditTrailEvent`. All enums, field types, optional fields, and relations must match the
specification exactly.

**Files to create / modify:**

- `src/prisma/schema.prisma`
- `src/package.json` (add prisma scripts: `db:migrate`, `db:seed`, `db:studio`)

**Acceptance Criteria:**

- [ ] `schema.prisma` declares `provider = "sqlite"` and `url = env("DATABASE_URL")`.
- [ ] All 8 models are present with every field from the specification (including correct types and
  optional markers `?`).
- [ ] All enums are defined: `OrgBoundary`, `SupplierStatus`, `DataSource` variants per model,
  `CalculationMethod`, `Scope` (scope_1/2/3), `AuditEntityType`, `AuditAction`.
- [ ] Foreign key relations are correct: `Supplier.companyId → Company`, `Scope1Record.companyId → Company`,
  `Scope2Record.companyId → Company`, `Scope3Record.companyId → Company`,
  `Scope3Record.supplierId → Supplier` (optional), `Scope3Record.categoryId → Scope3Category`,
  `MethodologyNote.companyId → Company`, `AuditTrailEvent.companyId → Company`.
- [ ] `Supplier.publicFormToken` has `@unique` constraint.
- [ ] `MethodologyNote` has a unique constraint on `(companyId, scope)` to support upsert.
- [ ] `prisma format` runs cleanly on the schema.

**Dependencies:** T01

**Notes:**
`Scope3Record` has two `DataSource` enum variants specific to it (`supplier_form`, `csv_import`,
`proxy`) while `Scope1Record` and `Scope2Record` share `manual` and `csv_import`. Consider
either separate enums or a single shared enum — pick whichever is cleaner but be consistent.
`Scope3Record.activityDataJson` should be `Json?` (nullable).
`AuditTrailEvent.timestamp` uses `@default(now())`.
`Scope1Record.createdAt` and `Scope2Record.createdAt` use `@default(now())`.
`Scope3Record` has both `createdAt @default(now())` and `updatedAt @updatedAt`.

---

### T03: Create `src/lib/constants.ts`

**Priority:** P1 (critical path)

**Description:**
Create the constants file with `DEMO_COMPANY_ID`, `PROXY_FACTOR`, and `PROXY_FACTOR_SOURCE`
exactly as specified in `architecture.md`. These are server-only constants (no `NEXT_PUBLIC_`
prefix). This file is imported by virtually every other module.

**Files to create:**

- `src/lib/constants.ts`

**Acceptance Criteria:**

- [ ] `DEMO_COMPANY_ID = "00000000-0000-0000-0000-000000000001"` is exported as a `const string`.
- [ ] `PROXY_FACTOR = 0.00042` is exported as a `const number`.
- [ ] `PROXY_FACTOR_SOURCE` is exported with the DEFRA source description string.
- [ ] TypeScript strict mode accepts the file with zero errors.
- [ ] No `any` types. No implicit types.

**Dependencies:** T01

---

### T04: Create Prisma Singleton Client (`src/lib/prisma.ts`)

**Priority:** P1 (critical path)

**Description:**
Create the Prisma singleton to prevent multiple client instances during Next.js HMR in development,
following the exact pattern in `architecture.md`. Enable query-level logging in development mode.

**Files to create:**

- `src/lib/prisma.ts`

**Acceptance Criteria:**

- [ ] The singleton pattern from `architecture.md` is implemented exactly.
- [ ] `PrismaClient` is configured with `log: ["query", "error"]` in development, `["error"]` in
  production.
- [ ] The exported `prisma` constant is the singleton instance.
- [ ] TypeScript strict mode accepts the file with zero errors.

**Dependencies:** T01, T02

---

### T05: Create and Run Initial Prisma Migration

**Priority:** P1 (critical path)

**Description:**
Run `prisma migrate dev --name init` to generate the initial SQL migration from `schema.prisma`.
Ensure `DATABASE_URL` is set in a `.env` file inside `src/` (gitignored, but with a `.env.example`
committed). The migration directory `src/prisma/migrations/` must be committed.

**Files to create / modify:**

- `src/prisma/migrations/` (generated — commit the entire directory)
- `src/.env.example` (with `DATABASE_URL="file:./dev.db"`)
- `src/.env` (gitignored — developer creates from `.env.example`)
- `.gitignore` (or `src/.gitignore`) — ensure `*.db`, `*.db-journal` are excluded

**Acceptance Criteria:**

- [ ] `cd src && npx prisma migrate dev --name init` runs without errors.
- [ ] Migration SQL file exists in `src/prisma/migrations/`.
- [ ] `src/.env.example` is committed with `DATABASE_URL="file:./dev.db"`.
- [ ] `src/.env` is gitignored.
- [ ] `src/dev.db` (SQLite file) is gitignored.

**Dependencies:** T01, T02, T03, T04

---

### T06: Create Prisma Seed Data

**Priority:** P1 (critical path)

**Description:**
Create `src/prisma/seed.ts` that seeds the demo company (using `DEMO_COMPANY_ID`), 3–5 demo
suppliers with tokens, the 15 standard Scope 3 categories (C1–C15), at least 2 Scope1Records,
2 Scope2Records, 3 Scope3Records, and 3 MethodologyNotes (one per scope). This data populates
the 5-minute demo flow.

**Files to create / modify:**

- `src/prisma/seed.ts`
- `src/package.json` (add `"prisma": { "seed": "ts-node prisma/seed.ts" }` or use `tsx`)

**Acceptance Criteria:**

- [ ] `cd src && npx prisma db seed` runs without errors.
- [ ] Demo company with `id = DEMO_COMPANY_ID`, `name`, `country = "DE"`, `reportingYear`, and
  `orgBoundary` is created.
- [ ] At least 3 suppliers with `publicFormToken` (UUID), `status`, `sector`, `contactEmail` are
  seeded.
- [ ] All 15 Scope 3 categories (C1–C15) are seeded with human-readable names; C1 is marked
  `material = true`.
- [ ] At least 2 Scope1Records and 2 Scope2Records for `reportingYear` are seeded.
- [ ] At least 3 Scope3Records are seeded, including at least 1 with `dataSource = "proxy"` and
  `confidence < 1.0`.
- [ ] MethodologyNotes for `scope_1`, `scope_2`, and `scope_3` are seeded.
- [ ] Seed is idempotent: running it twice does not fail (use `upsert`/`createMany` with
  `skipDuplicates`).

**Dependencies:** T01, T02, T03, T04, T05

**Notes:**
The 15 Scope 3 GHG Protocol categories:
C1 Purchased goods & services, C2 Capital goods, C3 Fuel and energy activities,
C4 Upstream transport & distribution, C5 Waste generated in operations,
C6 Business travel, C7 Employee commuting, C8 Upstream leased assets,
C9 Downstream transport & distribution, C10 Processing of sold products,
C11 Use of sold products, C12 End-of-life treatment of sold products,
C13 Downstream leased assets, C14 Franchises, C15 Investments.

---

### T07: Dockerfile and `docker-compose.yml`

**Priority:** P1 (critical path — required for Demo and Release)

**Description:**
Create a multi-stage Dockerfile at `src/Dockerfile` that produces a minimal production image.
Create a `docker-compose.yml` at the repository root (or `src/`) that mounts a SQLite data volume,
runs migrations on startup, and exposes port 3000. Create a `Makefile` at the repo root with a
`make dev` target. Puppeteer requires Chromium — install it in the Dockerfile and set
`PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true` with `PUPPETEER_EXECUTABLE_PATH` pointing to the
system Chromium.

**Files to create:**

- `src/Dockerfile`
- `docker-compose.yml` (repo root)
- `Makefile` (repo root, `make dev` target)
- `.dockerignore` (update existing one in `src/` if present)

**Acceptance Criteria:**

- [ ] `docker build -f src/Dockerfile src/ -t green-ledger:local` succeeds.
- [ ] `docker compose up` starts the application at `http://localhost:3000`.
- [ ] SQLite data is persisted to a named Docker volume (not lost on container restart).
- [ ] Migrations run automatically on container start (via `prisma migrate deploy`).
- [ ] `make dev` starts the application (either `docker compose up` or `cd src && npm run dev`).
- [ ] `Puppeteer` can launch Chromium inside the container (no sandbox error crashes the PDF route).
- [ ] Docker image is ≤ 1 GB (use multi-stage build; exclude `node_modules` dev deps).

**Dependencies:** T01, T02, T05, T06

**Notes:**
Recommended base: `node:20-slim` or `node:20-alpine`. If using Alpine, install Chromium via
`apk add chromium`. Set env `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true` and
`PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser` (or equivalent path).
The entrypoint should run: `npx prisma migrate deploy && node server.js` (Next.js standalone).

---

### T08: API Route — `GET /api/dashboard`

**Priority:** P1 (critical path — Dashboard page depends on this)

**Description:**
Implement the dashboard aggregate API. Query `Scope1Record`, `Scope2Record`, and `Scope3Record`
for the demo company's `reportingYear`, sum `valueTco2e` for each, compute the grand total, and
return JSON.

**Files to create:**

- `src/app/api/dashboard/route.ts`

**Acceptance Criteria:**

- [ ] `GET /api/dashboard` returns `{ "data": { "scope1": number, "scope2": number, "scope3": number, "total": number } }`.
- [ ] Values are summed only for records where `periodYear = company.reportingYear`.
- [ ] If no records exist for a scope, returns `0` (not `null` or missing key).
- [ ] Grand total equals `scope1 + scope2 + scope3`.
- [ ] Scoped to `DEMO_COMPANY_ID` — never returns data for other companies.
- [ ] Returns 500 with `{ "error": "..." }` if a database error occurs.

**Dependencies:** T03, T04, T05, T06

---

### T09: API Routes — Suppliers CRUD + Token Regeneration

**Priority:** P1

**Description:**
Implement the full Suppliers REST API:
- `GET /api/suppliers` — list all suppliers for `DEMO_COMPANY_ID`.
- `POST /api/suppliers` — create a supplier (generate initial `publicFormToken` via
  `crypto.randomUUID()`); log `AuditTrailEvent { action: "created", actor: "user" }`.
- `GET /api/suppliers/[id]` — get one supplier.
- `PUT /api/suppliers/[id]` — update a supplier; log `AuditTrailEvent { action: "updated", actor: "user" }`.
- `DELETE /api/suppliers/[id]` — delete a supplier.
- `POST /api/suppliers/[id]/token` — generate/refresh `publicFormToken`; return `{ token, url }`.

**Files to create:**

- `src/app/api/suppliers/route.ts`
- `src/app/api/suppliers/[id]/route.ts`
- `src/app/api/suppliers/[id]/token/route.ts`

**Acceptance Criteria:**

- [ ] `GET /api/suppliers` returns `{ "data": [...suppliers] }`.
- [ ] `POST /api/suppliers` creates a supplier; response is `201` with the created supplier.
- [ ] New suppliers always have a `publicFormToken` (UUID) set on creation.
- [ ] `POST /api/suppliers/[id]/token` replaces the existing token and returns
  `{ "data": { "token": "...", "url": "/public/supplier/..." } }`.
- [ ] `DELETE /api/suppliers/[id]` returns `204 No Content` on success.
- [ ] `GET /api/suppliers/[id]` returns `404` for non-existent supplier.
- [ ] Audit events are logged for create and update operations.
- [ ] All routes are scoped to `DEMO_COMPANY_ID`.

**Dependencies:** T03, T04, T05, T06, T18

---

### T10: API Routes — Scope 1 Records

**Priority:** P1

**Description:**
Implement Scope 1 API:
- `GET /api/scope1` — list all Scope1Records for `DEMO_COMPANY_ID`.
- `POST /api/scope1` — create a Scope1Record; log audit event `{ action: "created", actor: "user" }`.
- `DELETE /api/scope1/[id]` — delete a Scope1Record.

**Files to create:**

- `src/app/api/scope1/route.ts`
- `src/app/api/scope1/[id]/route.ts`

**Acceptance Criteria:**

- [ ] `GET /api/scope1` returns `{ "data": [...records] }`.
- [ ] `POST /api/scope1` validates required fields: `periodYear` (integer), `valueTco2e` (float > 0),
  `calculationMethod` (string), `emissionFactorsSource` (string), `dataSource` (enum); returns 400
  with error if missing.
- [ ] `POST /api/scope1` returns `201` with the created record.
- [ ] `DELETE /api/scope1/[id]` returns `204 No Content`.
- [ ] `DELETE /api/scope1/[id]` returns `404` for non-existent record.
- [ ] All routes are scoped to `DEMO_COMPANY_ID`.

**Dependencies:** T03, T04, T05, T06

---

### T11: API Routes — Scope 2 Records

**Priority:** P1

**Description:**
Implement Scope 2 API (identical structure to Scope 1):
- `GET /api/scope2` — list all Scope2Records for `DEMO_COMPANY_ID`.
- `POST /api/scope2` — create a Scope2Record.
- `DELETE /api/scope2/[id]` — delete a Scope2Record.

**Files to create:**

- `src/app/api/scope2/route.ts`
- `src/app/api/scope2/[id]/route.ts`

**Acceptance Criteria:**

- [ ] Same as T10 acceptance criteria, applied to Scope 2 records.
- [ ] `POST /api/scope2` validates the same required fields as T10.
- [ ] Returns 201 with created record, 204 on delete, 404 for non-existent.
- [ ] Scoped to `DEMO_COMPANY_ID`.

**Dependencies:** T03, T04, T05, T06

---

### T12: API Routes — Scope 3 Categories

**Priority:** P1

**Description:**
Implement Scope 3 categories API:
- `GET /api/scope3/categories` — list all 15 Scope3Categories.
- `PUT /api/scope3/categories/[id]` — update `material` (boolean) and optional
  `materialityReason` (string).

**Files to create:**

- `src/app/api/scope3/categories/route.ts`
- `src/app/api/scope3/categories/[id]/route.ts`

**Acceptance Criteria:**

- [ ] `GET /api/scope3/categories` returns `{ "data": [...categories] }` (all 15 entries).
- [ ] `PUT /api/scope3/categories/[id]` accepts `{ material: boolean, materialityReason?: string }`
  and returns the updated category.
- [ ] `PUT` returns `404` for non-existent category id.
- [ ] `PUT` returns `400` if `material` is not a boolean.
- [ ] Categories are global (not company-scoped) — all companies share the same 15 categories.

**Dependencies:** T03, T04, T05, T06

---

### T13: API Routes — Scope 3 Records

**Priority:** P1

**Description:**
Implement Scope 3 records API:
- `GET /api/scope3/records` — list all Scope3Records for `DEMO_COMPANY_ID`.
- `POST /api/scope3/records` — create a Scope3Record manually; log audit event
  `{ action: "created", actor: "user" }`.
- `DELETE /api/scope3/records/[id]` — delete a Scope3Record.

**Files to create:**

- `src/app/api/scope3/records/route.ts`
- `src/app/api/scope3/records/[id]/route.ts`

**Acceptance Criteria:**

- [ ] `GET /api/scope3/records` returns `{ "data": [...records] }` with supplier and category
  relations included.
- [ ] `POST /api/scope3/records` validates required fields: `categoryId`, `periodYear`,
  `valueTco2e`, `calculationMethod`, `emissionFactorSource`, `dataSource`, `confidence`.
- [ ] Returns `201` on create, `204` on delete, `404` for non-existent record.
- [ ] Scoped to `DEMO_COMPANY_ID`.

**Dependencies:** T03, T04, T05, T06, T18

---

### T14: API Routes — Methodology Notes

**Priority:** P2

**Description:**
Implement methodology API:
- `GET /api/methodology` — list all MethodologyNotes for `DEMO_COMPANY_ID` (returns 0–3 records).
- `PUT /api/methodology/[scope]` — upsert a MethodologyNote for the given scope
  (`scope_1`, `scope_2`, or `scope_3`); log audit event `{ action: "updated", actor: "user" }`.

**Files to create:**

- `src/app/api/methodology/route.ts`
- `src/app/api/methodology/[scope]/route.ts`

**Acceptance Criteria:**

- [ ] `GET /api/methodology` returns `{ "data": [...notes] }`.
- [ ] `PUT /api/methodology/[scope]` accepts `{ text: string }` and upserts (creates if missing,
  updates if existing).
- [ ] `PUT` validates `scope` is one of `scope_1`, `scope_2`, `scope_3`; returns `400` otherwise.
- [ ] `PUT` returns `400` if `text` is missing or empty.
- [ ] `PUT` returns the upserted MethodologyNote in `{ "data": { ... } }`.
- [ ] Audit event is logged on each `PUT`.
- [ ] Scoped to `DEMO_COMPANY_ID`.

**Dependencies:** T03, T04, T05, T06, T18

---

### T15: API Route — Public Supplier Form Submission

**Priority:** P1 (critical path — core Scope 3 collection flow)

**Description:**
Implement `POST /api/public/supplier/[token]` — the unauthenticated supplier data submission
endpoint. This route:
1. Looks up supplier by `publicFormToken`.
2. Validates exactly one of `spend_eur`, `ton_km`, or `waste_kg` is present.
3. Calls `calculateProxyEmissions()` from `src/lib/calculations.ts` (T17).
4. Finds the default Scope3Category (C1) or the supplier-selected one.
5. Creates `Scope3Record` + `AuditTrailEvent` in a Prisma transaction.
6. Returns `{ "data": { "success": true } }`.

**Files to create:**

- `src/app/api/public/supplier/[token]/route.ts`

**Acceptance Criteria:**

- [ ] `POST /api/public/supplier/[token]` with `{ spend_eur: 50000 }` returns `200` with
  `{ "data": { "success": true } }`.
- [ ] A `Scope3Record` is created with `dataSource = "supplier_form"`, `confidence < 1.0`,
  `calculationMethod = "spend_based"`, and `activityDataJson` containing the raw input.
- [ ] `AuditTrailEvent` is created with `action = "submitted"` and `actor = "supplier"`.
- [ ] Invalid token returns `404 { "error": "Supplier not found" }`.
- [ ] Payload with no valid activity field returns `400 { "error": "..." }`.
- [ ] Both record and audit event are created atomically (use `prisma.$transaction`).
- [ ] Route is accessible without any authentication headers.

**Dependencies:** T03, T04, T05, T06, T17, T18

---

### T16: API Route — PDF Export (`GET /api/export/pdf`)

**Priority:** P2

**Description:**
Implement `GET /api/export/pdf`. Fetches all required data from Prisma, calls the HTML template
(T19), renders to PDF via Puppeteer (T19), logs an audit event, and streams the PDF response.

**Files to create:**

- `src/app/api/export/pdf/route.ts`

**Acceptance Criteria:**

- [ ] `GET /api/export/pdf` returns a response with `Content-Type: application/pdf`.
- [ ] Response has `Content-Disposition: attachment; filename="csrd-climate-report-{year}.pdf"`.
- [ ] PDF is generated server-side (not a static file).
- [ ] An `AuditTrailEvent` with `entityType = "export"`, `action = "exported"`, `actor = "user"` is
  created.
- [ ] The route returns `500 { "error": "..." }` if Puppeteer fails to launch.
- [ ] Route does not time out within 30 seconds for a typical dataset.

**Dependencies:** T03, T04, T05, T06, T18, T19

---

### T17: Business Logic — Proxy Calculation (`src/lib/calculations.ts`)

**Priority:** P1 (required by T15)

**Description:**
Implement `calculateProxyEmissions()` in `src/lib/calculations.ts` per the architecture spec.
Handles three input types: `spend_eur`, `ton_km`, `waste_kg`. For `spend_eur`:
`tCO₂e = spend_eur × PROXY_FACTOR`, `confidence = 0.5`. For `ton_km` and `waste_kg`: use
reasonable proxy factors (define additional constants in `constants.ts`), `confidence = 0.4`.
Return `{ valueTco2e, calculationMethod, assumptions, confidence, emissionFactorSource }`.

**Files to create / modify:**

- `src/lib/calculations.ts`
- `src/lib/constants.ts` (add `TON_KM_FACTOR`, `WASTE_KG_FACTOR`, and their source strings)

**Acceptance Criteria:**

- [ ] `calculateProxyEmissions({ spend_eur: 1000 })` returns
  `{ valueTco2e: 0.42, calculationMethod: "spend_based", confidence: 0.5, ... }` (1000 × 0.00042).
- [ ] `calculateProxyEmissions({ ton_km: 1000 })` returns a result with
  `calculationMethod: "activity_based"` and `confidence: 0.4`.
- [ ] `calculateProxyEmissions({ waste_kg: 1000 })` returns a result with
  `calculationMethod: "activity_based"` and `confidence: 0.4`.
- [ ] All returned objects include non-empty `assumptions` and `emissionFactorSource` strings.
- [ ] The function is pure (no side effects, no database calls).
- [ ] TypeScript strict mode accepts the function signature with no `any` types.

**Dependencies:** T03

---

### T18: Business Logic — Audit Trail Helper (`src/lib/audit.ts`)

**Priority:** P1 (required by T09, T13, T14, T15, T16)

**Description:**
Implement `logAuditEvent()` in `src/lib/audit.ts` following the exact signature in
`architecture.md`. This helper is called from route handlers after successful mutations.

**Files to create:**

- `src/lib/audit.ts`

**Acceptance Criteria:**

- [ ] `logAuditEvent({ companyId, entityType, entityId, action, actor, comment? })` creates an
  `AuditTrailEvent` row in the database.
- [ ] Returns `Promise<void>`.
- [ ] The function is strongly typed — `entityType` and `action` use the Prisma enum types.
- [ ] TypeScript strict mode accepts the file with zero errors.
- [ ] If the database write fails, the error propagates (no silent swallowing).

**Dependencies:** T03, T04

---

### T19: Business Logic — PDF Generation (`src/lib/pdf/`)

**Priority:** P2

**Description:**
Implement two files:
1. `src/lib/pdf/report-template.ts` — exports `generateReportHtml(data: ReportData): string`.
   Produces a self-contained HTML string (inline CSS only, no external CDN) with all 5 sections:
   cover page, executive summary table, Scope 3 breakdown (material categories only), methodology,
   assumptions & data quality.
2. `src/lib/pdf/generator.ts` — exports `renderPdf(html: string): Promise<Buffer>`.
   Launches Puppeteer headless browser, sets HTML content, calls `page.pdf({ format: "A4",
   printBackground: true })`, and returns the Buffer.

**Files to create:**

- `src/lib/pdf/report-template.ts`
- `src/lib/pdf/generator.ts`

**Acceptance Criteria:**

- [ ] `generateReportHtml(data)` returns a string starting with `<!DOCTYPE html>`.
- [ ] The HTML contains all 5 required sections: cover page, executive summary, Scope 3 breakdown,
  methodology, assumptions & data quality.
- [ ] The Scope 3 breakdown table shows only categories where `material = true`.
- [ ] The assumptions section lists `Scope3Record` entries where `dataSource = "proxy"` OR
  `confidence < 1` OR `assumptions` is non-empty.
- [ ] All CSS is inline or in a `<style>` block — no `<link href="...cdn...">` references.
- [ ] `renderPdf(html)` launches Puppeteer with `{ args: ["--no-sandbox", "--disable-setuid-sandbox"] }`.
- [ ] `renderPdf(html)` returns a `Buffer` (binary PDF data).
- [ ] Both functions are strongly typed with no `any`.

**Dependencies:** T01 (Puppeteer installed)

---

### T20: App Shell — Layout, Navigation, Root Redirect

**Priority:** P1 (required for all UI pages)

**Description:**
Implement the root layout with sidebar navigation (`app/layout.tsx`) and the root redirect
(`app/page.tsx` → `/dashboard`). The sidebar must link to all 7 internal pages:
Dashboard, Suppliers, Scope 1, Scope 2, Scope 3, Methodology, Export.

**Files to create / modify:**

- `src/app/layout.tsx` (full implementation with nav)
- `src/app/page.tsx` (redirect to `/dashboard`)

**Acceptance Criteria:**

- [ ] Navigating to `http://localhost:3000/` redirects to `/dashboard`.
- [ ] The layout includes a sidebar (or top nav) with links to: `/dashboard`, `/suppliers`,
  `/scope-1`, `/scope-2`, `/scope-3`, `/methodology`, `/export`.
- [ ] Active page link is visually highlighted.
- [ ] Layout uses TailwindCSS. The overall design uses the green colour scheme (e.g., `green-600`).
- [ ] The public page (`/public/supplier/[token]`) does NOT show the main navigation.
- [ ] TypeScript strict mode accepts all layout files.

**Dependencies:** T01

**Notes:**
The `/public/supplier/[token]` page is intentionally outside the main layout — it is a standalone
page accessible to suppliers. Consider using a separate layout or no layout for the `public/`
route group.

---

### T21: UI Page — `/dashboard`

**Priority:** P1

**Description:**
Implement the dashboard page as a Server Component. Fetch data from `GET /api/dashboard` (or
directly from Prisma). Display four KPI cards: Scope 1, Scope 2, Scope 3, Total tCO₂e.

**Files to create:**

- `src/app/dashboard/page.tsx`

**Acceptance Criteria:**

- [ ] Page renders four KPI cards with labels: "Scope 1", "Scope 2", "Scope 3", "Total".
- [ ] Each card displays the tCO₂e value (formatted as a number with unit label "tCO₂e").
- [ ] Values are sourced from the database (seeded demo data is visible on first load).
- [ ] Grand total matches the sum of the three scopes.
- [ ] Page is a React Server Component (no `"use client"` at the top of `page.tsx`).
- [ ] Page renders without errors with empty data (all zeros is acceptable).

**Dependencies:** T08, T20

---

### T22: UI Page — `/suppliers`

**Priority:** P1

**Description:**
Implement the suppliers page. List suppliers with name, country, sector, status, and contact email.
Provide buttons to: add a new supplier (inline form or modal), edit/delete each supplier, generate
a new token link, and copy the token URL to clipboard. Client components (`"use client"`) for
interactive buttons and forms.

**Files to create:**

- `src/app/suppliers/page.tsx`
- `src/app/suppliers/SupplierList.tsx` (client component)
- `src/app/suppliers/SupplierForm.tsx` (client component — add/edit form)

**Acceptance Criteria:**

- [ ] Page lists all suppliers from the API.
- [ ] "Add Supplier" form accepts: name, country, sector, contactEmail; on submit, calls
  `POST /api/suppliers`.
- [ ] "Edit" opens a form pre-populated with supplier data; on save, calls `PUT /api/suppliers/[id]`.
- [ ] "Delete" calls `DELETE /api/suppliers/[id]` with a confirmation prompt.
- [ ] "Generate Link" button calls `POST /api/suppliers/[id]/token` and displays the new URL.
- [ ] "Copy Link" copies the tokenized URL (`/public/supplier/[token]`) to the clipboard.
- [ ] After any mutation, the supplier list refreshes (router refresh or re-fetch).
- [ ] Newly created suppliers appear in the list immediately after creation.

**Dependencies:** T09, T20

---

### T23: UI Page — `/scope-1`

**Priority:** P2

**Description:**
Implement the Scope 1 page. Display a list of Scope1Records with a form to add new records.

**Files to create:**

- `src/app/scope-1/page.tsx`
- `src/app/scope-1/Scope1Form.tsx` (client component)

**Acceptance Criteria:**

- [ ] Page lists all Scope1Records (periodYear, valueTco2e, calculationMethod, emissionFactorsSource,
  dataSource).
- [ ] "Add Record" form accepts all required fields; on submit, calls `POST /api/scope1`.
- [ ] New records appear in the list immediately after creation.
- [ ] Delete button calls `DELETE /api/scope1/[id]` (with confirmation).
- [ ] Form validates client-side: `valueTco2e` must be a positive number.

**Dependencies:** T10, T20

---

### T24: UI Page — `/scope-2`

**Priority:** P2

**Description:**
Implement the Scope 2 page. Identical structure to `/scope-1` but for Scope2Records.

**Files to create:**

- `src/app/scope-2/page.tsx`
- `src/app/scope-2/Scope2Form.tsx` (client component)

**Acceptance Criteria:**

- [ ] Same acceptance criteria as T23, applied to Scope 2 records.
- [ ] Calls `POST /api/scope2` and `DELETE /api/scope2/[id]`.

**Dependencies:** T11, T20

---

### T25: UI Page — `/scope-3`

**Priority:** P1

**Description:**
Implement the Scope 3 page with two sections:
1. **Categories panel** — list all 15 categories with a toggle to mark each as `material` and an
   optional `materialityReason` text input. Calls `PUT /api/scope3/categories/[id]`.
2. **Records table** — list all Scope3Records with supplier name, category, tCO₂e, confidence,
   dataSource. Includes a basic "Add Record" form calling `POST /api/scope3/records`.

**Files to create:**

- `src/app/scope-3/page.tsx`
- `src/app/scope-3/CategoryList.tsx` (client component)
- `src/app/scope-3/Scope3RecordList.tsx` (client component)
- `src/app/scope-3/Scope3RecordForm.tsx` (client component)

**Acceptance Criteria:**

- [ ] All 15 categories are displayed with their current `material` state.
- [ ] Toggling `material` calls `PUT /api/scope3/categories/[id]` and updates the UI.
- [ ] `materialityReason` can be entered and saved for material categories.
- [ ] Scope3Records are listed with: supplier name (or "Manual"), category, tCO₂e, confidence
  (as a percentage or 0–1 decimal), and dataSource badge.
- [ ] Records with `dataSource = "supplier_form"` or `"proxy"` are visually distinguished.
- [ ] "Add Record" form calls `POST /api/scope3/records` with required fields.

**Dependencies:** T12, T13, T20

---

### T26: UI Page — `/methodology`

**Priority:** P2

**Description:**
Implement the methodology page. Display a text area for each of the three scopes (Scope 1, Scope 2,
Scope 3). On save, call `PUT /api/methodology/[scope]`. Load existing notes on page load.

**Files to create:**

- `src/app/methodology/page.tsx`
- `src/app/methodology/MethodologyEditor.tsx` (client component)

**Acceptance Criteria:**

- [ ] Three sections are shown, one per scope, each with a labelled text area.
- [ ] Existing methodology notes are pre-populated on load.
- [ ] "Save" for each scope calls `PUT /api/methodology/scope_1` (or `scope_2`/`scope_3`).
- [ ] A success/error notification is shown after save.
- [ ] Saving an empty note is allowed (clears the existing text).

**Dependencies:** T14, T20

---

### T27: UI Page — `/export`

**Priority:** P2

**Description:**
Implement the export page with a single "Download PDF" button that triggers
`GET /api/export/pdf` and downloads the resulting PDF file.

**Files to create:**

- `src/app/export/page.tsx`
- `src/app/export/ExportButton.tsx` (client component — `"use client"` for download trigger)

**Acceptance Criteria:**

- [ ] Page renders a prominent "Download CSRD Climate Report PDF" button.
- [ ] Clicking the button calls `GET /api/export/pdf` and initiates a browser download.
- [ ] A loading/spinner state is shown while the PDF is being generated.
- [ ] An error message is shown if the PDF generation fails.
- [ ] Downloaded file is named `csrd-climate-report-{year}.pdf`.

**Dependencies:** T16, T20

---

### T28: UI Page — `/public/supplier/[token]`

**Priority:** P1

**Description:**
Implement the public supplier form page. This page is accessible without authentication. The Server
Component looks up the supplier by token. If not found, renders a "Link not found or expired"
message. If found, renders the `SupplierFormClient` with a form for: category selection (from
material categories), and exactly one of: `spend_eur`, `ton_km`, or `waste_kg`.

**Files to create:**

- `src/app/public/supplier/[token]/page.tsx`
- `src/app/public/supplier/[token]/SupplierFormClient.tsx` (client component)

**Acceptance Criteria:**

- [ ] `GET /public/supplier/valid-token` renders the form with the supplier's name displayed.
- [ ] `GET /public/supplier/invalid-token` renders a "Link not found or expired" message (not a
  crash page).
- [ ] The form includes radio buttons or a dropdown for input type selection
  (`spend_eur`, `ton_km`, `waste_kg`).
- [ ] On submit, the form `POST`s to `/api/public/supplier/[token]`.
- [ ] On success, a confirmation message is shown ("Thank you, your data has been submitted.").
- [ ] On error, the specific error from the API is shown to the user.
- [ ] The page does NOT display the main application navigation sidebar.
- [ ] No authentication cookie or header is sent or required.

**Dependencies:** T15, T20

---

### T29: Unit Tests — Proxy Calculation

**Priority:** P1 (validates core business logic)

**Description:**
Write Vitest unit tests for `src/lib/calculations.ts` covering TC-01 through TC-04 from the
test plan.

**Files to create:**

- `src/lib/__tests__/calculations.test.ts`

**Acceptance Criteria:**

- [ ] TC-01: `calculateProxyEmissions({ spend_eur: 1000 })` → `valueTco2e ≈ 0.42`
  (within floating-point tolerance).
- [ ] TC-02: `calculateProxyEmissions({ ton_km: 1000 })` → returns a number > 0 with
  `calculationMethod = "activity_based"`.
- [ ] TC-03: `calculateProxyEmissions({ waste_kg: 1000 })` → returns a number > 0 with
  `calculationMethod = "activity_based"`.
- [ ] TC-04: All three variants return `confidence < 1.0`.
- [ ] TC-10: `crypto.randomUUID()` returns a string matching the UUID v4 pattern.
- [ ] All tests pass with `cd src && npm test`.

**Dependencies:** T17

---

### T30: Unit Tests — Dashboard Totals

**Priority:** P1 (validates core business logic)

**Description:**
Write Vitest unit tests for the dashboard total calculation logic covering TC-05 through TC-09.
Since the dashboard total is computed in the API route using Prisma aggregates, test the logic
via a pure helper function. Extract a `calculateDashboardTotals()` function from the route handler
if needed, or test it directly with mocked Prisma results.

**Files to create:**

- `src/lib/__tests__/dashboard.test.ts`
- `src/lib/dashboard.ts` (extract pure calculation helper if not already present)

**Acceptance Criteria:**

- [ ] TC-05: Scope 1 total = sum of `valueTco2e` for the reporting year.
- [ ] TC-06: Scope 2 total = sum of `valueTco2e` for the reporting year.
- [ ] TC-07: Scope 3 total = sum of `valueTco2e` for the reporting year.
- [ ] TC-08: Grand total = S1 + S2 + S3.
- [ ] TC-09: Empty data set returns `{ scope1: 0, scope2: 0, scope3: 0, total: 0 }`.
- [ ] All tests pass with `cd src && npm test`.

**Dependencies:** T08, T17

---

### T31: API Smoke Tests

**Priority:** P2

**Description:**
Write Vitest API smoke tests (TC-11 through TC-23) using the actual Next.js route handler
functions imported directly (not via HTTP). Use an in-memory SQLite or a test-specific
`DATABASE_URL` to isolate test data.

**Files to create:**

- `src/app/api/__tests__/suppliers.test.ts` (TC-11, TC-12, TC-19, TC-20)
- `src/app/api/__tests__/public-supplier.test.ts` (TC-13, TC-14, TC-15, TC-16, TC-17)
- `src/app/api/__tests__/dashboard.test.ts` (TC-18)
- `src/app/api/__tests__/scope1.test.ts` (TC-21)
- `src/app/api/__tests__/scope2.test.ts` (TC-22)
- `src/app/api/__tests__/scope3-categories.test.ts` (TC-23)

**Acceptance Criteria:**

- [ ] TC-11: Token is stored on the supplier record after `POST /api/suppliers/[id]/token`.
- [ ] TC-12: `GET /api/suppliers/[id]` returns the `publicFormToken` field.
- [ ] TC-13: `POST /api/public/supplier/[token]` with `spend_eur` creates a `Scope3Record`.
- [ ] TC-14: The created record uses proxy calculation (valueTco2e = spend_eur × PROXY_FACTOR).
- [ ] TC-15: Created record has `confidence < 1.0`.
- [ ] TC-16: Invalid token returns 404.
- [ ] TC-17: Form submission creates an `AuditTrailEvent`.
- [ ] TC-18: `GET /api/dashboard` returns `{ scope1, scope2, scope3, total }`.
- [ ] TC-19: `GET /api/suppliers` returns an array.
- [ ] TC-20: `POST /api/suppliers` creates a supplier with `publicFormToken`.
- [ ] TC-21: `POST /api/scope1` creates a `Scope1Record`.
- [ ] TC-22: `POST /api/scope2` creates a `Scope2Record`.
- [ ] TC-23: `GET /api/scope3/categories` returns an array of 15 categories.
- [ ] All tests pass with `cd src && npm test`.

**Dependencies:** T08, T09, T10, T11, T12, T13, T15, T17, T18

---

### T32: Lint Validation — Zero ESLint Errors

**Priority:** P1 (must pass before PR is merged)

**Description:**
Run `cd src && npm run lint` and fix all ESLint errors until the command exits with code 0.
This is a validation/polish task, not a new feature.

**Files to modify:** Any file flagged by ESLint.

**Acceptance Criteria:**

- [ ] `cd src && npm run lint` exits with code 0.
- [ ] No ESLint warnings are suppressed with inline `// eslint-disable` comments without a comment
  explaining why.

**Dependencies:** All T01–T31 tasks completed.

---

### T33: Type Check Validation — Zero TypeScript Errors

**Priority:** P1 (must pass before PR is merged)

**Description:**
Run `cd src && npm run type-check` (i.e., `tsc --noEmit`) and fix all TypeScript errors until
the command exits with code 0. TypeScript strict mode must be maintained — no loosening of the
`tsconfig.json`.

**Files to modify:** Any file with TypeScript errors.

**Acceptance Criteria:**

- [ ] `cd src && npm run type-check` exits with code 0.
- [ ] No `any` types remain (unless explicitly required and documented).
- [ ] `tsconfig.json` still has `"strict": true`.

**Dependencies:** All T01–T31 tasks completed.

---

### T34: Test Suite — All Tests Pass

**Priority:** P1 (must pass before PR is merged)

**Description:**
Run `cd src && npm test` and fix any failing tests until the test suite passes with zero failures.
This includes TC-01 through TC-23.

**Files to modify:** Any failing test file or its corresponding source.

**Acceptance Criteria:**

- [ ] `cd src && npm test` exits with code 0.
- [ ] All 23+ test cases pass (TC-01 through TC-23).
- [ ] No tests are skipped with `test.skip()` (or all skipped tests have a documented reason).

**Dependencies:** T29, T30, T31.

---

### T35: Build Validation — `next build` Succeeds

**Priority:** P1 (must pass before PR is merged — TC-24)

**Description:**
Run `cd src && npm run build` and fix any build errors until it exits with code 0. This is the
final integration smoke test.

**Files to modify:** Any file causing build failures.

**Acceptance Criteria:**

- [ ] `cd src && npm run build` exits with code 0.
- [ ] No TypeScript compile errors during build.
- [ ] No missing module errors.
- [ ] All pages and API routes are included in the build output.

**Dependencies:** T32, T33, T34.

---

## Implementation Order

The recommended implementation sequence follows the dependency graph, ensuring each task has its
prerequisites completed:

| Step | Tasks | Reason |
|------|-------|--------|
| 1 | T01 | Next.js project scaffold — everything depends on this |
| 2 | T02, T03 | Schema and constants — can be done in parallel after T01 |
| 3 | T04 | Prisma client — requires T01 + T02 |
| 4 | T05 | Initial migration — requires schema to be finalized |
| 5 | T06 | Seed data — requires migration to exist |
| 6 | T07 | Docker — requires working app and seed |
| 7 | T17, T18 | Business logic helpers — prerequisite for API routes |
| 8 | T08, T09, T10, T11, T12, T13 | Core API routes — can be built in parallel |
| 9 | T14, T15, T16 | Remaining API routes — T15 needs T17; T16 needs T19 |
| 10 | T19 | PDF logic — can be done alongside T16 |
| 11 | T20 | App shell/layout — prerequisite for all UI pages |
| 12 | T21, T22, T25, T28 | P1 UI pages — Dashboard, Suppliers, Scope 3, Public form |
| 13 | T23, T24, T26, T27 | P2 UI pages — Scope 1, Scope 2, Methodology, Export |
| 14 | T29, T30 | Unit tests for business logic |
| 15 | T31 | API smoke tests |
| 16 | T32, T33 | Lint + type-check clean-up |
| 17 | T34, T35 | Final test run + build validation |

---

## Open Questions

None — the specification, architecture, and test plan provide sufficient detail for all tasks.
All ambiguities noted in the "Notes for Developer" section above.
