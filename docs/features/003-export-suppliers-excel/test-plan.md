# Test Plan: Export Suppliers to Excel

## Overview

This test plan covers the XLSX export feature for suppliers (Feature 003). The feature
adds a `GET /api/export/suppliers/xlsx` API route and an "Export to Excel" button on the
Suppliers page. Tests verify the route returns a valid XLSX binary with the correct
columns, headers, audit logging, empty-state behaviour, and error handling.

Reference: `docs/features/003-export-suppliers-excel/specification.md`

---

## Test Coverage Matrix

| Acceptance Criterion | Test Case(s) | Test Type |
|---|---|---|
| Route returns XLSX binary with correct MIME type | TC-01 | Unit |
| `Content-Disposition` header contains date-stamped filename | TC-02 | Unit |
| `Cache-Control: no-store` header is set | TC-03 | Unit |
| Header row contains Name, Country, Sector, Contact Email, Status | TC-04 | Unit |
| Each supplier appears as exactly one data row | TC-05 | Unit |
| `publicFormToken` is **not** present in any row | TC-06 | Unit |
| Rows are sorted alphabetically by Name | TC-07 | Unit |
| Empty supplier list returns header-only XLSX (no error) | TC-08 | Unit |
| Audit event is logged on every export | TC-09 | Unit |
| DB failure returns HTTP 500 JSON | TC-10 | Unit |
| "Export to Excel" button is visible on Suppliers page | TC-11 | Smoke |
| Clicking the export link does not show a server error page | TC-12 | Smoke |

---

## User Acceptance Scenarios

> **Purpose**: These scenarios guide the Maintainer (and the UAT Tester agent) when
> running the app locally to verify the feature end-to-end before merge.

### Scenario 1: Export Suppliers to Excel File

**User Goal**: Download all suppliers as an XLSX file for offline use.

**Test Steps**:

1. Run the app: `docker compose up -d`
2. Navigate to `http://localhost:3000/suppliers`
3. Verify an **"⬇ Export to Excel"** button/link is visible in the toolbar next to **"+ Add Supplier"**
4. Click "Export to Excel"
5. Verify that the browser prompts a file download (no error page shown)
6. Open the downloaded `.xlsx` file in Excel or LibreOffice Calc
7. Verify the filename pattern is `greenledger-suppliers-YYYY-MM-DD.xlsx`

**Expected Output**:

- First row: header row with columns `Name`, `Country`, `Sector`, `Contact Email`, `Status`
- Subsequent rows: one row per supplier, sorted A–Z by Name
- No column named `publicFormToken` is visible anywhere
- File opens without warnings in Excel / LibreOffice Calc

**Success Criteria**:

- [ ] Button is visible in the Suppliers toolbar
- [ ] File downloads automatically with `.xlsx` extension and correct filename pattern
- [ ] Header row contains exactly the five specified columns
- [ ] All seeded supplier records appear (sorted by name)
- [ ] `publicFormToken` is absent from all rows and headers
- [ ] File opens correctly in Excel and LibreOffice Calc

**Feedback Opportunities**:

- Does the button placement feel natural next to the Add Supplier button?
- Is the plain-text status column (active/inactive) readable enough, or would colour coding help?

---

### Scenario 2: Export with No Suppliers (Empty State)

**User Goal**: Confirm export works gracefully when no suppliers exist.

**Test Steps**:

1. (If required) Temporarily remove all suppliers via the app or seed a blank DB
2. Navigate to `http://localhost:3000/suppliers`
3. Click "Export to Excel"

**Expected Output**:

- A valid `.xlsx` file is downloaded
- The file contains only the header row (Name, Country, Sector, Contact Email, Status)
- No JavaScript error or 500 error page appears

**Success Criteria**:

- [ ] File downloads without error
- [ ] File contains header row with all five column names
- [ ] No data rows are present (empty sheet body)

---

## Test Cases

### TC-01: GET_returnsXlsxBinary_whenSuppliersExist

**Type:** Unit

**File:** `src/__tests__/xlsx-export.test.ts`

**Description:**
Calling the `GET` handler with a mocked Prisma that returns one or more supplier
records should produce an HTTP 200 response whose body is a non-empty binary buffer
(valid XLSX).

**Preconditions:**

- `prisma.supplier.findMany` is mocked to return at least one supplier record
- `logAuditEvent` is mocked as a no-op

**Test Steps:**

1. Import `GET` from `@/app/api/export/suppliers/xlsx/route`
2. Mock `@/lib/prisma` so `prisma.supplier.findMany` resolves with a fixture array
3. Mock `@/lib/audit` so `logAuditEvent` resolves without error
4. Call `await GET()`
5. Assert `response.status === 200`
6. Assert `response.body` is not null / `await response.arrayBuffer()` has `byteLength > 0`

**Expected Result:**
HTTP 200 with a non-empty binary body.

---

### TC-02: GET_returnsCorrectContentDispositionHeader_withDateStampedFilename

**Type:** Unit

**File:** `src/__tests__/xlsx-export.test.ts`

**Description:**
The `Content-Disposition` header must follow the pattern
`attachment; filename="greenledger-suppliers-YYYY-MM-DD.xlsx"`.

**Preconditions:**

- Same mocks as TC-01

**Test Steps:**

1. Call `await GET()`
2. Read `response.headers.get("Content-Disposition")`
3. Assert it matches the regex `attachment; filename="greenledger-suppliers-\d{4}-\d{2}-\d{2}\.xlsx"`

**Expected Result:**
Header value matches the dated filename pattern.

---

### TC-03: GET_returnsCacheControlNoStore

**Type:** Unit

**File:** `src/__tests__/xlsx-export.test.ts`

**Description:**
The response must include `Cache-Control: no-store` to prevent proxies from caching
the export binary.

**Preconditions:**

- Same mocks as TC-01

**Test Steps:**

1. Call `await GET()`
2. Assert `response.headers.get("Cache-Control") === "no-store"`

**Expected Result:**
`Cache-Control` header is exactly `"no-store"`.

---

### TC-04: GET_returnsCorrectContentTypeHeader

**Type:** Unit

**File:** `src/__tests__/xlsx-export.test.ts`

**Description:**
The `Content-Type` must be
`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.

**Preconditions:**

- Same mocks as TC-01

**Test Steps:**

1. Call `await GET()`
2. Assert `response.headers.get("Content-Type")` equals the XLSX MIME type string

**Expected Result:**
`Content-Type` is the XLSX MIME type.

---

### TC-05: GET_xlsxContainsCorrectHeaderRow

**Type:** Unit

**File:** `src/__tests__/xlsx-export.test.ts`

**Description:**
The first row of the returned XLSX sheet must be a header row with exactly the five
human-readable column names: `Name`, `Country`, `Sector`, `Contact Email`, `Status`.

**Preconditions:**

- `prisma.supplier.findMany` returns at least one supplier record
- `logAuditEvent` mocked

**Test Steps:**

1. Call `await GET()`
2. Read the response buffer via `await response.arrayBuffer()`
3. Parse the buffer with `XLSX.read()` (SheetJS)
4. Convert the first sheet to an array of arrays with `XLSX.utils.sheet_to_json({ header: 1 })`
5. Assert `rows[0]` deep-equals `["Name", "Country", "Sector", "Contact Email", "Status"]`

**Expected Result:**
Row 0 contains exactly the five specified header strings in the specified order.

---

### TC-06: GET_xlsxDataRowsMatchSupplierFixtures

**Type:** Unit

**File:** `src/__tests__/xlsx-export.test.ts`

**Description:**
Each supplier returned by Prisma must appear as exactly one data row in the sheet.

**Preconditions:**

- Mock returns a two-supplier array:

  ```ts
  [
    { name: "Alpha Ltd", country: "DE", sector: "Energy", contactEmail: "a@alpha.com", status: "active" },
    { name: "Beta GmbH", country: "FR", sector: "Transport", contactEmail: "b@beta.com", status: "inactive" },
  ]
  ```

- `logAuditEvent` mocked

**Test Steps:**

1. Call `await GET()`
2. Parse the XLSX buffer and convert to row objects
3. Assert `rows.length === 2` (data rows, excluding header)
4. Assert first data row has `Name: "Alpha Ltd"`, `Country: "DE"`, etc.

**Expected Result:**
Two data rows matching the fixture data exactly.

---

### TC-07: GET_xlsxExcludesPublicFormToken

**Type:** Unit

**File:** `src/__tests__/xlsx-export.test.ts`

**Description:**
The `publicFormToken` field must **not** appear as a column header or cell value in
the exported sheet.

**Preconditions:**

- Mock returns suppliers that include `publicFormToken` in their JS objects to
  simulate a scenario where the token leaks into the mapping layer

**Test Steps:**

1. Call `await GET()`
2. Parse XLSX and extract header row and all cell values
3. Assert no cell or header equals `"publicFormToken"` or contains a UUID in the
   typical `publicFormToken` position (last column in the fixture)

**Expected Result:**
`publicFormToken` is absent from all rows and headers.

---

### TC-08: GET_returnsHeaderOnlyXlsx_whenNoSuppliers

**Type:** Unit

**File:** `src/__tests__/xlsx-export.test.ts`

**Description:**
When `prisma.supplier.findMany` returns an empty array, the route must still return
HTTP 200 with a valid XLSX containing only the header row.

**Preconditions:**

- `prisma.supplier.findMany` mocked to return `[]`
- `logAuditEvent` mocked

**Test Steps:**

1. Call `await GET()`
2. Assert `response.status === 200`
3. Parse XLSX buffer
4. Assert sheet has exactly 1 row (the header row)
5. Assert header row equals `["Name", "Country", "Sector", "Contact Email", "Status"]`

**Expected Result:**
HTTP 200, valid XLSX, one header row, no data rows.

---

### TC-09: GET_logsAuditEvent_onEveryExport

**Type:** Unit

**File:** `src/__tests__/xlsx-export.test.ts`

**Description:**
`logAuditEvent` must be called exactly once per successful export, with
`entityType: "export"` and `action: "exported"`.

**Preconditions:**

- `prisma.supplier.findMany` returns a fixture array (may be empty)
- `logAuditEvent` is mocked with `vi.fn()`

**Test Steps:**

1. Call `await GET()`
2. Assert `logAuditEvent` was called exactly once
3. Assert the call argument includes `{ action: "exported", entityType: "export" }`
4. Assert the comment string contains the supplier count (e.g., `"0 rows"` for empty)

**Expected Result:**
`logAuditEvent` called once with correct action and entity type.

---

### TC-10: GET_returns500Json_whenDbThrows

**Type:** Unit

**File:** `src/__tests__/xlsx-export.test.ts`

**Description:**
If `prisma.supplier.findMany` throws an error (simulating a DB failure), the route
must return HTTP 500 with a JSON body containing an `error` field.

**Preconditions:**

- `prisma.supplier.findMany` mocked to reject with `new Error("DB connection failed")`
- `logAuditEvent` mocked

**Test Steps:**

1. Call `await GET()`
2. Assert `response.status === 500`
3. Parse response body as JSON
4. Assert body contains `{ error: "Failed to generate XLSX" }`

**Expected Result:**
HTTP 500 with JSON error body; no unhandled exception thrown.

---

### TC-11: suppliersPage_showsExportToExcelLink

**Type:** Smoke (Selenium)

**File:** `smoke-tests/export-suppliers-excel/test_smoke.py`

**Description:**
The Suppliers page must render an "Export to Excel" link/button in the toolbar.

**Preconditions:**

- Docker container running at `BASE_URL`

**Test Steps:**

1. Navigate to `{base_url}/suppliers`
2. Wait for `<main>` to be present
3. Assert page body contains the text `"Export to Excel"`

**Expected Result:**
Page body includes "Export to Excel" without a server error.

---

### TC-12: exportLink_triggersNoErrorPage_whenClicked

**Type:** Smoke (Selenium)

**File:** `smoke-tests/export-suppliers-excel/test_smoke.py`

**Description:**
Navigating directly to `/api/export/suppliers/xlsx` (mimicking a link click) must
not render a Next.js error page. The browser may trigger a file download or display
binary content; neither is a 500/application error.

**Preconditions:**

- Docker container running at `BASE_URL`

**Test Steps:**

1. Navigate to `{base_url}/api/export/suppliers/xlsx`
2. Assert page title does not contain `"500"`
3. Assert page body does not contain `"Application error"` (case-insensitive)

**Expected Result:**
No application error page; response is either a file download or binary body.

---

## Test Data Requirements

No new persistent test data files are needed. All Prisma interactions are mocked
inline with `vi.mock()` using fixture objects defined directly in the test file.

**Fixture supplier objects** (defined inline in `src/__tests__/xlsx-export.test.ts`):

```ts
const SUPPLIER_FIXTURES = [
  {
    name: "Alpha Ltd",
    country: "DE",
    sector: "Energy",
    contactEmail: "alpha@example.com",
    status: "active",
  },
  {
    name: "Beta GmbH",
    country: "FR",
    sector: "Transport",
    contactEmail: "beta@example.com",
    status: "inactive",
  },
];
```

---

## Edge Cases

| Scenario | Expected Behaviour | Test Case |
|---|---|---|
| No suppliers in DB | HTTP 200, header-only XLSX (no data rows) | TC-08 |
| DB throws on `findMany` | HTTP 500 JSON with `error` field | TC-10 |
| `publicFormToken` present in Prisma result | Token absent from all XLSX columns/cells | TC-07 |
| Single supplier | One data row, correct header | TC-05 (can assert count) |
| Filename date matches today | `Content-Disposition` regex match | TC-02 |

---

## Non-Functional Tests

### TypeScript Type Safety

Running `cd src && npm run build` (which calls `tsc --noEmit` via `type-check` and
Next.js compilation) verifies that:

- The `xlsx` library is imported correctly with the right types
- The `GET` handler returns `NextResponse`
- All Prisma `select` fields are typed correctly

This acts as a lightweight integration check and must pass without errors.

---

## Mock Strategy

Because the Vitest environment does not have a running database, both `@/lib/prisma`
and `@/lib/audit` must be mocked at the top of the test file:

```ts
vi.mock("@/lib/prisma", () => ({
  prisma: {
    supplier: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/audit", () => ({
  logAuditEvent: vi.fn(),
}));
```

Each test case uses `vi.mocked(prisma.supplier.findMany).mockResolvedValue(...)` to
control Prisma output per scenario.

The `xlsx` library itself is **not mocked** — actual SheetJS execution is used so
that tests verify the real binary output (header row, cell values, column order).

---

## Open Questions

None. All acceptance criteria are unambiguous and have direct test coverage above.
