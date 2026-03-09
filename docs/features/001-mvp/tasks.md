# Tasks: GreenLedger MVP

## Overview

This document defines the ordered development tasks for building the GreenLedger MVP from scratch. The `src/` directory is currently **empty** — all source code must be created. Tasks are organised into 7 phases ordered by dependency.

**Reference documents:**
- Specification: `docs/features/001-mvp/specification.md`
- Architecture: `docs/features/001-mvp/architecture.md`
- Test plan: `docs/features/001-mvp/test-plan.md`

**Key constants (from ADR-003 and architecture):**
- `DEMO_COMPANY_ID = "demo-company-001"` — fixed Company primary key
- `PROXY_FACTOR_SPEND = 0.233` tCO₂e/EUR (demo placeholder, JSDoc warning required)
- `PROXY_FACTOR_TON_KM`, `PROXY_FACTOR_WASTE_KG` — additional proxy constants
- `PROXY_CONFIDENCE = 0.4` — confidence score for all proxy-based records
- `REPORTING_YEAR` — from env var (default `2024`), stored in `Company.reportingYear`

**Bootstrap command:**

```bash
npx create-next-app@latest src --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*"
```

---

## Phase 1: Project Bootstrap

### T-001: Scaffold Next.js Project and Install All Dependencies

**Priority:** High

**Description:**
Bootstrap the entire Next.js application inside `src/` using `create-next-app`, then add all required additional dependencies (Prisma, `@react-pdf/renderer`, Vitest, Husky, Prettier). This is the first task and all subsequent work depends on it.

**Acceptance Criteria:**
- [ ] `src/package.json` exists with `"name": "green-ledger"` and all required dependencies listed below
- [ ] `create-next-app` run with flags: `--typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*"`
- [ ] Additional runtime deps installed: `prisma`, `@prisma/client`, `@react-pdf/renderer`
- [ ] Additional dev deps installed: `vitest`, `@vitejs/plugin-react`, `vite-tsconfig-paths`, `@vitest/coverage-v8`, `prettier`, `eslint-config-prettier`, `husky`, `lint-staged`, `tsx`
- [ ] `src/vitest.config.ts` created with `environment: "node"`, `resolve.alias` for `@/` path, and `vite-tsconfig-paths` plugin
- [ ] `package.json` scripts include: `"test": "vitest run"`, `"test:watch": "vitest"`, `"test:coverage": "vitest run --coverage"`, `"db:generate": "prisma generate"`, `"db:migrate": "prisma migrate dev"`, `"db:seed": "prisma db seed"`
- [ ] `src/next.config.mjs` sets `serverExternalPackages: ["@react-pdf/renderer"]` (required for PDF generation in route handlers)
- [ ] `src/tsconfig.json` has `"strict": true` enabled
- [ ] `src/.env.example` contains `DATABASE_URL="file:./dev.db"` and `# REPORTING_YEAR=2024`
- [ ] Husky pre-commit hook runs `lint-staged` (lint + type-check on staged files)
- [ ] `.gitignore` inside `src/` covers: `node_modules/`, `.next/`, `*.db`, `.env`, `prisma/migrations/` dev artefacts
- [ ] `npm run build` succeeds (even with placeholder content)

**Files to Create:**
- `src/package.json`
- `src/next.config.mjs`
- `src/tsconfig.json`
- `src/eslint.config.mjs` (or `.eslintrc.json`)
- `src/tailwind.config.ts`
- `src/postcss.config.mjs`
- `src/vitest.config.ts`
- `src/.env.example`
- `src/.gitignore`
- `src/.husky/pre-commit`

**Dependencies:** None

**Notes:**
- `create-next-app` already generates `app/`, `public/`, and basic config files — do not duplicate them
- `tsx` is used for executing TypeScript scripts (e.g., Prisma seed) without a separate compile step
- Vitest `environment` must be `"node"` (not `"jsdom"`) because API route tests run in a Node.js context; no browser DOM is needed
- `serverExternalPackages` in `next.config.mjs` is the Next.js 14+ replacement for the deprecated `experimental.serverComponentsExternalPackages`

---

### T-002: Define Prisma Schema

**Priority:** High

**Description:**
Create the full Prisma schema at `src/prisma/schema.prisma` with all 8 domain models from the specification. Generate the Prisma client and create the initial migration. The schema must be SQLite-compatible in dev but Postgres-migratable in production (no SQLite-specific features).

**Acceptance Criteria:**
- [ ] `schema.prisma` defines `datasource db` using `env("DATABASE_URL")` with provider `"sqlite"`
- [ ] `schema.prisma` defines `generator client` for `@prisma/client`
- [ ] `Company` model: `id String @id @default(uuid())`, `name String`, `country String @default("DE")`, `reportingYear Int`, `orgBoundary OrgBoundary`
- [ ] `Supplier` model: all fields from spec, `publicFormToken String @unique`, `status SupplierStatus`, `companyId String` (FK), relation to `Company`
- [ ] `Scope1Record` model: all fields from spec, `dataSource Scope12DataSource`, `companyId String` (FK)
- [ ] `Scope2Record` model: mirrors `Scope1Record` structure
- [ ] `Scope3Category` model: `id`, `code String @unique`, `name String`, `material Boolean @default(false)`, `materialityReason String?`
- [ ] `Scope3Record` model: all fields from spec, `calculationMethod Scope3CalculationMethod`, `dataSource Scope3DataSource`, `confidence Float`, `activityDataJson Json?`, FKs to `Company`, `Supplier?`, `Scope3Category`
- [ ] `MethodologyNote` model: all fields, `scope NoteScope`, `@@unique([companyId, scope])`
- [ ] `AuditTrailEvent` model: all fields, `entityType AuditEntityType`, `action AuditAction`, `actor String`
- [ ] All required enums defined: `OrgBoundary`, `SupplierStatus`, `Scope12DataSource`, `Scope3CalculationMethod`, `Scope3DataSource`, `NoteScope`, `AuditEntityType`, `AuditAction`
- [ ] `npx prisma generate` succeeds and creates `node_modules/@prisma/client`
- [ ] `npx prisma migrate dev --name init` creates `src/prisma/migrations/` directory with initial migration SQL

**Files to Create:**
- `src/prisma/schema.prisma`

**Dependencies:** T-001

**Notes:**
- Use `String @id @default(uuid())` for **all** primary keys
- `activityDataJson Json?` maps to `TEXT` in SQLite and `JSONB` in Postgres — Prisma handles this transparently; no SQLite-specific types required
- Enum definitions: `OrgBoundary { operational_control financial_control equity_share }`, `SupplierStatus { active inactive }`, `Scope12DataSource { manual csv_import }`, `Scope3CalculationMethod { spend_based activity_based supplier_specific }`, `Scope3DataSource { supplier_form csv_import proxy }`, `NoteScope { scope_1 scope_2 scope_3 }`, `AuditEntityType { supplier scope1 scope2 scope3 methodology export }`, `AuditAction { created updated deleted submitted exported }`
- Run Prisma commands from inside `src/`: `cd src && npx prisma migrate dev --name init`

---

### T-003: Create Database Seed Script

**Priority:** High

**Description:**
Create `src/prisma/seed.ts` that populates the database with a rich set of demo data for a compelling 5-minute demo. The script must be fully idempotent (safe to re-run without duplicating data). Configure `package.json` to run it with `npx prisma db seed`.

**Acceptance Criteria:**
- [ ] `package.json` includes `"prisma": { "seed": "tsx prisma/seed.ts" }`
- [ ] Seed creates `Company` with `id = "demo-company-001"`, `name = "Demo GmbH"`, `country = "DE"`, `reportingYear` from `process.env.REPORTING_YEAR ?? 2024`, `orgBoundary = "operational_control"`
- [ ] Seed creates all 15 ESRS Scope 3 categories (C1–C15) with standard names using `upsert` on `code`
- [ ] C1, C3, C4 are pre-marked `material = true` with sample `materialityReason` strings
- [ ] Seed creates at least 2 demo suppliers (e.g., `"Acme Logistics GmbH"`, `"BauStoff Müller AG"`) each with `publicFormToken = crypto.randomUUID()` and `status = "active"`
- [ ] Seed creates at least 2 `Scope1Record` entries for `periodYear = reportingYear`
- [ ] Seed creates at least 2 `Scope2Record` entries for `periodYear = reportingYear`
- [ ] Seed creates at least 3 `Scope3Record` entries linked to material categories; at least one linked to a demo supplier, at least one with `dataSource = "supplier_form"` and `confidence = 0.4`
- [ ] Seed creates one `MethodologyNote` per scope (`scope_1`, `scope_2`, `scope_3`) with demo placeholder text
- [ ] All seed operations use `upsert` or equivalent idempotent writes — running the seed twice produces no duplicate rows
- [ ] `npx prisma db seed` completes successfully and the dashboard shows non-zero KPIs

**Files to Create:**
- `src/prisma/seed.ts`

**Files to Modify:**
- `src/package.json` — add `"prisma": { "seed": "tsx prisma/seed.ts" }`

**Dependencies:** T-002

**Notes:**
- Full 15-category name list: C1 Purchased goods & services, C2 Capital goods, C3 Fuel- and energy-related activities, C4 Upstream transportation & distribution, C5 Waste generated in operations, C6 Business travel, C7 Employee commuting, C8 Upstream leased assets, C9 Downstream transportation & distribution, C10 Processing of sold products, C11 Use of sold products, C12 End-of-life treatment of sold products, C13 Downstream leased assets, C14 Franchises, C15 Investments
- The seed must use `prisma.company.upsert({ where: { id: "demo-company-001" }, ... })` to be idempotent
- `crypto.randomUUID()` is available in Node.js 14.17+ without any import

---

## Phase 2: Core Infrastructure

### T-004: Implement Prisma Client Singleton and Application Constants

**Priority:** High

**Description:**
Create `src/lib/prisma.ts` (Prisma client singleton using Next.js hot-reload-safe pattern) and `src/lib/constants.ts` (all application-wide constants including `DEMO_COMPANY_ID`, proxy factors, and confidence values).

**Acceptance Criteria:**
- [ ] `src/lib/prisma.ts` exports `prisma` as a singleton: `globalThis.__prisma ??= new PrismaClient()` with correct TypeScript type declaration for `globalThis.__prisma`
- [ ] `src/lib/constants.ts` exports `DEMO_COMPANY_ID = "demo-company-001"` as `const`
- [ ] `constants.ts` exports `PROXY_FACTOR_SPEND = 0.233` with JSDoc: `@remarks DEMO PLACEHOLDER — not an authoritative emission factor. Do not use in production.`
- [ ] `constants.ts` exports `PROXY_FACTOR_TON_KM` (a reasonable demo value, e.g. `0.0001`) with same JSDoc warning
- [ ] `constants.ts` exports `PROXY_FACTOR_WASTE_KG` (a reasonable demo value, e.g. `0.0005`) with same JSDoc warning
- [ ] `constants.ts` exports `PROXY_CONFIDENCE = 0.4` (confidence score applied to all proxy-based records)
- [ ] `constants.ts` exports `PROXY_ASSUMPTIONS_SPEND: string` — a pre-built assumptions string referencing `PROXY_FACTOR_SPEND` and noting it is a demo placeholder
- [ ] `constants.ts` exports `SCOPE3_CATEGORIES` as a readonly array of `{ code: string; name: string }` for the 15 ESRS categories (useful in seed script and tests)

**Files to Create:**
- `src/lib/prisma.ts`
- `src/lib/constants.ts`

**Dependencies:** T-001, T-002

---

### T-005: Implement Utility Functions, Audit Helper, and Proxy Utility

**Priority:** High

**Description:**
Create three core library modules: `utils.ts` (formatting helpers), `audit.ts` (audit trail helper), and `proxy.ts` (proxy calculation pure functions). These are tested extensively by the unit test suite (TC-25–TC-30, TC-44).

**Acceptance Criteria:**
- [ ] `src/lib/utils.ts` exports `formatTco2e(value: number): string` — returns tCO₂e formatted to 2 decimal places (e.g. `"1.23"`)
- [ ] `src/lib/utils.ts` exports `cn(...classes: (string | undefined | false | null)[]): string` — Tailwind class merge utility (can use `clsx` or a minimal custom implementation)
- [ ] `src/lib/audit.ts` exports `createAuditEvent(prisma: PrismaClient, params: CreateAuditEventParams): Promise<AuditTrailEvent>` — inserts one `AuditTrailEvent` row
- [ ] `CreateAuditEventParams` type exported from `audit.ts`: `{ companyId: string; entityType: AuditEntityType; entityId: string; action: AuditAction; actor: string; comment?: string }`
- [ ] `src/lib/proxy.ts` exports `calculateProxyTco2e(input: { spend_eur?: number; ton_km?: number; waste_kg?: number }): number` — returns computed tCO₂e using appropriate proxy factor (priority order: `spend_eur` → `ton_km` → `waste_kg`)
- [ ] `proxy.ts` exports `buildProxyAssumptions(input: { spend_eur?: number; ton_km?: number; waste_kg?: number }): string` — returns a string documenting the proxy factor value and its placeholder status; must contain `"0.233"` when `spend_eur` is used
- [ ] `proxy.ts` exports `buildActivityDataJson(input: { spend_eur?: number; ton_km?: number; waste_kg?: number }): Record<string, number>` — returns only the non-undefined fields
- [ ] `proxy.ts` functions are pure (no Prisma calls, no side effects) — enables unit testing without mocking

**Files to Create:**
- `src/lib/utils.ts`
- `src/lib/audit.ts`
- `src/lib/proxy.ts`

**Dependencies:** T-004

**Notes:**
- `calculateProxyTco2e` must handle edge case: if all inputs are `0`, return `0`
- `buildProxyAssumptions` output is stored in `Scope3Record.assumptions` — must be human-readable for auditors
- `clsx` can be installed as an optional dependency for `cn()`; alternatively implement it inline with a `filter + join` one-liner

---

### T-006: Create Root Layout, Global CSS, and Root Redirect

**Priority:** High

**Description:**
Create the root Next.js app shell: `src/app/layout.tsx` (HTML wrapper), `src/app/globals.css` (Tailwind directives), and `src/app/page.tsx` (redirects to `/dashboard`).

**Acceptance Criteria:**
- [ ] `src/app/layout.tsx` renders `<html lang="en">` and `<body>` with a basic sans-serif font (`Inter` or Next.js default font)
- [ ] `src/app/globals.css` contains Tailwind directives: `@tailwind base; @tailwind components; @tailwind utilities;` and any CSS custom properties
- [ ] `src/app/page.tsx` calls `redirect("/dashboard")` from `next/navigation` and is exported as a default page
- [ ] `npm run build` succeeds with these files in place

**Files to Create:**
- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/app/page.tsx`

**Dependencies:** T-001

---

### T-007: Implement App Group Layout, Sidebar Navigation, and UI Primitive Components

**Priority:** High

**Description:**
Create the `(app)` route group layout with a persistent sidebar navigation, the `PageHeader` component, and all reusable UI primitive components (`Button`, `Card`, `Input`, `Select`, `Textarea`, `Badge`, `Table`, `Spinner`). All subsequent management UI pages depend on these components.

**Acceptance Criteria:**
- [ ] `src/app/(app)/layout.tsx` renders a two-column layout: `Sidebar` on the left, `<main>` content area on the right; wraps all `(app)` pages
- [ ] `src/components/layout/Sidebar.tsx` uses `"use client"` and `usePathname()` to apply an "active" style to the current route link
- [ ] Sidebar contains nav links for all 7 management pages: Dashboard (`/dashboard`), Suppliers (`/suppliers`), Scope 1 (`/scope-1`), Scope 2 (`/scope-2`), Scope 3 (`/scope-3`), Methodology (`/methodology`), Export (`/export`)
- [ ] `src/components/layout/PageHeader.tsx` renders a `<h1>` with consistent styling, accepts a `title: string` prop
- [ ] UI primitives created and exported from `src/components/ui/`:
  - `Button.tsx` — accepts `variant` (`primary` | `secondary` | `danger`), `size`, `disabled`, `onClick`, `type` props
  - `Card.tsx` — wrapper with padding and rounded border
  - `Input.tsx` — styled `<input>` with label and error state
  - `Select.tsx` — styled `<select>` with options prop
  - `Textarea.tsx` — styled `<textarea>`
  - `Badge.tsx` — small coloured label, accepts `variant` prop
  - `Table.tsx` — styled `<table>` with `thead`/`tbody` convention
  - `Spinner.tsx` — loading spinner SVG or CSS animation
- [ ] All UI components use Tailwind classes only (no external CSS-in-JS)
- [ ] `npm run build` succeeds after this task

**Files to Create:**
- `src/app/(app)/layout.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/components/layout/PageHeader.tsx`
- `src/components/ui/Button.tsx`
- `src/components/ui/Card.tsx`
- `src/components/ui/Input.tsx`
- `src/components/ui/Select.tsx`
- `src/components/ui/Textarea.tsx`
- `src/components/ui/Badge.tsx`
- `src/components/ui/Table.tsx`
- `src/components/ui/Spinner.tsx`

**Dependencies:** T-006

---

## Phase 3: API Routes

### T-008: Implement Dashboard API Route

**Priority:** High

**Description:**
Create `GET /api/dashboard` that aggregates Scope 1, Scope 2, and Scope 3 emission totals for the company's configured reporting year.

**Acceptance Criteria:**
- [ ] `GET /api/dashboard` returns HTTP 200 with `{ scope1: number, scope2: number, scope3: number, total: number, reportingYear: number }`
- [ ] Totals computed as `SUM(valueTco2e)` for records where `companyId = DEMO_COMPANY_ID` AND `periodYear = company.reportingYear`
- [ ] Returns `{ scope1: 0, scope2: 0, scope3: 0, total: 0 }` (not `null`/`undefined`/error) when no records exist
- [ ] `total` equals the arithmetic sum of `scope1 + scope2 + scope3`
- [ ] `reportingYear` field comes from `Company.reportingYear` in the database
- [ ] Returns HTTP 500 with `{ error: string }` on unexpected database errors
- [ ] File exports `export const dynamic = "force-dynamic"`

**Files to Create:**
- `src/app/api/dashboard/route.ts`

**Dependencies:** T-004, T-005

---

### T-009: Implement Suppliers API Routes

**Priority:** High

**Description:**
Create all Supplier CRUD route handlers (`GET`, `POST`, `PUT`, `DELETE`) and the `refresh-token` endpoint.

**Acceptance Criteria:**
- [ ] `GET /api/suppliers` returns HTTP 200 with `Supplier[]` for `DEMO_COMPANY_ID`
- [ ] `POST /api/suppliers` creates supplier with `companyId = DEMO_COMPANY_ID`, auto-generated `publicFormToken = crypto.randomUUID()`; returns HTTP 201 with created supplier
- [ ] `POST /api/suppliers` returns HTTP 400 with `{ error: string }` if any of `name`, `country`, `sector`, `contactEmail` is missing
- [ ] `GET /api/suppliers/[id]` returns supplier or HTTP 404
- [ ] `PUT /api/suppliers/[id]` updates `name?`, `country?`, `sector?`, `contactEmail?`, `status?`; returns HTTP 200 or HTTP 404
- [ ] `DELETE /api/suppliers/[id]` deletes supplier; returns `{ success: true }` on HTTP 200 or HTTP 404 if not found
- [ ] `POST /api/suppliers/[id]/refresh-token` updates `publicFormToken` with `crypto.randomUUID()`; returns `{ publicFormToken: string }` on HTTP 200
- [ ] All write operations call `createAuditEvent()` with `entityType: "supplier"`, `actor: "user"`, and the appropriate `action` (`"created"`, `"updated"`, `"deleted"`)

**Files to Create:**
- `src/app/api/suppliers/route.ts`
- `src/app/api/suppliers/[id]/route.ts`
- `src/app/api/suppliers/[id]/refresh-token/route.ts`

**Dependencies:** T-004, T-005

---

### T-010: Implement Scope 1 API Routes

**Priority:** High

**Description:**
Create Scope 1 route handlers: list all records, create a new record, and delete a record.

**Acceptance Criteria:**
- [ ] `GET /api/scope1` returns HTTP 200 with `Scope1Record[]` for `DEMO_COMPANY_ID`, ordered by `createdAt desc`
- [ ] `POST /api/scope1` creates record with `companyId = DEMO_COMPANY_ID`; returns HTTP 201 with created record
- [ ] `POST /api/scope1` returns HTTP 400 if any of `periodYear`, `valueTco2e`, `calculationMethod`, `emissionFactorsSource`, `dataSource` is missing
- [ ] `DELETE /api/scope1/[id]` returns `{ success: true }` on HTTP 200 or HTTP 404 if not found
- [ ] All write operations call `createAuditEvent()` with `entityType: "scope1"`, `actor: "user"`

**Files to Create:**
- `src/app/api/scope1/route.ts`
- `src/app/api/scope1/[id]/route.ts`

**Dependencies:** T-004, T-005

---

### T-011: Implement Scope 2 API Routes

**Priority:** High

**Description:**
Create Scope 2 route handlers (mirrors Scope 1 structure exactly).

**Acceptance Criteria:**
- [ ] `GET /api/scope2` returns HTTP 200 with `Scope2Record[]` for `DEMO_COMPANY_ID`, ordered by `createdAt desc`
- [ ] `POST /api/scope2` creates record; returns HTTP 201 with created record
- [ ] `POST /api/scope2` returns HTTP 400 if any required field is missing
- [ ] `DELETE /api/scope2/[id]` returns `{ success: true }` on HTTP 200 or HTTP 404
- [ ] All write operations call `createAuditEvent()` with `entityType: "scope2"`, `actor: "user"`

**Files to Create:**
- `src/app/api/scope2/route.ts`
- `src/app/api/scope2/[id]/route.ts`

**Dependencies:** T-004, T-005

---

### T-012: Implement Scope 3 API Routes (Categories and Records)

**Priority:** High

**Description:**
Create all Scope 3 route handlers: category listing, category materiality update, and full record CRUD.

**Acceptance Criteria:**
- [ ] `GET /api/scope3/categories` returns HTTP 200 with all `Scope3Category[]` (all 15 seeded categories)
- [ ] `PUT /api/scope3/categories/[id]` updates `material` and `materialityReason`; returns HTTP 200 with updated category or HTTP 404
- [ ] `GET /api/scope3/records` returns HTTP 200 with `Scope3Record[]` for `DEMO_COMPANY_ID`, including `supplier` and `category` relations (via Prisma `include`)
- [ ] `POST /api/scope3/records` creates record with `companyId = DEMO_COMPANY_ID`; returns HTTP 201
- [ ] `POST /api/scope3/records` returns HTTP 400 if any of `categoryId`, `periodYear`, `valueTco2e`, `calculationMethod`, `emissionFactorSource`, `dataSource`, `confidence` is missing
- [ ] `DELETE /api/scope3/records/[id]` returns `{ success: true }` on HTTP 200 or HTTP 404
- [ ] All write operations call `createAuditEvent()` with `entityType: "scope3"`, `actor: "user"`

**Files to Create:**
- `src/app/api/scope3/categories/route.ts`
- `src/app/api/scope3/categories/[id]/route.ts`
- `src/app/api/scope3/records/route.ts`
- `src/app/api/scope3/records/[id]/route.ts`

**Dependencies:** T-004, T-005

---

### T-013: Implement Methodology API Routes

**Priority:** High

**Description:**
Create route handlers for fetching all methodology notes and upserting a note for a specific scope.

**Acceptance Criteria:**
- [ ] `GET /api/methodology` returns HTTP 200 with `MethodologyNote[]` for `DEMO_COMPANY_ID`
- [ ] `PUT /api/methodology/[scope]` upserts the note for the given scope using Prisma `upsert` on `@@unique([companyId, scope])`; returns HTTP 200 with the note
- [ ] `PUT /api/methodology/[scope]` returns HTTP 400 if `text` is absent from the request body
- [ ] `PUT /api/methodology/[scope]` returns HTTP 400 if `scope` is not one of `scope_1`, `scope_2`, `scope_3`
- [ ] Write operations call `createAuditEvent()` with `entityType: "methodology"`, `actor: "user"`, `action: "updated"`

**Files to Create:**
- `src/app/api/methodology/route.ts`
- `src/app/api/methodology/[scope]/route.ts`

**Dependencies:** T-004, T-005

---

## Phase 4: UI Pages

### T-014: Implement Dashboard Page

**Priority:** High

**Description:**
Create the dashboard page with four KPI cards displaying the current emission totals for all three scopes and the aggregate.

**Acceptance Criteria:**
- [ ] Page renders at `/dashboard` within the `(app)` layout
- [ ] Four `KpiCard` components displayed: "Scope 1", "Scope 2", "Scope 3", "Total Emissions"
- [ ] Values fetched server-side from `GET /api/dashboard` (server component fetch or direct Prisma call)
- [ ] Each card shows the tCO₂e value formatted with `formatTco2e()` and the unit label `"tCO₂e"`
- [ ] Shows `"0.00 tCO₂e"` (not blank/error/`NaN`) when no records exist
- [ ] Reporting year displayed on the page (e.g. `"Reporting year: 2024"`)
- [ ] `export const dynamic = "force-dynamic"` present in `page.tsx`

**Files to Create:**
- `src/app/(app)/dashboard/page.tsx`
- `src/components/dashboard/KpiCard.tsx`

**Dependencies:** T-007, T-008

---

### T-015: Implement Suppliers Page

**Priority:** High

**Description:**
Create the full supplier management page: table with all suppliers, Add/Edit modal form, and per-row token actions (Copy Link, Refresh Token).

**Acceptance Criteria:**
- [ ] Page renders at `/suppliers`; initial data fetched server-side
- [ ] Table columns: Name, Country, Sector, Email, Status, Actions
- [ ] "Add Supplier" button opens a modal/inline form with fields: Name (required), Country (required), Sector (required), Contact Email (required)
- [ ] On successful create (`POST /api/suppliers`), table refreshes without full page reload
- [ ] Each row has: **Edit** (opens pre-populated form, submits `PUT /api/suppliers/[id]`), **Delete** (calls `DELETE /api/suppliers/[id]` after confirmation), **Copy Link** (copies `/public/supplier/[token]` URL to clipboard), **Refresh Token** (calls `POST /api/suppliers/[id]/refresh-token`)
- [ ] "Copy Link" shows a transient success indicator (e.g. tooltip "Copied!")
- [ ] "Refresh Token" updates the displayed token in the table row without page reload
- [ ] Inline validation: required fields highlighted if blank on submit
- [ ] Empty state displayed with placeholder text when no suppliers exist
- [ ] Status badge shown with appropriate colour (`active` = green, `inactive` = grey)
- [ ] `export const dynamic = "force-dynamic"` present in `page.tsx`

**Files to Create:**
- `src/app/(app)/suppliers/page.tsx`
- `src/components/suppliers/SupplierTable.tsx`
- `src/components/suppliers/SupplierForm.tsx`
- `src/components/suppliers/SupplierTokenActions.tsx`

**Dependencies:** T-007, T-009

**Notes:**
- `SupplierTokenActions.tsx` requires `"use client"` for the Clipboard API (`navigator.clipboard.writeText()`)
- `SupplierTable.tsx` and `SupplierForm.tsx` require `"use client"` for interactive state management

---

### T-016: Implement Scope 1 Page

**Priority:** High

**Description:**
Create the Scope 1 data entry and listing page.

**Acceptance Criteria:**
- [ ] Page renders at `/scope-1`
- [ ] Table of existing records with columns: Period Year, Value (tCO₂e), Calculation Method, EF Source, Data Source, Created At, Delete action
- [ ] "Add Record" form with fields: Period Year (number), Value tCO₂e (number), Calculation Method (text), Emission Factors Source (text), Data Source (dropdown: `manual` / `csv_import`), Assumptions (optional textarea)
- [ ] On submit, calls `POST /api/scope1` and refreshes the table
- [ ] "Delete" button calls `DELETE /api/scope1/[id]` and removes row from table
- [ ] Required fields validated on submit; inline error messages shown
- [ ] Empty state shown when no records exist
- [ ] `export const dynamic = "force-dynamic"` in `page.tsx`

**Files to Create:**
- `src/app/(app)/scope-1/page.tsx`
- `src/components/scope1/Scope1RecordTable.tsx`
- `src/components/scope1/Scope1RecordForm.tsx`

**Dependencies:** T-007, T-010

---

### T-017: Implement Scope 2 Page

**Priority:** High

**Description:**
Create the Scope 2 data entry and listing page (mirrors Scope 1 structure).

**Acceptance Criteria:**
- [ ] Page renders at `/scope-2`
- [ ] Same table columns, form fields, validation, and empty state as Scope 1
- [ ] Calls `/api/scope2` endpoints for all operations
- [ ] `export const dynamic = "force-dynamic"` in `page.tsx`

**Files to Create:**
- `src/app/(app)/scope-2/page.tsx`
- `src/components/scope2/Scope2RecordTable.tsx`
- `src/components/scope2/Scope2RecordForm.tsx`

**Dependencies:** T-007, T-011

---

### T-018: Implement Scope 3 Page (Categories and Records)

**Priority:** High

**Description:**
Create the Scope 3 page with two views: (1) category materiality management and (2) Scope 3 records listing with add/delete.

**Acceptance Criteria:**
- [ ] Page renders at `/scope-3` with tab navigation or two clearly labelled sections: "Categories" and "Records"
- [ ] **Categories section:** shows all 15 categories with Name, Code, Material (toggle checkbox or toggle button), Materiality Reason (inline editable field), Save button per row
  - Saving calls `PUT /api/scope3/categories/[id]` with `{ material, materialityReason }`
- [ ] **Records section:** table with columns: Category (code + name), Supplier (name or "—"), Period Year, Value (tCO₂e), Method, Data Source, Confidence, Created At, Delete
- [ ] "Add Record" form with fields: Category (dropdown of all 15 categories), Supplier (optional dropdown of suppliers), Period Year, Value (tCO₂e), Calculation Method (dropdown: `spend_based` / `activity_based` / `supplier_specific`), Emission Factor Source, Data Source (dropdown: `supplier_form` / `csv_import` / `proxy`), Assumptions (optional), Confidence (number input 0–1)
- [ ] On submit, calls `POST /api/scope3/records` and refreshes the records table
- [ ] "Delete" calls `DELETE /api/scope3/records/[id]`
- [ ] Empty state for records section when no records exist
- [ ] `export const dynamic = "force-dynamic"` in `page.tsx`

**Files to Create:**
- `src/app/(app)/scope-3/page.tsx`
- `src/components/scope3/CategoryList.tsx`
- `src/components/scope3/Scope3RecordTable.tsx`
- `src/components/scope3/Scope3RecordForm.tsx`

**Dependencies:** T-007, T-012

---

### T-019: Implement Methodology Page

**Priority:** Medium

**Description:**
Create the methodology notes editor page with one text area per scope.

**Acceptance Criteria:**
- [ ] Page renders at `/methodology` with three sections labelled "Scope 1 Methodology", "Scope 2 Methodology", "Scope 3 Methodology"
- [ ] Each section has a `<textarea>` pre-populated with the existing note text from `GET /api/methodology`
- [ ] Each section has a "Save" button that calls `PUT /api/methodology/[scope]` with `{ text }`
- [ ] After saving, a success message or timestamp update is shown (e.g. "Saved — last updated 14 Jul 2025 10:32")
- [ ] `updatedAt` timestamp displayed below each section
- [ ] `export const dynamic = "force-dynamic"` in `page.tsx`

**Files to Create:**
- `src/app/(app)/methodology/page.tsx`
- `src/components/methodology/MethodologyEditor.tsx`

**Dependencies:** T-007, T-013

---

## Phase 5: Tests

### T-020: Write Unit Tests for Core Library Functions

**Priority:** High

**Description:**
Implement all unit tests for `src/lib/` functions as specified in the test plan (TC-25 through TC-30, TC-44, TC-45). These tests have no Prisma dependency — they test pure functions.

**Acceptance Criteria:**
- [ ] `src/tests/fixtures/index.ts` exports shared mock objects: `mockCompany`, `mockSupplier`, `mockScope1Record`, `mockScope2Record`, `mockScope3Category`, `mockScope3Record`, `mockMethodologyNote`, `mock15Categories`
- [ ] `src/lib/proxy.test.ts` implements and passes:
  - TC-25: `calculateProxyTco2e({ spend_eur: 1000 })` returns `233` (1000 × 0.233)
  - TC-26: `calculateProxyTco2e({ spend_eur: 0 })` returns `0`
  - TC-27: `buildProxyAssumptions({ spend_eur: 1000 })` returns a string containing `"0.233"`
  - TC-28: `PROXY_CONFIDENCE` is `> 0` and `< 1`
  - TC-29: `calculateProxyTco2e({ ton_km: 500 })` returns `500 × PROXY_FACTOR_TON_KM` (positive number)
  - TC-30: `calculateProxyTco2e({ waste_kg: 200 })` returns `200 × PROXY_FACTOR_WASTE_KG` (positive number)
- [ ] `src/lib/utils.test.ts` implements and passes:
  - TC-44: `formatTco2e(1.2345)` returns a string with at most 2 decimal places (e.g. `"1.23"`)
- [ ] `src/lib/constants.test.ts` implements and passes:
  - TC-45: `PROXY_FACTOR_SPEND === 0.233`
- [ ] `npm test` passes all unit tests with exit code 0

**Files to Create:**
- `src/lib/proxy.test.ts`
- `src/lib/utils.test.ts`
- `src/lib/constants.test.ts`
- `src/tests/fixtures/index.ts`

**Dependencies:** T-005

---

### T-021: Write API Smoke Tests for All Route Handlers

**Priority:** High

**Description:**
Implement all API smoke tests from the test plan (TC-01 through TC-43) covering all route handlers. All Prisma calls are mocked via `vi.mock`. The goal is to verify status codes, response shapes, validation behaviour, and audit event creation without a live database.

**Acceptance Criteria:**
- [ ] All test files use `vi.mock('@/lib/prisma')` to replace Prisma with stubs
- [ ] `createAuditEvent` from `@/lib/audit` mocked via `vi.mock('@/lib/audit')`
- [ ] `@react-pdf/renderer` mocked for export tests: `vi.mock('@react-pdf/renderer', () => ({ renderToBuffer: vi.fn().mockResolvedValue(Buffer.from('mock-pdf')), ... }))`
- [ ] **Dashboard tests** (TC-01–TC-04) in `route.test.ts`: correct totals, year filtering, total = sum, zero values
- [ ] **Supplier tests** (TC-05–TC-10): list, create with token, token UUID format, update, delete, refresh token
- [ ] **Scope 1 tests** (TC-11–TC-13): create with audit event, delete
- [ ] **Scope 2 tests** (TC-14–TC-16): create with audit event, delete
- [ ] **Scope 3 tests** (TC-17–TC-21): list 15 categories, update materiality, create record with audit event, delete
- [ ] **Public supplier form tests** (TC-22–TC-24, TC-27, TC-28b, TC-31, TC-33): valid token response, 404 for invalid token, creates Scope3Record on submit, assumptions contain proxy factor, confidence < 1, activityDataJson stored, audit actor = "supplier"
- [ ] **Methodology tests** (TC-35–TC-36): list all notes, upsert note
- [ ] **Export tests** (TC-34, TC-37–TC-38): audit event with action="exported", Content-Type application/pdf, non-empty buffer
- [ ] **Validation tests** (TC-39–TC-43): 400 on missing required fields for suppliers, scope1, scope3, public form; 404 on non-existent resource update
- [ ] `npm test` passes all API smoke tests with exit code 0

**Files to Create:**
- `src/app/api/dashboard/route.test.ts`
- `src/app/api/suppliers/route.test.ts`
- `src/app/api/suppliers/[id]/route.test.ts`
- `src/app/api/suppliers/[id]/refresh-token/route.test.ts`
- `src/app/api/scope1/route.test.ts`
- `src/app/api/scope1/[id]/route.test.ts`
- `src/app/api/scope2/route.test.ts`
- `src/app/api/scope2/[id]/route.test.ts`
- `src/app/api/scope3/categories/route.test.ts`
- `src/app/api/scope3/categories/[id]/route.test.ts`
- `src/app/api/scope3/records/route.test.ts`
- `src/app/api/scope3/records/[id]/route.test.ts`
- `src/app/api/methodology/route.test.ts`
- `src/app/api/methodology/[scope]/route.test.ts`
- `src/app/api/export/route.test.ts`
- `src/app/api/public/supplier/[token]/route.test.ts`

**Dependencies:** T-008, T-009, T-010, T-011, T-012, T-013, T-020

**Notes:**
- Use `new NextRequest("http://localhost/api/...", { method: "POST", body: JSON.stringify({...}) })` to construct mock requests in tests
- Each test file should import the route handler function directly (e.g. `import { GET, POST } from "./route"`)
- See test plan (`docs/features/001-mvp/test-plan.md`) for the full specification of each test case

---

## Phase 6: PDF Export

### T-022: Implement PDF Report Template Component

**Priority:** High

**Description:**
Create `src/lib/pdf/report-template.tsx` — a `@react-pdf/renderer` React component tree that renders all five required sections of the CSRD Climate Report PDF.

**Acceptance Criteria:**
- [ ] File exports `ReportDocument` as a named React component accepting `ReportData` props
- [ ] `ReportData` TypeScript type defined (co-located in file or separate `types.ts`); includes: `company`, `scope1Total`, `scope2Total`, `scope3Total`, `materialCategories`, `allScope3Records`, `methodologyNotes`, `assumptionRecords`
- [ ] **Section 1 — Cover page:** company name and `reportingYear` prominently displayed
- [ ] **Section 2 — Summary table:** rows for Scope 1, Scope 2, Scope 3, Total with tCO₂e values
- [ ] **Section 3 — Scope 3 breakdown table:** lists only categories with `material = true` and their summed tCO₂e; includes a footnote if any non-material categories have records
- [ ] **Section 4 — Methodology section:** displays `MethodologyNote.text` for each scope (`scope_1`, `scope_2`, `scope_3`)
- [ ] **Section 5 — Assumptions & Data Quality table:** lists `Scope3Record`s where `confidence < 1` OR `dataSource = "proxy"` OR `assumptions` is non-empty; columns: Supplier Name, Category, Assumptions, Confidence, Data Source
- [ ] All layout uses `@react-pdf/renderer` primitives (`Document`, `Page`, `View`, `Text`, `StyleSheet.create()`)
- [ ] No browser APIs used; component must render correctly in Node.js context

**Files to Create:**
- `src/lib/pdf/report-template.tsx`

**Dependencies:** T-004

**Notes:**
- `@react-pdf/renderer` must be in `serverExternalPackages` in `next.config.mjs` (handled in T-001)
- `StyleSheet.create()` from `@react-pdf/renderer` is used for all styling — no Tailwind in PDF components
- The component does not make any database calls — all data is passed in as props

---

### T-023: Implement PDF Generation Orchestrator and Export API + Page

**Priority:** High

**Description:**
Create the PDF generation orchestrator (`generate-report.ts`), the export API route (`POST /api/export`), and the export UI page with download button.

**Acceptance Criteria:**
- [ ] `src/lib/pdf/generate-report.ts` exports `generateReport(prisma: PrismaClient): Promise<Buffer>`
- [ ] `generateReport` fetches all required data: Company, scope totals (summed by year), material Scope3Categories, Scope3Records (with supplier and category), MethodologyNotes, and assumption-flagged records
- [ ] `generateReport` constructs `ReportData` and calls `renderToBuffer(<ReportDocument data={reportData} />)` from `@react-pdf/renderer`
- [ ] `POST /api/export` calls `generateReport(prisma)` and returns:
  - HTTP 200
  - `Content-Type: application/pdf`
  - `Content-Disposition: attachment; filename="csrd-climate-report-<year>.pdf"`
  - PDF `Buffer` as response body
- [ ] `POST /api/export` creates `AuditTrailEvent` with `action: "exported"`, `entityType: "export"`, `actor: "user"`, `entityId: DEMO_COMPANY_ID`
- [ ] `POST /api/export` returns HTTP 500 with `{ error: string }` on failure
- [ ] `src/components/export/ExportButton.tsx` uses `"use client"`, calls `fetch("/api/export", { method: "POST" })`, converts response to Blob, and triggers browser file download via `URL.createObjectURL()`
- [ ] `ExportButton` shows a `Spinner` and disables the button while the request is in flight
- [ ] Export page at `/export` renders `ExportButton` within the `(app)` layout
- [ ] `export const dynamic = "force-dynamic"` in export `page.tsx`

**Files to Create:**
- `src/lib/pdf/generate-report.ts`
- `src/app/api/export/route.ts`
- `src/app/(app)/export/page.tsx`
- `src/components/export/ExportButton.tsx`

**Dependencies:** T-004, T-005, T-022

---

## Phase 7: Public Supplier Form

### T-024: Implement Public Supplier Form API Routes

**Priority:** High

**Description:**
Create the two public supplier form API endpoints: `GET /api/public/supplier/[token]` (token validation and supplier info) and `POST /api/public/supplier/[token]` (form submission, proxy calculation, Scope 3 record creation).

**Acceptance Criteria:**
- [ ] `GET /api/public/supplier/[token]` looks up `Supplier` by `publicFormToken`
  - Returns HTTP 200 with `{ supplierName: string, categories: Scope3Category[] }` if found
  - Returns HTTP 404 with `{ error: "Form not found" }` if token does not match any supplier
- [ ] `POST /api/public/supplier/[token]` validates token; returns HTTP 404 if invalid
- [ ] `POST` request body: `{ categoryId: string, spend_eur?: number, ton_km?: number, waste_kg?: number }`
- [ ] `POST` returns HTTP 400 if none of `spend_eur`, `ton_km`, `waste_kg` is provided
- [ ] `POST` uses `calculateProxyTco2e(input)` from `src/lib/proxy.ts` for `valueTco2e`
- [ ] `POST` creates `Scope3Record` with:
  - `companyId = DEMO_COMPANY_ID`
  - `supplierId` = matched supplier's `id`
  - `dataSource = "supplier_form"`
  - `calculationMethod = "spend_based"` (or appropriate based on which input was provided)
  - `confidence = PROXY_CONFIDENCE`
  - `assumptions = buildProxyAssumptions(input)`
  - `activityDataJson = buildActivityDataJson(input)`
  - `periodYear` = Company's `reportingYear`
- [ ] `POST` creates `AuditTrailEvent` with `actor: "supplier"`, `action: "submitted"`, `entityType: "scope3"`, `entityId`: new record ID
- [ ] Returns HTTP 201 with `{ success: true, record: Scope3Record }` on success

**Files to Create:**
- `src/app/api/public/supplier/[token]/route.ts`

**Dependencies:** T-004, T-005

---

### T-025: Implement Public Supplier Form Page

**Priority:** High

**Description:**
Create the publicly accessible supplier form page at `/public/supplier/[token]` — no sidebar, no authentication. Uses the `(public)` route group with its own minimal layout.

**Acceptance Criteria:**
- [ ] `src/app/(public)/layout.tsx` renders a minimal HTML shell with no sidebar navigation (just a centred content container)
- [ ] Page at `/public/supplier/[token]` is publicly accessible (no auth gate)
- [ ] Server component validates token by calling `GET /api/public/supplier/[token]` (or direct Prisma query); if token is invalid, renders a clear "Form not found" error page (not a 500 error)
- [ ] If token is valid, renders `SupplierPublicForm` with supplier name pre-filled and categories list passed as props
- [ ] `SupplierPublicForm` form fields: Spend in EUR (number), Transport in tonne-km (number), Waste in kg (number) — at least one required, all optional individually; Category selector (defaults to C1)
- [ ] Client-side validation: shows inline error if all three activity fields are left blank on submit
- [ ] On submit, `SupplierPublicForm` calls `POST /api/public/supplier/[token]`
- [ ] **Success state:** "Thank you — your data has been submitted successfully." message replaces the form
- [ ] **Error state:** inline error message below the submit button on API failure
- [ ] `SupplierPublicForm.tsx` uses `"use client"`
- [ ] `export const dynamic = "force-dynamic"` in `page.tsx`

**Files to Create:**
- `src/app/(public)/layout.tsx`
- `src/app/(public)/public/supplier/[token]/page.tsx`
- `src/components/public/SupplierPublicForm.tsx`

**Dependencies:** T-006, T-024

---

## Implementation Order

The recommended implementation sequence follows dependency order, with tests interleaved after core API routes are stable:

| Step | Task | Rationale |
|------|------|-----------|
| 1 | T-001 | All tasks require the project to exist |
| 2 | T-002 | All DB-dependent tasks require the schema |
| 3 | T-003 | Completes DB bootstrap; enables early demo |
| 4 | T-004 | All API routes require Prisma client + constants |
| 5 | T-005 | All API routes require utils, audit, proxy helpers |
| 6 | T-006 | Root layout required before any page can be created |
| 7 | T-007 | App layout + UI components required by all management pages |
| 8 | T-008 | Dashboard API (simple, good first API to implement) |
| 9 | T-009 | Suppliers API (most complex CRUD; validates token pattern) |
| 10 | T-010 | Scope 1 API |
| 11 | T-011 | Scope 2 API |
| 12 | T-012 | Scope 3 API (most complex business rules) |
| 13 | T-013 | Methodology API |
| 14 | T-020 | Unit tests (can run as soon as T-005 is done; early feedback on proxy logic) |
| 15 | T-021 | API smoke tests (after all API routes complete) |
| 16 | T-014 | Dashboard page |
| 17 | T-015 | Suppliers page (most complex UI) |
| 18 | T-016 | Scope 1 page |
| 19 | T-017 | Scope 2 page |
| 20 | T-018 | Scope 3 page |
| 21 | T-019 | Methodology page |
| 22 | T-022 | PDF report template (foundational for PDF feature) |
| 23 | T-023 | PDF generation + export route + export page |
| 24 | T-024 | Public supplier form API |
| 25 | T-025 | Public supplier form page |

> **Note:** T-020 (unit tests) can be started immediately after T-005 is complete, in parallel with API route work. T-021 (API smoke tests) should be completed after T-013.

---

## Open Questions

1. **`ts-node` vs `tsx` for seed script:** This plan assumes `tsx` (lighter, modern). If the project already uses `ts-node`, adjust `package.json` `prisma.seed` accordingly.
2. **Vitest alias resolution:** The Developer should verify that `vite-tsconfig-paths` correctly resolves `@/` imports in test files when mocking modules (e.g. `vi.mock('@/lib/prisma')`). An explicit `resolve.alias` in `vitest.config.ts` may be needed as a fallback.
3. **`@react-pdf/renderer` version:** Check that the installed version of `@react-pdf/renderer` works without a native binary in Next.js 14+ App Router route handlers. If there are Node.js compatibility issues, `serverExternalPackages` in `next.config.mjs` must include it.
4. **Proxy priority when multiple inputs provided:** When a supplier submits both `spend_eur` and `ton_km`, which proxy factor takes precedence? This plan assumes `spend_eur` → `ton_km` → `waste_kg` priority. Developer should confirm with the Maintainer if a different priority is desired.
5. **Dockerfile:** The architecture references a `src/Dockerfile`. The Developer should create this based on the standard Next.js standalone output pattern (`next build` with `output: "standalone"`), ensuring `docker compose up` works end-to-end.
