# Test Plan: GreenLedger MVP

## Overview

This test plan covers all automated tests for the GreenLedger MVP. The MVP is a Next.js
full-stack application providing CSRD/ESRS E1 climate reporting for German SMEs.
All tests are executed with **Vitest** (unit and API logic tests) plus a `next build`
smoke test. No E2E browser tests, visual regression tests, or authentication-flow tests
are in scope for the MVP.

**Reference:** [`docs/features/001-mvp/specification.md`](./specification.md),
[`docs/features/001-mvp/architecture.md`](./architecture.md)

---

## Test Coverage Matrix

| Acceptance Criterion | Test Case(s) | Test Type |
|---------------------|--------------|-----------|
| Dashboard KPI totals sum correctly from DB | TC-01, TC-02, TC-03 | Unit |
| Dashboard returns `0.00` when no records exist | TC-04 | Unit |
| GET /api/dashboard returns correct JSON shape | TC-05 | API |
| POST /api/suppliers auto-generates publicFormToken | TC-10, TC-11 | API |
| GET /api/suppliers lists all suppliers | TC-06 | API |
| PUT /api/suppliers/[id] updates supplier fields | TC-07 | API |
| DELETE /api/suppliers/[id] sets status = "inactive" | TC-08 | API |
| POST /api/suppliers/[id]/token refreshes token | TC-09 | API |
| Token is cryptographically random and unique | TC-11, TC-12 | Unit |
| GET /api/scope1 lists records | TC-13 | API |
| POST /api/scope1 creates record | TC-14 | API |
| GET /api/scope2 lists records | TC-15 | API |
| POST /api/scope2 creates record | TC-16 | API |
| GET /api/scope3/categories lists 15 categories | TC-17 | API |
| PUT /api/scope3/categories/[id] updates material flag | TC-18 | API |
| GET /api/scope3/records lists records | TC-19 | API |
| POST /api/scope3/records creates record | TC-20 | API |
| Proxy: spend_eur × PROXY_FACTOR = correct tCO2e | TC-21 | Unit |
| Proxy: ton_km × factor = correct tCO2e | TC-22 | Unit |
| Proxy: waste_kg × factor = correct tCO2e | TC-23 | Unit |
| Proxy priority: waste_kg > ton_km > spend_eur | TC-24 | Unit |
| Proxy sets confidence = 0.5 | TC-25 | Unit |
| Proxy sets assumptions text | TC-26 | Unit |
| Proxy sets dataSource = "proxy" | TC-21, TC-22, TC-23 | Unit |
| POST /api/supplier-form/[token] creates Scope3Record | TC-27 | API |
| POST /api/supplier-form/[token] with spend_eur uses proxy calc | TC-28 | API |
| POST /api/supplier-form/[token] with invalid token returns 404 | TC-29 | API |
| POST /api/supplier-form/[token] with no fields returns 400 | TC-30 | API |
| GET /api/supplier-form/[token] with inactive supplier returns 404 | TC-31 | API |
| GET /api/export/pdf returns PDF content | TC-32 | API |
| GET /api/export/pdf sets correct Content-Type header | TC-32 | API |
| `next build` completes without errors | TC-33 | Smoke |
| Prisma seed runs without errors | TC-34 | Smoke |

---

## Test File Structure

All test files live under `src/` alongside the source they test.

```
src/
  lib/
    __tests__/
      calculations.test.ts    # TC-21 – TC-26 (proxy business logic)
      dashboard.test.ts       # TC-01 – TC-04 (dashboard total helpers)
      token.test.ts           # TC-11 – TC-12 (token generation)
  app/
    api/
      dashboard/__tests__/
        route.test.ts         # TC-05
      suppliers/__tests__/
        route.test.ts         # TC-06, TC-07, TC-08, TC-10
      suppliers/[id]/token/__tests__/
        route.test.ts         # TC-09
      scope1/__tests__/
        route.test.ts         # TC-13, TC-14
      scope2/__tests__/
        route.test.ts         # TC-15, TC-16
      scope3/categories/__tests__/
        route.test.ts         # TC-17, TC-18
      scope3/records/__tests__/
        route.test.ts         # TC-19, TC-20
      supplier-form/[token]/__tests__/
        route.test.ts         # TC-27 – TC-31
      export/pdf/__tests__/
        route.test.ts         # TC-32
```

---

## Test Cases

### Business Logic: Dashboard Totals

---

#### TC-01: `calculateScope1Total_WithMultipleRecords_ReturnsSumForYear`

**Type:** Unit
**File:** `src/lib/__tests__/dashboard.test.ts`
**Criterion:** Dashboard KPI totals sum correctly from DB

**Description:**
Verifies that the dashboard total helper correctly sums all `Scope1Record.valueTco2e`
values for a given `periodYear`.

**Preconditions:**
- Two Scope 1 records exist for 2024: `45.20` and `12.80` tCO₂e.
- One Scope 1 record exists for 2023: `30.00` tCO₂e (must be excluded).

**Test Steps:**
1. Call `calculateScopeTotals(records, 2024)` (or equivalent helper) with the test data.
2. Assert the returned Scope 1 total equals `58.00`.
3. Assert the 2023 record is NOT included.

**Expected Result:** Scope 1 total = `58.00` tCO₂e.

---

#### TC-02: `calculateScope2Total_WithSingleRecord_ReturnsValue`

**Type:** Unit
**File:** `src/lib/__tests__/dashboard.test.ts`
**Criterion:** Dashboard KPI totals sum correctly from DB

**Description:**
Verifies Scope 2 total sums correctly with a single record.

**Test Steps:**
1. Provide one Scope 2 record for 2024: `38.50` tCO₂e.
2. Call the total helper.
3. Assert result = `38.50`.

**Expected Result:** Scope 2 total = `38.50` tCO₂e.

---

#### TC-03: `calculateGrandTotal_WithAllScopes_ReturnsSumOfAllThree`

**Type:** Unit
**File:** `src/lib/__tests__/dashboard.test.ts`
**Criterion:** Dashboard totals: sum of records per year

**Description:**
Verifies the grand total is `Scope1 + Scope2 + Scope3`.

**Test Steps:**
1. Provide: Scope 1 = `58.00`, Scope 2 = `38.50`, Scope 3 = `258.30`.
2. Assert grand total = `354.80`.

**Expected Result:** Grand total = `354.80` tCO₂e.

---

#### TC-04: `calculateScopeTotal_WithNoRecords_ReturnsZero`

**Type:** Unit
**File:** `src/lib/__tests__/dashboard.test.ts`
**Criterion:** Dashboard returns `0.00` when no records exist

**Description:**
Verifies that an empty record array returns `0`, not `undefined` or `NaN`.

**Test Steps:**
1. Call total helper with an empty array `[]`.
2. Assert result = `0`.

**Expected Result:** Total = `0`.

---

### Business Logic: Proxy Calculation

---

#### TC-21: `calculateProxy_WithSpendEur_ReturnsCorrectTco2eAndMetadata`

**Type:** Unit
**File:** `src/lib/__tests__/calculations.test.ts`
**Criterion:** Proxy: spend_eur × PROXY_FACTOR = correct tCO2e; dataSource = "proxy"

**Description:**
Verifies spend-based proxy: `spend_eur × PROXY_FACTOR_SPEND_KG_PER_EUR / 1000` = tCO₂e.
With the configured constant of `0.5 kgCO₂e/EUR`, a spend of `1000 EUR` = `0.5 tCO₂e`.

**Test Steps:**
1. Call `calculateProxy({ spend_eur: 1000 })`.
2. Assert `valueTco2e = 0.5`.
3. Assert `calculationMethod = "spend_based"`.
4. Assert `dataSource = "proxy"`.
5. Assert `emissionFactorSource` contains `"DEFRA"` (or matches constant string).
6. Assert `assumptions` is non-empty string.

**Expected Result:** `{ valueTco2e: 0.5, calculationMethod: "spend_based", dataSource: "proxy", emissionFactorSource: <non-empty>, assumptions: <non-empty> }`

---

#### TC-22: `calculateProxy_WithTonKm_ReturnsCorrectTco2eAndMetadata`

**Type:** Unit
**File:** `src/lib/__tests__/calculations.test.ts`
**Criterion:** Proxy: ton_km × factor = correct tCO2e

**Description:**
Verifies transport proxy: `ton_km × PROXY_FACTOR_TRANSPORT_KG_PER_TON_KM / 1000`.
With `0.1 kgCO₂e/tonne-km`, `500 tonne-km` = `0.05 tCO₂e`.

**Test Steps:**
1. Call `calculateProxy({ ton_km: 500 })`.
2. Assert `valueTco2e = 0.05`.
3. Assert `calculationMethod = "activity_based"`.
4. Assert `dataSource = "proxy"`.

**Expected Result:** `{ valueTco2e: 0.05, calculationMethod: "activity_based", dataSource: "proxy" }`

---

#### TC-23: `calculateProxy_WithWasteKg_ReturnsCorrectTco2eAndMetadata`

**Type:** Unit
**File:** `src/lib/__tests__/calculations.test.ts`
**Criterion:** Proxy: waste_kg × factor = correct tCO2e

**Description:**
Verifies waste proxy: `waste_kg × PROXY_FACTOR_WASTE_KG_PER_KG / 1000`.
With `2.0 kgCO₂e/kg`, `200 kg` = `0.4 tCO₂e`.

**Test Steps:**
1. Call `calculateProxy({ waste_kg: 200 })`.
2. Assert `valueTco2e = 0.4`.
3. Assert `calculationMethod = "activity_based"`.
4. Assert `dataSource = "proxy"`.

**Expected Result:** `{ valueTco2e: 0.4, calculationMethod: "activity_based", dataSource: "proxy" }`

---

#### TC-24: `calculateProxy_WithMultipleFields_UsesHighestPriorityFactor`

**Type:** Unit
**File:** `src/lib/__tests__/calculations.test.ts`
**Criterion:** Proxy priority: waste_kg > ton_km > spend_eur

**Description:**
When multiple activity fields are submitted, the system must use the most specific factor.
Priority: `waste_kg` > `ton_km` > `spend_eur`.

**Test Steps:**
1. Call `calculateProxy({ spend_eur: 1000, ton_km: 500, waste_kg: 200 })`.
2. Assert `valueTco2e = 0.4` (waste_kg takes priority).
3. Call `calculateProxy({ spend_eur: 1000, ton_km: 500 })`.
4. Assert `valueTco2e = 0.05` (ton_km takes priority over spend_eur).

**Expected Result:**
- `waste_kg + ton_km + spend_eur` → uses `waste_kg`.
- `ton_km + spend_eur` → uses `ton_km`.

---

#### TC-25: `calculateProxy_Always_SetsConfidenceToProxyConstant`

**Type:** Unit
**File:** `src/lib/__tests__/calculations.test.ts`
**Criterion:** Proxy sets confidence = 0.5

**Description:**
All proxy calculations must set `confidence = PROXY_CONFIDENCE` (0.5).

**Test Steps:**
1. Call `calculateProxy({ spend_eur: 100 })`.
2. Assert `confidence = 0.5`.
3. Call `calculateProxy({ ton_km: 100 })`.
4. Assert `confidence = 0.5`.
5. Call `calculateProxy({ waste_kg: 100 })`.
6. Assert `confidence = 0.5`.

**Expected Result:** `confidence = 0.5` in all cases.

---

#### TC-26: `calculateProxy_WithSpendEur_SetsNonEmptyAssumptions`

**Type:** Unit
**File:** `src/lib/__tests__/calculations.test.ts`
**Criterion:** Proxy sets assumptions text

**Description:**
The returned `assumptions` string must be non-empty and describe the proxy method and factor.

**Test Steps:**
1. Call `calculateProxy({ spend_eur: 100 })`.
2. Assert `assumptions.length > 0`.
3. Assert `assumptions` includes the factor value string (e.g. `"0.5"` or `"kgCO2e/EUR"`).

**Expected Result:** Non-empty `assumptions` string referencing the proxy factor.

---

### Business Logic: Token Generation

---

#### TC-11: `generateSupplierToken_Always_ReturnsNonEmptyString`

**Type:** Unit
**File:** `src/lib/__tests__/token.test.ts`
**Criterion:** Token is cryptographically random

**Description:**
Verifies the token generator returns a non-empty string.

**Test Steps:**
1. Call the token generation utility (e.g. `generatePublicFormToken()`).
2. Assert the result is a `string`.
3. Assert `result.length > 0`.

**Expected Result:** Non-empty string token.

---

#### TC-12: `generateSupplierToken_CalledTwice_ReturnsDifferentTokens`

**Type:** Unit
**File:** `src/lib/__tests__/token.test.ts`
**Criterion:** Token is globally unique

**Description:**
Two successive calls to the token generator must return different values (uniqueness guarantee).

**Test Steps:**
1. Call `generatePublicFormToken()` twice.
2. Assert the two results are not equal.

**Expected Result:** Two distinct token strings.

---

### API Route Tests

> **Note on Prisma mocking:** All API route tests must mock the Prisma client using
> `vi.mock()` (Vitest) to avoid requiring a real database. The mock replaces
> `src/lib/prisma.ts` (or equivalent singleton export) with an in-memory stub.

---

#### TC-05: `GET_/api/dashboard_WithSeededData_ReturnsCorrectTotals`

**Type:** API (unit test calling route handler directly)
**File:** `src/app/api/dashboard/__tests__/route.test.ts`
**Criterion:** GET /api/dashboard returns correct JSON shape

**Description:**
Directly invokes the route handler function with a mocked Prisma client. Verifies the
JSON response contains `scope1`, `scope2`, `scope3`, and `total` fields summed correctly.

**Preconditions:**
- Mock Prisma returns:
  - `scope1Records.aggregate._sum.valueTco2e = 58.0`
  - `scope2Records.aggregate._sum.valueTco2e = 38.5`
  - `scope3Records.aggregate._sum.valueTco2e = 258.3`

**Test Steps:**
1. Mock Prisma aggregate calls to return the above values.
2. Invoke the `GET` handler from `app/api/dashboard/route.ts`.
3. Parse the JSON response body.
4. Assert `scope1 = 58.0`.
5. Assert `scope2 = 38.5`.
6. Assert `scope3 = 258.3`.
7. Assert `total = 354.8`.
8. Assert HTTP status = 200.

**Expected Result:** `{ scope1: 58.0, scope2: 38.5, scope3: 258.3, total: 354.8 }`, status 200.

---

#### TC-06: `GET_/api/suppliers_Always_ReturnsSupplierList`

**Type:** API
**File:** `src/app/api/suppliers/__tests__/route.test.ts`
**Criterion:** GET /api/suppliers lists all suppliers

**Description:**
Verifies the list endpoint returns an array of suppliers from the mocked DB.

**Test Steps:**
1. Mock `prisma.supplier.findMany()` to return two supplier objects.
2. Invoke the `GET` handler.
3. Assert response is an array with length 2.
4. Assert status = 200.
5. Assert each item contains `id`, `name`, `publicFormToken`, and `status`.

**Expected Result:** Array of 2 suppliers, status 200.

---

#### TC-07: `PUT_/api/suppliers/[id]_WithValidBody_UpdatesSupplier`

**Type:** API
**File:** `src/app/api/suppliers/__tests__/route.test.ts`
**Criterion:** PUT /api/suppliers/[id] updates supplier fields

**Description:**
Verifies the update endpoint calls `prisma.supplier.update()` with correct payload and
returns the updated supplier.

**Test Steps:**
1. Mock `prisma.supplier.update()` to return an updated supplier.
2. Invoke the `PUT` handler with `{ name: "New Name" }` and a valid `id` param.
3. Assert `prisma.supplier.update` was called with `{ where: { id }, data: { name: "New Name" } }`.
4. Assert status = 200.
5. Assert response body contains the updated `name`.

**Expected Result:** Updated supplier returned, status 200.

---

#### TC-08: `DELETE_/api/suppliers/[id]_Always_SetsStatusToInactive`

**Type:** API
**File:** `src/app/api/suppliers/__tests__/route.test.ts`
**Criterion:** DELETE /api/suppliers/[id] sets status = "inactive" (soft delete)

**Description:**
Verifies the delete endpoint performs a soft-delete by setting `status = "inactive"`.
It must NOT call `prisma.supplier.delete()`.

**Test Steps:**
1. Mock `prisma.supplier.update()` to return a supplier with `status = "inactive"`.
2. Invoke the `DELETE` handler with a valid `id` param.
3. Assert `prisma.supplier.update` was called with `{ where: { id }, data: { status: "inactive" } }`.
4. Assert `prisma.supplier.delete` was NOT called.
5. Assert status = 200.

**Expected Result:** `prisma.supplier.update` called with `status: "inactive"`, status 200.

---

#### TC-09: `POST_/api/suppliers/[id]/token_Always_GeneratesNewToken`

**Type:** API
**File:** `src/app/api/suppliers/[id]/token/__tests__/route.test.ts`
**Criterion:** POST /api/suppliers/[id]/token refreshes token

**Description:**
Verifies that refreshing the token calls `prisma.supplier.update()` with a new `publicFormToken`
value and returns the updated URL.

**Test Steps:**
1. Mock `prisma.supplier.update()` to return the updated supplier with a new token.
2. Invoke the `POST` handler with a valid `id` param.
3. Assert `prisma.supplier.update` was called with `{ where: { id }, data: { publicFormToken: <any non-empty string> } }`.
4. Assert response contains the new `publicFormToken`.
5. Assert status = 200.

**Expected Result:** `prisma.supplier.update` called, new token in response, status 200.

---

#### TC-10: `POST_/api/suppliers_WithValidBody_CreatesSupplierWithToken`

**Type:** API
**File:** `src/app/api/suppliers/__tests__/route.test.ts`
**Criterion:** POST /api/suppliers auto-generates publicFormToken

**Description:**
Verifies that creating a supplier auto-generates a `publicFormToken`.

**Test Steps:**
1. Mock `prisma.supplier.create()` to return a supplier object.
2. Invoke the `POST` handler with `{ name: "Test", country: "DE", sector: "Mfg", contactEmail: "x@y.com", companyId: "<uuid>" }`.
3. Assert `prisma.supplier.create` was called.
4. Assert the `data` argument to `create` includes a non-empty `publicFormToken`.
5. Assert status = 201.

**Expected Result:** `prisma.supplier.create` called with `publicFormToken` set, status 201.

---

#### TC-13: `GET_/api/scope1_Always_ReturnsRecordList`

**Type:** API
**File:** `src/app/api/scope1/__tests__/route.test.ts`
**Criterion:** GET /api/scope1 lists records

**Description:**
Verifies the Scope 1 list endpoint returns all records from the mock.

**Test Steps:**
1. Mock `prisma.scope1Record.findMany()` to return two records.
2. Invoke the `GET` handler.
3. Assert response is an array with length 2.
4. Assert each item contains `id`, `periodYear`, `valueTco2e`, `calculationMethod`.
5. Assert status = 200.

**Expected Result:** Array of 2 Scope 1 records, status 200.

---

#### TC-14: `POST_/api/scope1_WithValidBody_CreatesRecord`

**Type:** API
**File:** `src/app/api/scope1/__tests__/route.test.ts`
**Criterion:** POST /api/scope1 creates record

**Description:**
Verifies the Scope 1 create endpoint calls `prisma.scope1Record.create()` with the
provided fields and returns the created record.

**Test Steps:**
1. Mock `prisma.scope1Record.create()` to return a new record.
2. Invoke the `POST` handler with valid body: `{ periodYear: 2024, valueTco2e: 50.0, calculationMethod: "Natural gas", emissionFactorsSource: "DEFRA 2023", dataSource: "manual" }`.
3. Assert `prisma.scope1Record.create` was called with matching `data`.
4. Assert status = 201.
5. Assert response body contains the created record.

**Expected Result:** `prisma.scope1Record.create` called, new record returned, status 201.

---

#### TC-15: `GET_/api/scope2_Always_ReturnsRecordList`

**Type:** API
**File:** `src/app/api/scope2/__tests__/route.test.ts`
**Criterion:** GET /api/scope2 lists records

**Description:**
Mirrors TC-13 for Scope 2 records.

**Test Steps:**
1. Mock `prisma.scope2Record.findMany()` to return one record.
2. Invoke the `GET` handler.
3. Assert response is an array with length 1.
4. Assert status = 200.

**Expected Result:** Array of 1 Scope 2 record, status 200.

---

#### TC-16: `POST_/api/scope2_WithValidBody_CreatesRecord`

**Type:** API
**File:** `src/app/api/scope2/__tests__/route.test.ts`
**Criterion:** POST /api/scope2 creates record

**Description:**
Mirrors TC-14 for Scope 2 records.

**Test Steps:**
1. Mock `prisma.scope2Record.create()` to return a new record.
2. Invoke the `POST` handler with valid body.
3. Assert `prisma.scope2Record.create` was called.
4. Assert status = 201.

**Expected Result:** Scope 2 record created, status 201.

---

#### TC-17: `GET_/api/scope3/categories_Always_ReturnsAllFifteenCategories`

**Type:** API
**File:** `src/app/api/scope3/categories/__tests__/route.test.ts`
**Criterion:** GET /api/scope3/categories lists 15 categories

**Description:**
Verifies the categories endpoint returns all 15 pre-seeded GHG Protocol categories.

**Test Steps:**
1. Mock `prisma.scope3Category.findMany()` to return an array of 15 objects.
2. Invoke the `GET` handler.
3. Assert response is an array with length 15.
4. Assert each item contains `code`, `name`, `material`.
5. Assert status = 200.

**Expected Result:** Array of 15 categories, status 200.

---

#### TC-18: `PUT_/api/scope3/categories/[id]_WithMaterialTrue_UpdatesMaterialFlag`

**Type:** API
**File:** `src/app/api/scope3/categories/__tests__/route.test.ts`
**Criterion:** PUT /api/scope3/categories/[id] updates material flag

**Description:**
Verifies toggling a category's `material` flag calls the Prisma update.

**Test Steps:**
1. Mock `prisma.scope3Category.update()` to return the updated category.
2. Invoke the `PUT` handler with `{ material: true, materialityReason: "Primary spend category" }`.
3. Assert `prisma.scope3Category.update` was called with `{ where: { id }, data: { material: true, materialityReason: "Primary spend category" } }`.
4. Assert status = 200.

**Expected Result:** `prisma.scope3Category.update` called correctly, status 200.

---

#### TC-19: `GET_/api/scope3/records_Always_ReturnsRecordList`

**Type:** API
**File:** `src/app/api/scope3/records/__tests__/route.test.ts`
**Criterion:** GET /api/scope3/records lists records

**Description:**
Verifies the Scope 3 records list endpoint returns records from mock.

**Test Steps:**
1. Mock `prisma.scope3Record.findMany()` to return three records.
2. Invoke the `GET` handler.
3. Assert response is an array with length 3.
4. Assert each item contains `id`, `valueTco2e`, `categoryId`, `confidence`.
5. Assert status = 200.

**Expected Result:** Array of 3 Scope 3 records, status 200.

---

#### TC-20: `POST_/api/scope3/records_WithValidBody_CreatesRecord`

**Type:** API
**File:** `src/app/api/scope3/records/__tests__/route.test.ts`
**Criterion:** POST /api/scope3/records creates record

**Description:**
Verifies manual Scope 3 record creation via the API.

**Test Steps:**
1. Mock `prisma.scope3Record.create()` to return a new record.
2. Invoke the `POST` handler with valid body including `categoryId`, `periodYear`, `valueTco2e`, `calculationMethod`, `emissionFactorSource`, `dataSource`, `confidence`.
3. Assert `prisma.scope3Record.create` was called with matching `data`.
4. Assert status = 201.

**Expected Result:** Scope 3 record created, status 201.

---

#### TC-27: `POST_/api/supplier-form/[token]_WithSpendEur_CreatesScope3Record`

**Type:** API
**File:** `src/app/api/supplier-form/[token]/__tests__/route.test.ts`
**Criterion:** POST /api/supplier-form/[token] creates Scope3Record

**Description:**
Submitting the public supplier form with `spend_eur` creates a `Scope3Record` in the DB.

**Preconditions:**
- Mock `prisma.supplier.findUnique({ where: { publicFormToken: token } })` returns an active supplier.
- Mock `prisma.scope3Category.findFirst()` returns a default category (C1).
- Mock `prisma.scope3Record.create()` returns a new record.

**Test Steps:**
1. Set up mocks as above.
2. Invoke the `POST` handler with `{ spend_eur: 1000 }` and a valid token param.
3. Assert `prisma.scope3Record.create` was called.
4. Assert the `data.valueTco2e = 0.5` (1000 × 0.5 / 1000).
5. Assert `data.dataSource = "proxy"`.
6. Assert `data.confidence = 0.5`.
7. Assert `data.assumptions` is non-empty.
8. Assert status = 201.

**Expected Result:** Scope3Record created with correct proxy values, status 201.

---

#### TC-28: `POST_/api/supplier-form/[token]_WithSpendEur_UsesProxyCalculation`

**Type:** API
**File:** `src/app/api/supplier-form/[token]/__tests__/route.test.ts`
**Criterion:** POST /api/supplier-form/[token] with spend_eur uses proxy calc

**Description:**
Verifies the proxy calculation is applied correctly end-to-end through the API handler,
not just in the isolated `calculateProxy` unit. Complements TC-27 with a focus on the
exact numeric value stored.

**Test Steps:**
1. Mock as in TC-27.
2. Invoke with `{ spend_eur: 2000 }`.
3. Assert `prisma.scope3Record.create` was called with `data.valueTco2e = 1.0` (2000 × 0.5 / 1000).
4. Assert `data.calculationMethod = "spend_based"`.
5. Assert `data.activityDataJson` contains `{ spend_eur: 2000 }`.

**Expected Result:** `valueTco2e = 1.0`, `calculationMethod = "spend_based"`, raw data in `activityDataJson`.

---

#### TC-29: `GET_/api/supplier-form/[token]_WithInvalidToken_Returns404`

**Type:** API
**File:** `src/app/api/supplier-form/[token]/__tests__/route.test.ts`
**Criterion:** POST /api/supplier-form/[token] with invalid token returns 404

**Description:**
Verifies that a token not found in the DB returns HTTP 404.

**Test Steps:**
1. Mock `prisma.supplier.findUnique()` to return `null`.
2. Invoke the `GET` handler with a non-existent token.
3. Assert status = 404.

**Expected Result:** HTTP 404 response.

---

#### TC-30: `POST_/api/supplier-form/[token]_WithNoActivityFields_Returns400`

**Type:** API
**File:** `src/app/api/supplier-form/[token]/__tests__/route.test.ts`
**Criterion:** POST /api/supplier-form/[token] with no fields returns 400

**Description:**
Verifies that submitting the form with no activity data returns a validation error.

**Test Steps:**
1. Mock `prisma.supplier.findUnique()` to return a valid active supplier.
2. Invoke the `POST` handler with an empty body `{}`.
3. Assert status = 400.
4. Assert response body contains an error message referencing missing activity data.
5. Assert `prisma.scope3Record.create` was NOT called.

**Expected Result:** HTTP 400 with validation error; no record created.

---

#### TC-31: `GET_/api/supplier-form/[token]_WithInactiveSupplier_Returns404`

**Type:** API
**File:** `src/app/api/supplier-form/[token]/__tests__/route.test.ts`
**Criterion:** GET /api/supplier-form/[token] with inactive supplier returns 404

**Description:**
Verifies that a token belonging to an `inactive` supplier returns HTTP 404.

**Test Steps:**
1. Mock `prisma.supplier.findUnique()` to return a supplier with `status = "inactive"`.
2. Invoke the `GET` handler.
3. Assert status = 404.

**Expected Result:** HTTP 404 response.

---

#### TC-32: `GET_/api/export/pdf_Always_ReturnsPdfContent`

**Type:** API
**File:** `src/app/api/export/pdf/__tests__/route.test.ts`
**Criterion:** GET /api/export/pdf returns PDF content; correct Content-Type

**Description:**
Verifies the PDF export endpoint returns a non-empty response with the correct MIME type
and `Content-Disposition` header for download. The PDF generation library (`@react-pdf/renderer`)
is mocked to return a dummy `Buffer` to avoid rendering overhead in tests.

**Preconditions:**
- Mock Prisma to return minimal seeded data (1 company, 0+ records).
- Mock `generateReport()` from `src/lib/pdf/` to return a non-empty `Buffer`.

**Test Steps:**
1. Set up mocks as above.
2. Invoke the `GET` handler.
3. Assert HTTP status = 200.
4. Assert `Content-Type` header = `"application/pdf"`.
5. Assert `Content-Disposition` header starts with `"attachment; filename="`.
6. Assert response body is non-empty (Buffer length > 0).

**Expected Result:** 200 OK, `Content-Type: application/pdf`, non-empty PDF body.

---

### Smoke Tests

---

#### TC-33: `nextBuild_Always_CompletesWithoutErrors`

**Type:** Smoke (CI gate)
**File:** CI workflow (`pr-validation.yml`)
**Criterion:** `next build` completes without errors

**Description:**
Runs `next build` in `src/` and asserts exit code 0. This is the primary CI gate.
No Vitest involvement — this is a shell-level check in the PR Validation workflow.

**Preconditions:**
- All TypeScript source files compile without errors.
- All imports resolve.

**Test Steps:**
1. Run `cd src && npm run build` (or equivalent `next build`).
2. Assert the command exits with code 0.
3. Assert no TypeScript compilation errors in stdout/stderr.

**Expected Result:** Exit code 0, no errors.

---

#### TC-34: `prismaSeed_Always_CompletesWithoutErrors`

**Type:** Smoke
**File:** `src/prisma/__tests__/seed.smoke.test.ts` (or separate CI step)
**Criterion:** Database seed runs without errors

**Description:**
Runs the Prisma seed script against a fresh in-memory/temp SQLite DB and asserts no
exceptions are thrown. Verifies seed data integrity: correct record counts and required
field values (company name, 15 categories, 3 suppliers).

**Preconditions:**
- A temporary SQLite DB file (e.g. `test.db`) is used.
- `DATABASE_URL` is set to the temp file path.

**Test Steps:**
1. Run `prisma migrate deploy` against the temp DB.
2. Run `prisma db seed`.
3. Assert exit code 0.
4. Query DB: assert 1 Company exists.
5. Query DB: assert 15 `Scope3Category` rows exist.
6. Query DB: assert 3 `Supplier` rows exist.
7. Query DB: assert 2 `Scope1Record` rows exist.
8. Query DB: assert 1 `Scope2Record` row exists.
9. Query DB: assert 3 `Scope3Record` rows exist.
10. Assert at least one `AuditTrailEvent` row exists.

**Expected Result:** Seed succeeds; all record counts match expected values.

---

## Test Data Requirements

No external JSON test data files are required. All test data is defined inline within each
test using mock objects. The mock Prisma client is the primary test data mechanism.

If a shared set of typed mock fixtures is helpful, the Developer may optionally create:

- `src/lib/__tests__/fixtures/mockCompany.ts` — A default `Company` mock object
- `src/lib/__tests__/fixtures/mockSupplier.ts` — A default `Supplier` mock object
- `src/lib/__tests__/fixtures/mockScope3Record.ts` — A default `Scope3Record` mock object

These are optional convenience helpers, not required test data files.

---

## Edge Cases

| Scenario | Expected Behavior | Test Case |
|----------|-------------------|-----------|
| Dashboard with no records for any scope | All totals = 0 | TC-04 |
| Dashboard records from previous years only | Current year total = 0 | TC-01 |
| Grand total with all scopes = 0 | Grand total = 0 | TC-04 |
| Supplier form with multiple activity fields | Highest-priority field used | TC-24 |
| Supplier form token not in DB | 404 returned | TC-29 |
| Supplier form token belongs to inactive supplier | 404 returned | TC-31 |
| Supplier form submitted with no activity fields | 400 returned, no record created | TC-30 |
| Proxy with zero spend_eur | `valueTco2e = 0` | TC-21 (boundary) |
| Token generation called twice | Both tokens are different | TC-12 |
| Soft-delete supplier | `status = "inactive"`, not physically deleted | TC-08 |

---

## Non-Functional Tests

### TypeScript Strict Mode

- All test files must compile with `strict: true` TypeScript settings.
- The `next build` smoke test (TC-33) implicitly validates type correctness across the
  entire application.

### Error Handling

- API routes must return appropriate HTTP status codes for error scenarios (400, 404 — see TC-29, TC-30, TC-31).
- Error responses must include a JSON body with an `error` field.

### Vitest Configuration

Tests run via the `vitest` CLI as configured in `src/vitest.config.ts`. The recommended
test command is:

```bash
cd src && npx vitest run
```

---

## Out of Scope

The following are explicitly **not** tested in the MVP:

| Area | Reason |
|------|--------|
| E2E browser tests (Playwright/Cypress) | Out of scope per spec; `next build` is the CI gate |
| Visual regression | No UI snapshot testing for MVP |
| Authentication flows | No auth in MVP |
| CSV import | Feature deferred post-MVP |
| Audit trail DB writes (via integration test) | Covered implicitly by Prisma mock call assertions in API tests |
| PDF content/rendering fidelity | `generateReport` is mocked; visual output verified manually |
| Multi-company scenarios | Single demo company only |

---

## Open Questions

None. All testing approach decisions are consistent with the spec, architecture, and the
"minimal unit/smoke tests" constraint stated in `docs/spec.md`.
