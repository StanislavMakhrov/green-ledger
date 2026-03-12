# Test Plan: Supplier Selection and Excel Export (Feature 003)

## Overview

This test plan covers the automated verification of Feature 003: Supplier Selection and
Excel Export. The feature adds per-row checkboxes to the Suppliers table, a "Select All"
header checkbox, a selection counter, and an "Export to Excel" button that triggers a
server-side `.xlsx` download via `GET /api/suppliers/export?ids=...`.

**Specification:** `docs/features/003-supplier-selection-excel-export/specification.md`
**Architecture:** `docs/features/003-supplier-selection-excel-export/architecture.md`

---

## Test Coverage Matrix

| Acceptance Criterion | Test Case(s) | Test Type |
|---|---|---|
| Checkbox column appears as leftmost column | TC-09 (smoke) | Smoke |
| Header checkbox selects / deselects all rows | TC-03, TC-04, TC-09 | Unit, Smoke |
| Individual row checkboxes toggle independently | TC-01, TC-02 | Unit |
| Header checkbox shows indeterminate when partial | TC-05 | Unit |
| Selected rows are visually distinct | TC-09 | Smoke |
| Selection counter shows "N selected" | TC-09 | Smoke |
| "Export to Excel" button is visible | TC-09 | Smoke |
| Export button disabled when 0 suppliers selected | TC-06, TC-09 | Unit, Smoke |
| Export button enabled when ≥ 1 supplier selected | TC-07, TC-09 | Unit, Smoke |
| Clicking Export triggers `.xlsx` browser download | TC-10 | Smoke |
| Downloaded file is named `suppliers-export-YYYY-MM-DD.xlsx` | TC-16, TC-10 | Unit, Smoke |
| Downloaded file contains correct columns | TC-12, TC-13 | Unit |
| Each selected supplier is exactly one row | TC-13 | Unit |
| Non-selected suppliers excluded from file | TC-13, TC-10 | Unit, Smoke |
| Selecting all and exporting produces full file | TC-14, TC-10 | Unit, Smoke |
| `generateSupplierExcel` returns valid Buffer | TC-11 | Unit |
| `generateSupplierExcel` with empty array | TC-15 | Unit |
| API returns 400 when `ids` param is missing | TC-17 | Unit |
| API returns 400 when `ids` param is empty string | TC-18 | Unit |
| API returns 404 when no matching suppliers found | TC-19 | Unit |
| API returns 500 on unexpected server error | TC-20 | Unit |
| API returns 200 with correct headers on success | TC-16 | Unit |
| Audit event logged on successful export | TC-21 | Unit (mocked) |
| Row checkbox has `aria-label="Select {name}"` | TC-08, TC-09 | Unit, Smoke |
| Header checkbox has `aria-label="Select all suppliers"` | TC-08, TC-09 | Unit, Smoke |
| Export button disabled state uses native `disabled` attr | TC-06 | Unit |
| Export error message shown on failure | TC-10 | Smoke |
| Selection cleared after data reload (`load()`) | TC-22 | Unit |
| Existing supplier actions are unaffected | TC-10 | Smoke |

---

## User Acceptance Scenarios

> **Purpose**: For user-facing features (UI changes, new pages, API behavior changes, or any
> visible user output), define scenarios for manual Maintainer review by running the app locally.
> These help catch visual/interaction bugs and validate real-world usage before merge.

### Scenario 1: Select Suppliers and Download Excel File

**User Goal**: Select individual suppliers and export them as a spreadsheet.

**Test Steps**:
1. Run `docker compose up -d` (or `cd src && npm run dev`)
2. Navigate to `http://localhost:3000/suppliers`
3. Verify a checkbox column appears as the leftmost column in the suppliers table
4. Verify the "Export to Excel" button is visible but disabled (greyed out)
5. Verify the selection counter shows "0 selected" (or equivalent)
6. Check the checkbox on the first supplier row
7. Verify the row becomes visually highlighted (e.g., green/blue background tint)
8. Verify the selection counter now shows "1 selected" (or "1 supplier(s) selected")
9. Verify the "Export to Excel" button is now enabled
10. Click "Export to Excel"
11. Verify the browser downloads a file named `suppliers-export-<today's date>.xlsx`
12. Open the file in Excel or a spreadsheet viewer
13. Verify the first row contains headers: Name, Country, Sector, Contact Email, Status
14. Verify only the selected supplier appears as a data row

**Expected Output**:
- A `.xlsx` file is downloaded with today's date in the filename
- The file contains exactly one data row matching the selected supplier
- All five columns are populated with the correct data from the database

**Success Criteria**:
- [ ] Checkbox column is leftmost in the suppliers table
- [ ] Export button starts disabled and enables when a supplier is selected
- [ ] Browser download starts on button click without a page reload
- [ ] Downloaded file has the correct name format (`suppliers-export-YYYY-MM-DD.xlsx`)
- [ ] Downloaded file contains correct columns and only the selected supplier's data

**Feedback Opportunities**:
- Is the row highlight visually clear enough?
- Is the selection counter wording natural?
- Does the disabled button state clearly communicate it is inactive?

---

### Scenario 2: Select All Suppliers and Export

**User Goal**: Quickly select all suppliers and download the complete list.

**Test Steps**:
1. Navigate to `http://localhost:3000/suppliers`
2. Click the "Select All" checkbox in the table header
3. Verify all rows become visually highlighted
4. Verify the selection counter shows the total number of suppliers
5. Verify the "Export to Excel" button is enabled
6. Click "Export to Excel"
7. Verify a `.xlsx` file is downloaded
8. Open the file and verify it contains one row per supplier (matching the count in the UI)

**Expected Output**:
- All supplier rows are highlighted after clicking "Select All"
- The exported file contains a row for every supplier in the database

**Success Criteria**:
- [ ] "Select All" checkbox selects all rows in one click
- [ ] Clicking "Select All" again deselects all rows
- [ ] Exported file contains all suppliers (no missing rows)
- [ ] File columns match specification: Name, Country, Sector, Contact Email, Status

**Feedback Opportunities**:
- Does the indeterminate state of the header checkbox display correctly when only some
  rows are selected?

---

### Scenario 3: Error Handling and Edge Cases

**User Goal**: Verify graceful error handling when export is triggered with no selection.

**Test Steps**:
1. Navigate to `http://localhost:3000/suppliers`
2. Verify the "Export to Excel" button is disabled (greyed out)
3. Attempt to programmatically click the disabled button (e.g., via browser DevTools)
4. Verify an inline message appears: "Please select at least one supplier to export."
5. Select one supplier, then click Export; while the export is in progress verify the
   button shows a loading state (e.g., "Exporting…") and is temporarily disabled
6. Verify that after export completes the button returns to its enabled state

**Expected Output**:
- No download is triggered if no suppliers are selected
- An inline error message is shown instead of a blank failure

**Success Criteria**:
- [ ] Inline validation message shown when export attempted with no selection
- [ ] Button shows loading indicator during the export request
- [ ] Button re-enables after a successful export (allowing repeated exports)
- [ ] Existing actions (Add Supplier, Delete, Toggle Status, Copy Form Link) still work

**Feedback Opportunities**:
- Is the error message placement visible enough (below the header vs. in a toast)?
- Is the loading state obvious to users?

---

## Test Cases

### TC-01: `handleToggleSelect_togglesOnce_addsIdToSet`

**Type:** Unit
**File:** `src/__tests__/supplier-selection.test.ts`

**Description:**
Verifies that calling `handleToggleSelect` with an un-selected supplier ID adds it to the
`selectedIds` set (reflecting the state transition from unchecked → checked).

**Preconditions:**
- `selectedIds` is an empty `Set<string>`

**Test Steps:**
1. Call `handleToggleSelect("supplier-1")` starting with an empty set
2. Assert the resulting set contains `"supplier-1"`
3. Assert `selectedIds.size === 1`

**Expected Result:**
The new set contains exactly the toggled ID.

**Test Data:** Inline — arbitrary supplier ID string.

---

### TC-02: `handleToggleSelect_togglesTwice_removesIdFromSet`

**Type:** Unit
**File:** `src/__tests__/supplier-selection.test.ts`

**Description:**
Verifies that toggling an already-selected supplier ID removes it (checked → unchecked).

**Preconditions:**
- `selectedIds` contains `"supplier-1"`

**Test Steps:**
1. Call `handleToggleSelect("supplier-1")` with the set containing that ID
2. Assert the resulting set is empty

**Expected Result:**
The ID is removed; the set is empty.

**Test Data:** Inline.

---

### TC-03: `handleSelectAll_noSelection_selectsAll`

**Type:** Unit
**File:** `src/__tests__/supplier-selection.test.ts`

**Description:**
When `selectedIds` is empty (or partially filled), `handleSelectAll` adds all supplier IDs.

**Preconditions:**
- `suppliers` array has 3 items with IDs `["s1", "s2", "s3"]`
- `selectedIds` is empty

**Test Steps:**
1. Call `handleSelectAll()` when not all are selected
2. Assert the resulting set equals `new Set(["s1", "s2", "s3"])`

**Expected Result:**
All three IDs are in the set.

**Test Data:** Inline array of 3 supplier objects.

---

### TC-04: `handleSelectAll_allSelected_deselects`

**Type:** Unit
**File:** `src/__tests__/supplier-selection.test.ts`

**Description:**
When all suppliers are already selected, `handleSelectAll` clears the set.

**Preconditions:**
- `suppliers` array has 3 items
- `selectedIds` contains all 3 IDs

**Test Steps:**
1. Call `handleSelectAll()` when all are already selected
2. Assert the resulting set is empty (`size === 0`)

**Expected Result:**
Set is cleared.

**Test Data:** Inline.

---

### TC-05: `derivedState_someSelected_indeterminateIsTrue`

**Type:** Unit
**File:** `src/__tests__/supplier-selection.test.ts`

**Description:**
Verifies the `someSelected` derived boolean is `true` when a strict subset of suppliers is
selected, enabling the indeterminate state on the header checkbox.

**Preconditions:**
- `suppliers` has 3 items; `selectedIds` contains exactly 1 ID

**Test Steps:**
1. Compute `allSelected = suppliers.length > 0 && selectedIds.size === suppliers.length`
2. Compute `someSelected = selectedIds.size > 0 && selectedIds.size < suppliers.length`
3. Assert `allSelected === false`
4. Assert `someSelected === true`

**Expected Result:**
Only `someSelected` is `true`, `allSelected` is `false`.

**Test Data:** Inline.

---

### TC-06: `exportButton_zeroSelected_isDisabled`

**Type:** Unit
**File:** `src/__tests__/supplier-selection.test.ts`

**Description:**
Confirms the export button's `disabled` attribute is set (native HTML) when `selectedIds.size === 0`.

**Preconditions:**
- `selectedIds` is empty; `exporting` is `false`

**Test Steps:**
1. Compute `disabled = selectedIds.size === 0 || exporting`
2. Assert `disabled === true`

**Expected Result:**
`disabled` evaluates to `true`.

**Test Data:** Inline.

---

### TC-07: `exportButton_oneSelected_isEnabled`

**Type:** Unit
**File:** `src/__tests__/supplier-selection.test.ts`

**Description:**
Confirms the export button is enabled when at least one supplier is selected and not
currently exporting.

**Preconditions:**
- `selectedIds` contains 1 ID; `exporting` is `false`

**Test Steps:**
1. Compute `disabled = selectedIds.size === 0 || exporting`
2. Assert `disabled === false`

**Expected Result:**
`disabled` evaluates to `false`.

**Test Data:** Inline.

---

### TC-08: `ariaLabels_rowCheckbox_includesSupplierName`

**Type:** Unit
**File:** `src/__tests__/supplier-selection.test.ts`

**Description:**
Verifies that the aria-label for an individual row checkbox follows the pattern
`"Select {supplier name}"` as required by the accessibility acceptance criterion.

**Test Steps:**
1. Given `supplierName = "Acme Corp"`
2. Compute `ariaLabel = \`Select ${supplierName}\``
3. Assert `ariaLabel === "Select Acme Corp"`
4. Assert the header aria-label constant equals `"Select all suppliers"`

**Expected Result:**
Both aria-labels match the specification.

**Test Data:** Inline string.

---

### TC-09: `smoke_suppliersPage_checkboxesAndExportButtonPresent`

**Type:** Smoke (Selenium)
**File:** `smoke-tests/supplier-selection-excel-export/test_smoke.py`

**Description:**
End-to-end browser test that navigates to `/suppliers` and verifies all new UI elements
are present and in the correct initial state.

**Preconditions:**
- Docker container is running with seeded data containing at least 1 supplier.

**Test Steps:**
1. Navigate to `/suppliers`
2. Assert no server error (application error boundary not triggered)
3. Locate the checkbox in the table header via `aria-label="Select all suppliers"`
4. Assert it exists and is not checked
5. Locate at least one row checkbox matching `aria-label="Select <supplier name>"`
6. Assert the "Export to Excel" button exists
7. Assert the "Export to Excel" button is `disabled`
8. Assert the selection counter is visible (text contains "selected")

**Expected Result:**
All UI elements are present; export button is initially disabled.

**Test Data:** Seeded database (docker image seed data).

---

### TC-10: `smoke_selectOneAndExport_downloadsFile`

**Type:** Smoke (Selenium)
**File:** `smoke-tests/supplier-selection-excel-export/test_smoke.py`

**Description:**
End-to-end test that selects one supplier checkbox and verifies the export button becomes
enabled; then triggers the export and verifies a download is initiated (via Chrome
download directory inspection or network request detection).

**Preconditions:**
- Docker container running; at least 1 supplier in seeded data.
- Chrome configured with a known download directory.

**Test Steps:**
1. Navigate to `/suppliers`
2. Click the first row's supplier checkbox (aria-label matches "Select …")
3. Assert the "Export to Excel" button is now enabled (not disabled)
4. Assert the selection counter shows "1" (or contains "1 supplier")
5. Click "Export to Excel"
6. Wait up to 10 seconds for a `.xlsx` file to appear in the Chrome download directory
7. Assert the filename matches the pattern `suppliers-export-\d{4}-\d{2}-\d{2}\.xlsx`

**Expected Result:**
A `.xlsx` file with the correct name is downloaded to the configured directory.

**Test Data:** Seeded database.

---

### TC-11: `generateSupplierExcel_validRows_returnsBuffer`

**Type:** Unit
**File:** `src/__tests__/supplier-export.test.ts`

**Description:**
Verifies that `generateSupplierExcel` accepts a valid array of supplier rows and returns a
non-empty `Buffer` that begins with the OOXML magic bytes for a `.xlsx` file (PK ZIP header).

**Preconditions:**
- `exceljs` package available in the test environment (Node.js)

**Test Steps:**
1. Import `generateSupplierExcel` from `@/lib/excel/supplier-export`
2. Call it with an array of 2 valid `SupplierExportRow` objects
3. Assert the result is an instance of `Buffer`
4. Assert `result.length > 0`
5. Assert the first 2 bytes are `0x50, 0x4B` (PK ZIP signature used by OOXML)

**Expected Result:**
A non-empty Buffer with valid `.xlsx` magic bytes is returned.

**Test Data:**
```ts
[
  { name: "Alpha Inc", country: "Germany", sector: "Energy",
    contactEmail: "alpha@example.com", status: "active" },
  { name: "Beta GmbH", country: "France", sector: "Transport",
    contactEmail: "beta@example.com", status: "inactive" }
]
```

---

### TC-12: `generateSupplierExcel_validRows_containsCorrectHeaders`

**Type:** Unit
**File:** `src/__tests__/supplier-export.test.ts`

**Description:**
Reads back the generated workbook via ExcelJS and verifies the header row in the
"Suppliers" worksheet contains exactly: Name, Country, Sector, Contact Email, Status.

**Preconditions:**
- Same as TC-11.

**Test Steps:**
1. Call `generateSupplierExcel` with 1 valid row
2. Load the returned Buffer into a new `ExcelJS.Workbook` via `workbook.xlsx.load(buffer)`
3. Get the worksheet named `"Suppliers"`
4. Assert the worksheet exists
5. Read row 1 (header row) cell values
6. Assert cell values are `["Name", "Country", "Sector", "Contact Email", "Status"]`

**Expected Result:**
Header row exactly matches the specification.

**Test Data:** Single valid `SupplierExportRow`.

---

### TC-13: `generateSupplierExcel_twoRows_eachSupplierAppearsOnce`

**Type:** Unit
**File:** `src/__tests__/supplier-export.test.ts`

**Description:**
Verifies that each supplier in the input array appears as exactly one data row in the
worksheet, with all five field values correctly mapped to the corresponding columns.

**Preconditions:**
- Same as TC-11.

**Test Steps:**
1. Call `generateSupplierExcel` with 2 distinct supplier rows
2. Load the Buffer and open the "Suppliers" worksheet
3. Assert the worksheet has exactly 3 rows (1 header + 2 data)
4. Assert row 2 values match supplier 1's fields in column order
5. Assert row 3 values match supplier 2's fields in column order

**Expected Result:**
2 data rows, each with correct values in all 5 columns.

**Test Data:** 2 distinct `SupplierExportRow` objects (see TC-11).

---

### TC-14: `generateSupplierExcel_allSuppliers_fullExport`

**Type:** Unit
**File:** `src/__tests__/supplier-export.test.ts`

**Description:**
Verifies that when all suppliers are passed, every one appears in the output — ensuring
no rows are dropped due to off-by-one errors or array-slicing issues.

**Test Steps:**
1. Build an array of 5 `SupplierExportRow` objects
2. Call `generateSupplierExcel` with all 5
3. Load the Buffer; assert the worksheet has 6 rows (1 header + 5 data)

**Expected Result:**
All 5 suppliers appear as data rows.

**Test Data:** 5 inline `SupplierExportRow` objects.

---

### TC-15: `generateSupplierExcel_emptyArray_returnsHeaderOnlyBuffer`

**Type:** Unit
**File:** `src/__tests__/supplier-export.test.ts`

**Description:**
Verifies graceful handling of an empty input array — the utility should still produce a
valid `.xlsx` file containing only the header row (no crash, no empty Buffer).

**Test Steps:**
1. Call `generateSupplierExcel([])` 
2. Assert result is a non-empty Buffer
3. Load the Buffer and open the "Suppliers" worksheet
4. Assert the worksheet has exactly 1 row (header only)

**Expected Result:**
A valid `.xlsx` Buffer with header row and zero data rows.

**Test Data:** Empty array `[]`.

---

### TC-16: `exportRouteHandler_validIds_returns200WithCorrectHeaders`

**Type:** Unit (Route Handler, Prisma mocked)
**File:** `src/__tests__/supplier-export-route.test.ts`

**Description:**
Mocks Prisma's `supplier.findMany` to return 2 suppliers, calls the route handler with
valid comma-separated IDs, and verifies the HTTP 200 response with the correct
`Content-Type`, `Content-Disposition`, and `Cache-Control` headers.

**Preconditions:**
- `prisma` is mocked using `vi.mock`
- `logAuditEvent` is mocked using `vi.mock`

**Test Steps:**
1. Mock `prisma.supplier.findMany` to return 2 supplier records
2. Construct a `NextRequest` with `?ids=id1,id2`
3. Call the route handler's `GET` function
4. Assert response status is `200`
5. Assert `Content-Type` header is
   `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
6. Assert `Content-Disposition` header matches
   `attachment; filename="suppliers-export-\d{4}-\d{2}-\d{2}\.xlsx"`
7. Assert `Cache-Control` header is `no-store`

**Expected Result:**
HTTP 200 with all three required response headers.

**Test Data:** 2 mocked supplier records; valid IDs in query string.

---

### TC-17: `exportRouteHandler_missingIds_returns400`

**Type:** Unit (Route Handler, Prisma mocked)
**File:** `src/__tests__/supplier-export-route.test.ts`

**Description:**
Verifies that the route handler returns HTTP 400 when the `ids` query parameter is absent.

**Test Steps:**
1. Construct a `NextRequest` with no query parameters
2. Call the route handler's `GET` function
3. Assert response status is `400`

**Expected Result:**
HTTP 400 response.

**Test Data:** Request URL with no query string.

---

### TC-18: `exportRouteHandler_emptyIds_returns400`

**Type:** Unit (Route Handler, Prisma mocked)
**File:** `src/__tests__/supplier-export-route.test.ts`

**Description:**
Verifies that the route handler returns HTTP 400 when `ids` is present but empty (`?ids=`).

**Test Steps:**
1. Construct a `NextRequest` with `?ids=`
2. Call the route handler's `GET` function
3. Assert response status is `400`

**Expected Result:**
HTTP 400 response.

**Test Data:** Request URL with `?ids=`.

---

### TC-19: `exportRouteHandler_noMatchingSuppliers_returns404`

**Type:** Unit (Route Handler, Prisma mocked)
**File:** `src/__tests__/supplier-export-route.test.ts`

**Description:**
Verifies that when Prisma finds no suppliers for the given IDs, the handler returns HTTP 404.

**Preconditions:**
- `prisma.supplier.findMany` is mocked to return `[]`

**Test Steps:**
1. Mock `prisma.supplier.findMany` to return empty array
2. Construct a `NextRequest` with `?ids=nonexistent-id`
3. Call the route handler's `GET` function
4. Assert response status is `404`

**Expected Result:**
HTTP 404 response.

**Test Data:** Non-existent supplier ID; Prisma mock returns `[]`.

---

### TC-20: `exportRouteHandler_prismaThrows_returns500`

**Type:** Unit (Route Handler, Prisma mocked)
**File:** `src/__tests__/supplier-export-route.test.ts`

**Description:**
Verifies that an unexpected Prisma error (database down, connection failure) is caught and
surfaced as HTTP 500 without leaking the error message to the client.

**Preconditions:**
- `prisma.supplier.findMany` is mocked to throw `new Error("DB_FAILURE")`

**Test Steps:**
1. Mock `prisma.supplier.findMany` to throw
2. Construct a `NextRequest` with valid `?ids=id1`
3. Call the route handler's `GET` function
4. Assert response status is `500`

**Expected Result:**
HTTP 500 response; response body does not contain `"DB_FAILURE"`.

**Test Data:** Any valid ID string.

---

### TC-21: `exportRouteHandler_successfulExport_logsAuditEvent`

**Type:** Unit (Route Handler, Prisma + audit mocked)
**File:** `src/__tests__/supplier-export-route.test.ts`

**Description:**
Verifies that on a successful export `logAuditEvent` is called once with the correct
`entityType`, `action`, and `actor` fields — matching the pattern used by the PDF export.

**Preconditions:**
- `prisma.supplier.findMany` returns 2 suppliers
- `logAuditEvent` is mocked with `vi.fn()`

**Test Steps:**
1. Mock `prisma.supplier.findMany` to return 2 supplier records
2. Spy on `logAuditEvent`
3. Construct a valid `NextRequest` with `?ids=id1,id2`
4. Call the route handler's `GET` function
5. Assert `logAuditEvent` was called exactly once
6. Assert the call arguments include `entityType: "export"`, `action: "exported"`,
   `actor: "system"`
7. Assert the `comment` field contains the supplier count (e.g., `"2 suppliers"`)

**Expected Result:**
`logAuditEvent` called once with correct arguments.

**Test Data:** 2 mocked supplier records.

---

### TC-22: `selectionState_afterLoad_isCleared`

**Type:** Unit
**File:** `src/__tests__/supplier-selection.test.ts`

**Description:**
Verifies that `selectedIds` is reset to an empty set when `load()` is called (after
add/delete/token-refresh operations), preventing stale selections pointing to deleted
suppliers.

**Preconditions:**
- `selectedIds` contains IDs of 2 suppliers

**Test Steps:**
1. Simulate `load()` completing (which calls `setSelectedIds(new Set())`)
2. Assert `selectedIds.size === 0`

**Expected Result:**
Set is empty after reload.

**Test Data:** Inline.

---

## Test Data Requirements

No new test data files required. All unit tests use inline data. Smoke tests use the
existing Docker image seed data which already includes multiple supplier records.

---

## Edge Cases

| Scenario | Expected Behavior | Test Case |
|---|---|---|
| Empty supplier list (0 rows) | Export button stays disabled; select-all has no effect | TC-06 |
| All suppliers selected then one deselected | Header checkbox shows indeterminate | TC-05 |
| `generateSupplierExcel` with empty array | Returns header-only `.xlsx` Buffer, no crash | TC-15 |
| API called with `?ids=` (empty string) | HTTP 400 returned | TC-18 |
| API called with IDs for non-existent suppliers | HTTP 404 returned | TC-19 |
| DB error during export | HTTP 500 returned; error not leaked | TC-20 |
| Export triggered via keyboard when disabled | Inline validation message shown | TC-10 (smoke) |
| Supplier deleted while selected | `load()` resets selection; no dangling ID | TC-22 |
| `status` field value "active" vs "inactive" | Passed through as-is (no transformation) | TC-13 |
| Long supplier name / special characters | Written to Excel cell verbatim | TC-13 |

---

## Non-Functional Tests

### Performance

The specification requires Excel generation to complete in under 3 seconds for up to
1,000 suppliers. This is verified implicitly by the smoke tests (which have a 10-second
download timeout) and the architecture analysis (ExcelJS in-memory serialisation for
1,000 × 5 columns is well under 100 ms). A dedicated performance test is not required
for the MVP but should be added if load testing is introduced.

### Accessibility

TC-08 and TC-09 verify `aria-label` values on checkboxes. The `disabled` attribute
(not CSS alone) on the export button is verified in TC-06. Screen-reader compatibility
is validated during UAT Scenario 3.

### Error Handling

TC-17 through TC-20 cover all four documented HTTP error codes (400, 404, 500). The
client-side error message "Export failed. Please try again." is verified in TC-10 (smoke).

---

## Test File Locations

| File | Tests |
|---|---|
| `src/__tests__/supplier-selection.test.ts` | TC-01 through TC-08, TC-22 |
| `src/__tests__/supplier-export.test.ts` | TC-11 through TC-15 |
| `src/__tests__/supplier-export-route.test.ts` | TC-16 through TC-21 |
| `smoke-tests/supplier-selection-excel-export/test_smoke.py` | TC-09, TC-10 |

All unit tests run via `cd src && npm test` (Vitest).
All smoke tests run via `pytest smoke-tests/` against the Docker container.

---

## Open Questions

1. **Smoke test download verification** — Selenium's native download detection requires
   configuring a Chrome download directory in the test fixture. If this adds too much
   complexity, TC-10 may instead verify that the fetch to `/api/suppliers/export` returns
   a `200` response with the correct `Content-Type`, using the browser's Network API or
   `requests` in a Python HTTP call. The UAT Tester agent should choose the most reliable
   approach.

2. **Indeterminate checkbox in Selenium** — The `indeterminate` property is set via a
   DOM ref in React (not via a standard HTML attribute), so Selenium's `is_selected()`
   will return `false` for an indeterminate checkbox. TC-09 should use
   `driver.execute_script("return arguments[0].indeterminate", el)` to assert the
   property correctly.
