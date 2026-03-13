# Tasks: Export Suppliers to Excel

## Overview

Feature 003 adds a one-click "Export to Excel" button on the Suppliers page that
triggers a download of all suppliers as a `.xlsx` file. The file contains five
columns (Name, Country, Sector, Contact Email, Status), is sorted alphabetically
by name, and follows the same fetch → transform → binary-response → audit-log
pattern established by the existing PDF export route.

Reference: `docs/features/003-export-suppliers-excel/specification.md`
Architecture: `docs/features/003-export-suppliers-excel/architecture.md`
Test Plan: `docs/features/003-export-suppliers-excel/test-plan.md`

---

## Tasks

### Task 1: Install `xlsx` (SheetJS) npm package

**Priority:** High

**Description:**
Add the SheetJS community edition (`xlsx`) npm package as a production dependency
inside `src/`. This is the only new dependency required by this feature and must
be installed before any other task can be implemented or tested.

**Acceptance Criteria:**
- [x] `cd src && npm install xlsx` completes without errors
- [x] `"xlsx"` appears in `src/package.json` under `"dependencies"` with a version
      in the `0.18.x` range (e.g. `"^0.18.5"`)
- [x] `src/package-lock.json` is updated to reflect the new dependency
- [x] Running `cd src && npm run build` still succeeds (no import resolution errors)

**Dependencies:** None

**Notes:**
Per ADR-005 (`architecture.md`), SheetJS is preferred over ExcelJS for this MVP
because it has zero native dependencies, a minimal API surface, and produces valid
`.xlsx` files from plain JavaScript objects in three lines of code.
Install inside `src/` (where `package.json` lives), not at the repository root.

---

### Task 2: Create the XLSX export API route

**Priority:** High

**Description:**
Create a new Next.js App Router route handler at
`src/app/api/export/suppliers/xlsx/route.ts` that:
1. Fetches all suppliers for `DEMO_COMPANY_ID` from Prisma (five fields only,
   sorted by `name` ascending — `publicFormToken` must never be selected).
2. Maps the Prisma records to row objects with human-readable header keys.
3. Uses SheetJS to build a workbook and write it to a `Buffer`.
4. Logs an audit event via `logAuditEvent`.
5. Returns the buffer as an HTTP 200 binary response with the correct headers.
6. Returns an HTTP 500 JSON response if any step throws an error.

**Acceptance Criteria:**
- [x] File `src/app/api/export/suppliers/xlsx/route.ts` exists and exports an
      async `GET` function
- [x] Prisma query selects only `name`, `country`, `sector`, `contactEmail`,
      `status`; `publicFormToken` is **not** in the `select` clause
- [x] Rows are ordered `{ orderBy: { name: "asc" } }`
- [x] Row objects use the keys `Name`, `Country`, `Sector`, `"Contact Email"`,
      `Status` (human-readable, matching the spec's header row)
- [x] SheetJS calls follow the pattern:
      `json_to_sheet(rows)` → `book_new()` + `book_append_sheet(wb, ws, "Suppliers")`
      → `write(wb, { type: "buffer", bookType: "xlsx" })`
- [x] `logAuditEvent` is called with
      `{ entityType: "export", action: "exported", actor: "system", ... }`
      and a comment containing the supplier row count
- [x] Response `Content-Type` is
      `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- [x] Response `Content-Disposition` is
      `attachment; filename="greenledger-suppliers-YYYY-MM-DD.xlsx"` using today's
      ISO date (`new Date().toISOString().slice(0, 10)`)
- [x] Response `Cache-Control` is `no-store`
- [x] On DB error the handler catches the exception and returns
      `NextResponse.json({ error: "Failed to generate XLSX", detail: message }, { status: 500 })`
- [x] TypeScript strict-mode compilation succeeds (`cd src && npm run type-check`)

**Dependencies:** Task 1

**Notes:**
Follow the structure of the existing PDF route at
`src/app/api/export/pdf/route.ts` (imports, try/catch shape, audit log call,
`NextResponse` binary return).
Import constants from `@/lib/constants` (`DEMO_COMPANY_ID`) and the audit helper
from `@/lib/audit` (`logAuditEvent`), consistent with the rest of the codebase.
Use `new Uint8Array(buf as Buffer)` when constructing the `NextResponse` body.

---

### Task 3: Add "Export to Excel" button to the Suppliers page

**Priority:** High

**Description:**
Modify `src/app/(app)/suppliers/suppliers-client.tsx` to add an "Export to Excel"
anchor link in the toolbar area next to the existing "+ Add Supplier" button.

**Acceptance Criteria:**
- [x] An `<a>` element with `href="/api/export/suppliers/xlsx"` is rendered in
      the toolbar `div` (the `flex items-center justify-between` container at
      approximately line 110)
- [x] The anchor text is `⬇ Export to Excel` (or visually equivalent)
- [x] The `<a>` tag uses a secondary button style consistent with the page's
      design system, e.g.:
      ```
      className="bg-white border border-gray-300 text-gray-700 px-4 py-2
                 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
      ```
- [x] The existing `+ Add Supplier` button is unchanged and still present
- [x] The toolbar `div` wraps both controls in a `flex items-center gap-3`
      container so they appear side-by-side
- [x] The button is visible regardless of whether any suppliers exist
- [x] TypeScript compilation succeeds with no new type errors
- [x] No client-side `fetch()` or `useState` logic is added — the `<a>` tag
      triggers the browser's native file-download flow directly

**Dependencies:** None (can be developed in parallel with Task 2, but needs
Task 2 to be testable end-to-end)

**Notes:**
Using a plain `<a>` (not `<button onClick={fetch(...)}>`) is a deliberate
architectural choice documented in ADR-005. It avoids client-side state, loading
indicators, and blob URLs, and relies on the browser's built-in download handling.
The toolbar change is minimal: wrap the existing lone `<button>` in a
`<div className="flex items-center gap-3">` and add the `<a>` sibling before it.

---

### Task 4: Write Vitest unit tests

**Priority:** High

**Description:**
Create `src/__tests__/xlsx-export.test.ts` with 10 unit test cases (TC-01 through
TC-10) as specified in the test plan. The tests cover: correct HTTP status, all
three response headers, correct XLSX content (header row, data rows, column
exclusion, alphabetical sort), empty-state, audit logging, and DB-error handling.
Real SheetJS execution is used (no mocking of `xlsx`) so that tests verify actual
binary output.

**Acceptance Criteria:**
- [x] File `src/__tests__/xlsx-export.test.ts` exists
- [x] `@/lib/prisma` is mocked with `vi.mock` so `prisma.supplier.findMany` is a
      `vi.fn()` controllable per test
- [x] `@/lib/audit` is mocked with `vi.mock` so `logAuditEvent` is a `vi.fn()`
- [x] The `SUPPLIER_FIXTURES` array is defined inline (Alpha Ltd / Beta GmbH as
      specified in the test plan's "Test Data Requirements" section)
- [x] **TC-01** — `GET` returns HTTP 200 with non-empty body when suppliers exist
- [x] **TC-02** — `Content-Disposition` matches regex
      `attachment; filename="greenledger-suppliers-\d{4}-\d{2}-\d{2}\.xlsx"`
- [x] **TC-03** — `Cache-Control` header equals `"no-store"`
- [x] **TC-04** — `Content-Type` header equals
      `"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"`
- [x] **TC-05** — Header row (row index 0) deep-equals
      `["Name", "Country", "Sector", "Contact Email", "Status"]`
- [x] **TC-06** — Data rows match fixture values; `rows.length === 2`
- [x] **TC-07** — `publicFormToken` is absent from all XLSX headers and cells
      (even when the mock returns a fixture object that includes it)
- [x] **TC-08** — Empty supplier list returns HTTP 200 with a header-only XLSX
      (exactly 1 row, the header row)
- [x] **TC-09** — `logAuditEvent` is called exactly once with
      `{ action: "exported", entityType: "export" }` and a comment containing
      the supplier count
- [x] **TC-10** — DB error (mock rejects) returns HTTP 500 JSON with
      `{ error: "Failed to generate XLSX" }`
- [x] All 10 tests pass: `cd src && npm test -- xlsx-export`
- [x] No existing tests are broken: `cd src && npm test` exits with 0

**Dependencies:** Tasks 1 and 2 (tests import and exercise the real route)

**Notes:**
Parse the XLSX binary in tests using `XLSX.read(Buffer.from(await response.arrayBuffer()))`,
then convert the first sheet with `XLSX.utils.sheet_to_json({ header: 1 })` to get
an array of arrays for header-row assertions, and with
`XLSX.utils.sheet_to_json()` (default object mode) for data-row assertions.
Each test should call `vi.mocked(prisma.supplier.findMany).mockResolvedValue(...)`
(or `mockRejectedValue` for TC-10) at the start of the test body.

---

## Implementation Order

Recommended sequence for implementation:

1. **Task 1** — Install `xlsx` package. Everything else depends on SheetJS being
   importable.
2. **Task 2** — Create the API route. This is the core of the feature; the UI
   button and tests both depend on it existing.
3. **Task 3** — Add the UI button. Depends on Task 2 to be testable end-to-end,
   but the JSX change itself is simple and self-contained.
4. **Task 4** — Write Vitest tests. Requires Tasks 1 and 2; should be written
   after the route is implemented so tests can import and exercise real code.

Tasks 2 and 3 may be developed in parallel by splitting work, but Task 1 must
complete before Task 2, and Task 2 must complete before Task 4.

---

## Open Questions

None. The specification, architecture, and test plan are unambiguous. All
acceptance criteria have direct test coverage. The library choice (SheetJS) and
UI pattern (plain `<a>` tag) are decided in ADR-005.
