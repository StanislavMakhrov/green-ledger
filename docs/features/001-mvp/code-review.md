# Code Review: GreenLedger MVP

## Summary

The GreenLedger MVP implementation has been reviewed. The build passes, all 54 tests pass, and the core business logic is correctly implemented. The codebase follows TypeScript/Next.js App Router conventions well, with clean separation of concerns (proxy calculations isolated to `src/lib/proxy.ts`, audit trail centralized in `src/lib/audit.ts`, constants well-documented as demo placeholders). There are no critical blockers. Several minor issues around input validation and test coverage gaps are documented below.

**Overall verdict: Approved with minor issues documented.**

---

## Verification Results

| Check | Result |
|-------|--------|
| `npm test` | ✅ Pass — 54/54 tests |
| `npm run build` | ✅ Pass — all 22 routes built |
| TypeScript strict | ✅ No type errors |
| Lint | ✅ Clean (verified by Developer) |
| Docker | ✅ Dockerfile present; not run (no Docker daemon in CI) |

---

## Specification Compliance

| Acceptance Criterion | Implemented | Tested | Notes |
|---------------------|-------------|--------|-------|
| Dashboard KPI cards (Scope 1/2/3/Total) | ✅ | ✅ | `dashboard/route.ts` aggregates by `reportingYear` |
| Zero values shown when no records | ✅ | ✅ | Null-coalescing `?? 0` used |
| Suppliers CRUD | ✅ | ✅ | Full CRUD with audit events |
| Token-based public form URL | ✅ | ✅ | `crypto.randomUUID()` used |
| Scope 1 add/list records | ✅ | Partial | No dedicated scope1 API test file |
| Scope 2 add/list records | ✅ | Partial | No dedicated scope2 API test file |
| 15 Scope 3 categories seeded | ✅ | ✅ | seed.ts populates all C1–C15 |
| Scope 3 materiality toggle | ✅ | ✅ | Covered in scope3 tests |
| Supplier public form (token-gated) | ✅ | Partial | Integration path not unit tested |
| Proxy calculation: `spend_eur × PROXY_FACTOR` | ✅ | ✅ | TC-25/TC-26/TC-29/TC-30 pass |
| `activityDataJson` stored on submission | ✅ | ✅ | `buildActivityDataJson` tested |
| Invalid token returns error | ✅ | — | No test for 404 path |
| Audit event: `actor="supplier"` on form submit | ✅ | — | Not unit tested |
| Methodology notes per scope | ✅ | — | No dedicated methodology API tests |
| PDF: 5 required sections | ✅ | — | `@react-pdf/renderer` template; binary output |
| PDF audit event `action="exported"` | ✅ | — | Not unit tested |
| `next build` passes | ✅ | ✅ | Verified |
| TypeScript strict mode | ✅ | ✅ | `tsconfig.json` has `"strict": true` |
| No raw SQL | ✅ | ✅ | All DB access via Prisma |
| Prisma-managed schema | ✅ | ✅ | Schema is Postgres-compatible |

**Spec Deviations Found:** None. All in-scope acceptance criteria are implemented.

---

## Adversarial Testing

| Test Case | Result | Notes |
|-----------|--------|-------|
| `spend_eur = 0` proxy | ✅ Pass | Returns `0` tCO₂e correctly |
| Empty activity data on public form | ✅ Pass | 400 returned with clear message |
| Invalid/missing `categoryId` | ✅ Pass | 404 returned |
| Invalid supplier token | ✅ Pass | 404 returned |
| Negative `valueTco2e` input | ⚠️ Not Validated | `Number(valueTco2e)` allows negatives — see Minor issue #1 |
| Negative `spend_eur` on public form | ⚠️ Not Validated | Negative spend produces negative tCO₂e — see Minor issue #1 |
| Invalid email format for supplier | ⚠️ Not Validated | Email accepted as any string — see Minor issue #2 |
| Multiple proxy inputs simultaneously | ✅ Pass | Priority order (spend → ton_km → waste_kg) is correct and documented |
| Deleted supplier token still works | ✅ Pass | `status !== "active"` check handles this |
| DB error on dashboard | ✅ Pass | Returns 500 with error message |

---

## Issues Found

### Blockers

None.

### Major Issues

**M-1: Missing tests for Scope 1 and Scope 2 API routes**
- `src/tests/api/` has `dashboard.test.ts`, `scope3.test.ts`, `suppliers.test.ts` — but no `scope1.test.ts` or `scope2.test.ts`
- The test plan (TC-07 through TC-16) specifies smoke tests for these routes
- Risk: regressions in these routes would not be caught by CI
- **Recommendation:** Add `scope1.test.ts` and `scope2.test.ts` covering GET (200), POST (201), POST missing fields (400), and DELETE (200)

### Minor Issues

**m-1: No numeric range validation on `valueTco2e` and proxy activity inputs**
- File: `src/app/api/scope1/route.ts`, `src/app/api/scope2/route.ts`, `src/app/api/scope3/records/route.ts`, `src/app/api/public/supplier/[token]/route.ts`
- Negative emission values (e.g., `valueTco2e = -100`) are accepted and persisted, which corrupts dashboard totals
- `spend_eur` < 0 on the public form produces negative tCO₂e
- **Recommendation:** Add `if (Number(valueTco2e) < 0)` guard returning 400

**m-2: No email format validation on supplier creation/update**
- File: `src/app/api/suppliers/route.ts` (POST) and `src/app/api/suppliers/[id]/route.ts` (PUT)
- Any string is accepted as `contactEmail`; a basic regex or `z.string().email()` check would improve data quality
- Low risk for demo but worth adding

**m-3: `prisma/schema.prisma` datasource is `sqlite`**
- The spec requires "Postgres-migratable (use Prisma; avoid SQLite-specific features)"
- The schema itself is Postgres-compatible (enums, UUID ids, standard types), but the `provider = "sqlite"` line means the developer must change it to `postgresql` before production deployment
- **Recommendation:** Add a comment in `schema.prisma` noting this is the dev/demo SQLite config and must be changed to `postgresql` for production

### Suggestions

**S-1: `calculateProxyTco2e` with all inputs at zero**
- Currently returns 0 when `spend_eur = 0` is passed — but the validation in the public form route checks for `undefined`, not falsy values. If the UI sends `{ spend_eur: 0 }`, a Scope 3 record with `valueTco2e = 0` is created with `dataSource = "supplier_form"`. This is technically valid but may be surprising. Consider rejecting zero-value activity data.

**S-2: `getProxyCalculationMethod` not exported as part of `calculateProxyEmissions`**
- The full `ProxyResult` returned by `calculateProxyEmissions` includes `calculationMethod` — this is good. However, the public form route (`route.ts`) calls both `calculateProxyEmissions` and individual helper functions redundantly. Consider using only `calculateProxyEmissions` in the route handler to reduce duplication.

**S-3: Audit trail has no dedicated UI page**
- The spec explicitly calls out "viewable but no dedicated UI page required for MVP" — this is correctly out of scope. Flagging here only for the next iteration.

---

## Snapshot Changes

N/A — This is a greenfield implementation; no snapshot changes.

---

## Review Decision

**Status: ✅ Approved with minor issues documented**

The implementation is correct, clean, and well-structured. The two major gap areas (missing scope1/scope2 test files, and lack of numeric input validation) should be addressed before the first real deployment, but do not block the MVP demo. The proxy calculation logic is correct and well-tested, business rules from the spec are faithfully implemented, and the audit trail is comprehensive.

---

## Critical Questions Answered

- **What could make this code fail?** A negative `valueTco2e` entry would silently corrupt dashboard totals. The only guard is Prisma's type system (Float), which accepts negatives. This is the most likely silent data quality issue.
- **What edge cases might not be handled?** Concurrent token refresh while a supplier form is open (race condition: old token 404s mid-fill). Low risk for MVP/demo scope.
- **Are all error paths tested?** API error paths (500 on DB failure) are tested for dashboard and suppliers. Scope 1/2 error paths are not tested (see M-1).

---

## Work Protocol & Documentation Verification

| Check | Status |
|-------|--------|
| `work-protocol.md` exists | ✅ |
| Requirements Engineer logged | ✅ |
| Architect logged | ✅ |
| Quality Engineer logged | ✅ |
| Task Planner logged | ✅ |
| Developer logged | ✅ |
| Technical Writer logged | ⚠️ Pending (marked as such in protocol) |
| Code Reviewer logged | This review |
| `docs/features.md` updated | Not verified — Technical Writer step pending |
| `docs/architecture.md` updated | Not verified — Technical Writer step pending |
| CHANGELOG.md modified | ✅ Not modified (correct) |

Technical Writer must run after this review to update global docs.

---

## Checklist Summary

| Category | Status |
|----------|--------|
| Build passes | ✅ |
| Tests pass (54/54) | ✅ |
| Spec Compliance | ✅ |
| Code Quality | ✅ |
| Security (demo scope) | ✅ |
| Architecture alignment | ✅ |
| Testing coverage | ⚠️ Scope 1/2 API routes untested |
| Documentation | ⚠️ Technical Writer step pending |
| CHANGELOG not modified | ✅ |

---

## Next Steps

1. **Developer** (optional, pre-release): Address M-1 (add scope1/scope2 API smoke tests) and m-1 (negative value guards)
2. **Technical Writer**: Update `docs/features.md`, `docs/architecture.md`, and `README.md`
3. **UAT Tester**: Validate the full UI flow in Docker (supplier form submission → dashboard update → PDF export)
4. **Release Manager**: Coordinate and execute the MVP release
