# Implementation Tasks: GreenLedger MVP

## Overview

This document breaks down the GreenLedger MVP feature (001-mvp) into concrete,
ordered implementation tasks. The MVP is a full-stack Next.js application for German SMEs
to automate CSRD/ESRS climate reporting. The `src/` directory is currently empty (greenfield).

**References:**
- [Feature Specification](./specification.md) — FR-001 through FR-012, NFR-001 through NFR-009
- [Architecture](./architecture.md) — Component diagram, `src/` layout, API design
- [Test Plan](./test-plan.md) — TC-01 through TC-83
- ADRs: [ADR-001](../../adr-001-nextjs-app-router.md), [ADR-002](../../adr-002-prisma-sqlite.md), [ADR-003](../../adr-003-pdf-rendering.md), [ADR-004](../../adr-004-seed-strategy.md), [ADR-005](../../adr-005-proxy-factor.md)

---

## Phase 1: Project Foundation

> Establishes the Next.js application skeleton, TypeScript configuration, TailwindCSS,
> linting, and test runner. Everything else depends on this phase.

---

### T-001: Initialize Next.js Application

**Priority:** P0 — Blocker for all other tasks

**Description:**
Bootstrap the Next.js 15 project inside `src/` using `create-next-app` with App Router,
TypeScript strict mode, and TailwindCSS. The result must be a working skeleton that can
run `npm run dev` and `npm run build`.

**Inputs:** Empty `src/` directory

**Outputs:**
- `src/package.json` — with `name: "green-ledger"`, scripts: `dev`, `build`, `start`, `lint`, `type-check`
- `src/next.config.mjs`
- `src/tsconfig.json` — `strict: true`, `baseUrl: "."`, `paths` as needed
- `src/tailwind.config.ts` + `src/postcss.config.mjs`
- `src/app/layout.tsx` — root layout (placeholder, refined in T-016)
- `src/app/page.tsx` — root page (placeholder, refined in T-017)
- `src/app/globals.css` — TailwindCSS directives

**Acceptance Criteria:**
- [ ] `cd src && npm run dev` starts the dev server on port 3000 without errors
- [ ] `cd src && npm run build` completes successfully
- [ ] `tsconfig.json` includes `"strict": true`
- [ ] TailwindCSS is configured and `globals.css` includes `@tailwind base/components/utilities`
- [ ] `package.json` `name` field is `"green-ledger"`
- [ ] `scripts` block includes `"type-check": "tsc --noEmit"`

**Dependencies:** None

**Notes:**
- Use `npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"` inside `src/`
  (the `src/` directory itself is the Next.js project root, not a sub-directory inside Next.js)
- App Router, TypeScript, TailwindCSS: yes. ESLint: yes. `src/` directory: no (the CWD is already `src/`)
- Per NFR-009, all application code lives in `src/`; Next.js app directory is `src/app/` in the repo

---

### T-002: Configure ESLint and Prettier

**Priority:** P0 — Required for CI lint step

**Description:**
Set up ESLint with Next.js recommended config and Prettier for consistent code style.
Add the `lint` and `format` npm scripts. Ensure `npm run lint` passes on the initial skeleton.

**Outputs:**
- `src/eslint.config.mjs` — Next.js recommended + Prettier
- `src/.prettierrc` — consistent formatting rules
- `src/package.json` — `lint` script: `next lint`, `format` script: `prettier --write .`

**Acceptance Criteria:**
- [ ] `cd src && npm run lint` passes with zero errors on the initial codebase
- [ ] Prettier config is present and consistent with the project (2-space indent, single quotes, trailing commas)
- [ ] ESLint uses `@next/eslint-plugin-next` (included in Next.js ESLint config)

**Dependencies:** T-001

**Notes:**
- `create-next-app` may already generate an ESLint config; verify and refine if needed
- Add `eslint-config-prettier` to suppress ESLint formatting rules that conflict with Prettier

---

### T-003: Configure Vitest

**Priority:** P0 — Required for CI test step

**Description:**
Add Vitest as the test runner with configuration suitable for testing Next.js Route Handlers
and pure TypeScript functions. Set up `vitest.config.ts` with the correct module resolution.

**Outputs:**
- `src/vitest.config.ts` — Vitest config (environment: `node`, include: `**/*.test.ts`)
- `src/package.json` — `"test": "vitest run"`, `"test:watch": "vitest"` scripts
- `vitest`, `@vitejs/plugin-react` (if needed) added to `devDependencies`

**Acceptance Criteria:**
- [ ] `cd src && npm test` runs without errors (zero tests is acceptable at this stage)
- [ ] Vitest config resolves `@/` path alias matching `tsconfig.json` paths
- [ ] Test files matching `**/*.test.ts` are discovered automatically

**Dependencies:** T-001

**Notes:**
- Use `vitest` (not Jest) per NFR-001
- Route Handler tests will mock Prisma with `vi.mock()` — no test database required
- Configure `globals: true` in Vitest to avoid needing explicit `vi` imports

---

### T-004: Configure Husky Pre-commit Hooks

**Priority:** P1 — Required for NFR-005 code quality

**Description:**
Install Husky and lint-staged to run ESLint + TypeScript type-check before every commit.
This enforces code quality at the developer workflow level.

**Outputs:**
- `src/.husky/pre-commit` — shell script running `npm run lint && npm run type-check`
- `src/package.json` — `"prepare": "husky"` script, `lint-staged` config
- `husky`, `lint-staged` added to `devDependencies`

**Acceptance Criteria:**
- [ ] `npm run prepare` initialises Husky without errors
- [ ] Attempting to commit code with a lint error is blocked by the pre-commit hook
- [ ] Pre-commit hook runs `npm run lint` and `npm run type-check`

**Dependencies:** T-001, T-002

**Notes:**
- Per NFR-005, Husky must be configured in `src/package.json`
- The `prepare` script runs automatically after `npm install`

---

## Phase 2: Database Layer

> Defines the Prisma schema, generates migrations, and creates the seed script.
> API routes and business logic depend on the Prisma-generated types.

---

### T-005: Define Prisma Schema

**Priority:** P0 — Blocker for all database-accessing code

**Description:**
Create the complete Prisma schema in `src/prisma/schema.prisma` with all eight domain models
as specified. Use SQLite as the datasource. All primary keys are UUIDs. Enum-equivalent fields
use `String` with documented constraints to remain Postgres-migratable.

**Outputs:**
- `src/prisma/schema.prisma` — complete schema with all models and relations
- `prisma` added to `dependencies` in `src/package.json`
- `@prisma/client` added to `dependencies`

**Domain Models to implement (exact fields from spec.md):**
1. **Company** — `id`, `name`, `country` (default "DE"), `reportingYear`, `orgBoundary`
2. **Supplier** — `id`, `companyId` (FK), `name`, `country`, `sector`, `contactEmail`,
   `publicFormToken` (`@unique`), `status`
3. **Scope1Record** — `id`, `companyId` (FK), `periodYear`, `valueTco2e`, `calculationMethod`,
   `emissionFactorsSource`, `dataSource`, `assumptions`, `createdAt`
4. **Scope2Record** — same structure as Scope1Record
5. **Scope3Category** — `id`, `code` (`@unique`), `name`, `material`, `materialityReason`
6. **Scope3Record** — `id`, `companyId` (FK), `supplierId` (nullable FK), `categoryId` (FK),
   `periodYear`, `valueTco2e`, `calculationMethod`, `emissionFactorSource`, `dataSource`,
   `assumptions`, `confidence`, `activityDataJson` (Json?), `createdAt`, `updatedAt`
7. **MethodologyNote** — `id`, `companyId` (FK), `scope`, `text`, `updatedAt`
8. **AuditTrailEvent** — `id`, `companyId` (FK), `entityType`, `entityId`, `action`, `actor`,
   `timestamp`, `comment`

**Acceptance Criteria:**
- [ ] `npx prisma validate` passes with no errors
- [ ] All models have `String @id @default(uuid())` primary keys
- [ ] All FK relations are correctly defined (Prisma `@relation`)
- [ ] `Supplier.publicFormToken` has `@unique` constraint
- [ ] `Scope3Category.code` has `@unique` constraint
- [ ] `Scope3Record.activityDataJson` is `Json?` type
- [ ] `Scope3Record.updatedAt` has `@updatedAt`
- [ ] `AuditTrailEvent.timestamp` defaults to `@default(now())`
- [ ] Schema comment documents that String enums are Postgres-migratable

**Dependencies:** T-001

**Notes:**
- Per ADR-002, use `String` for enum-equivalent fields (e.g., `orgBoundary`, `status`,
  `dataSource`, `calculationMethod`, `scope`, `entityType`, `action`, `actor`)
- `Json` type in Prisma maps to `TEXT` in SQLite; this is acceptable per ADR-002
- Add `"prisma": { "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts" }`
  to `src/package.json` to enable `npx prisma db seed`

---

### T-006: Create Prisma Migration and Generate Client

**Priority:** P0 — Blocker for any code that imports `@prisma/client`

**Description:**
Run `prisma migrate dev` to create the initial migration and generate the Prisma client.
The migration file must be committed to the repository.

**Outputs:**
- `src/prisma/migrations/` — initial migration files
- `src/prisma/dev.db` — development SQLite database (gitignored)
- Updated `src/.gitignore` — includes `prisma/*.db`, `prisma/*.db-journal`

**Acceptance Criteria:**
- [ ] `cd src && npx prisma migrate dev --name init` completes without errors
- [ ] `src/prisma/migrations/` directory with `migration.sql` exists and is committed
- [ ] `@prisma/client` is generated (`.prisma/client/` or `node_modules/.prisma/`)
- [ ] `src/.gitignore` excludes `prisma/*.db` and `prisma/*.db-journal`
- [ ] `npx prisma studio` can connect to the database and shows all tables

**Dependencies:** T-005

**Notes:**
- The `prisma generate` command is automatically run as part of `prisma migrate dev`
- Add `postinstall: "prisma generate"` to `src/package.json` scripts so client is generated after `npm ci` in CI

---

### T-007: Create Database Seed Script

**Priority:** P0 — Required for demo flow and Docker Compose bring-up

**Description:**
Create `src/prisma/seed.ts` that populates the database with all 15 Scope 3 categories
and demo data (Company, Suppliers, Scope 1/2/3 records, MethodologyNotes). The script must
be idempotent (safe to run multiple times).

**Outputs:**
- `src/prisma/seed.ts` — idempotent seed script
- `src/package.json` — `"seed": "prisma db seed"` script
- `ts-node` added to `devDependencies`

**Seed Data to create:**
- 1 × `Company`: `{ name: "Acme GmbH", country: "DE", reportingYear: 2024, orgBoundary: "operational_control" }`
- 15 × `Scope3Category`: C1–C15 per GHG Protocol (see ADR-004 for full list); use `upsert` on `code`
- 3 × `Supplier`: e.g. "Tech Supplies AG", "LogiTrans GmbH", "Büro Zentrum GmbH" with pre-generated tokens
- 2 × `Scope1Record` for 2024
- 1 × `Scope2Record` for 2024
- 3 × `Scope3Record` (mix of `supplier_form`, `proxy`, `activity_based` data sources)
- 3 × `MethodologyNote` (one per scope with placeholder text)

**Acceptance Criteria:**
- [ ] `cd src && npm run seed` completes without errors on a freshly migrated DB
- [ ] Running `npm run seed` a second time does not create duplicates (idempotent)
- [ ] All 15 Scope 3 categories (C1–C15) exist after seeding
- [ ] Dashboard shows non-zero values for all three scopes after seeding
- [ ] Company record exists with `reportingYear: 2024`
- [ ] At least one `Supplier` has a non-null `publicFormToken`
- [ ] At least one `Scope3Record` has `dataSource: "proxy"` and `confidence < 1`

**Dependencies:** T-006

**Notes:**
- Use `prisma.company.findFirst()` guard before creating Company to ensure idempotency
- Per ADR-004, `docker-compose.yml` entrypoint runs `prisma migrate deploy && npm run seed && npm start`
- Use `upsert` with `where: { code: 'C1' }` for all 15 Scope3Category rows
- `ts-node` must be in `devDependencies`; the seed script uses CommonJS module syntax via `ts-node --compiler-options`

---

## Phase 3: Core Business Logic (`src/lib/`)

> Pure functions and helpers that encapsulate all business logic. Tested independently
> from the UI and API layers.

---

### T-008: Create Prisma Client Singleton (`lib/prisma.ts`)

**Priority:** P0 — Blocker for all API routes

**Description:**
Create `src/lib/prisma.ts` that exports a singleton PrismaClient instance, following
the Next.js hot-reload pattern to avoid multiple instances in development.

**Outputs:**
- `src/lib/prisma.ts` — PrismaClient singleton

**Implementation:**
```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

**Acceptance Criteria:**
- [ ] `prisma` is exported as a named export
- [ ] Module-level singleton pattern prevents multiple PrismaClient instances in dev/hot-reload
- [ ] TypeScript compiles without errors

**Dependencies:** T-006

---

### T-009: Create Constants (`lib/constants.ts`)

**Priority:** P0 — Blocker for proxy calculation and PDF generation

**Description:**
Create `src/lib/constants.ts` with `PROXY_FACTOR` and `PROXY_FACTOR_SOURCE` as documented
in ADR-005.

**Outputs:**
- `src/lib/constants.ts`

**Implementation:**
```typescript
/** Spend-based proxy emission factor (kgCO₂e per EUR spent).
 *  PLACEHOLDER VALUE for demo purposes only.
 *  Source: Exiobase v3.8 – global average, purchased goods & services.
 *  Replace with sector-specific factors for production use.
 */
export const PROXY_FACTOR = 0.4; // kgCO₂e/€

export const PROXY_FACTOR_SOURCE =
  "Exiobase v3.8 – global average, purchased goods & services (placeholder)";
```

**Acceptance Criteria:**
- [ ] `PROXY_FACTOR` is exported and equals `0.4`
- [ ] `PROXY_FACTOR_SOURCE` is exported as a non-empty string
- [ ] JSDoc comment documents the placeholder nature and source
- [ ] Test case TC-33 passes: `import { PROXY_FACTOR } from '@/lib/constants'` works

**Dependencies:** T-001

---

### T-010: Create Emissions Helpers (`lib/emissions.ts`)

**Priority:** P0 — Blocker for dashboard API and supplier form submission

**Description:**
Create `src/lib/emissions.ts` with two exported functions:
1. `calculateDashboardTotals()` — sums `valueTco2e` across Scope 1/2/3 arrays
2. `calculateProxyTco2e()` — converts `spend_eur` to tCO₂e using `PROXY_FACTOR`

**Outputs:**
- `src/lib/emissions.ts`

**Function signatures:**
```typescript
export interface DashboardTotals {
  scope1: number;
  scope2: number;
  scope3: number;
  total: number;
}

export function calculateDashboardTotals(
  scope1Records: Array<{ valueTco2e: number }>,
  scope2Records: Array<{ valueTco2e: number }>,
  scope3Records: Array<{ valueTco2e: number }>,
): DashboardTotals

/** Returns tCO₂e. Formula: (spend_eur * PROXY_FACTOR) / 1000 */
export function calculateProxyTco2e(spendEur: number): number
```

**Acceptance Criteria:**
- [ ] `calculateDashboardTotals([{valueTco2e:100},{valueTco2e:50}],[{valueTco2e:200}],[{valueTco2e:300},{valueTco2e:150}])` returns `{scope1:150, scope2:200, scope3:450, total:800}` (TC-01)
- [ ] Empty arrays return all zeros (TC-02)
- [ ] Partial scopes return correct partial sums (TC-03)
- [ ] `calculateProxyTco2e(1000)` returns `1000 * 0.4 / 1000 = 0.4` tCO₂e (TC-30)
- [ ] `calculateProxyTco2e(0)` returns `0` (TC-31)

**Dependencies:** T-009

---

### T-011: Create Audit Trail Helper (`lib/audit.ts`)

**Priority:** P0 — Required by all mutation API routes

**Description:**
Create `src/lib/audit.ts` with a `createAuditEvent()` helper that creates an
`AuditTrailEvent` record in the database.

**Outputs:**
- `src/lib/audit.ts`

**Function signature:**
```typescript
export interface CreateAuditEventInput {
  companyId: string;
  entityType: 'supplier' | 'scope1' | 'scope2' | 'scope3' | 'methodology' | 'export';
  entityId: string;
  action: 'created' | 'updated' | 'submitted' | 'exported';
  actor: 'system' | 'supplier' | 'user';
  comment?: string;
}

export async function createAuditEvent(input: CreateAuditEventInput): Promise<void>
```

**Acceptance Criteria:**
- [ ] `createAuditEvent()` calls `prisma.auditTrailEvent.create()` with correct fields
- [ ] `timestamp` defaults to current date/time
- [ ] Function accepts all required `entityType` and `action` enum values
- [ ] Unit test TC-80 passes: mocked Prisma `create` is called with correct shape

**Dependencies:** T-008

---

### T-012: Create PDF Generator (`lib/pdf.ts`)

**Priority:** P1 — Required for PDF export API route

**Description:**
Create `src/lib/pdf.ts` with two exported functions:
1. `buildReportData()` — assembles a structured data object from raw Prisma data
2. `generatePdfBuffer()` — renders HTML to PDF via Puppeteer

Install `puppeteer` as a production dependency.

**Outputs:**
- `src/lib/pdf.ts`
- `puppeteer` added to `dependencies` in `src/package.json`

**Key types and functions:**
```typescript
export interface ReportData {
  cover: { companyName: string; reportingYear: number };
  summary: { scope1: number; scope2: number; scope3: number; total: number };
  scope3Breakdown: Array<{ categoryCode: string; categoryName: string; valueTco2e: number }>;
  hasNonMaterialCategories: boolean;
  methodology: Array<{ scope: string; text: string }>;
  assumptionsDataQuality: Array<{
    supplierName: string | null;
    categoryName: string;
    assumptions: string | null;
    confidence: number;
    dataSource: string;
  }>;
}

/** Pure data assembly — no Puppeteer. Testable without browser. */
export function buildReportData(data: RawReportInput): ReportData

/** Renders HTML template to PDF via Puppeteer. */
export async function generatePdfBuffer(reportData: ReportData): Promise<Buffer>
```

**PDF Sections (per FR-011):**
1. Cover page — company name, reporting year
2. Summary table — Scope 1/2/3/Total in tCO₂e
3. Scope 3 breakdown — material categories only; note if non-material exist
4. Methodology — one section per scope from MethodologyNote
5. Assumptions & Data Quality — Scope3Records where `dataSource === "proxy"` OR `confidence < 1` OR `assumptions` non-empty

**Acceptance Criteria:**
- [ ] `buildReportData()` returns all five sections when given complete data (TC-71)
- [ ] `scope3Breakdown` includes only material categories; `hasNonMaterialCategories` is `true` when non-material exist (TC-72)
- [ ] `assumptionsDataQuality` filters correctly: includes proxy/confidence<1/non-empty assumptions; excludes clean records (TC-73)
- [ ] `generatePdfBuffer()` returns a `Buffer` when Puppeteer is available
- [ ] Puppeteer is launched with `args: ['--no-sandbox', '--disable-setuid-sandbox']` for Docker compatibility
- [ ] HTML template uses `format: 'A4'` and `printBackground: true`

**Dependencies:** T-008, T-009, T-010

**Notes:**
- Per ADR-003, the HTML template uses inline styles or a `<style>` block (no CDN dependency in PDF HTML)
- The `buildReportData()` function must be separately testable without Puppeteer (TC-71–73 mock Puppeteer)
- Puppeteer must be in `dependencies` (not `devDependencies`) so it is included in the Docker build

---

## Phase 4: API Routes

> All Route Handlers in `src/app/api/`. Each handler is lean: parse request,
> call lib/ helpers, return `{ data: ... }` or `{ error: ... }`. See architecture.md for
> the consistent response shape.

---

### T-013: Dashboard API Route (`/api/dashboard`)

**Priority:** P0 — Required for dashboard page

**Description:**
Implement `GET /api/dashboard` that returns Scope 1/2/3 totals and grand total
for the current `reportingYear`.

**Outputs:**
- `src/app/api/dashboard/route.ts`

**Logic:**
1. `prisma.company.findFirst()` — if null, return HTTP 503
2. `prisma.scope1Record.findMany({ where: { companyId, periodYear: reportingYear } })`
3. `prisma.scope2Record.findMany({ where: { companyId, periodYear: reportingYear } })`
4. `prisma.scope3Record.findMany({ where: { companyId, periodYear: reportingYear } })`
5. Call `calculateDashboardTotals()` from `lib/emissions.ts`
6. Return `{ data: { scope1, scope2, scope3, total } }` with HTTP 200

**Acceptance Criteria:**
- [ ] `GET /api/dashboard` returns HTTP 200 with `{ data: { scope1, scope2, scope3, total } }` (TC-04)
- [ ] Returns HTTP 503 (or 500) with `{ error: ... }` when no Company exists (TC-05)
- [ ] Totals are filtered by `reportingYear` from the Company record

**Dependencies:** T-008, T-010

**Test Cases:** TC-04, TC-05

---

### T-014: Suppliers API Routes

**Priority:** P0 — Required for supplier management

**Description:**
Implement all Supplier CRUD endpoints.

**Outputs:**
- `src/app/api/suppliers/route.ts` — `GET` (list), `POST` (create)
- `src/app/api/suppliers/[id]/route.ts` — `PUT` (update), `DELETE`

**Logic for POST create:**
1. Parse and validate body (name, country, sector, contactEmail, status — all required except assumptions)
2. `prisma.company.findFirst()` → get companyId
3. `prisma.supplier.create()` with a generated `publicFormToken: crypto.randomUUID()`
4. `createAuditEvent({ entityType: "supplier", action: "created", actor: "user" })`
5. Return HTTP 201 with `{ data: supplier }`

**Acceptance Criteria:**
- [ ] `GET /api/suppliers` returns HTTP 200 with array of suppliers (TC-10)
- [ ] `POST /api/suppliers` with valid body returns HTTP 201 with supplier (TC-11)
- [ ] `POST /api/suppliers` missing `name` returns HTTP 400 (TC-12)
- [ ] `DELETE /api/suppliers/[id]` returns HTTP 200 (TC-13)
- [ ] `PUT /api/suppliers/[id]` updates and returns updated supplier
- [ ] `POST` creates `AuditTrailEvent` with `entityType: "supplier"`, `action: "created"` (TC-82)
- [ ] New supplier always gets a `publicFormToken` generated on creation

**Dependencies:** T-008, T-011

**Test Cases:** TC-10, TC-11, TC-12, TC-13, TC-82

---

### T-015: Supplier Token API Route

**Priority:** P0 — Required for token generation feature (FR-003)

**Description:**
Implement `POST /api/suppliers/[id]/token` that regenerates `publicFormToken`
for a given supplier.

**Outputs:**
- `src/app/api/suppliers/[id]/token/route.ts`

**Logic:**
1. `prisma.supplier.findUnique({ where: { id } })` — if null, return HTTP 404
2. `prisma.supplier.update({ data: { publicFormToken: crypto.randomUUID() } })`
3. Return HTTP 200 with `{ data: { publicFormToken } }`

**Acceptance Criteria:**
- [ ] `POST /api/suppliers/[id]/token` returns HTTP 200 with new `publicFormToken` (TC-14)
- [ ] Returns HTTP 404 when supplier not found (TC-15)
- [ ] New token is a non-empty UUID string

**Dependencies:** T-008

**Test Cases:** TC-14, TC-15

---

### T-016: Public Supplier Form API Routes

**Priority:** P0 — Required for supplier data submission (FR-004, FR-005)

**Description:**
Implement the two public supplier form API routes:
1. `GET /api/public/supplier/[token]` — fetch supplier info for form display
2. `POST /api/public/supplier/[token]/submit` — process form submission

**Outputs:**
- `src/app/api/public/supplier/[token]/route.ts`
- `src/app/api/public/supplier/[token]/submit/route.ts`

**Logic for POST submit:**
1. `prisma.supplier.findUnique({ where: { publicFormToken: token } })` → 404 if not found
2. Validate body — at least one of `spend_eur`, `ton_km`, `waste_kg` must be present → 400 if all absent
3. `prisma.company.findFirst()` → get company
4. `prisma.scope3Category.findFirst({ where: { code: 'C1' } })` → default category
5. Determine `calculationMethod` and compute `valueTco2e`:
   - If `spend_eur`: `calculationMethod = "spend_based"`, `valueTco2e = calculateProxyTco2e(spend_eur)`, `confidence = 0.4`
   - Else: `calculationMethod = "activity_based"`, `valueTco2e` = 0 (placeholder), `confidence = 0.6`
6. `prisma.scope3Record.create()` with `dataSource = "supplier_form"`, `emissionFactorSource = PROXY_FACTOR_SOURCE`, `activityDataJson = body`
7. `createAuditEvent({ entityType: "scope3", action: "submitted", actor: "supplier" })`
8. Return HTTP 201

**Acceptance Criteria:**
- [ ] `GET /api/public/supplier/[token]` returns HTTP 200 with supplier name (TC-20)
- [ ] `GET` with invalid token returns HTTP 404 (TC-20b)
- [ ] `POST submit` with `{ spend_eur: 1000 }` creates `Scope3Record` with correct fields (TC-21):
  - `dataSource: "supplier_form"`
  - `calculationMethod: "spend_based"`
  - `valueTco2e === 1000 * 0.4 / 1000 = 0.4`
  - `confidence < 1.0`
  - `assumptions` non-empty
  - `activityDataJson` contains `{ spend_eur: 1000 }`
- [ ] `POST submit` with empty body returns HTTP 400 (TC-22)
- [ ] `POST submit` creates `AuditTrailEvent` with `action: "submitted"`, `actor: "supplier"` (TC-23)

**Dependencies:** T-008, T-009, T-010, T-011

**Test Cases:** TC-20, TC-20b, TC-21, TC-22, TC-23

---

### T-017: Scope 1 API Routes

**Priority:** P0 — Required for Scope 1 recording (FR-007)

**Description:**
Implement `GET`, `POST` for `/api/scope1` and `DELETE` for `/api/scope1/[id]`.

**Outputs:**
- `src/app/api/scope1/route.ts`
- `src/app/api/scope1/[id]/route.ts`

**POST validation:** `periodYear` (int), `valueTco2e` (number), `calculationMethod` (string),
`emissionFactorsSource` (string) — all required. `assumptions` optional.
`dataSource` defaults to `"manual"`.

**Acceptance Criteria:**
- [ ] `GET /api/scope1` returns HTTP 200 with array (TC-40)
- [ ] `POST /api/scope1` with valid body returns HTTP 201 (TC-41)
- [ ] `POST /api/scope1` with non-numeric `valueTco2e` returns HTTP 400 (TC-41b)
- [ ] `POST` creates `AuditTrailEvent` with `entityType: "scope1"`, `action: "created"`, `actor: "user"` (TC-81)
- [ ] `DELETE /api/scope1/[id]` returns HTTP 200

**Dependencies:** T-008, T-011

**Test Cases:** TC-40, TC-41, TC-41b, TC-81

---

### T-018: Scope 2 API Routes

**Priority:** P0 — Required for Scope 2 recording (FR-008)

**Description:**
Implement `GET`, `POST` for `/api/scope2` and `DELETE` for `/api/scope2/[id]`.
Identical structure to T-017 with `Scope2Record` model.

**Outputs:**
- `src/app/api/scope2/route.ts`
- `src/app/api/scope2/[id]/route.ts`

**Acceptance Criteria:**
- [ ] `GET /api/scope2` returns HTTP 200 (TC-42)
- [ ] `POST /api/scope2` with valid body returns HTTP 201 (TC-43)
- [ ] `DELETE /api/scope2/[id]` returns HTTP 200
- [ ] `POST` creates `AuditTrailEvent` with `entityType: "scope2"`, `action: "created"`

**Dependencies:** T-008, T-011

**Test Cases:** TC-42, TC-43

---

### T-019: Scope 3 Categories API Routes

**Priority:** P0 — Required for category management (FR-009)

**Description:**
Implement `GET /api/scope3/categories` and `PUT /api/scope3/categories/[id]`.

**Outputs:**
- `src/app/api/scope3/categories/route.ts`
- `src/app/api/scope3/categories/[id]/route.ts`

**PUT body:** `{ material: boolean, materialityReason?: string }`

**Acceptance Criteria:**
- [ ] `GET /api/scope3/categories` returns HTTP 200 with all 15 categories (TC-50)
- [ ] `PUT /api/scope3/categories/[id]` with `{ material: true, materialityReason: "..." }` returns HTTP 200 (TC-51)

**Dependencies:** T-008

**Test Cases:** TC-50, TC-51

---

### T-020: Scope 3 Records API Route

**Priority:** P0 — Required for Scope 3 display (FR-009)

**Description:**
Implement `GET /api/scope3/records` and `DELETE /api/scope3/records/[id]`.
The GET includes `supplier` and `category` via Prisma `include`.

**Outputs:**
- `src/app/api/scope3/records/route.ts`
- `src/app/api/scope3/records/[id]/route.ts`

**Acceptance Criteria:**
- [ ] `GET /api/scope3/records` returns HTTP 200 with records including supplier and category names (TC-52)
- [ ] `DELETE /api/scope3/records/[id]` returns HTTP 200

**Dependencies:** T-008

**Test Cases:** TC-52

---

### T-021: Methodology API Routes

**Priority:** P0 — Required for methodology notes (FR-010)

**Description:**
Implement `GET /api/methodology` and `PUT /api/methodology/[scope]`.
The `[scope]` parameter must be one of: `scope_1`, `scope_2`, `scope_3`.

**Outputs:**
- `src/app/api/methodology/route.ts`
- `src/app/api/methodology/[scope]/route.ts`

**PUT logic:** `prisma.methodologyNote.upsert` keyed on `{ companyId, scope }`.
Validate `scope` parameter against allowed values → HTTP 400 if invalid.

**Acceptance Criteria:**
- [ ] `GET /api/methodology` returns HTTP 200 with array of notes (TC-60)
- [ ] `PUT /api/methodology/scope_3` with valid text returns HTTP 200 with updated note (TC-61)
- [ ] `PUT /api/methodology/scope_4` returns HTTP 400 (TC-61b)
- [ ] `PUT` creates `AuditTrailEvent` with `entityType: "methodology"`, `action: "updated"`

**Dependencies:** T-008, T-011

**Test Cases:** TC-60, TC-61, TC-61b

---

### T-022: PDF Export API Route

**Priority:** P1 — Required for PDF export (FR-011, FR-012)

**Description:**
Implement `POST /api/export/pdf` that assembles report data, generates a PDF buffer
via `lib/pdf.ts`, and returns it as `application/pdf`.

**Outputs:**
- `src/app/api/export/pdf/route.ts`

**Logic:**
1. `prisma.company.findFirst()` → company data
2. Fetch all required data: Scope1/2/3 records, categories, methodology notes
3. `buildReportData(rawData)` → structured report data
4. `generatePdfBuffer(reportData)` → PDF buffer
5. `createAuditEvent({ entityType: "export", action: "exported", actor: "user" })`
6. Return `new Response(buffer, { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="csrd-climate-report.pdf"' } })`

**Acceptance Criteria:**
- [ ] `POST /api/export/pdf` returns HTTP 200 with `Content-Type: application/pdf` (TC-70)
- [ ] `AuditTrailEvent` created with `entityType: "export"`, `action: "exported"`, `actor: "user"` (TC-83)
- [ ] Response includes `Content-Disposition: attachment` header

**Dependencies:** T-008, T-011, T-012

**Test Cases:** TC-70, TC-83

---

## Phase 5: UI Pages

> Next.js App Router pages and layouts. Most are server components that fetch data
> directly. Interactive elements (forms, copy-to-clipboard) use `"use client"` components.

---

### T-023: Root Layout with Sidebar Navigation

**Priority:** P0 — Required for all internal pages

**Description:**
Implement `src/app/layout.tsx` as the root layout with a persistent sidebar navigation
linking to all internal pages. The public supplier form page should use a nested layout
that omits the sidebar.

**Outputs:**
- `src/app/layout.tsx` — root layout with sidebar nav
- `src/app/public/supplier/[token]/layout.tsx` — minimal layout (no sidebar) for public form

**Navigation links (sidebar):**
- Dashboard (`/dashboard`)
- Suppliers (`/suppliers`)
- Scope 1 (`/scope-1`)
- Scope 2 (`/scope-2`)
- Scope 3 (`/scope-3`)
- Methodology (`/methodology`)
- Export (`/export`)

**Acceptance Criteria:**
- [ ] All internal pages show the sidebar with all navigation links
- [ ] Public supplier form page does NOT show the sidebar
- [ ] Active navigation link is visually highlighted
- [ ] Layout uses TailwindCSS for styling (neutral colour palette, professional B2B look)
- [ ] `next build` completes without errors

**Dependencies:** T-001

**Notes:**
- Per ADR-001, the public form uses a separate nested layout to omit the sidebar
- Sidebar should be a client component only if it needs active link detection (use `usePathname()`)
- The root `<html>` and `<body>` tags must be in the root layout; the nested layout for public form wraps content only

---

### T-024: Root Redirect

**Priority:** P0 — Required per ADR-001

**Description:**
Implement `src/app/page.tsx` to redirect `/` to `/dashboard`.

**Outputs:**
- `src/app/page.tsx`

**Implementation:**
```typescript
import { redirect } from 'next/navigation';
export default function RootPage() { redirect('/dashboard'); }
```

**Acceptance Criteria:**
- [ ] Navigating to `http://localhost:3000/` redirects to `/dashboard`
- [ ] TypeScript compiles without errors

**Dependencies:** T-023

---

### T-025: Dashboard Page

**Priority:** P0 — Core demo page (FR-001)

**Description:**
Implement `src/app/dashboard/page.tsx` as a server component that fetches
dashboard KPI totals from `/api/dashboard` (or directly from Prisma) and renders
four KPI cards: Scope 1, Scope 2, Scope 3, Total.

**Outputs:**
- `src/app/dashboard/page.tsx`

**Acceptance Criteria:**
- [ ] Page displays four KPI cards with labels "Scope 1", "Scope 2", "Scope 3", "Total"
- [ ] Values are in tCO₂e with clear unit labelling
- [ ] Data is populated from the database (not hardcoded)
- [ ] Page loads within 3 seconds with seed data (NFR-007)
- [ ] `next build` compiles this page without errors

**Dependencies:** T-013, T-023

---

### T-026: Suppliers Page

**Priority:** P0 — Required for supplier management (FR-002, FR-003)

**Description:**
Implement `src/app/suppliers/page.tsx` with a supplier table and interactive client
components for add/edit/delete and token management.

**Outputs:**
- `src/app/suppliers/page.tsx` — server component (fetches supplier list)
- `src/app/suppliers/SupplierForm.tsx` — `"use client"` form for add/edit
- `src/app/suppliers/TokenActions.tsx` — `"use client"` for generate/copy token

**Features:**
- Table of suppliers: name, country, sector, contactEmail, status
- "Add Supplier" button → form modal or inline form
- Edit and Delete actions per row
- "Generate / Refresh Token" button per row → calls `POST /api/suppliers/[id]/token`
- "Copy Link" button per row → copies `{origin}/public/supplier/{token}` to clipboard

**Acceptance Criteria:**
- [ ] Supplier table renders all suppliers from the database
- [ ] New supplier can be created via the form
- [ ] Supplier can be edited and deleted
- [ ] "Generate / Refresh Token" calls the token API and updates the displayed token
- [ ] "Copy Link" copies the full public form URL to clipboard
- [ ] Success/error feedback is shown to the user after each action

**Dependencies:** T-014, T-015, T-023

---

### T-027: Scope 1 Page

**Priority:** P0 — Required for Scope 1 recording (FR-007)

**Description:**
Implement `src/app/scope-1/page.tsx` with an add form and records list table.

**Outputs:**
- `src/app/scope-1/page.tsx` — server component (renders list + form)
- `src/app/scope-1/Scope1Form.tsx` — `"use client"` add form

**Form fields:** `periodYear`, `valueTco2e`, `calculationMethod`, `emissionFactorsSource`, `assumptions` (optional)

**Acceptance Criteria:**
- [ ] Records list shows all Scope 1 records for the company
- [ ] Add form creates a new record via `POST /api/scope1`
- [ ] Delete action removes a record via `DELETE /api/scope1/[id]`
- [ ] Validation error shown when required fields are missing

**Dependencies:** T-017, T-023

---

### T-028: Scope 2 Page

**Priority:** P0 — Required for Scope 2 recording (FR-008)

**Description:**
Implement `src/app/scope-2/page.tsx` with the same structure as the Scope 1 page.

**Outputs:**
- `src/app/scope-2/page.tsx`
- `src/app/scope-2/Scope2Form.tsx`

**Acceptance Criteria:**
- [ ] Same acceptance criteria as T-027 but for Scope 2 records

**Dependencies:** T-018, T-023

---

### T-029: Scope 3 Page

**Priority:** P0 — Required for Scope 3 management (FR-009)

**Description:**
Implement `src/app/scope-3/page.tsx` with two sections:
1. Categories table with materiality toggle and reason input
2. Records table showing supplier, category, value, data source, confidence, assumptions

**Outputs:**
- `src/app/scope-3/page.tsx` — server component
- `src/app/scope-3/CategoryMateriality.tsx` — `"use client"` materiality toggle
- `src/app/scope-3/Scope3RecordsTable.tsx` — records display table

**Acceptance Criteria:**
- [ ] All 15 Scope 3 categories are displayed with their codes and names
- [ ] Materiality toggle (checkbox or toggle) calls `PUT /api/scope3/categories/[id]`
- [ ] `materialityReason` can be entered per category
- [ ] Records table shows: supplier name, category, `valueTco2e`, `dataSource`, `confidence`, `assumptions`

**Dependencies:** T-019, T-020, T-023

---

### T-030: Methodology Page

**Priority:** P0 — Required for methodology notes (FR-010)

**Description:**
Implement `src/app/methodology/page.tsx` with three text areas, one per scope,
with individual Save buttons.

**Outputs:**
- `src/app/methodology/page.tsx` — server component (loads existing notes)
- `src/app/methodology/MethodologyEditor.tsx` — `"use client"` text area + save

**Acceptance Criteria:**
- [ ] Three text areas displayed: Scope 1, Scope 2, Scope 3
- [ ] Existing notes pre-populated from the database
- [ ] Each "Save" button calls `PUT /api/methodology/[scope]`
- [ ] Success confirmation shown after save

**Dependencies:** T-021, T-023

---

### T-031: Export Page

**Priority:** P1 — Required for PDF export (FR-011)

**Description:**
Implement `src/app/export/page.tsx` with a "Download PDF Report" button.

**Outputs:**
- `src/app/export/page.tsx` — server component (optional: show last export timestamp)
- `src/app/export/ExportButton.tsx` — `"use client"` button that POSTs to `/api/export/pdf` and triggers download

**Acceptance Criteria:**
- [ ] "Download PDF Report" button is displayed
- [ ] Clicking the button calls `POST /api/export/pdf` and triggers browser file download
- [ ] Loading state shown while PDF is generating
- [ ] Error message shown if PDF generation fails
- [ ] Downloaded file is named `csrd-climate-report.pdf`

**Dependencies:** T-022, T-023

---

### T-032: Public Supplier Form Page

**Priority:** P0 — Required for supplier data collection (FR-004)

**Description:**
Implement `src/app/public/supplier/[token]/page.tsx` as a public-facing form
(no sidebar, no auth). Displays supplier name and accepts `spend_eur`, `ton_km`, `waste_kg`.

**Outputs:**
- `src/app/public/supplier/[token]/page.tsx` — server component (loads supplier name, renders form)
- `src/app/public/supplier/[token]/SupplierSubmitForm.tsx` — `"use client"` interactive form

**Acceptance Criteria:**
- [ ] Page is accessible without authentication
- [ ] Supplier name is displayed (fetched via `GET /api/public/supplier/[token]`)
- [ ] Invalid token shows a 404/error page
- [ ] Form fields: `spend_eur` (number), `ton_km` (number), `waste_kg` (number) — all optional individually but at least one required
- [ ] Submit calls `POST /api/public/supplier/[token]/submit`
- [ ] Success confirmation message shown after submission
- [ ] No sidebar navigation is present on this page

**Dependencies:** T-016, T-023

---

## Phase 6: Tests

> Unit and smoke/integration tests as defined in the test plan. Co-located with their source files.

---

### T-033: Unit Tests for `lib/emissions.ts`

**Priority:** P0 — Required for CI test step

**Description:**
Create `src/lib/emissions.test.ts` covering TC-01 through TC-03 (dashboard totals)
and TC-30 through TC-33 (proxy calculation).

**Outputs:**
- `src/lib/emissions.test.ts`

**Test Cases to implement:**
- TC-01: `calculateDashboardTotals_allScopesHaveRecords_returnsSummedTotals`
- TC-02: `calculateDashboardTotals_noRecords_returnsZeroTotals`
- TC-03: `calculateDashboardTotals_onlySomeScopes_returnsPartialSums`
- TC-30: `calculateProxyEmissions_spendEurProvided_appliesProxyFactor`
- TC-31: `calculateProxyEmissions_spendEurZero_returnsZeroTco2e`
- TC-32: `calculateProxyEmissions_spendEurProvided_setsConfidenceBelowOne`
- TC-33: `PROXY_FACTOR_isNamedConstant_notMagicNumber`

**Acceptance Criteria:**
- [ ] All 7 test cases pass with `npm test`
- [ ] TC-30: `calculateProxyTco2e(1000) === 0.4` (1000 × 0.4 / 1000)
- [ ] TC-33: `PROXY_FACTOR === 0.4` and `PROXY_FACTOR_SOURCE` is a non-empty string

**Dependencies:** T-009, T-010

**Test Cases:** TC-01, TC-02, TC-03, TC-30, TC-31, TC-32, TC-33

---

### T-034: Unit Tests for `lib/pdf.ts`

**Priority:** P0 — Required for CI test step

**Description:**
Create `src/lib/pdf.test.ts` covering TC-71 through TC-73 (PDF data assembly).
Puppeteer is NOT invoked in unit tests — only `buildReportData()` is tested.

**Outputs:**
- `src/lib/pdf.test.ts`

**Test Cases to implement:**
- TC-71: `buildPdfReportData_completeData_includesAllRequiredSections`
- TC-72: `buildPdfReportData_scope3Breakdown_includesMaterialCategoriesOnly`
- TC-73: `buildPdfReportData_assumptionsSection_filtersCorrectly`

**Acceptance Criteria:**
- [ ] TC-71: `buildReportData()` returns object with all five required keys
- [ ] TC-72: `scope3Breakdown` contains only material categories; `hasNonMaterialCategories === true` when non-material exist
- [ ] TC-73: Records A (proxy), B (confidence<1), C (non-empty assumptions) are included; Record D (clean) is excluded

**Dependencies:** T-012

**Test Cases:** TC-71, TC-72, TC-73

---

### T-035: Unit Tests for `lib/audit.ts`

**Priority:** P0 — Required for CI test step

**Description:**
Create `src/lib/audit.test.ts` covering TC-80 (audit event creation).

**Outputs:**
- `src/lib/audit.test.ts`

**Test Cases to implement:**
- TC-80: `createAuditEvent_validInput_returnsEventShape`

**Acceptance Criteria:**
- [ ] `prisma.auditTrailEvent.create` is called with correct `data` shape
- [ ] `timestamp` field is present in the call args
- [ ] Mocked Prisma with `vi.mock('@/lib/prisma')`

**Dependencies:** T-011

**Test Cases:** TC-80

---

### T-036: Smoke Tests for API Route Handlers

**Priority:** P0 — Required for CI test step

**Description:**
Create smoke/integration tests for all API route handlers. These tests mock Prisma
with `vi.mock()` — no real database is used. Tests verify: request parsing, business-logic
delegation, response status codes, and response body shape.

**Outputs (one test file per route group):**
- `src/app/api/dashboard/route.test.ts` — TC-04, TC-05
- `src/app/api/suppliers/route.test.ts` — TC-10, TC-11, TC-12, TC-82
- `src/app/api/suppliers/[id]/route.test.ts` — TC-13
- `src/app/api/suppliers/[id]/token/route.test.ts` — TC-14, TC-15
- `src/app/api/public/supplier/[token]/route.test.ts` — TC-20, TC-20b
- `src/app/api/public/supplier/[token]/submit/route.test.ts` — TC-21, TC-22, TC-23
- `src/app/api/scope1/route.test.ts` — TC-40, TC-41, TC-41b, TC-81
- `src/app/api/scope2/route.test.ts` — TC-42, TC-43
- `src/app/api/scope3/categories/route.test.ts` — TC-50
- `src/app/api/scope3/categories/[id]/route.test.ts` — TC-51
- `src/app/api/scope3/records/route.test.ts` — TC-52
- `src/app/api/methodology/route.test.ts` — TC-60
- `src/app/api/methodology/[scope]/route.test.ts` — TC-61, TC-61b
- `src/app/api/export/pdf/route.test.ts` — TC-70, TC-83

**Approach:**
- Use `vi.mock('@/lib/prisma')` at the top of each test file
- Use `vi.fn()` to control mock return values per test case
- Import the route handler function directly and test it with synthetic `Request` objects
- Mock `@/lib/pdf` in PDF export tests to avoid spawning Puppeteer

**Acceptance Criteria:**
- [ ] All listed test cases (TC-04 through TC-83) pass with `npm test`
- [ ] No real database connections are made during tests
- [ ] Puppeteer is NOT invoked during tests (mocked)
- [ ] All route handlers follow the consistent response shape `{ data: ... }` / `{ error: ... }`

**Dependencies:** T-013 through T-022

**Test Cases:** TC-04, TC-05, TC-10 to TC-15, TC-20 to TC-23, TC-40 to TC-43, TC-50 to TC-52, TC-60, TC-61, TC-61b, TC-70, TC-80 to TC-83

---

## Phase 7: Docker and Infrastructure

> Dockerfile, docker-compose finalisation, and verification that CI workflows pass.
> Existing workflows (pr-validation.yml, ci.yml, release.yml) are already in place.

---

### T-037: Create Dockerfile

**Priority:** P0 — Required for `docker compose up` (NFR-003)

**Description:**
Create `src/Dockerfile` for a production-ready Node.js image that:
1. Installs dependencies
2. Builds the Next.js application
3. Runs `prisma migrate deploy && npm run seed && node server.js` as the entrypoint

**Outputs:**
- `src/Dockerfile`

**Key requirements (per ADR-003, ADR-004):**
- Base image: `node:20-slim` with `chromium` installed via `apt-get` (for Puppeteer)
- Set `ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser` (or equivalent)
- Set Puppeteer `--no-sandbox` args (already handled in `lib/pdf.ts`)
- Multi-stage build: `builder` stage (installs deps, runs `next build`), `runner` stage (copies built output)
- Entrypoint: `sh -c "npx prisma migrate deploy && npm run seed && node server.js"`
  (or `next start` equivalent for standalone output)
- `DATABASE_URL` environment variable expected at runtime

**Acceptance Criteria:**
- [ ] `docker build -t green-ledger ./src` completes without errors
- [ ] `docker compose up` from repo root starts the app at `http://localhost:3000`
- [ ] App is accessible and seed data is present after first `docker compose up`
- [ ] Container restart does not re-seed or duplicate data (idempotent seed guard)
- [ ] PDF generation works inside Docker (Puppeteer/Chromium available)

**Dependencies:** T-001 through T-007

**Notes:**
- Use `next.config.mjs` with `output: 'standalone'` for optimised Docker image
- The `docker-compose.yml` at repo root already has the correct service structure (maps port 3000, mounts prisma volume)
- Add `ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true` and use the system Chromium from `apt-get`

---

### T-038: Add `package.json` Version and Release Config

**Priority:** P1 — Required for CI versioning workflow

**Description:**
Ensure `src/package.json` has a `version` field and that `commit-and-tag-version`
can bump it. The CI workflow (`ci.yml`) already references `src/package.json` as the
`packageFiles` and `bumpFiles` target.

**Outputs:**
- `src/package.json` — `"version": "0.1.0"`
- `.versionrc` or equivalent config at `src/` level (optional, if defaults not sufficient)

**Acceptance Criteria:**
- [ ] `src/package.json` has a `version` field (e.g., `"0.1.0"`)
- [ ] `commit-and-tag-version --packageFiles src/package.json --bumpFiles src/package.json` runs without error
- [ ] The existing `ci.yml` workflow can bump the version on merge to `main`

**Dependencies:** T-001

**Notes:**
- This is a minimal task; `create-next-app` sets `"version": "0.1.0"` by default
- Verify the version field is present and not removed during setup

---

## Implementation Order

The following sequence is recommended for a single developer implementing the MVP top-down:

| Order | Task | Reason |
|-------|------|--------|
| 1 | T-001 | Everything depends on the Next.js project skeleton |
| 2 | T-002 | ESLint required before any code is written (CI enforced) |
| 3 | T-003 | Vitest must be configured before writing any tests |
| 4 | T-005 | Prisma schema defines all types used by lib/ and API routes |
| 5 | T-006 | Migration generates `@prisma/client` types |
| 6 | T-008 | Prisma singleton needed by all other lib/ modules |
| 7 | T-009 | Constants needed by emissions.ts and pdf.ts |
| 8 | T-010 | Emissions helpers needed by dashboard API and submit route |
| 9 | T-011 | Audit helper needed by all mutation routes |
| 10 | T-007 | Seed script can now reference Prisma types; enables local dev |
| 11 | T-012 | PDF lib depends on all other lib/ modules |
| 12 | T-013 | Dashboard API (simple, first API route to test the stack) |
| 13 | T-014 | Supplier CRUD (foundational for token and public form) |
| 14 | T-015 | Token generation (depends on T-014) |
| 15 | T-016 | Public form submission (depends on T-014, T-010, T-011) |
| 16 | T-017 | Scope 1 API |
| 17 | T-018 | Scope 2 API |
| 18 | T-019 | Scope 3 categories API |
| 19 | T-020 | Scope 3 records API |
| 20 | T-021 | Methodology API |
| 21 | T-022 | PDF export API (depends on T-012) |
| 22 | T-033 | Unit tests for emissions.ts (can be written alongside T-010) |
| 23 | T-034 | Unit tests for pdf.ts (can be written alongside T-012) |
| 24 | T-035 | Unit tests for audit.ts (can be written alongside T-011) |
| 25 | T-036 | Smoke tests for all API routes (after all routes are implemented) |
| 26 | T-023 | Root layout + sidebar (can be done in parallel with API routes) |
| 27 | T-024 | Root redirect (trivial, do with T-023) |
| 28 | T-025 | Dashboard page (depends on T-013, T-023) |
| 29 | T-026 | Suppliers page (depends on T-014, T-015, T-023) |
| 30 | T-027 | Scope 1 page |
| 31 | T-028 | Scope 2 page |
| 32 | T-029 | Scope 3 page |
| 33 | T-030 | Methodology page |
| 34 | T-031 | Export page (depends on T-022) |
| 35 | T-032 | Public supplier form page (depends on T-016) |
| 36 | T-037 | Dockerfile (after all src/ code is working) |
| 37 | T-038 | Version field check (trivial, verify during T-001) |
| 38 | T-004 | Husky hooks (set up early but verify at end) |

**Parallelisation opportunities (if multiple developers):**
- T-013 through T-022 (API routes) can be implemented in parallel after Phase 2 + 3 are complete
- T-025 through T-032 (UI pages) can be implemented in parallel with API routes
- T-033 through T-035 (unit tests) can be written alongside their respective lib/ modules

---

## Acceptance Criteria Summary

All tasks are complete when:

- [ ] `cd src && npm run dev` starts without errors; app accessible at `http://localhost:3000`
- [ ] `cd src && npm run build` completes without TypeScript or build errors
- [ ] `cd src && npm test` — all Vitest tests pass (TC-01 through TC-83 as applicable)
- [ ] `cd src && npm run lint` — zero ESLint errors
- [ ] `cd src && npm run type-check` — zero TypeScript errors
- [ ] `docker compose up` from repo root starts the app with seed data at `http://localhost:3000`
- [ ] Complete 5-minute demo flow works: dashboard → suppliers → public form → Scope 3 record created → PDF exported
- [ ] PR Validation GitHub Actions workflow passes (lint + type-check + test + build + markdownlint)

---

## Open Questions

No blocking open questions remain. All architectural decisions have been resolved in ADR-001
through ADR-005. The following notes are informational:

1. **`ts-node` vs `tsx` for seed script:** ADR-004 references `ts-node`; if TypeScript
   import issues arise, consider using `tsx` (`npx tsx prisma/seed.ts`) instead.

2. **Puppeteer Chromium in CI:** The PR Validation workflow does not run the PDF export
   route with a real Puppeteer instance — it uses mocked tests. If a future CI step
   requires real PDF generation, the `ubuntu-latest` runner will need Chromium installed.

3. **Next.js standalone output:** Using `output: 'standalone'` in `next.config.mjs`
   significantly reduces the Docker image size. The Dockerfile should use this mode and
   copy the `.next/standalone` and `.next/static` directories accordingly.
