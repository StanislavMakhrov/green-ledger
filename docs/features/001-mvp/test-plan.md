# Test Plan: GreenLedger MVP (001-mvp)

## Overview

This test plan covers the automated test suite for the GreenLedger MVP. All tests are executed
via `cd src && npm test` (Vitest) and must pass together with a successful `next build`.

**Reference:** [Feature Specification](./specification.md) · [Architecture](./architecture.md)

**Test command:** `cd src && npm test`
**Build command:** `cd src && npm run build`

---

## Test Strategy

| Layer | Scope | Location | Runner |
|-------|-------|----------|--------|
| **Unit** | Pure business logic functions in `src/lib/` | Co-located `*.test.ts` | Vitest |
| **Integration (smoke)** | API Route Handlers (happy-path + key errors) | Co-located `*.test.ts` | Vitest |
| **Build** | TypeScript compilation + Next.js page graph | CI only | `next build` |

> **Out of scope for automated tests:** Full browser E2E (Playwright), PDF visual layout,
> clipboard interactions, Docker Compose bring-up. These are covered by the UAT Test Plan.

### Key Constraints

- `src/` is a greenfield — no pre-existing test infrastructure.
- Route Handler tests use Vitest with mocked Prisma client (via `vi.mock('../../../lib/prisma')`).
- No test database is spun up; all Prisma calls are mocked with `vi.fn()`.
- PDF generation tests use a mocked Puppeteer instance (avoid headless Chromium in CI).
- All tests must be fully automated with no human intervention required.

### Naming Convention

`methodName_scenario_expectedResult`

Examples:

- `calculateDashboardTotals_allScopesHaveRecords_returnsSummedTotals`
- `POST_createSupplier_validBody_returns201WithSupplier`
- `calculateProxyEmissions_spendEurProvided_appliesProxyFactor`

---

## Test Coverage Matrix

| Acceptance Criterion | Test Case(s) | Test Type |
|----------------------|-------------|-----------|
| Dashboard KPI cards populated from DB | TC-01, TC-02, TC-03 | Unit + Smoke |
| Supplier CRUD (create, read, update, delete) | TC-10, TC-11, TC-12, TC-13 | Smoke |
| Token generation per supplier | TC-14, TC-15 | Smoke |
| Public form accessible without auth | TC-20 | Smoke |
| Public form creates Scope3Record with correct fields | TC-21, TC-22 | Smoke |
| Proxy calc: `valueTco2e = spend_eur × PROXY_FACTOR` | TC-30, TC-31 | Unit |
| Proxy calc sets `confidence < 1.0` | TC-32 | Unit |
| Scope 1 records: create and list | TC-40, TC-41 | Smoke |
| Scope 2 records: create and list | TC-42, TC-43 | Smoke |
| Scope 3 category materiality update | TC-50, TC-51 | Smoke |
| Scope 3 records list | TC-52 | Smoke |
| Methodology note upsert | TC-60, TC-61 | Smoke |
| PDF export returns `application/pdf` | TC-70 | Smoke |
| PDF content: cover, summary, breakdown, methodology, assumptions | TC-71, TC-72 | Unit |
| PDF assumptions section filters by dataSource/confidence | TC-73 | Unit |
| AuditTrailEvent created on form submission | TC-80 | Smoke |
| AuditTrailEvent created on record creation | TC-81, TC-82 | Smoke |
| AuditTrailEvent created on PDF export | TC-83 | Smoke |
| PROXY_FACTOR is named constant (not magic number) | TC-33 | Unit |

---

## Unit Tests

### `src/lib/emissions.test.ts` — KPI Aggregation & Proxy Calculation

#### TC-01: `calculateDashboardTotals_allScopesHaveRecords_returnsSummedTotals`

**Type:** Unit
**Covers:** FR-001, Business Rule §1

**Description:**
Verifies that `calculateDashboardTotals()` (or equivalent function in `lib/emissions.ts`) sums
`valueTco2e` across all Scope 1, Scope 2, and Scope 3 records for the given `reportingYear` and
returns the correct grand total.

**Preconditions:** Pure function, no DB. Input is arrays of records.

**Test Steps:**

1. Prepare mock Scope1 records: `[{ valueTco2e: 100 }, { valueTco2e: 50 }]`
2. Prepare mock Scope2 records: `[{ valueTco2e: 200 }]`
3. Prepare mock Scope3 records: `[{ valueTco2e: 300 }, { valueTco2e: 150 }]`
4. Call the aggregation function with the above arrays.
5. Assert return value: `{ scope1: 150, scope2: 200, scope3: 450, total: 800 }`

**Expected Result:** `{ scope1: 150, scope2: 200, scope3: 450, total: 800 }`

---

#### TC-02: `calculateDashboardTotals_noRecords_returnsZeroTotals`

**Type:** Unit
**Covers:** FR-001 (edge case)

**Description:**
Verifies that when there are no emission records the totals all return `0`.

**Test Steps:**

1. Call the aggregation function with three empty arrays.
2. Assert all totals equal `0`.

**Expected Result:** `{ scope1: 0, scope2: 0, scope3: 0, total: 0 }`

---

#### TC-03: `calculateDashboardTotals_onlySomeScopes_returnsPartialSums`

**Type:** Unit
**Covers:** FR-001 (edge case — Scope 3 not yet populated)

**Test Steps:**

1. Pass Scope1: `[{ valueTco2e: 100 }]`, Scope2: `[]`, Scope3: `[]`
2. Assert `{ scope1: 100, scope2: 0, scope3: 0, total: 100 }`

**Expected Result:** `{ scope1: 100, scope2: 0, scope3: 0, total: 100 }`

---

#### TC-30: `calculateProxyEmissions_spendEurProvided_appliesProxyFactor`

**Type:** Unit
**Covers:** FR-005, FR-006, Business Rule §3, AC: "valueTco2e equals spend_eur × PROXY_FACTOR"

**Description:**
Verifies that `calculateProxyEmissions()` (or equivalent in `lib/emissions.ts`) correctly
multiplies `spend_eur` by `PROXY_FACTOR` to produce `valueTco2e`.

**Test Steps:**

1. Import `PROXY_FACTOR` from `lib/constants.ts`.
2. Call `calculateProxyEmissions({ spend_eur: 1000 })`.
3. Assert `valueTco2e === 1000 * PROXY_FACTOR`.

**Expected Result:** `valueTco2e` equals `1000 * 0.4 = 0.4` tCO₂e (using PROXY_FACTOR = 0.4 kgCO₂e/€, converted to tCO₂e).

---

#### TC-31: `calculateProxyEmissions_spendEurZero_returnsZeroTco2e`

**Type:** Unit
**Covers:** FR-006 (boundary)

**Test Steps:**

1. Call `calculateProxyEmissions({ spend_eur: 0 })`.
2. Assert `valueTco2e === 0`.

**Expected Result:** `valueTco2e === 0`

---

#### TC-32: `calculateProxyEmissions_spendEurProvided_setsConfidenceBelowOne`

**Type:** Unit
**Covers:** FR-005, AC: "confidence < 1.0 when only spend_eur is submitted"

**Test Steps:**

1. Call `calculateProxyEmissions({ spend_eur: 500 })`.
2. Assert that the returned `confidence` value is `< 1.0`.
3. Assert that `confidence >= 0`.

**Expected Result:** `0 <= confidence < 1.0`

---

#### TC-33: `PROXY_FACTOR_isNamedConstant_notMagicNumber`

**Type:** Unit
**Covers:** FR-006, NFR-006

**Description:**
Verifies that `PROXY_FACTOR` is exported as a named constant from `lib/constants.ts` with the
correct value (0.4 kgCO₂e/€ per ADR-005), and that `PROXY_FACTOR_SOURCE` is also exported as
a non-empty string.

**Test Steps:**

1. Import `PROXY_FACTOR` and `PROXY_FACTOR_SOURCE` from `lib/constants.ts`.
2. Assert `PROXY_FACTOR === 0.4`.
3. Assert `typeof PROXY_FACTOR_SOURCE === 'string'` and `PROXY_FACTOR_SOURCE.length > 0`.

**Expected Result:** Both constants exist and have expected types/values.

---

### `src/lib/pdf.test.ts` — PDF Content Assembly

#### TC-71: `buildPdfReportData_completeData_includesAllRequiredSections`

**Type:** Unit
**Covers:** FR-011, AC: "PDF contains cover, summary table, Scope 3 breakdown, methodology, assumptions"

**Description:**
Verifies that the PDF data-assembly function (e.g., `buildReportData()` in `lib/pdf.ts`)
includes all five required sections when given a complete dataset.

**Preconditions:** Pure function; no Puppeteer. Pass mock data for company, scope records,
categories, methodology notes, Scope 3 records.

**Test Steps:**

1. Prepare a mock dataset: one company, Scope 1/2/3 records, material categories, methodology
   notes, and one Scope 3 proxy record.

2. Call `buildReportData(mockData)`.
3. Assert the returned object contains keys / sections for: `cover`, `summary`, `scope3Breakdown`,
   `methodology`, `assumptionsDataQuality`.

**Expected Result:** All five sections present and non-empty.

---

#### TC-72: `buildPdfReportData_scope3Breakdown_includesMaterialCategoriesOnly`

**Type:** Unit
**Covers:** FR-011 (Scope 3 breakdown shows material categories only), Business Rule §4

**Test Steps:**

1. Prepare two categories: `C1` (material: true) and `C2` (material: false).
2. Prepare one Scope3Record for each category.
3. Call `buildReportData(mockData)`.
4. Assert `scope3Breakdown` rows contain only C1.
5. Assert there is a note/flag indicating that non-material categories exist.

**Expected Result:** Only material categories in breakdown; non-material existence is flagged.

---

#### TC-73: `buildPdfReportData_assumptionsSection_filtersCorrectly`

**Type:** Unit
**Covers:** FR-011, AC: "PDF assumptions section lists proxy/confidence<1/non-empty assumptions"

**Description:**
Verifies that the assumptions & data quality section correctly includes only records where
`dataSource === "proxy"` OR `confidence < 1` OR `assumptions` is non-empty.

**Test Steps:**

1. Create four mock Scope3Records:

   - Record A: `{ dataSource: "proxy", confidence: 0.5, assumptions: "spend-based" }`
   - Record B: `{ dataSource: "supplier_form", confidence: 0.8, assumptions: "" }`
   - Record C: `{ dataSource: "supplier_form", confidence: 1.0, assumptions: "manual correction" }`
   - Record D: `{ dataSource: "supplier_form", confidence: 1.0, assumptions: "" }`
2. Call `buildReportData(mockData)` using these four records.
3. Assert `assumptionsDataQuality` includes Records A, B, and C.
4. Assert `assumptionsDataQuality` does NOT include Record D.

**Expected Result:** Records A, B, C included; Record D excluded.

---

### `src/lib/audit.test.ts` — Audit Trail Helper

#### TC-80 (Unit-level): `createAuditEvent_validInput_returnsEventShape`

**Type:** Unit
**Covers:** FR-012

**Description:**
Verifies that `createAuditEvent()` in `lib/audit.ts` constructs an audit event object with the
correct shape before persisting.

**Test Steps:**

1. Mock `prisma.auditTrailEvent.create` with `vi.fn()`.
2. Call `createAuditEvent({ entityType: "supplier", entityId: "abc", action: "created", actor: "user", companyId: "cid" })`.
3. Assert that `prisma.auditTrailEvent.create` was called with the correct `data` shape.
4. Assert that `timestamp` is a recent `Date`.

**Expected Result:** Prisma create called with correct fields; timestamp present.

---

## Integration / Smoke Tests

> All route handler tests mock the Prisma client with `vi.mock('../../../lib/prisma')` (or
> relative path equivalent). Puppeteer is also mocked for PDF tests. Tests verify: request
> parsing, business-logic delegation, response status codes, and response body shape.

### Dashboard API — `src/app/api/dashboard/route.test.ts`

#### TC-04: `GET_dashboard_recordsExist_returns200WithTotals`

**Type:** Smoke (Route Handler)
**Covers:** FR-001, AC: "dashboard displays Scope 1, Scope 2, Scope 3, and Total KPI cards"

**Test Steps:**

1. Mock `prisma.company.findFirst` → returns demo company with `reportingYear: 2024`.
2. Mock `prisma.scope1Record.findMany` → returns `[{ valueTco2e: 100 }]`.
3. Mock `prisma.scope2Record.findMany` → returns `[{ valueTco2e: 200 }]`.
4. Mock `prisma.scope3Record.findMany` → returns `[{ valueTco2e: 300 }]`.
5. Call `GET /api/dashboard`.
6. Assert HTTP 200.
7. Assert body: `{ data: { scope1: 100, scope2: 200, scope3: 300, total: 600 } }`.

**Expected Result:** 200 with correct totals.

---

#### TC-05: `GET_dashboard_noCompany_returns500`

**Type:** Smoke (Route Handler)
**Covers:** Error handling

**Test Steps:**

1. Mock `prisma.company.findFirst` → returns `null`.
2. Call `GET /api/dashboard`.
3. Assert HTTP 500 with `{ error: ... }`.

**Expected Result:** 500 error response.

---

### Suppliers API — `src/app/api/suppliers/route.test.ts`

#### TC-10: `GET_listSuppliers_suppliersExist_returns200WithArray`

**Type:** Smoke
**Covers:** FR-002

**Test Steps:**

1. Mock `prisma.supplier.findMany` → returns array of two suppliers.
2. Call `GET /api/suppliers`.
3. Assert HTTP 200, body `{ data: [...] }` with 2 items.

---

#### TC-11: `POST_createSupplier_validBody_returns201WithSupplier`

**Type:** Smoke
**Covers:** FR-002

**Test Steps:**

1. Mock `prisma.company.findFirst` → demo company.
2. Mock `prisma.supplier.create` → returns created supplier object.
3. Call `POST /api/suppliers` with valid body `{ name, country, sector, contactEmail, status }`.
4. Assert HTTP 201, body `{ data: { id, name, ... } }`.

---

#### TC-12: `POST_createSupplier_missingName_returns400`

**Type:** Smoke
**Covers:** FR-002, error handling

**Test Steps:**

1. Call `POST /api/suppliers` with body missing `name`.
2. Assert HTTP 400 with `{ error: ... }`.

---

#### TC-13: `DELETE_deleteSupplier_validId_returns200`

**Type:** Smoke
**Covers:** FR-002

**Test Steps:**

1. Mock `prisma.supplier.delete` → returns deleted supplier.
2. Call `DELETE /api/suppliers/[id]` with valid UUID.
3. Assert HTTP 200.

---

### Supplier Token API — `src/app/api/suppliers/[id]/token/route.test.ts`

#### TC-14: `POST_generateToken_validSupplier_returns200WithToken`

**Type:** Smoke
**Covers:** FR-003, AC: "publicFormToken can be generated/refreshed"

**Test Steps:**

1. Mock `prisma.supplier.update` → returns supplier with new `publicFormToken`.
2. Call `POST /api/suppliers/[id]/token`.
3. Assert HTTP 200, body `{ data: { publicFormToken: "<uuid>" } }`.
4. Assert `publicFormToken` is a non-empty string.

---

#### TC-15: `POST_generateToken_supplierNotFound_returns404`

**Type:** Smoke
**Covers:** FR-003, error handling

**Test Steps:**

1. Mock `prisma.supplier.findUnique` → returns `null`.
2. Call `POST /api/suppliers/[id]/token` with unknown id.
3. Assert HTTP 404.

---

### Public Supplier Form API — `src/app/api/public/supplier/[token]/route.test.ts`

#### TC-20: `GET_publicSupplierInfo_validToken_returns200WithSupplierName`

**Type:** Smoke
**Covers:** FR-004, AC: "public form accessible without auth"

**Test Steps:**

1. Mock `prisma.supplier.findUnique` → returns supplier with matching token.
2. Call `GET /api/public/supplier/[token]`.
3. Assert HTTP 200, body includes supplier name (for display in form).

---

#### TC-20b: `GET_publicSupplierInfo_invalidToken_returns404`

**Type:** Smoke
**Covers:** FR-004, error handling

**Test Steps:**

1. Mock `prisma.supplier.findUnique` → returns `null`.
2. Call `GET /api/public/supplier/[invalid-token]`.
3. Assert HTTP 404.

---

### Public Supplier Form Submit API — `src/app/api/public/supplier/[token]/submit/route.test.ts`

#### TC-21: `POST_submitSupplierForm_spendEurProvided_createsScope3RecordWithProxy`

**Type:** Smoke
**Covers:** FR-005, FR-006, AC: "submitting form creates Scope3Record with correct fields"

**Test Steps:**

1. Mock `prisma.supplier.findUnique` → returns demo supplier.
2. Mock `prisma.company.findFirst` → returns demo company.
3. Mock `prisma.scope3Category.findFirst` → returns C1 (Purchased Goods & Services).
4. Mock `prisma.scope3Record.create` → captures call args; returns created record.
5. Mock `prisma.auditTrailEvent.create` → captures call args.
6. Call `POST /api/public/supplier/[token]/submit` with `{ spend_eur: 1000 }`.
7. Assert HTTP 201.
8. Assert `prisma.scope3Record.create` called with:

   - `dataSource: "supplier_form"`
   - `calculationMethod: "spend_based"`
   - `valueTco2e === 1000 * PROXY_FACTOR` (converted to tCO₂e)
   - `confidence < 1.0`
   - `assumptions` non-empty string
   - `activityDataJson` contains `{ spend_eur: 1000 }`
   - `supplierId` equal to supplier's id

---

#### TC-22: `POST_submitSupplierForm_noActivityData_returns400`

**Type:** Smoke
**Covers:** FR-004, FR-005, error handling

**Test Steps:**

1. Call `POST /api/public/supplier/[token]/submit` with empty body `{}`.
2. Assert HTTP 400 with `{ error: ... }`.

---

#### TC-23: `POST_submitSupplierForm_createsAuditTrailEvent`

**Type:** Smoke
**Covers:** FR-012, AC: "AuditTrailEvent recorded for form submission"

**Test Steps:**

1. (Same mocks as TC-21.)
2. Call `POST /api/public/supplier/[token]/submit` with `{ spend_eur: 500 }`.
3. Assert `prisma.auditTrailEvent.create` was called with:

   - `entityType: "scope3"`
   - `action: "submitted"`
   - `actor: "supplier"`

---

### Scope 1 API — `src/app/api/scope1/route.test.ts`

#### TC-40: `GET_listScope1Records_returns200WithArray`

**Type:** Smoke
**Covers:** FR-007

**Test Steps:**

1. Mock `prisma.scope1Record.findMany` → returns array with one record.
2. Call `GET /api/scope1`.
3. Assert HTTP 200, body `{ data: [...] }`.

---

#### TC-41: `POST_createScope1Record_validBody_returns201`

**Type:** Smoke
**Covers:** FR-007, AC: "Scope 1 records can be added"

**Test Steps:**

1. Mock `prisma.company.findFirst` → demo company.
2. Mock `prisma.scope1Record.create` → returns created record.
3. Mock `prisma.auditTrailEvent.create` → ok.
4. Call `POST /api/scope1` with `{ periodYear: 2024, valueTco2e: 120.5, calculationMethod: "combustion", emissionFactorsSource: "DEFRA 2023" }`.
5. Assert HTTP 201, body `{ data: { id, valueTco2e: 120.5, ... } }`.

---

#### TC-41b: `POST_createScope1Record_invalidValueTco2e_returns400`

**Type:** Smoke
**Covers:** FR-007, error handling

**Test Steps:**

1. Call `POST /api/scope1` with `valueTco2e: "not-a-number"`.
2. Assert HTTP 400.

---

### Scope 2 API — `src/app/api/scope2/route.test.ts`

#### TC-42: `GET_listScope2Records_returns200WithArray`

**Type:** Smoke
**Covers:** FR-008

**Test Steps:**

1. Mock `prisma.scope2Record.findMany` → returns one record.
2. Call `GET /api/scope2`.
3. Assert HTTP 200.

---

#### TC-43: `POST_createScope2Record_validBody_returns201`

**Type:** Smoke
**Covers:** FR-008, AC: "Scope 2 records can be added"

**Test Steps:**

1. Mock `prisma.company.findFirst` → demo company.
2. Mock `prisma.scope2Record.create` → returns record.
3. Call `POST /api/scope2` with valid body.
4. Assert HTTP 201.

---

### Scope 3 Categories API — `src/app/api/scope3/categories/route.test.ts` and `[id]/route.test.ts`

#### TC-50: `GET_listScope3Categories_returns200With15Categories`

**Type:** Smoke
**Covers:** FR-009

**Test Steps:**

1. Mock `prisma.scope3Category.findMany` → returns array of 15 categories.
2. Call `GET /api/scope3/categories`.
3. Assert HTTP 200, body `{ data: [...] }` with 15 items.

---

#### TC-51: `PUT_updateCategoryMateriality_validBody_returns200`

**Type:** Smoke
**Covers:** FR-009, AC: "Scope 3 category materiality can be toggled"

**Test Steps:**

1. Mock `prisma.scope3Category.update` → returns updated category.
2. Call `PUT /api/scope3/categories/[id]` with `{ material: true, materialityReason: "Largest emission source" }`.
3. Assert HTTP 200, body includes `material: true`.

---

### Scope 3 Records API — `src/app/api/scope3/records/route.test.ts`

#### TC-52: `GET_listScope3Records_returns200WithArray`

**Type:** Smoke
**Covers:** FR-009

**Test Steps:**

1. Mock `prisma.scope3Record.findMany` → returns records with `include: { supplier, category }`.
2. Call `GET /api/scope3/records`.
3. Assert HTTP 200, body `{ data: [...] }`.

---

### Methodology API — `src/app/api/methodology/route.test.ts` and `[scope]/route.test.ts`

#### TC-60: `GET_listMethodologyNotes_returns200WithNotes`

**Type:** Smoke
**Covers:** FR-010

**Test Steps:**

1. Mock `prisma.methodologyNote.findMany` → returns array with three notes.
2. Call `GET /api/methodology`.
3. Assert HTTP 200.

---

#### TC-61: `PUT_upsertMethodologyNote_validScope_returns200WithUpdatedNote`

**Type:** Smoke
**Covers:** FR-010, AC: "methodology notes can be edited and saved for all three scopes"

**Test Steps:**

1. Mock `prisma.company.findFirst` → demo company.
2. Mock `prisma.methodologyNote.upsert` → returns updated note.
3. Call `PUT /api/methodology/scope_3` with `{ text: "Spend-based proxy using DEFRA EFs." }`.
4. Assert HTTP 200, body `{ data: { scope: "scope_3", text: "Spend-based proxy..." } }`.

---

#### TC-61b: `PUT_upsertMethodologyNote_invalidScope_returns400`

**Type:** Smoke
**Covers:** FR-010, error handling

**Test Steps:**

1. Call `PUT /api/methodology/scope_4` (invalid scope).
2. Assert HTTP 400.

---

### PDF Export API — `src/app/api/export/pdf/route.test.ts`

#### TC-70: `POST_exportPdf_happyPath_returns200WithApplicationPdf`

**Type:** Smoke
**Covers:** FR-011, AC: "exported PDF contains all required sections"

**Description:**
Verifies that the PDF export endpoint returns a binary response with the correct Content-Type.
Puppeteer is mocked to return a dummy `Buffer`.

**Test Steps:**

1. Mock all Prisma calls (`company.findFirst`, `scope1Record.findMany`, etc.) with demo data.
2. Mock Puppeteer / `generatePdf()` helper to return `Buffer.from("PDF")`.
3. Mock `prisma.auditTrailEvent.create`.
4. Call `POST /api/export/pdf`.
5. Assert HTTP 200.
6. Assert response header `Content-Type: application/pdf`.

---

#### TC-83: `POST_exportPdf_createsAuditTrailEvent`

**Type:** Smoke
**Covers:** FR-012, AC: "AuditTrailEvent recorded for PDF export"

**Test Steps:**

1. (Same mocks as TC-70.)
2. Call `POST /api/export/pdf`.
3. Assert `prisma.auditTrailEvent.create` called with:

   - `entityType: "export"`
   - `action: "exported"`
   - `actor: "user"`

---

### Audit Trail — Additional Smoke Tests

#### TC-81: `POST_createScope1Record_createsAuditTrailEvent`

**Type:** Smoke
**Covers:** FR-012, AC: "AuditTrailEvent recorded for record creation"

**Test Steps:**

1. (Same mocks as TC-41.)
2. Call `POST /api/scope1` with valid body.
3. Assert `prisma.auditTrailEvent.create` called with:

   - `entityType: "scope1"`
   - `action: "created"`
   - `actor: "user"`

---

#### TC-82: `POST_createSupplier_createsAuditTrailEvent`

**Type:** Smoke
**Covers:** FR-012

**Test Steps:**

1. (Same mocks as TC-11.)
2. Call `POST /api/suppliers` with valid body.
3. Assert `prisma.auditTrailEvent.create` called with:

   - `entityType: "supplier"`
   - `action: "created"`
   - `actor: "user"`

---

## Edge Cases

| Scenario | Expected Behaviour | Test Case |
|----------|--------------------|-----------|
| No Company row in DB | API returns HTTP 500 | TC-05 |
| Form submitted with no activity fields | HTTP 400 validation error | TC-22 |
| Invalid supplier token on public form | HTTP 404 | TC-20b |
| Supplier token not found on DELETE | HTTP 404 | TC-15 |
| `spend_eur = 0` | `valueTco2e = 0`, still creates record | TC-31 |
| Methodology note for invalid scope | HTTP 400 | TC-61b |
| Scope 1 record with non-numeric `valueTco2e` | HTTP 400 | TC-41b |
| Dashboard with zero records for a scope | Returns 0 for that scope | TC-02, TC-03 |
| PDF assumptions section with no qualifying records | Returns empty array (no error) | TC-73 |

---

## Test Data Requirements

No test data files are required. All data is supplied inline within each test using `vi.fn()`
mock return values. This avoids test database setup and keeps tests fast and deterministic.

---

## Non-Functional Tests

### NFR-001 / NFR-005: TypeScript + Lint (CI enforced)

Verified by `npm run lint` and `npm run type-check` in `pr-validation.yml`. Not part of Vitest
suite but required to pass CI.

### NFR-002: `next build` Passes

Verified by `npm run build` in `pr-validation.yml`. Catches incorrect TypeScript in page
components and route handlers that unit tests don't cover.

### NFR-007: Performance (Demo-Level)

Not automatically tested in Vitest. Covered by UAT: the UAT tester verifies dashboard loads
within 3 seconds and PDF generates within 10 seconds with seed data.

---

## Open Questions

1. **`calculateProxyEmissions` unit:** The architecture shows the proxy logic lives in
   `lib/emissions.ts`. If the proxy calculation is performed inline in the route handler rather
   than extracted into a testable function, TC-30/31/32 must be adjusted to test the
   submit-route handler directly with mocked Prisma. The plan prefers a dedicated helper.

2. **PDF HTML builder:** TC-71/72/73 assume a `buildReportData()` pure function. If the PDF
   template is built directly inside `lib/pdf.ts` without a separately testable data-assembly
   step, these tests should be adapted to verify the intermediate HTML string output rather than
   a data object.

3. **PROXY_FACTOR unit conversion:** The spec says PROXY_FACTOR = 0.4 kgCO₂e/€. TC-30 expects
   the result in tCO₂e (divide by 1000). The exact conversion should be confirmed in ADR-005 and
   reflected in the implementation.

---

## Test File Locations (Proposed)

```
src/
├── lib/
│   ├── emissions.test.ts       ← TC-01–03, TC-30–33
│   ├── pdf.test.ts             ← TC-71–73
│   └── audit.test.ts           ← TC-80 (unit portion)
└── app/
    └── api/
        ├── dashboard/
        │   └── route.test.ts   ← TC-04, TC-05
        ├── suppliers/
        │   ├── route.test.ts   ← TC-10–12, TC-82
        │   └── [id]/
        │       ├── route.test.ts       ← TC-13
        │       └── token/
        │           └── route.test.ts   ← TC-14, TC-15
        ├── scope1/
        │   └── route.test.ts   ← TC-40, TC-41, TC-41b, TC-81
        ├── scope2/
        │   └── route.test.ts   ← TC-42, TC-43
        ├── scope3/
        │   ├── categories/
        │   │   └── route.test.ts   ← TC-50
        │   │   └── [id]/
        │   │       └── route.test.ts ← TC-51
        │   └── records/
        │       └── route.test.ts   ← TC-52
        ├── methodology/
        │   ├── route.test.ts       ← TC-60
        │   └── [scope]/
        │       └── route.test.ts   ← TC-61, TC-61b
        ├── export/
        │   └── pdf/
        │       └── route.test.ts   ← TC-70, TC-83
        └── public/
            └── supplier/
                └── [token]/
                    ├── route.test.ts       ← TC-20, TC-20b
                    └── submit/
                        └── route.test.ts   ← TC-21, TC-22, TC-23
```
