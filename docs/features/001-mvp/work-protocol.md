# Work Protocol: GreenLedger MVP

**Work Item:** `docs/features/001-mvp/`
**Branch:** `feature/001-mvp`
**Workflow Type:** Feature
**Created:** 2025-07-14

## Agent Work Log

<!-- Each agent appends their entry below when they complete their work. -->

### Architect

- **Date:** 2025-07-14
- **Summary:** Reviewed `docs/spec.md` and `docs/features/001-mvp/specification.md` in full.
  Made all key architectural decisions for the MVP, resolving every open question from the
  specification. Produced three ADRs and a comprehensive architecture document.
- **Artifacts Produced:**
  - `docs/adr-001-pdf-export.md` — Chose `@react-pdf/renderer` over Puppeteer; zero native
    binaries, minimal Docker image impact, pure-JS PDF generation from React components.
  - `docs/adr-002-database.md` — SQLite via Prisma for local demo simplicity; documented
    Postgres-migratable schema constraints (UUID PKs, no SQLite-specific `@db` attributes).
  - `docs/adr-003-project-structure.md` — Full annotated directory layout under `src/`;
    page-to-file mapping, API route inventory, client vs. server component conventions.
  - `docs/features/001-mvp/architecture.md` — Master architecture document covering:
    project structure, complete Prisma schema (with enum definitions), API route table,
    proxy calculation design with concrete constant values, PDF pipeline data flow,
    all 15 Scope3Category seed entries, full demo seed data specification, default route
    decision, component architecture, and security considerations.
- **Key Decisions Made:**
  1. **PDF library:** `@react-pdf/renderer` — no Chromium, ~5 MB, works in Next.js Route Handlers.
  2. **Proxy constants:** spend: 0.5 kgCO2e/EUR; transport: 0.1 kgCO2e/tonne-km;
     waste: 2.0 kgCO2e/kg; confidence: 0.5. All documented as demo placeholders.
  3. **Scope3 seed:** All 15 GHG Protocol categories; C1 and C4 marked material.
  4. **Default route:** `/` → redirect to `/dashboard` (no splash screen).
  5. **Demo seed:** 1 company (Musterfirma GmbH, 2024), 3 suppliers, 2× Scope 1 records,
     1× Scope 2 record, 3× Scope 3 proxy records, 3× methodology notes, audit events.
- **Problems Encountered:** None — spec.md and specification.md were comprehensive; all
  open questions had clear recommended answers or required straightforward technical judgment.

### Requirements Engineer

- **Date:** 2025-07-14
- **Summary:** Read `docs/spec.md` and `docs/features.md` in full. Captured all domain models, business rules, pages, tech stack constraints, and non-goals from the spec. Produced a detailed Feature Specification covering the complete GreenLedger MVP scope. Updated `docs/features.md` to reference the new specification.
- **Artifacts Produced:**
  - `docs/features/001-mvp/specification.md` — Full MVP Feature Specification
  - `docs/features/001-mvp/work-protocol.md` — This work protocol
  - `docs/features.md` — Updated with link to specification
- **Problems Encountered:** None — spec.md was comprehensive and unambiguous; no clarifying questions were needed.

### Quality Engineer

- **Date:** 2025-07-14
- **Summary:** Read `docs/spec.md`, `docs/features/001-mvp/specification.md`, and
  `docs/features/001-mvp/architecture.md` in full. Mapped all 19 acceptance criteria from
  the specification to 34 test cases across three test categories: business logic unit tests,
  API route tests (with mocked Prisma), and smoke tests. The test plan is aligned with the
  spec's constraint of "minimal unit/smoke tests (Vitest for API logic)" and ensures
  `next build` remains the primary CI gate.
- **Artifacts Produced:**
  - `docs/features/001-mvp/test-plan.md` — Full test plan with 34 test cases mapped to
    acceptance criteria. Covers: proxy calculation (spend/transport/waste + priority logic),
    dashboard totals (sum, zero cases), token generation uniqueness, all API routes (CRUD for
    suppliers/scope1/scope2/scope3/methodology, supplier form validation and proxy creation,
    PDF export headers), and two smoke tests (`next build` + Prisma seed integrity).
- **Key Decisions Made:**
  1. **All API tests mock Prisma** via `vi.mock()` — no real SQLite DB needed in Vitest runs.
  2. **PDF export test mocks `generateReport()`** — validates headers and response shape
     without rendering the actual PDF (avoids `@react-pdf/renderer` overhead in CI).
  3. **Seed smoke test** queries the live DB record counts to validate seed integrity (15
     categories, 3 suppliers, correct Scope 1/2/3 record counts, AuditTrailEvent rows).
  4. **No UAT test plan** created — MVP has no user-facing rendering changes that require a
     GitHub/ADO PR comment verification; the PDF is validated by headers only in CI.
  5. **No new test infrastructure** proposed — standard Vitest + `vi.mock()` per the spec.
- **Problems Encountered:** `docs/testing-strategy.md` does not yet exist; the test plan
  is self-contained and establishes the testing conventions for the project. The Developer
  should create `docs/testing-strategy.md` as part of implementation.
