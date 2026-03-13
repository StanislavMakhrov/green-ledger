# Code Review: Export Suppliers to Excel (Feature 003)

**Reviewer:** Code Reviewer Agent
**Date:** 2025-07-14
**Branch:** `copilot/add-export-suppliers-to-excel`

---

## Summary

Reviewed the three primary implementation files for Feature 003 (XLSX supplier export):
the new API route, the updated UI component, and the Vitest test suite. The implementation
is clean, correct, and follows the established PDF export pattern closely. All 34 tests
pass, the build succeeds, ESLint reports zero warnings, and CodeQL reports zero alerts.

**Two fixes were applied during this review:**

1. Added `Content-Length` header to the XLSX route response (missing relative to the
   PDF route pattern).
2. Fixed 45 markdownlint errors across 4 feature documentation files (MD032, MD040,
   MD031, MD038 — all blank-line and code-block formatting issues introduced by
   earlier agents).

---

## Verification Results

| Check | Result |
|-------|--------|
| Tests | ✅ Pass (34/34 — 10 new + 24 pre-existing) |
| Build (`next build`) | ✅ Success |
| Type check | ✅ Pass (embedded in `next build`) |
| ESLint | ✅ 0 warnings, 0 errors |
| Markdownlint | ✅ 0 errors (after fixes) |
| CodeQL | ✅ 0 alerts |

---

## Specification Compliance

| Acceptance Criterion | Implemented | Tested | Notes |
|---|---|---|---|
| "Export to Excel" button visible on Suppliers page | ✅ | TC-11 (smoke — pending UAT) | `<a>` in toolbar next to "+ Add Supplier" |
| Clicking button downloads `.xlsx` file | ✅ | TC-01 (binary body) | `Content-Disposition: attachment` |
| File opens in Excel / LibreOffice | ✅ | TC-01, TC-05, TC-06 | Real SheetJS execution in tests |
| Header row: Name, Country, Sector, Contact Email, Status | ✅ | TC-05 | Explicit `header` array in `json_to_sheet` |
| Each supplier appears as exactly one data row | ✅ | TC-06 | `rows.length === 2` for 2-fixture test |
| `publicFormToken` **not** present | ✅ | TC-07 | Excluded at Prisma `select` level; test verifies no leak even if returned by mock |
| Rows sorted alphabetically by Name | ✅ | ⚠️ No unit test (see Minor Issues) | `orderBy: { name: "asc" }` in Prisma query |
| Filename: `greenledger-suppliers-YYYY-MM-DD.xlsx` | ✅ | TC-02 | Regex match on `Content-Disposition` |
| Audit log entry on every export | ✅ | TC-09 | `logAuditEvent` called once with correct payload |
| Empty supplier list → valid XLSX with header row only | ✅ | TC-08 | `rows.length === 1` for empty mock |
| `GET /api/export/suppliers/xlsx` API route | ✅ | TC-01 to TC-10 | Registered in Next.js app router |
| Works within Next.js App Router / TypeScript strict | ✅ | Build pass | TypeScript strict mode, no type errors |
| `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` | ✅ | TC-04 | |
| `Cache-Control: no-store` | ✅ | TC-03 | |
| DB error → HTTP 500 JSON | ✅ | TC-10 | |

**Spec Deviations Found:** None. All acceptance criteria are implemented correctly.

---

## Adversarial Testing

| Test Case | Result | Notes |
|-----------|--------|-------|
| Empty supplier list | ✅ Pass | TC-08 — header-only XLSX, HTTP 200 |
| `publicFormToken` in mock return value | ✅ Pass | TC-07 — token absent from all cells/headers |
| DB throws during `findMany` | ✅ Pass | TC-10 — HTTP 500 JSON |
| Null/invalid input | N/A | No query params; no user input surface |
| Very large supplier list | Not tested | Acceptable for MVP; SheetJS handles large arrays |
| Special characters in supplier names | Not tested | Acceptable for MVP |

---

## Code Quality — Line-by-Line Analysis

### `src/app/api/export/suppliers/xlsx/route.ts`

- **Structure:** Mirrors the PDF export route exactly — try/catch wrapper, Prisma fetch,
  transform, generate, audit log, binary response. Pattern conformance is excellent.
- **Security:** `publicFormToken` excluded at the Prisma `select` level — it never
  reaches the mapping layer. Confirmed by TC-07 which passes a fixture with the token
  included in the mock return value.
- **Type safety:** `buf as Buffer` is a safe cast. `XLSX.write` with `{ type: "buffer" }`
  returns a Node.js `Buffer`; the TypeScript types cannot infer this from the `type`
  option at compile time, so the cast is necessary and correct.
- **Empty state:** `json_to_sheet([], { header: [...] })` produces a valid single-row
  (header-only) workbook. The explicit `header` array ensures headers appear even
  when the row array is empty — correct and deliberate.
- **Error handling:** Complete — all async operations are inside try/catch; the catch
  block extracts the message and returns a structured `{ error, detail }` JSON 500.
- **`Content-Length` header:** Added during this review for consistency with the PDF
  export route.

### `src/app/(app)/suppliers/suppliers-client.tsx`

- **Button placement:** Correct — `<a>` element inside `flex items-center gap-3` wrapper,
  next to the existing "+ Add Supplier" button.
- **Styling:** Secondary button style (white background, gray border) is consistent with
  the existing design system.
- **No client-side state added:** Confirmed — uses a plain `<a href="...">` tag, which
  triggers the browser's native file-download flow. No `fetch()`, no `useState` changes.
- **`publicFormToken` in client interface:** The `Supplier` interface includes
  `publicFormToken` (needed for the "Copy Link" feature), but this is not new and is
  unrelated to the export. The export button never uses this field.

### `src/__tests__/xlsx-export.test.ts`

- **Coverage:** 10 test cases covering all 10 unit-testable acceptance criteria.
- **Real SheetJS execution:** The `xlsx` library is NOT mocked — tests verify actual binary
  output structure, not just that SheetJS was called.
- **Mock isolation:** `vi.mock` for `@/lib/prisma` and `@/lib/audit` prevents database
  connections in the test environment. `vi.clearAllMocks()` in `beforeEach` ensures
  clean state between tests.
- **Test naming:** Descriptions are human-readable with TC-0X prefixes that trace back
  to the test plan. Methods and scenarios are clear.
- **Helper functions:** `parseXlsxResponse`, `sheetToRows`, `sheetToObjects` are well
  named and reused across tests, reducing duplication.

---

## Issues Found

### Blockers

None remaining after fixes applied during this review.

> **Note:** 45 markdownlint errors were found across 4 documentation files
> (`architecture.md`, `tasks.md`, `test-plan.md`, `uat-test-plan.md`) and fixed
> in this review session. These were pre-Blocker; all are now resolved.

### Major Issues

None.

### Minor Issues

1. **Missing unit test for alphabetical sort** (`src/__tests__/xlsx-export.test.ts`)
   - The acceptance criterion "Rows sorted alphabetically by Name" has no corresponding
     unit test. The test plan coverage matrix maps it to TC-07, but TC-07 is actually the
     `publicFormToken` exclusion test.
   - **Impact:** Low. The implementation is correct (`orderBy: { name: "asc" }` in the
     Prisma query). Since Prisma is mocked, a unit test could only verify the `orderBy`
     argument is passed — the actual sort is tested by Prisma itself. The UAT scenario
     (Scenario 1, step 7) covers this end-to-end.
   - **Recommendation:** Add `expect(prisma.supplier.findMany).toHaveBeenCalledWith(expect.objectContaining({ orderBy: { name: "asc" } }))` to TC-06 or a new TC-06b.

### Suggestions

1. **`Content-Length` header** — Added during this review. Consistent with the PDF route
   and helps browsers show download progress.

2. **`download` attribute on `<a>` tag** — Consider adding `download` to the export link
   (`<a href="..." download>`). While `Content-Disposition: attachment` handles download
   behaviour server-side, the `download` attribute provides an additional browser hint
   and allows renaming in some browsers. Optional for MVP.

---

## Security Summary

- `publicFormToken` is excluded at the Prisma `select` clause — it never enters the
  serialisation pipeline. TC-07 verifies this.
- No user-controlled input is used (no query parameters, no request body).
- `Cache-Control: no-store` prevents proxy caching of the export binary.
- Known vulnerability: `xlsx` v0.18.5 has GHSA-4r6h-8v6p-xvw6 (Prototype Pollution)
  and a ReDoS issue. No patched version exists in the 0.18.x branch. Accepted per
  ADR-005 for an internal tool. No fix applied; trade-off documented by the Developer.
- CodeQL: 0 alerts.

---

## Critical Questions Answered

- **What could make this code fail?** A Prisma connection error is handled by the
  try/catch → HTTP 500. SheetJS write failure is also caught. The main unhandled
  scenario is `logAuditEvent` throwing — but this is post-generation, so the file
  would not be returned. The try/catch wraps the audit call, so this correctly
  returns HTTP 500 rather than silently failing.
- **What edge cases might not be handled?** Very large supplier lists (thousands of
  rows) could theoretically cause memory pressure, but this is acceptable for an
  internal tool. No pagination is in scope.
- **Are all error paths tested?** The DB error path is tested (TC-10). The audit
  error path is not explicitly tested — if `logAuditEvent` throws, the response
  would be HTTP 500 instead of the XLSX file. This is correct behaviour and
  consistent with the PDF route.

---

## Work Protocol & Documentation Verification

| Check | Status | Notes |
|-------|--------|-------|
| `work-protocol.md` exists | ✅ | Present in feature folder |
| All required agents logged | ✅ | Requirements Engineer, Architect, QE, Task Planner, Developer, Technical Writer all done |
| `docs/features.md` updated | ✅ | "Excel Export (Suppliers)" entry added |
| `README.md` updated | ✅ | Feature listed, SheetJS added to Tech Stack |
| `docs/architecture.md` | N/A | No global architecture changes; ADR in feature folder |
| `docs/testing-strategy.md` | N/A | No new test patterns |
| CHANGELOG.md not modified | ✅ | Confirmed |

---

## Checklist Summary

| Category | Status |
|----------|--------|
| Correctness | ✅ |
| Spec Compliance | ✅ |
| Code Quality | ✅ |
| Architecture | ✅ |
| Testing | ✅ (minor gap: no sort-order unit test) |
| Documentation | ✅ (after markdownlint fixes) |
| Security | ✅ (known xlsx vuln accepted per ADR-005) |

---

## Review Decision

**Status: ✅ APPROVED**

The implementation correctly satisfies all acceptance criteria. All tests pass, build
succeeds, lint is clean, and CodeQL reports no alerts. The two fixes applied (Content-Length
header and markdownlint errors) bring the PR to a fully green state. The only Minor issue
(missing alphabetical sort unit test) does not block approval — the implementation is
correct and the sort is covered by UAT.

---

## Next Steps

This is a user-facing feature (new UI button + new API endpoint). Hand off to the
**UAT Tester** agent to write Selenium smoke tests (TC-11, TC-12) and validate the
feature end-to-end in the Docker container.
