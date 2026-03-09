# Test Plan: GreenLedger MVP

## Overview

This test plan covers automated testing for the GreenLedger MVP (`docs/features/001-mvp/specification.md`).
The MVP is a Next.js full-stack application providing CSRD climate reporting for German SMEs, with features spanning a management dashboard, supplier CRUD, Scope 1/2/3 emission records, a public supplier form, PDF export, and an audit trail.

Tests are written with **Vitest** and live alongside source files in `src/`. They are executed via:

```bash
cd src && npm test
```

The primary testing objective is to verify the core business logic and API route contracts that underpin the 5-minute demo flow, keeping tests minimal but meaningful for an MVP.

---

## Testing Strategy

| Layer | Tool | Scope | Location |
|-------|------|-------|----------|
| **Unit** | Vitest | Pure business-logic functions (proxy calculations, audit helpers, utils, constants) | `src/lib/**/*.test.ts` |
| **API Smoke** | Vitest + Prisma mock | Route handler request/response contracts, status codes, and payload shapes | `src/app/api/**/*.test.ts` |
| **Integration (optional)** | Vitest + in-memory SQLite | End-to-end flow through route handler → Prisma → DB | `src/tests/integration/` |
| **Build smoke** | `next build` | TypeScript strict, no import errors, no static-generation failures | CI only |

> **Prisma Mocking Strategy:** Route handler tests use a Vitest `vi.mock('../../../lib/prisma')` approach, replacing Prisma calls with `vi.fn()` stubs. This avoids needing a live DB in CI while still verifying handler logic, validation, status codes, and response shapes.

### Coverage Targets

| Area | Target |
|------|--------|
| `src/lib/` business logic | ≥ 90 % statement coverage |
| API route handlers | ≥ 80 % statement coverage (happy path + key error paths) |
| Overall | ≥ 75 % statement coverage |

---

## Test Coverage Matrix

| Acceptance Criterion (from specification.md) | Test Case(s) | Test Type |
|----------------------------------------------|--------------|-----------|
| Dashboard returns correct scope totals | TC-01, TC-02, TC-03 | API Smoke |
| Dashboard shows zero values when no records exist | TC-04 | API Smoke |
| Supplier list returns all suppliers | TC-05 | API Smoke |
| Create supplier persists record and generates token | TC-06, TC-07 | API Smoke |
| Update supplier changes fields | TC-08 | API Smoke |
| Delete supplier removes record | TC-09 | API Smoke |
| Refresh token invalidates old token | TC-10 | API Smoke |
| Scope 1 record creation | TC-11, TC-12 | API Smoke |
| Scope 1 record deletion | TC-13 | API Smoke |
| Scope 2 record creation | TC-14, TC-15 | API Smoke |
| Scope 2 record deletion | TC-16 | API Smoke |
| Scope 3 categories list returns 15 entries | TC-17 | API Smoke |
| Scope 3 category materiality update | TC-18 | API Smoke |
| Scope 3 record creation | TC-19, TC-20 | API Smoke |
| Scope 3 record deletion | TC-21 | API Smoke |
| Public supplier form: valid token returns supplier info | TC-22 | API Smoke |
| Public supplier form: invalid token returns 404 | TC-23 | API Smoke |
| Supplier form submission creates Scope 3 record | TC-24 | API Smoke |
| Proxy calculation: spend_eur × PROXY_FACTOR | TC-25, TC-26 | Unit |
| Proxy assumptions documented in Scope 3 record | TC-27 | API Smoke |
| Proxy confidence < 1.0 | TC-28, TC-28b | Unit, API Smoke |
| ton_km and waste_kg also produce estimates | TC-29, TC-30 | Unit |
| Activity data stored in activityDataJson | TC-31 | API Smoke |
| Audit event created for supplier create | TC-32 | API Smoke |
| Audit event created for supplier form submit (actor=supplier) | TC-33 | API Smoke |
| Audit event created for PDF export (actor=user, action=exported) | TC-34 | API Smoke |
| Methodology note upsert | TC-35, TC-36 | API Smoke |
| PDF export returns application/pdf | TC-37 | API Smoke |
| PDF export returns non-empty binary | TC-38 | API Smoke |
| Invalid token on public form shows error | TC-23 | API Smoke |
| Missing required fields return 400 | TC-39–TC-43 | API Smoke |
| formatTco2e utility formats correctly | TC-44 | Unit |
| PROXY_FACTOR constants correct values | TC-45 | Unit |

---

## Unit Tests

### TC-01 to TC-04 — `src/lib/` Unit Tests

These tests have **no Prisma dependency** — they test pure functions exported from `src/lib/`.

---

### TC-25: `calculateProxyTco2e_withSpendEur_returnsSpendTimesProxyFactor`

**Type:** Unit
**File:** `src/lib/proxy.test.ts` (or `src/lib/constants.test.ts`)

**Description:**
Verifies the core proxy calculation: `tCO₂e = spend_eur × PROXY_FACTOR_SPEND`.

**Test Steps:**
1. Import `PROXY_FACTOR_SPEND` from `src/lib/constants.ts`
2. Call the proxy calculation logic with `spend_eur = 1000`
3. Assert result equals `1000 × 0.233 = 233`

**Expected Result:** `233` (tCO₂e)

**Test Data:** `spend_eur = 1000`, `PROXY_FACTOR_SPEND = 0.233`

---

### TC-26: `calculateProxyTco2e_withZeroSpend_returnsZero`

**Type:** Unit

**Description:**
Verifies edge case: zero spend results in zero tCO₂e.

**Test Steps:**
1. Call proxy calculation with `spend_eur = 0`
2. Assert result equals `0`

**Expected Result:** `0`

---

### TC-27: `buildProxyAssumptions_withSpendEur_includesFactorAndSource`

**Type:** Unit

**Description:**
Verifies that the assumptions string generated for a spend-based proxy record documents the factor value and its placeholder status.

**Test Steps:**
1. Call the helper that builds the `assumptions` string for a spend-based proxy
2. Assert the returned string contains the `PROXY_FACTOR_SPEND` value (`0.233`)
3. Assert the string contains a reference to the factor source description

**Expected Result:** Assumptions string mentions `0.233` and the documented source string.

---

### TC-28: `proxyConfidence_isLessThanOne`

**Type:** Unit

**Description:**
Verifies that the confidence value used for proxy-based Scope 3 records is always `< 1.0`.

**Test Steps:**
1. Import `PROXY_CONFIDENCE` (or the proxy record builder) from `src/lib/constants.ts`
2. Assert the value is strictly less than `1.0`
3. Assert the value is greater than `0.0`

**Expected Result:** `0 < confidence < 1`

---

### TC-29: `calculateProxyTco2e_withTonKm_returnsEstimate`

**Type:** Unit

**Description:**
Verifies proxy calculation for `ton_km` activity data using `PROXY_FACTOR_TON_KM`.

**Test Steps:**
1. Call proxy calculation with `ton_km = 500`
2. Assert result equals `500 × PROXY_FACTOR_TON_KM`
3. Assert result is `> 0`

**Expected Result:** Positive tCO₂e value computed from ton_km input.

---

### TC-30: `calculateProxyTco2e_withWasteKg_returnsEstimate`

**Type:** Unit

**Description:**
Verifies proxy calculation for `waste_kg` activity data using `PROXY_FACTOR_WASTE_KG`.

**Test Steps:**
1. Call proxy calculation with `waste_kg = 200`
2. Assert result equals `200 × PROXY_FACTOR_WASTE_KG`
3. Assert result is `> 0`

**Expected Result:** Positive tCO₂e value computed from waste_kg input.

---

### TC-44: `formatTco2e_withDecimalValue_returnsFormattedString`

**Type:** Unit
**File:** `src/lib/utils.test.ts`

**Description:**
Verifies `formatTco2e()` formats a float tCO₂e value correctly (e.g., rounds to 2 decimal places).

**Test Steps:**
1. Import `formatTco2e` from `src/lib/utils.ts`
2. Call `formatTco2e(1.2345)`
3. Assert result is a string matching the expected display format (e.g., `"1.23"`)

**Expected Result:** Formatted string representation of the value.

---

### TC-45: `constants_proxyFactorSpend_isDocumentedDemoValue`

**Type:** Unit
**File:** `src/lib/constants.test.ts`

**Description:**
Verifies `PROXY_FACTOR_SPEND` equals the documented demo placeholder value `0.233`.

**Test Steps:**
1. Import `PROXY_FACTOR_SPEND` from `src/lib/constants.ts`
2. Assert `PROXY_FACTOR_SPEND === 0.233`

**Expected Result:** `0.233`

---

## API Smoke Tests

All API smoke tests use **Vitest** with Prisma mocked via `vi.mock`. Each test:
1. Imports the route handler directly
2. Constructs a mock `NextRequest` (or uses a helper)
3. Asserts the response status code and JSON body shape

### Dashboard API

#### TC-01: `GET_dashboard_withRecords_returnsScopeTotals`

**Type:** API Smoke
**File:** `src/app/api/dashboard/route.test.ts`

**Description:**
Verifies the dashboard endpoint aggregates Scope 1, 2, and 3 totals correctly.

**Preconditions:**
- Prisma mock returns:
  - `Scope1Record`: `[{ valueTco2e: 10 }, { valueTco2e: 20 }]` → sum = 30
  - `Scope2Record`: `[{ valueTco2e: 5 }]` → sum = 5
  - `Scope3Record`: `[{ valueTco2e: 15 }, { valueTco2e: 10 }]` → sum = 25
  - `Company`: `{ reportingYear: 2024 }`

**Test Steps:**
1. Mock Prisma `findMany` for Scope1Record, Scope2Record, Scope3Record
2. Mock Prisma `findUnique` for Company
3. Call `GET(request)`
4. Assert status `200`
5. Assert body `{ scope1: 30, scope2: 5, scope3: 25, total: 60, reportingYear: 2024 }`

**Expected Result:** HTTP 200 with correct aggregated totals.

---

#### TC-02: `GET_dashboard_filtersRecordsByReportingYear`

**Type:** API Smoke

**Description:**
Verifies that totals only include records matching `Company.reportingYear`, not records from other years.

**Preconditions:**
- Prisma mock for Scope1Record `findMany` called with `where: { periodYear: 2024 }`

**Test Steps:**
1. Capture the Prisma `findMany` call arguments
2. Assert the `where` clause includes `periodYear: reportingYear`

**Expected Result:** Prisma query filtered by `periodYear`.

---

#### TC-03: `GET_dashboard_calculatesTotal_asSumOfAllScopes`

**Type:** API Smoke

**Description:**
Verifies that `total = scope1 + scope2 + scope3`.

**Test Steps:**
1. Mock Scope1 sum = 10, Scope2 sum = 20, Scope3 sum = 30
2. Assert response `total === 60`

**Expected Result:** `total` equals the arithmetic sum of all three scopes.

---

#### TC-04: `GET_dashboard_withNoRecords_returnsZeroTotals`

**Type:** API Smoke

**Description:**
Verifies that when no records exist, the dashboard returns `0` for all scopes (not null, undefined, or an error).

**Preconditions:**
- All Prisma `findMany` mocks return `[]`

**Test Steps:**
1. Call `GET(request)`
2. Assert status `200`
3. Assert body `{ scope1: 0, scope2: 0, scope3: 0, total: 0 }`

**Expected Result:** HTTP 200 with all-zero totals.

---

### Supplier API

#### TC-05: `GET_suppliers_returnsAllSuppliers`

**Type:** API Smoke
**File:** `src/app/api/suppliers/route.test.ts`

**Description:**
Verifies the list endpoint returns all suppliers in the array.

**Preconditions:**
- Prisma `findMany` returns two seeded supplier records

**Test Steps:**
1. Call `GET(request)`
2. Assert status `200`
3. Assert response body is an array with 2 items
4. Assert each item has `id`, `name`, `country`, `sector`, `contactEmail`, `publicFormToken`, `status`

**Expected Result:** HTTP 200 with array of suppliers.

---

#### TC-06: `POST_suppliers_withValidBody_createsSupplierAndReturns201`

**Type:** API Smoke

**Description:**
Verifies a new supplier is created when all required fields are provided.

**Preconditions:**
- Prisma `create` mock returns a new supplier record

**Test Steps:**
1. POST `{ name: "Acme GmbH", country: "DE", sector: "Manufacturing", contactEmail: "contact@acme.de" }`
2. Assert status `201`
3. Assert response body contains `name: "Acme GmbH"` and a non-empty `publicFormToken`
4. Assert Prisma `create` was called with `companyId: DEMO_COMPANY_ID`

**Expected Result:** HTTP 201 with created supplier including a generated token.

---

#### TC-07: `POST_suppliers_generatesUniquePublicFormToken`

**Type:** API Smoke

**Description:**
Verifies a `publicFormToken` is generated and included in the created supplier.

**Test Steps:**
1. POST a valid supplier body
2. Assert the Prisma `create` call includes `publicFormToken` as a non-empty UUID-format string

**Expected Result:** Token is a UUID-format string (matches `/^[0-9a-f-]{36}$/`).

---

#### TC-08: `PUT_suppliers_id_withValidBody_updatesSupplier`

**Type:** API Smoke
**File:** `src/app/api/suppliers/[id]/route.test.ts`

**Description:**
Verifies updating a supplier's details.

**Preconditions:**
- Prisma `findUnique` returns existing supplier
- Prisma `update` mock returns updated supplier

**Test Steps:**
1. PUT `{ name: "Updated Name", status: "inactive" }` to `/api/suppliers/[id]`
2. Assert status `200`
3. Assert response body contains `name: "Updated Name"` and `status: "inactive"`

**Expected Result:** HTTP 200 with updated supplier record.

---

#### TC-09: `DELETE_suppliers_id_removesSupplier`

**Type:** API Smoke

**Description:**
Verifies deleting a supplier returns success.

**Test Steps:**
1. Call `DELETE` on `/api/suppliers/[id]`
2. Assert status `200`
3. Assert response body is `{ success: true }`

**Expected Result:** HTTP 200 `{ success: true }`.

---

#### TC-10: `POST_suppliers_id_refreshToken_returnsNewToken`

**Type:** API Smoke
**File:** `src/app/api/suppliers/[id]/refresh-token/route.test.ts`

**Description:**
Verifies that refreshing a token generates a new UUID and saves it.

**Preconditions:**
- Prisma `update` returns the supplier with a new token

**Test Steps:**
1. POST to `/api/suppliers/[id]/refresh-token`
2. Assert status `200`
3. Assert response body contains `publicFormToken` as a UUID string
4. Assert Prisma `update` was called with a new `publicFormToken` value

**Expected Result:** HTTP 200 with new `publicFormToken`.

---

### Scope 1 API

#### TC-11: `POST_scope1_withValidBody_createsRecord`

**Type:** API Smoke
**File:** `src/app/api/scope1/route.test.ts`

**Description:**
Verifies a Scope 1 record is created with all required fields.

**Test Steps:**
1. POST `{ periodYear: 2024, valueTco2e: 12.5, calculationMethod: "combustion", emissionFactorsSource: "IPCC", dataSource: "manual" }`
2. Assert status `201`
3. Assert response body contains `valueTco2e: 12.5` and `companyId: DEMO_COMPANY_ID`

**Expected Result:** HTTP 201 with created Scope 1 record.

---

#### TC-12: `POST_scope1_createsAuditTrailEvent`

**Type:** API Smoke

**Description:**
Verifies that creating a Scope 1 record produces an AuditTrailEvent.

**Test Steps:**
1. POST a valid Scope 1 body
2. Assert `createAuditEvent` (or Prisma `AuditTrailEvent.create`) was called with:
   - `entityType: "scope1"`
   - `action: "created"`
   - `actor: "user"`

**Expected Result:** Audit event created with correct fields.

---

#### TC-13: `DELETE_scope1_id_removesRecord`

**Type:** API Smoke
**File:** `src/app/api/scope1/[id]/route.test.ts`

**Description:**
Verifies deleting a Scope 1 record returns success.

**Test Steps:**
1. Call `DELETE` on `/api/scope1/[id]`
2. Assert status `200`
3. Assert response body `{ success: true }`

**Expected Result:** HTTP 200 `{ success: true }`.

---

### Scope 2 API

#### TC-14: `POST_scope2_withValidBody_createsRecord`

**Type:** API Smoke
**File:** `src/app/api/scope2/route.test.ts`

**Description:**
Verifies a Scope 2 record is created (location-based method).

**Test Steps:**
1. POST `{ periodYear: 2024, valueTco2e: 8.0, calculationMethod: "location-based", emissionFactorsSource: "IEA", dataSource: "manual" }`
2. Assert status `201`
3. Assert response body contains `valueTco2e: 8.0`

**Expected Result:** HTTP 201 with created Scope 2 record.

---

#### TC-15: `POST_scope2_createsAuditTrailEvent`

**Type:** API Smoke

**Description:**
Verifies that creating a Scope 2 record produces an AuditTrailEvent with `entityType: "scope2"`.

**Test Steps:**
1. POST a valid Scope 2 body
2. Assert audit event was created with `entityType: "scope2"`, `action: "created"`

**Expected Result:** Audit event created.

---

#### TC-16: `DELETE_scope2_id_removesRecord`

**Type:** API Smoke
**File:** `src/app/api/scope2/[id]/route.test.ts`

**Description:**
Verifies deleting a Scope 2 record returns success.

**Test Steps:**
1. Call `DELETE` on `/api/scope2/[id]`
2. Assert status `200` and `{ success: true }`

**Expected Result:** HTTP 200 `{ success: true }`.

---

### Scope 3 API

#### TC-17: `GET_scope3Categories_returnsAllFifteenCategories`

**Type:** API Smoke
**File:** `src/app/api/scope3/categories/route.test.ts`

**Description:**
Verifies the categories endpoint returns all 15 ESRS Scope 3 categories.

**Preconditions:**
- Prisma mock returns 15 seeded category records

**Test Steps:**
1. Call `GET` on `/api/scope3/categories`
2. Assert status `200`
3. Assert response body is an array with exactly 15 items
4. Assert codes span `"C1"` through `"C15"`

**Expected Result:** HTTP 200, array of 15 categories.

---

#### TC-18: `PUT_scope3Categories_id_updatesMateriality`

**Type:** API Smoke
**File:** `src/app/api/scope3/categories/[id]/route.test.ts`

**Description:**
Verifies marking a category as material with a reason.

**Test Steps:**
1. PUT `{ material: true, materialityReason: "Highest spend category" }`
2. Assert status `200`
3. Assert response body `material: true` and `materialityReason: "Highest spend category"`

**Expected Result:** HTTP 200 with updated category.

---

#### TC-19: `POST_scope3Records_withValidBody_createsRecord`

**Type:** API Smoke
**File:** `src/app/api/scope3/records/route.test.ts`

**Description:**
Verifies a Scope 3 record is created with all required fields.

**Test Steps:**
1. POST `{ categoryId: "cat-c1", periodYear: 2024, valueTco2e: 50.0, calculationMethod: "spend_based", emissionFactorSource: "EXIOBASE", dataSource: "proxy", confidence: 0.4 }`
2. Assert status `201`
3. Assert response body contains `valueTco2e: 50.0` and `confidence: 0.4`

**Expected Result:** HTTP 201 with created Scope 3 record.

---

#### TC-20: `POST_scope3Records_createsAuditTrailEvent`

**Type:** API Smoke

**Description:**
Verifies that creating a Scope 3 record produces an AuditTrailEvent with `entityType: "scope3"`.

**Test Steps:**
1. POST a valid Scope 3 record body
2. Assert audit event created with `entityType: "scope3"`, `action: "created"`, `actor: "user"`

**Expected Result:** Audit event created.

---

#### TC-21: `DELETE_scope3Records_id_removesRecord`

**Type:** API Smoke
**File:** `src/app/api/scope3/records/[id]/route.test.ts`

**Description:**
Verifies deleting a Scope 3 record returns success.

**Test Steps:**
1. Call `DELETE` on `/api/scope3/records/[id]`
2. Assert status `200` and `{ success: true }`

**Expected Result:** HTTP 200 `{ success: true }`.

---

### Public Supplier Form API

#### TC-22: `GET_publicSupplier_token_withValidToken_returnsSupplierInfo`

**Type:** API Smoke
**File:** `src/app/api/public/supplier/[token]/route.test.ts`

**Description:**
Verifies that a valid token returns the supplier name and available categories.

**Preconditions:**
- Prisma `findUnique` for Supplier by `publicFormToken` returns a supplier record
- Prisma returns 15 category records

**Test Steps:**
1. Call `GET` on `/api/public/supplier/[token]` with a valid token
2. Assert status `200`
3. Assert response body has `supplierName` (non-empty string)
4. Assert response body has `categories` (array)

**Expected Result:** HTTP 200 with supplier info and categories.

---

#### TC-23: `GET_publicSupplier_token_withInvalidToken_returns404`

**Type:** API Smoke

**Description:**
Verifies that an invalid or expired token returns a 404 response.

**Preconditions:**
- Prisma `findUnique` returns `null` for the given token

**Test Steps:**
1. Call `GET` on `/api/public/supplier/invalid-token`
2. Assert status `404`
3. Assert response body contains an `error` field

**Expected Result:** HTTP 404 with error message.

---

#### TC-24: `POST_publicSupplier_token_withSpendEur_createsScope3Record`

**Type:** API Smoke

**Description:**
Verifies that submitting spend data via the public form creates a Scope 3 record.

**Preconditions:**
- Prisma finds a valid supplier by token
- Prisma `create` mock returns a new Scope3Record

**Test Steps:**
1. POST `{ categoryId: "cat-c1", spend_eur: 5000 }` to `/api/public/supplier/[token]`
2. Assert status `201`
3. Assert response body `{ success: true, record: { ... } }`
4. Assert the created record has `dataSource: "supplier_form"`

**Expected Result:** HTTP 201 with `success: true` and the created record.

---

#### TC-31: `POST_publicSupplier_token_storesActivityDataInJson`

**Type:** API Smoke

**Description:**
Verifies that raw submitted values (`spend_eur`, `ton_km`, `waste_kg`) are stored in `activityDataJson`.

**Test Steps:**
1. POST `{ categoryId: "cat-c1", spend_eur: 5000, ton_km: 100 }` to the public form API
2. Capture the Prisma `create` call arguments
3. Assert `activityDataJson` contains `{ spend_eur: 5000, ton_km: 100 }`

**Expected Result:** `activityDataJson` stores all raw activity fields.

---

#### TC-33: `POST_publicSupplier_token_createsAuditEventWithActorSupplier`

**Type:** API Smoke

**Description:**
Verifies the audit trail records the supplier form submission with `actor = "supplier"`.

**Test Steps:**
1. POST a valid form submission to the public form API
2. Assert `createAuditEvent` was called with:
   - `actor: "supplier"`
   - `action: "submitted"`
   - `entityType: "scope3"`

**Expected Result:** Audit event with `actor: "supplier"`.

---

### Proxy Calculation (via API)

#### TC-27: `POST_publicSupplier_spendBasedSubmission_setsAssumptionsWithProxyFactor`

**Type:** API Smoke

**Description:**
Verifies that when only `spend_eur` is submitted, the created Scope 3 record's `assumptions` field documents the proxy factor and its placeholder status.

**Test Steps:**
1. POST `{ categoryId: "cat-c1", spend_eur: 1000 }` to the public form API
2. Capture Prisma `create` call arguments
3. Assert `assumptions` is non-empty
4. Assert `assumptions` contains the PROXY_FACTOR_SPEND value (e.g., `"0.233"`)

**Expected Result:** `assumptions` documents the proxy factor used.

---

#### TC-28b (via API): `POST_publicSupplier_spendBasedSubmission_setsConfidenceLessThanOne`

**Type:** API Smoke

**Description:**
Verifies that the proxy-based record has `confidence < 1.0`.

**Test Steps:**
1. POST `{ categoryId: "cat-c1", spend_eur: 1000 }` to the public form API
2. Capture Prisma `create` arguments
3. Assert `confidence < 1.0`

**Expected Result:** `confidence` is less than 1.0.

---

### Methodology API

#### TC-35: `GET_methodology_returnsAllNotes`

**Type:** API Smoke
**File:** `src/app/api/methodology/route.test.ts`

**Description:**
Verifies the methodology endpoint returns all notes (up to 3 — one per scope).

**Test Steps:**
1. Mock Prisma `findMany` returning 3 MethodologyNote records
2. Call `GET` on `/api/methodology`
3. Assert status `200`
4. Assert response body is an array of 3 items

**Expected Result:** HTTP 200, array with scope notes.

---

#### TC-36: `PUT_methodology_scope_upsertsNote`

**Type:** API Smoke
**File:** `src/app/api/methodology/[scope]/route.test.ts`

**Description:**
Verifies that PUTting a methodology note upserts the record for the given scope.

**Test Steps:**
1. PUT `{ text: "We used location-based method for scope 2." }` to `/api/methodology/scope_2`
2. Assert status `200`
3. Assert Prisma `upsert` was called with `scope: "scope_2"` and `companyId: DEMO_COMPANY_ID`
4. Assert response body contains `text: "We used location-based method for scope 2."`

**Expected Result:** HTTP 200 with upserted note.

---

### Audit Trail

#### TC-32: `POST_suppliers_createsAuditTrailEvent`

**Type:** API Smoke

**Description:**
Verifies that creating a supplier via the API creates an AuditTrailEvent.

**Test Steps:**
1. POST a valid supplier body
2. Assert `createAuditEvent` (or Prisma AuditTrailEvent create) was called with:
   - `entityType: "supplier"`
   - `action: "created"`
   - `actor: "user"`
   - `companyId: DEMO_COMPANY_ID`

**Expected Result:** Audit event with correct fields.

---

#### TC-34: `POST_export_createsAuditEventWithActionExported`

**Type:** API Smoke
**File:** `src/app/api/export/route.test.ts`

**Description:**
Verifies that triggering a PDF export records an audit event with `action = "exported"`.

**Test Steps:**
1. POST to `/api/export` (mocking the PDF renderer to return a minimal buffer)
2. Assert `createAuditEvent` was called with:
   - `action: "exported"`
   - `entityType: "export"`
   - `actor: "user"`

**Expected Result:** Audit event recorded for export.

---

### PDF Export API

#### TC-37: `POST_export_returnsPdfContentType`

**Type:** API Smoke

**Description:**
Verifies the export endpoint returns a response with `Content-Type: application/pdf`.

**Preconditions:**
- Prisma mocks return Company, Scope1/2/3 records, categories, methodology notes
- `@react-pdf/renderer` is mocked to return a minimal `Buffer`

**Test Steps:**
1. POST to `/api/export`
2. Assert status `200`
3. Assert `Content-Type` header is `application/pdf`

**Expected Result:** HTTP 200 with PDF content type.

---

#### TC-38: `POST_export_returnsNonEmptyPdfBuffer`

**Type:** API Smoke

**Description:**
Verifies the export endpoint returns a non-empty response body.

**Test Steps:**
1. POST to `/api/export`
2. Assert response body is a non-empty buffer/stream

**Expected Result:** Non-empty PDF binary in response body.

---

### Validation / Error Cases

#### TC-39: `POST_suppliers_missingRequiredField_returns400`

**Type:** API Smoke

**Description:**
Verifies that missing required fields in a supplier create request returns HTTP 400.

**Test Steps:**
1. POST `{ name: "Acme" }` (missing country, sector, contactEmail)
2. Assert status `400`
3. Assert response body contains `error` field

**Expected Result:** HTTP 400 with validation error.

---

#### TC-40: `POST_scope1_missingValueTco2e_returns400`

**Type:** API Smoke

**Description:**
Verifies that a Scope 1 create request without `valueTco2e` returns HTTP 400.

**Test Steps:**
1. POST `{ periodYear: 2024, calculationMethod: "combustion", emissionFactorsSource: "IPCC", dataSource: "manual" }` (no `valueTco2e`)
2. Assert status `400`

**Expected Result:** HTTP 400.

---

#### TC-41: `POST_scope3Records_missingConfidence_returns400`

**Type:** API Smoke

**Description:**
Verifies that a Scope 3 record create request without `confidence` returns HTTP 400.

**Test Steps:**
1. POST a Scope 3 record body without the `confidence` field
2. Assert status `400`

**Expected Result:** HTTP 400.

---

#### TC-42: `POST_publicSupplier_token_withNoActivityData_returns400`

**Type:** API Smoke

**Description:**
Verifies that submitting a supplier form with none of `spend_eur`, `ton_km`, or `waste_kg` returns HTTP 400 (at least one required).

**Test Steps:**
1. POST `{ categoryId: "cat-c1" }` (no activity data) to public form API
2. Assert status `400`
3. Assert response body contains an `error` describing the requirement

**Expected Result:** HTTP 400 with clear error message.

---

#### TC-43: `PUT_suppliers_id_withNonExistentId_returns404`

**Type:** API Smoke

**Description:**
Verifies that updating a non-existent supplier returns HTTP 404.

**Preconditions:**
- Prisma `findUnique` returns `null`

**Test Steps:**
1. PUT a valid body to `/api/suppliers/non-existent-id`
2. Assert status `404`

**Expected Result:** HTTP 404.

---

## Test Data Requirements

The following test data is needed for the tests above. Since tests mock Prisma, these are inline mock objects rather than files — but they should be extracted into a shared fixture helper to avoid duplication:

| Fixture | Description |
|---------|-------------|
| `mockCompany` | `{ id: "demo-company-001", name: "Demo GmbH", country: "DE", reportingYear: 2024, orgBoundary: "operational_control" }` |
| `mockSupplier` | Supplier with all fields including `publicFormToken: "abc-uuid"` and `status: "active"` |
| `mockScope1Record` | `{ id: "s1-1", companyId: "demo-company-001", periodYear: 2024, valueTco2e: 10.0, ... }` |
| `mockScope2Record` | Same structure as Scope 1 |
| `mockScope3Category` | `{ id: "cat-c1", code: "C1", name: "Purchased goods & services", material: true, materialityReason: "Highest spend" }` |
| `mockScope3Record` | Scope 3 record with `dataSource: "supplier_form"`, `confidence: 0.4`, `activityDataJson: { spend_eur: 5000 }` |
| `mockMethodologyNote` | `{ id: "note-s3", companyId: "demo-company-001", scope: "scope_3", text: "...", updatedAt: ... }` |
| `mock15Categories` | Array of 15 category objects with codes `C1`–`C15` |

Recommended location: `src/tests/fixtures/index.ts`

---

## Edge Cases

| Scenario | Expected Behaviour | Test Case |
|----------|--------------------|-----------|
| Dashboard with no records | Returns `{ scope1: 0, scope2: 0, scope3: 0, total: 0 }` | TC-04 |
| Public form with invalid token | HTTP 404 with error message | TC-23 |
| Supplier form with no activity data | HTTP 400, at least one field required | TC-42 |
| Proxy spend of zero | tCO₂e = 0 | TC-26 |
| Missing required fields on create | HTTP 400 with error | TC-39–TC-41 |
| Update non-existent resource | HTTP 404 | TC-43 |
| Refresh token changes token value | New UUID differs from old | TC-10 |
| Scope 3 record with `confidence = 1.0` | Valid; not flagged as proxy in PDF | (PDF section) |
| `activityDataJson` with multiple fields | All fields stored | TC-31 |

---

## Non-Functional Tests

### Build Smoke Test
- **`next build` must complete without TypeScript errors**
- Run in CI via PR Validation workflow
- All pages must use `export const dynamic = "force-dynamic"` or equivalent to avoid static-generation failures

### Performance (Not Automated for MVP)
- Dashboard target: < 3 seconds with ≤ 100 records per scope (verified manually during UAT)
- PDF generation target: < 15 seconds for ≤ 50 Scope 3 records (verified manually during UAT)

---

## Open Questions

1. **Proxy calculation location:** Is the proxy formula inline in the route handler, or extracted to a utility function in `src/lib/`? A utility function is strongly preferred for testability (TC-25 through TC-30 assume a callable function).
2. **`@react-pdf/renderer` mocking:** The PDF generation route handler invokes `renderToBuffer()` from `@react-pdf/renderer`. This must be mockable in Vitest. If it is not exported cleanly, a thin wrapper in `src/lib/pdf/generate-report.ts` should be introduced to enable mocking.
3. **Prisma mock strategy:** Confirm whether the team prefers `vi.mock('../../lib/prisma')` (module-level mock) or a dependency injection approach (pass prisma as a parameter to handler logic). The module-level mock is simpler for an MVP.
4. **Audit helper:** If `createAuditEvent` is in `src/lib/audit.ts`, it must be separately mockable in route handler tests. Confirm it is exported as a named function.
