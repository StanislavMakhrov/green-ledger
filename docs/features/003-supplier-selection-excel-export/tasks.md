# Tasks: Supplier Selection and Excel Export

## Overview

Feature 003 adds per-row checkboxes to the Suppliers table, a "Select All" header checkbox,
a selection counter, and an "Export to Excel" button that triggers a server-side `.xlsx`
download via `GET /api/suppliers/export?ids=...`.

**Specification:** `docs/features/003-supplier-selection-excel-export/specification.md`
**Architecture:** `docs/features/003-supplier-selection-excel-export/architecture.md`
**Test Plan:** `docs/features/003-supplier-selection-excel-export/test-plan.md`

---

## Tasks

### Task 1: Install ExcelJS Dependency

**Priority:** High

**Description:**
Add `exceljs@4.4.0` to the project's production dependencies. This is the only new
third-party dependency for this feature. ExcelJS was chosen over SheetJS because SheetJS
0.18.5 (the latest public version) has two unpatched vulnerabilities (Prototype Pollution
and ReDoS) with no patched version available on the public npm registry. ExcelJS 4.4.0 has
no known vulnerabilities (confirmed via GitHub Advisory Database).

**Files to Modify:**
- `src/package.json` — add `"exceljs": "4.4.0"` to `dependencies`
- `src/package-lock.json` — updated automatically by `npm install`

**Steps:**
1. `cd src && npm install exceljs@4.4.0`
2. Verify the package appears in `src/package.json` under `dependencies`
3. Verify `src/package-lock.json` is updated

**Acceptance Criteria:**
- [ ] `exceljs@4.4.0` is listed in `src/package.json` under `dependencies`
- [ ] `npm install` in `src/` completes without errors
- [ ] `npm run build` in `src/` still passes after the install (no type errors from ExcelJS)
- [ ] No new security vulnerabilities are introduced (check `npm audit`)

**Dependencies:** None

**Notes:**
ExcelJS ships its own TypeScript types; no separate `@types/exceljs` package is needed.

---

### Task 2: Create Excel Utility — `src/lib/excel/supplier-export.ts`

**Priority:** High

**Description:**
Create a pure Node.js utility function `generateSupplierExcel(rows)` that accepts an array
of `SupplierExportRow` objects and returns a `Promise<Buffer>` containing a valid `.xlsx`
workbook. This follows the exact same pattern as `src/lib/pdf/report-template.ts` (pure
data-in / output-out, no Prisma access, no side effects).

**Files to Create:**
- `src/lib/excel/supplier-export.ts` — utility function + `SupplierExportRow` interface

**Files to Create (Tests):**
- `src/__tests__/supplier-export.test.ts` — unit tests for the utility (TC-11 through TC-15)

**Implementation Details:**

```
Interface SupplierExportRow {
  name: string
  country: string
  sector: string
  contactEmail: string
  status: "active" | "inactive"
}

async function generateSupplierExcel(rows: SupplierExportRow[]): Promise<Buffer>
```

The function must:
1. Create a new `ExcelJS.Workbook`
2. Add a worksheet named `"Suppliers"`
3. Write header row: `["Name", "Country", "Sector", "Contact Email", "Status"]`
4. Append one data row per element in `rows`
5. Return the workbook via `workbook.xlsx.writeBuffer()` cast to `Buffer`

**Acceptance Criteria:**
- [ ] `src/lib/excel/supplier-export.ts` exports `generateSupplierExcel` as a named export
- [ ] `src/lib/excel/supplier-export.ts` exports `SupplierExportRow` as a named interface
- [ ] TC-11: `generateSupplierExcel` returns a non-empty `Buffer` with PK ZIP magic bytes (`0x50 0x4B`)
- [ ] TC-12: The worksheet is named `"Suppliers"` and row 1 is exactly `["Name", "Country", "Sector", "Contact Email", "Status"]`
- [ ] TC-13: Two input rows produce exactly 3 worksheet rows (1 header + 2 data), with correct field values in column order
- [ ] TC-14: Five input rows produce 6 worksheet rows (full export, no off-by-one errors)
- [ ] TC-15: Empty input `[]` produces a valid Buffer with 1 row (header only, no crash)
- [ ] All 5 test cases in `src/__tests__/supplier-export.test.ts` pass with `npm test`
- [ ] No Prisma imports in the utility (pure data transformation)
- [ ] File stays under 50 lines (simple utility)

**Dependencies:** Task 1 (ExcelJS installed)

**Notes:**
- Use `workbook.xlsx.writeBuffer()` — it returns a `Buffer` in Node.js
- Named exports only (no default export) per `docs/conventions.md`
- Mirror the file/folder structure of `src/lib/pdf/report-template.ts`

---

### Task 3: Create Route Handler — `src/app/api/suppliers/export/route.ts`

**Priority:** High

**Description:**
Create a new Next.js Route Handler at `GET /api/suppliers/export?ids=id1,id2,...` that
accepts a comma-separated list of supplier IDs, fetches the matching suppliers from Prisma,
generates the Excel file using the utility from Task 2, logs an audit event, and returns
the binary response. This follows the identical pattern as `src/app/api/export/pdf/route.ts`.

**Files to Create:**
- `src/app/api/suppliers/export/route.ts` — Route Handler

**Files to Create (Tests):**
- `src/__tests__/supplier-export-route.test.ts` — unit tests with mocked Prisma + audit (TC-16 through TC-21)

**Implementation Details:**

```
GET /api/suppliers/export?ids=id1,id2,...
```

Handler behaviour (in order):
1. Parse `ids` query parameter (comma-separated string). Return **HTTP 400** if absent or empty.
2. Fetch suppliers from Prisma: `companyId = DEMO_COMPANY_ID` AND `id IN ids`.
3. Return **HTTP 404** if the result set is empty.
4. Call `generateSupplierExcel(rows)` to produce the Buffer.
5. Call `logAuditEvent` with:
   - `entityType: "export"`, `entityId: DEMO_COMPANY_ID`, `action: "exported"`, `actor: "system"`
   - `comment: "Excel export — N suppliers"` (where N = number of suppliers exported)
6. Return **HTTP 200** with headers:
   - `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
   - `Content-Disposition: attachment; filename="suppliers-export-YYYY-MM-DD.xlsx"` (date from `new Date().toISOString().slice(0, 10)`)
   - `Cache-Control: no-store`
7. Return **HTTP 500** on any unexpected error (do not leak error details to the client).

**Acceptance Criteria:**
- [ ] TC-16: HTTP 200 response with correct `Content-Type`, `Content-Disposition` (matching `suppliers-export-\d{4}-\d{2}-\d{2}\.xlsx`), and `Cache-Control: no-store`
- [ ] TC-17: HTTP 400 when `ids` query parameter is absent
- [ ] TC-18: HTTP 400 when `ids` is present but empty (`?ids=`)
- [ ] TC-19: HTTP 404 when Prisma returns no matching suppliers
- [ ] TC-20: HTTP 500 on unexpected Prisma error; response body does NOT contain the internal error message
- [ ] TC-21: `logAuditEvent` is called exactly once with `entityType: "export"`, `action: "exported"`, `actor: "system"`, and `comment` containing the supplier count
- [ ] All 6 test cases in `src/__tests__/supplier-export-route.test.ts` pass with `npm test`
- [ ] Prisma query filters by `companyId: DEMO_COMPANY_ID` (no cross-company data leakage)
- [ ] `npm run build` passes after this task

**Dependencies:** Task 2 (utility function)

**Notes:**
- Use `vi.mock("@/lib/prisma")` and `vi.mock("@/lib/audit")` in the test file — consistent with existing route handler tests in the project
- The date in the filename must be derived server-side (not passed in from client)
- Return `new NextResponse(new Uint8Array(buffer), { ... })` — same pattern as the PDF route

---

### Task 4: Update UI — Add Selection State, Checkboxes, and Export Button to `suppliers-client.tsx`

**Priority:** High

**Description:**
Modify the existing `src/app/(app)/suppliers/suppliers-client.tsx` client component to add:
- Selection state (`selectedIds: Set<string>`)
- Exporting state (`exporting: boolean`) and error state (`exportError: string | null`)
- "Select All" checkbox in the table header (with indeterminate support)
- Per-row checkbox in each table body row (with accessible `aria-label`)
- Visual highlight for selected rows (`bg-green-50` on the `<tr>`)
- Selection counter label ("N supplier(s) selected")
- "Export to Excel" button (disabled when 0 selected or while exporting)
- `handleExport()` async function (fetch → Blob → object URL → temporary `<a>` → click → revoke)
- Selection reset inside `load()` after any data refresh

**Files to Modify:**
- `src/app/(app)/suppliers/suppliers-client.tsx`

**Implementation Details (Architecture § suppliers-client.tsx):**

State additions:
```ts
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
const [exporting, setExporting]     = useState(false)
const [exportError, setExportError] = useState<string | null>(null)
```

Derived values (computed, not stored):
```ts
const allSelected  = suppliers.length > 0 && selectedIds.size === suppliers.length
const someSelected = selectedIds.size > 0 && selectedIds.size < suppliers.length
```

`handleSelectAll`: if `allSelected` → `setSelectedIds(new Set())`; else → `setSelectedIds(new Set(suppliers.map(s => s.id)))`.

`handleToggleSelect(id)`: create new Set from `selectedIds`, toggle membership, call setter.

`handleExport()`:
1. Guard: `selectedIds.size === 0` → set `exportError` and return early.
2. Set `exporting = true`, clear `exportError`.
3. `fetch("/api/suppliers/export?ids=...")` with `GET`.
4. On non-OK: parse error JSON body or use generic message, throw.
5. Convert to `Blob` → `URL.createObjectURL` → temporary `<a download="...">` → `.click()` → `URL.revokeObjectURL`.
6. On catch: `setExportError("Export failed. Please try again.")`.
7. Finally: `setExporting(false)`.

Selection reset: add `setSelectedIds(new Set())` inside the `load` callback after `setSuppliers(json.data)`.

Header bar layout:
```
[N supplier(s) selected]  [Export to Excel ↓ | Exporting…]  [+ Add Supplier]
```

The "Select All" header checkbox must use a `ref` callback (or `useRef` + `useEffect`) to set
the `indeterminate` DOM property when `someSelected === true`.

**Acceptance Criteria:**
- [ ] A checkbox column appears as the **leftmost** column in the Suppliers table
- [ ] Header checkbox has `aria-label="Select all suppliers"`
- [ ] Checking the header checkbox selects all visible rows; unchecking deselects all
- [ ] Header checkbox shows indeterminate state when a strict subset is selected (TC-05 derived logic)
- [ ] Each row checkbox has `aria-label="Select {supplier name}"`
- [ ] Toggling a row checkbox adds/removes the supplier ID from `selectedIds`
- [ ] Selected rows have `bg-green-50` applied to the `<tr>` element
- [ ] Selection counter label is visible and shows "N supplier(s) selected"
- [ ] "Export to Excel" button is present in the page header
- [ ] "Export to Excel" button is **disabled** (native `disabled` attribute) when `selectedIds.size === 0` or `exporting === true`
- [ ] "Export to Excel" button shows "Exporting…" while `exporting === true`
- [ ] Clicking "Export to Excel" with ≥ 1 selected supplier triggers a browser download
- [ ] An inline error message is shown when `exportError` is set
- [ ] Selection is cleared (`selectedIds.size === 0`) after `load()` completes
- [ ] All existing supplier actions (add, delete, toggle status, copy form link, refresh token) continue to function correctly
- [ ] `npm run build` passes; no TypeScript errors

**Dependencies:** Task 3 (route handler must exist for `handleExport()` to call)

**Notes:**
- The indeterminate property is a DOM property, not an HTML attribute — it can only be set via a ref: `checkboxRef.current.indeterminate = someSelected`
- Keep the file under 300 lines; the architecture doc shows it will grow significantly — refactor sub-components into separate files if the limit is exceeded
- Use `void handleExport()` in the onClick handler (consistent with existing `void handleAdd(e)` pattern)

---

### Task 5: Add Component Unit Tests for Selection State Logic

**Priority:** Medium

**Description:**
Create the unit test file for selection state logic derived from `suppliers-client.tsx`. Per
the test plan, these tests are written as **pure function tests** (no React component
rendering required), extracting the toggle and select-all logic to test in isolation. This
approach was chosen by the Quality Engineer to avoid React Testing Library setup overhead
while achieving full coverage of the business logic.

**Files to Create:**
- `src/__tests__/supplier-selection.test.ts` — 8 unit test cases (TC-01 through TC-08, TC-22)

**Test Cases to Implement:**

| Test Case | Description |
|-----------|-------------|
| TC-01 | `handleToggleSelect` with un-selected ID → adds to set |
| TC-02 | `handleToggleSelect` with already-selected ID → removes from set |
| TC-03 | `handleSelectAll` when nothing selected → selects all IDs |
| TC-04 | `handleSelectAll` when all selected → clears set |
| TC-05 | `someSelected` derived value is `true` when strict subset selected |
| TC-06 | Export button `disabled` is `true` when `selectedIds.size === 0` |
| TC-07 | Export button `disabled` is `false` when `selectedIds.size >= 1` |
| TC-08 | `aria-label` for row checkbox follows `"Select {name}"` pattern; header label is `"Select all suppliers"` |
| TC-22 | `selectedIds` resets to empty set after `load()` simulated |

**Acceptance Criteria:**
- [ ] TC-01: Toggling an unselected ID once adds it to the set (`size === 1`)
- [ ] TC-02: Toggling an already-selected ID removes it (set becomes empty)
- [ ] TC-03: `handleSelectAll` with empty set produces a set containing all supplier IDs
- [ ] TC-04: `handleSelectAll` when all selected clears the set (`size === 0`)
- [ ] TC-05: `someSelected` is `true` and `allSelected` is `false` when 1 of 3 suppliers selected
- [ ] TC-06: `disabled = selectedIds.size === 0 || exporting` evaluates to `true` when size is 0
- [ ] TC-07: `disabled` evaluates to `false` when size ≥ 1 and `exporting` is false
- [ ] TC-08: `aria-label` string for a row matches `"Select Acme Corp"` given name `"Acme Corp"`; header label constant is `"Select all suppliers"`
- [ ] TC-22: After simulating `load()` (calling `setSelectedIds(new Set())`), `selectedIds.size === 0`
- [ ] All 9 test cases pass with `npm test`
- [ ] Tests are in `src/__tests__/supplier-selection.test.ts` (filename matches test plan)

**Dependencies:** Task 4 (the logic under test comes from the supplier-client implementation)

**Notes:**
- The test plan explicitly calls for these as pure logic tests — model the selection handlers
  as standalone functions or extract the logic inline in the test file (no `render()` calls needed)
- For TC-22, simulate by calling `setSelectedIds(new Set())` directly, asserting the resulting
  state variable, as the `load()` function is a `useCallback` that updates state

---

## Implementation Order

Recommended sequence for implementation:

1. **Task 1 — Install ExcelJS** — Must be first; Tasks 2–4 all depend on the package being
   available. Validates the dependency itself has no installation issues.

2. **Task 2 — Excel utility (`src/lib/excel/supplier-export.ts`)** — Pure function, no UI
   dependencies. Can be built and tested independently. Early verification that ExcelJS
   works as expected in the project's Node.js environment.

3. **Task 3 — Route handler (`src/app/api/suppliers/export/route.ts`)** — Depends on the
   utility (Task 2). Build and test the server-side API in isolation before touching the UI.
   Route handler tests confirm the API contract before the UI calls it.

4. **Task 4 — UI changes (`suppliers-client.tsx`)** — Depends on the route handler (Task 3)
   being available at the expected URL. The most complex task; implement after the backend
   is confirmed working.

5. **Task 5 — Selection state unit tests** — Depends on Task 4 being complete so the logic
   under test is finalised. Can be written in parallel with Task 4 if the developer prefers
   TDD, but logically follows the implementation.

---

## Open Questions

1. **Audit event `entityType`**: The `logAuditEvent` call uses `entityType: "export"` and
   `action: "exported"` (matching the PDF export). This requires `"export"` to be a valid
   `AuditEntityType` enum value in the Prisma schema. Confirm this is already seeded before
   implementing Task 3. If not, a Prisma migration will be needed (not currently in scope).

2. **`bg-green-50` vs `bg-blue-50` for row highlight**: Architecture mentions either colour.
   The specification says "light background tint." Unless the Maintainer has a preference,
   use `bg-green-50` (consistent with the app's existing green brand colour).

3. **Selection counter wording**: Architecture spec shows `"N supplier(s) selected"`.
   Should this read `"1 supplier selected"` / `"3 suppliers selected"` (grammatically
   correct pluralisation) or `"N supplier(s) selected"` (simpler)? Unless Maintainer
   specifies, use the `"N supplier(s) selected"` format as documented.
