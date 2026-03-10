# Test Plan: GreenLedger MVP (001)

## Overview

This test plan covers the GreenLedger MVP — a greenfield Next.js application for CSRD/ESRS climate
reporting. It maps every acceptance criterion in the [feature specification](./specification.md) to
concrete, fully automated test cases using **Vitest** (`cd src && npm test`).

The MVP testing strategy is intentionally minimal but targeted:

- **Unit tests** for business logic in `src/lib/` (proxy calculations, dashboard totals, audit logging).
- **API route smoke tests** for the critical happy-path of each key endpoint.
- **Build validation** (`next build`) as the primary integration smoke test, executed as part of CI.

No E2E tests (Playwright/Cypress) are in scope for MVP.

All test files live in `src/__tests__/` or colocated with their source module as `*.test.ts`.

---

## Test Coverage Matrix

| Acceptance Criterion | Test Case(s) | Test Type |
|---|---|---|
| Proxy: `spend_eur × PROXY_FACTOR` = correct tCO₂e | TC-01 | Unit |
| Proxy: `ton_km × transport factor` = correct value | TC-02 | Unit |
| Proxy: `waste_kg × waste factor` = correct value | TC-03 | Unit |
| Proxy: missing/incomplete data sets `confidence < 1.0` | TC-04 | Unit |
| Dashboard: Scope 1 total = sum of Scope1Records for year | TC-05 | Unit |
| Dashboard: Scope 2 total = sum of Scope2Records for year | TC-06 | Unit |
| Dashboard: Scope 3 total = sum of Scope3Records for year | TC-07 | Unit |
| Dashboard: Grand total = S1 + S2 + S3 | TC-08 | Unit |
| Dashboard: empty year returns 0 for all scopes | TC-09 | Unit |
| Token generation creates a unique UUID | TC-10 | Unit |
| Token is stored on the supplier record | TC-11 | API Smoke |
| Token is accessible via GET `/api/suppliers/[id]` | TC-12 | API Smoke |
| POST supplier form with `spend_eur` creates Scope3Record | TC-13 | API Smoke |
| POST supplier form uses proxy calculation | TC-14 | API Smoke |
| POST with incomplete data: `confidence < 1` | TC-15 | API Smoke |
| Invalid token returns 404 | TC-16 | API Smoke |
| Form submission creates AuditTrailEvent | TC-17 | API Smoke |
| GET `/api/dashboard` returns `{ scope1, scope2, scope3, total }` | TC-18 | API Smoke |
| GET `/api/suppliers` returns array | TC-19 | API Smoke |
| POST `/api/suppliers` creates supplier with `publicFormToken` | TC-20 | API Smoke |
| POST `/api/scope1` creates Scope1Record | TC-21 | API Smoke |
| POST `/api/scope2` creates Scope2Record | TC-22 | API Smoke |
| GET `/api/scope3/categories` returns categories array | TC-23 | API Smoke |
| `next build` succeeds with zero TypeScript errors | TC-24 | Build |

---

## User Acceptance Scenarios

> **Purpose:** For user-facing features (UI, new pages, API behaviours), these scenarios guide the
> Maintainer and UAT Tester agent on what to verify manually in the running application. See
> [`uat-test-plan.md`](./uat-test-plan.md) for the full step-by-step UAT plan.

### Scenario 1: Dashboard KPI Cards

**User Goal:** View aggregated emissions totals at a glance.

**Test Steps:**

1. Run `docker compose up -d` (or `cd src && npm run dev`).
2. Navigate to `http://localhost:3000/dashboard`.
3. Observe the KPI cards.

**Expected Output:**

- Four KPI cards: Scope 1, Scope 2, Scope 3, Total tCO₂e.
- Values sourced from seeded demo data; Total = S1 + S2 + S3.

**Success Criteria:**

- [ ] All four KPI cards are displayed with numeric values.
- [ ] Grand total equals the sum of the three scope values.

---

### Scenario 2: Supplier Token & Public Form Flow

**User Goal:** Send a unique form link to a supplier and receive their data.

**Test Steps:**

1. Navigate to `/suppliers`.
2. Click "Generate Link" for any supplier.
3. Copy the tokenised URL (format: `/public/supplier/[token]`).
4. Open the URL in a private/incognito tab (simulating no auth).
5. Submit `spend_eur = 50000`.

**Expected Output:**

- The form is accessible without login.
- After submission, navigating to `/scope-3` shows a new record with `dataSource = "supplier_form"`.

**Success Criteria:**

- [ ] Public form renders without authentication.
- [ ] Submission creates a Scope 3 record with proxy assumptions and `confidence < 1.0`.
- [ ] Token URL is unique per supplier.

---

### Scenario 3: PDF Export

**User Goal:** Download an audit-ready CSRD Climate Report.

**Test Steps:**

1. Navigate to `/export`.
2. Click "Download PDF".
3. Open the downloaded PDF.

**Expected Output:**

- PDF opens successfully; contains cover page, executive summary table, Scope 3 breakdown,
  methodology section, and assumptions & data quality section.

**Success Criteria:**

- [ ] PDF downloads without error.
- [ ] All five required sections are present.
- [ ] Only material Scope 3 categories appear in the breakdown table.

---

## Test Cases

### TC-01: calculateProxyEmissions_spendEur_returnsCorrectTco2e

**Type:** Unit

**File:** `src/__tests__/lib/calculations.test.ts`

**Description:**
Verifies that `calculateProxyEmissions({ spend_eur: 100000 })` returns `valueTco2e = 100000 * PROXY_FACTOR`
(e.g., 42 tCO₂e with `PROXY_FACTOR = 0.00042`), with `calculationMethod = "spend_based"`.

**Preconditions:**

- `PROXY_FACTOR` constant available from `src/lib/constants.ts`.

**Test Steps:**

1. Import `calculateProxyEmissions` from `src/lib/calculations.ts`.
2. Call with `{ spend_eur: 100000 }`.
3. Assert `result.valueTco2e === 100000 * PROXY_FACTOR`.
4. Assert `result.calculationMethod === "spend_based"`.
5. Assert `result.emissionFactorSource` is a non-empty string.

**Expected Result:**
`{ valueTco2e: 42, calculationMethod: "spend_based", confidence: 0.5, assumptions: <non-empty string>, emissionFactorSource: <non-empty string> }`

---

### TC-02: calculateProxyEmissions_tonKm_returnsCorrectTco2e

**Type:** Unit

**File:** `src/__tests__/lib/calculations.test.ts`

**Description:**
Verifies that `calculateProxyEmissions({ ton_km: 1000 })` returns a positive `valueTco2e`
computed using the transport proxy factor, with `calculationMethod = "activity_based"`.

**Preconditions:**

- Transport proxy factor constant available.

**Test Steps:**

1. Import `calculateProxyEmissions`.
2. Call with `{ ton_km: 1000 }`.
3. Assert `result.valueTco2e > 0`.
4. Assert `result.calculationMethod === "activity_based"`.

**Expected Result:**
`{ valueTco2e: > 0, calculationMethod: "activity_based", confidence: <= 1.0 }`

---

### TC-03: calculateProxyEmissions_wasteKg_returnsCorrectTco2e

**Type:** Unit

**File:** `src/__tests__/lib/calculations.test.ts`

**Description:**
Verifies that `calculateProxyEmissions({ waste_kg: 5000 })` returns a positive `valueTco2e`
computed using the waste proxy factor, with `calculationMethod = "activity_based"`.

**Test Steps:**

1. Import `calculateProxyEmissions`.
2. Call with `{ waste_kg: 5000 }`.
3. Assert `result.valueTco2e > 0`.
4. Assert `result.calculationMethod === "activity_based"`.

**Expected Result:**
`{ valueTco2e: > 0, calculationMethod: "activity_based", confidence: <= 1.0 }`

---

### TC-04: calculateProxyEmissions_missingData_returnsLowConfidence

**Type:** Unit

**File:** `src/__tests__/lib/calculations.test.ts`

**Description:**
Verifies that when only partial or the minimum supported data is provided, the returned
`confidence` value is strictly less than 1.0, reflecting proxy uncertainty.

**Test Steps:**

1. Import `calculateProxyEmissions`.
2. Call with `{ spend_eur: 50000 }`.
3. Assert `result.confidence < 1.0`.
4. Assert `result.assumptions` is a non-empty string explaining the proxy.

**Expected Result:**
`{ confidence: < 1.0, assumptions: <non-empty> }`

---

### TC-05: calculateDashboardTotals_scope1_sumForReportingYear

**Type:** Unit

**File:** `src/__tests__/lib/dashboard.test.ts`

**Description:**
Verifies that the dashboard total calculation function sums only `Scope1Record.valueTco2e`
records whose `periodYear` matches the reporting year, ignoring records from other years.

**Preconditions:**

- Dashboard calculation helper is a pure function accepting arrays of records.

**Test Steps:**

1. Provide two Scope 1 records for year 2024 (`10.0` and `15.5`) and one for year 2023 (`99.0`).
2. Call `calculateScope1Total(records, 2024)`.
3. Assert result equals `25.5`.

**Expected Result:** `25.5`

---

### TC-06: calculateDashboardTotals_scope2_sumForReportingYear

**Type:** Unit

**File:** `src/__tests__/lib/dashboard.test.ts`

**Description:**
Same as TC-05 but for Scope 2 records.

**Test Steps:**

1. Provide Scope 2 records for years 2024 and 2023.
2. Call `calculateScope2Total(records, 2024)`.
3. Assert result matches sum of 2024 records only.

**Expected Result:** Sum of records matching the target year.

---

### TC-07: calculateDashboardTotals_scope3_sumForReportingYear

**Type:** Unit

**File:** `src/__tests__/lib/dashboard.test.ts`

**Description:**
Same as TC-05 but for Scope 3 records.

**Test Steps:**

1. Provide Scope 3 records for years 2024 and 2023.
2. Call `calculateScope3Total(records, 2024)`.
3. Assert result matches sum of 2024 records only.

**Expected Result:** Sum of records matching the target year.

---

### TC-08: calculateDashboardTotals_total_equalsSumOfAllScopes

**Type:** Unit

**File:** `src/__tests__/lib/dashboard.test.ts`

**Description:**
Verifies that the grand total equals S1 + S2 + S3.

**Test Steps:**

1. Provide known values: scope1 = 10.0, scope2 = 20.0, scope3 = 30.0.
2. Call `calculateGrandTotal(10.0, 20.0, 30.0)`.
3. Assert result equals `60.0`.

**Expected Result:** `60.0`

---

### TC-09: calculateDashboardTotals_emptyYear_returnsZero

**Type:** Unit

**File:** `src/__tests__/lib/dashboard.test.ts`

**Description:**
Verifies that an empty set of records for the reporting year returns 0 for all scopes and
the grand total.

**Test Steps:**

1. Call each total function with an empty array.
2. Assert all return `0`.
3. Assert grand total is `0`.

**Expected Result:** All totals = `0`

---

### TC-10: generateToken_producesUniqueUUID

**Type:** Unit

**File:** `src/__tests__/lib/token.test.ts`

**Description:**
Verifies that the token generation utility produces a valid UUID v4 string and that two
successive calls produce different tokens.

**Test Steps:**

1. Import the token generation utility (or call `crypto.randomUUID()` as used in the route handler).
2. Generate two tokens.
3. Assert each matches the UUID v4 format (`/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i`).
4. Assert they are not equal to each other.

**Expected Result:** Two distinct UUID v4 strings.

---

### TC-11: supplierTokenRoute_post_storesTokenOnSupplier

**Type:** API Smoke

**File:** `src/__tests__/api/suppliers-token.test.ts`

**Description:**
Verifies that `POST /api/suppliers/[id]/token` stores a new UUID token on the supplier record.
Uses a mocked Prisma client.

**Preconditions:**

- Prisma client is mocked via `vi.mock`.
- A seeded supplier ID is available.

**Test Steps:**

1. Mock `prisma.supplier.update` to return a supplier object with a `publicFormToken` field.
2. Call the route handler with a valid supplier `id`.
3. Assert the response status is `200`.
4. Assert the response body contains `{ token: <uuid>, url: /public/supplier/<uuid> }`.
5. Assert `prisma.supplier.update` was called with a UUID token.

**Expected Result:**
HTTP 200; response includes `token` (UUID) and `url`.

---

### TC-12: supplierGetRoute_get_includesPublicFormToken

**Type:** API Smoke

**File:** `src/__tests__/api/suppliers.test.ts`

**Description:**
Verifies that `GET /api/suppliers/[id]` returns the supplier record including the
`publicFormToken` field.

**Preconditions:**

- Prisma `findUnique` mocked to return a supplier with a token.

**Test Steps:**

1. Mock `prisma.supplier.findUnique` to return `{ id, name, publicFormToken: "test-token", ... }`.
2. Call the route handler.
3. Assert response status is `200`.
4. Assert `data.publicFormToken` is present in the response body.

**Expected Result:**
HTTP 200; `data.publicFormToken` is a non-empty string.

---

### TC-13: publicSupplierFormRoute_postSpendEur_createsScope3Record

**Type:** API Smoke

**File:** `src/__tests__/api/public-supplier-form.test.ts`

**Description:**
Verifies that `POST /api/public/supplier/[token]` with `{ spend_eur: 50000 }` creates a
Scope3Record with `dataSource = "supplier_form"` and links it to the matching supplier.

**Preconditions:**

- Prisma mocked: `supplier.findUnique` returns a valid supplier; `scope3Record.create` and
  `auditTrailEvent.create` accept inputs; `$transaction` executes both.
- A valid Scope3Category (C1) exists in the mock.

**Test Steps:**

1. Mock Prisma to return a matching supplier for the given token.
2. POST `{ spend_eur: 50000 }` to the route handler.
3. Assert response status is `200` with `{ success: true }`.
4. Assert the Scope3Record creation call included `dataSource: "supplier_form"`.
5. Assert `supplierId` matches the looked-up supplier.

**Expected Result:**
HTTP 200; `{ success: true }`; Scope3Record created with correct `dataSource`.

---

### TC-14: publicSupplierFormRoute_postSpendEur_appliesProxyCalculation

**Type:** API Smoke

**File:** `src/__tests__/api/public-supplier-form.test.ts`

**Description:**
Verifies that when `spend_eur` is submitted, the resulting Scope3Record `valueTco2e` equals
`spend_eur × PROXY_FACTOR` and `calculationMethod = "spend_based"`.

**Preconditions:**

- Same mocks as TC-13.

**Test Steps:**

1. POST `{ spend_eur: 100000 }`.
2. Capture the arguments passed to the Scope3Record create mock.
3. Assert `valueTco2e === 100000 * PROXY_FACTOR`.
4. Assert `calculationMethod === "spend_based"`.

**Expected Result:**
`valueTco2e = 42` (with `PROXY_FACTOR = 0.00042`); `calculationMethod = "spend_based"`.

---

### TC-15: publicSupplierFormRoute_incompleteData_setsLowConfidence

**Type:** API Smoke

**File:** `src/__tests__/api/public-supplier-form.test.ts`

**Description:**
Verifies that a submission resulting in proxy calculation sets `confidence < 1.0` on the
created Scope3Record.

**Test Steps:**

1. POST `{ spend_eur: 50000 }`.
2. Capture the Scope3Record create arguments.
3. Assert `confidence < 1.0`.
4. Assert `assumptions` is a non-empty string.

**Expected Result:**
`confidence < 1.0`; `assumptions` non-empty.

---

### TC-16: publicSupplierFormRoute_invalidToken_returns404

**Type:** API Smoke

**File:** `src/__tests__/api/public-supplier-form.test.ts`

**Description:**
Verifies that `POST /api/public/supplier/[token]` returns HTTP 404 when the token does not
match any supplier.

**Preconditions:**

- `prisma.supplier.findUnique` mocked to return `null`.

**Test Steps:**

1. POST any payload to the route with a non-existent token.
2. Assert response status is `404`.
3. Assert the response body contains `{ error: <non-empty string> }`.

**Expected Result:**
HTTP 404; `{ error: "..." }`.

---

### TC-17: publicSupplierFormRoute_validSubmission_createsAuditTrailEvent

**Type:** API Smoke

**File:** `src/__tests__/api/public-supplier-form.test.ts`

**Description:**
Verifies that a successful supplier form submission creates an `AuditTrailEvent` with
`action = "submitted"` and `actor = "supplier"`.

**Preconditions:**

- Same mocks as TC-13.
- `$transaction` captures both Scope3Record and AuditTrailEvent creates.

**Test Steps:**

1. POST `{ spend_eur: 50000 }` with a valid token.
2. Assert that the AuditTrailEvent creation includes:
   - `action: "submitted"`
   - `actor: "supplier"`
   - `entityType: "scope3"`

**Expected Result:**
AuditTrailEvent created with `action = "submitted"`, `actor = "supplier"`.

---

### TC-18: dashboardRoute_get_returnsExpectedShape

**Type:** API Smoke

**File:** `src/__tests__/api/dashboard.test.ts`

**Description:**
Verifies that `GET /api/dashboard` returns a JSON object with the shape
`{ scope1: number, scope2: number, scope3: number, total: number }`.

**Preconditions:**

- Prisma aggregate mocks return known values for each scope.

**Test Steps:**

1. Mock `prisma.scope1Record.aggregate` → `{ _sum: { valueTco2e: 10.0 } }`.
2. Mock `prisma.scope2Record.aggregate` → `{ _sum: { valueTco2e: 20.0 } }`.
3. Mock `prisma.scope3Record.aggregate` → `{ _sum: { valueTco2e: 30.0 } }`.
4. Call the GET route handler.
5. Assert response status is `200`.
6. Assert `data.scope1 === 10.0`.
7. Assert `data.scope2 === 20.0`.
8. Assert `data.scope3 === 30.0`.
9. Assert `data.total === 60.0`.

**Expected Result:**
HTTP 200; `{ scope1: 10.0, scope2: 20.0, scope3: 30.0, total: 60.0 }`.

---

### TC-19: suppliersRoute_get_returnsArray

**Type:** API Smoke

**File:** `src/__tests__/api/suppliers.test.ts`

**Description:**
Verifies that `GET /api/suppliers` returns HTTP 200 with `{ data: Array }`.

**Preconditions:**

- `prisma.supplier.findMany` mocked to return an array of two suppliers.

**Test Steps:**

1. Call the GET route handler.
2. Assert response status is `200`.
3. Assert `data` is an array with length 2.

**Expected Result:**
HTTP 200; `{ data: [supplier1, supplier2] }`.

---

### TC-20: suppliersRoute_post_createsSupplierWithToken

**Type:** API Smoke

**File:** `src/__tests__/api/suppliers.test.ts`

**Description:**
Verifies that `POST /api/suppliers` creates a supplier and that the initial `publicFormToken`
field is present (whether set at creation time or via token generation).

**Preconditions:**

- `prisma.supplier.create` mocked to return a supplier object including a `publicFormToken`.

**Test Steps:**

1. POST `{ name: "Test Supplier", country: "DE", sector: "Manufacturing", contactEmail: "test@example.com" }`.
2. Assert response status is `201`.
3. Assert `data.publicFormToken` is present (string or null based on implementation).

**Expected Result:**
HTTP 201; supplier created; `publicFormToken` field present in response.

---

### TC-21: scope1Route_post_createsScope1Record

**Type:** API Smoke

**File:** `src/__tests__/api/scope1.test.ts`

**Description:**
Verifies that `POST /api/scope1` with valid payload creates a Scope1Record and returns it.

**Preconditions:**

- `prisma.scope1Record.create` mocked to return the created record.

**Test Steps:**

1. POST `{ periodYear: 2024, valueTco2e: 50.0, calculationMethod: "combustion", emissionFactorsSource: "DEFRA", dataSource: "manual" }`.
2. Assert response status is `201`.
3. Assert `data.valueTco2e === 50.0`.
4. Assert `data.dataSource === "manual"`.

**Expected Result:**
HTTP 201; Scope1Record returned with correct fields.

---

### TC-22: scope2Route_post_createsScope2Record

**Type:** API Smoke

**File:** `src/__tests__/api/scope2.test.ts`

**Description:**
Verifies that `POST /api/scope2` with valid payload creates a Scope2Record and returns it.

**Preconditions:**

- `prisma.scope2Record.create` mocked to return the created record.

**Test Steps:**

1. POST `{ periodYear: 2024, valueTco2e: 30.0, calculationMethod: "location-based", emissionFactorsSource: "IEA", dataSource: "manual" }`.
2. Assert response status is `201`.
3. Assert `data.valueTco2e === 30.0`.
4. Assert `data.dataSource === "manual"`.

**Expected Result:**
HTTP 201; Scope2Record returned with correct fields.

---

### TC-23: scope3CategoriesRoute_get_returnsCategories

**Type:** API Smoke

**File:** `src/__tests__/api/scope3-categories.test.ts`

**Description:**
Verifies that `GET /api/scope3/categories` returns a non-empty array of Scope3Category
objects with `code`, `name`, and `material` fields.

**Preconditions:**

- `prisma.scope3Category.findMany` mocked to return the 15 seeded categories (C1–C15).

**Test Steps:**

1. Call the GET route handler.
2. Assert response status is `200`.
3. Assert `data` is an array with length ≥ 1.
4. Assert each item has `code`, `name`, and `material` fields.

**Expected Result:**
HTTP 200; array of categories with required fields.

---

### TC-24: build_nextBuild_succeedsWithoutTypeScriptErrors

**Type:** Build

**Description:**
Verifies that `next build` completes successfully with zero TypeScript compilation errors and
no missing import/export errors.

**Preconditions:**

- `DATABASE_URL` environment variable is set to a valid SQLite path.
- Prisma client has been generated (`npx prisma generate`).

**Test Steps:**

1. From the `src/` directory, run `npm run build`.
2. Verify the exit code is `0`.
3. Verify no TypeScript errors appear in stdout/stderr.

**Expected Result:**
Exit code `0`; no error output.

**Notes:**
This test is executed by the CI `pr-validation.yml` workflow on every pull request.

---

## Test Data Requirements

All unit and API smoke tests use **mocked Prisma calls** (`vi.mock('@/lib/prisma')`) — no live
database connection is required to run the test suite. Test data is defined inline within each
test file.

| Data Item | Source | Notes |
|---|---|---|
| `PROXY_FACTOR` | `src/lib/constants.ts` | Imported directly; `0.00042` in demo |
| Demo supplier stub | Inline mock in test file | `{ id, name, publicFormToken, companyId }` |
| Demo Scope3Category C1 | Inline mock in test file | `{ id, code: "C1", name: "Purchased goods & services", material: true }` |
| Scope1/2/3 record stubs | Inline mock per test | Minimal fields required per assertion |

---

## Edge Cases

| Scenario | Expected Behaviour | Test Case |
|---|---|---|
| `spend_eur = 0` | `valueTco2e = 0`; proxy record still created with assumptions | TC-01 (boundary variant) |
| All three activity fields absent | Route returns HTTP 400 "at least one field required" | TC-13 (error variant) |
| Token not in database | Route returns HTTP 404 | TC-16 |
| Empty reporting year | All totals return `0` | TC-09 |
| Negative `valueTco2e` input | Route returns HTTP 400 (input validation) | TC-21 (error variant) |
| Non-numeric `spend_eur` | Route returns HTTP 400 | TC-13 (error variant) |

---

## Non-Functional Tests

### TypeScript Strict Mode

- Enforced via `tsc --noEmit` in the `pr-validation.yml` CI workflow.
- No `any` types permitted.

### ESLint

- Enforced via `eslint` in the `pr-validation.yml` CI workflow.
- Zero errors required before merge.

### Build

- TC-24 (`next build`) validates the whole application compiles and all pages/routes are
  importable without runtime errors at build time.

---

## Coverage Goals (MVP)

| Area | Goal | Rationale |
|---|---|---|
| `src/lib/calculations.ts` | 100% function coverage | Core business logic; directly auditable |
| `src/lib/audit.ts` | Covered via TC-17 (indirect) | Audit trail correctness is a CSRD requirement |
| Dashboard total aggregation | 100% branch coverage | Financial accuracy is critical for demo |
| Public supplier form route | Happy path + 404 + low confidence | The primary user-facing flow |
| Other API routes | Happy path smoke only | MVP scope; keep tests minimal |

---

## Open Questions

None. All acceptance criteria are fully specified in
[`docs/features/001-mvp/specification.md`](./specification.md) and the architecture is
described in [`docs/features/001-mvp/architecture.md`](./architecture.md).
