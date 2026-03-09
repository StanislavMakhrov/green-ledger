# Work Protocol: GreenLedger MVP

**Work Item:** `docs/features/001-mvp/`
**Branch:** `copilot/implement-green-ledger-mvp`
**Workflow Type:** Feature
**Created:** 2025-07-14

## Required Agents

| Agent | Feature | Status |
|-------|---------|--------|
| Requirements Engineer | ✅ Required | ✅ Done |
| Architect | ✅ Required | ✅ Done |
| Quality Engineer | ✅ Required | ✅ Done |
| Task Planner | ✅ Required | ✅ Done |
| Developer | ✅ Required | ⬜ Pending |
| Technical Writer | ✅ Required | ⬜ Pending |
| Code Reviewer | ✅ Required | ⬜ Pending |
| UAT Tester | ⚠️ If user-facing | ⬜ Pending |
| Release Manager | ✅ Required | ⬜ Pending |
| Retrospective | ✅ Required | ⬜ Pending |

## Agent Work Log

<!-- Each agent appends their entry below when they complete their work. -->

### Requirements Engineer
- **Date:** 2025-07-14
- **Summary:** Read `docs/spec.md` thoroughly and created a formal Feature Specification for the GreenLedger MVP. The specification covers: problem statement, user goals, full scope (in/out), UX per page, business rules, non-functional requirements, domain model as requirements, per-feature success criteria (acceptance tests), and open questions for the Architect.
- **Artifacts Produced:**
  - `docs/features/001-mvp/specification.md` — full Feature Specification
  - `docs/features/001-mvp/work-protocol.md` — this file
- **Problems Encountered:** None. The project spec in `docs/spec.md` was comprehensive and unambiguous. All requirements were derived directly from it with no need for clarification from the Maintainer.

### Architect
- **Date:** 2025-07-14
- **Summary:** Designed the full technical architecture for the GreenLedger MVP. Analysed the Feature Specification and project spec, evaluated implementation options for all key decisions, and documented them in four ADRs. Created a comprehensive architecture document covering system overview, directory structure, API route design, component hierarchy, data flows for the two key scenarios (supplier form submission and PDF generation), and the full database schema.
- **Artifacts Produced:**
  - `docs/features/001-mvp/architecture.md` — full architecture document with system overview, directory structure, API routes, component hierarchy, data flows, database schema, and key technical decisions
  - `docs/adr-001-pdf-generation.md` — chose `@react-pdf/renderer` (pure JS, no headless browser, works in Next.js Route Handlers)
  - `docs/adr-002-demo-seed-data.md` — chose rich seed (company + 15 Scope 3 categories + suppliers + sample records) for a compelling out-of-the-box demo
  - `docs/adr-003-proxy-factor.md` — chose `src/lib/constants.ts` for proxy factor constants (PROXY_FACTOR_SPEND = 0.233 tCO₂e/EUR, with JSDoc warnings marking them as demo placeholders)
  - `docs/adr-004-app-router-structure.md` — chose route groups `(app)` and `(public)` for clean layout separation between the management UI and the public supplier form
- **Key Decisions Made:**
  - PDF library: `@react-pdf/renderer` — pure JS, no Chromium/native binaries, React-like API
  - Demo seed: Rich seed with sample records for an immediately compelling demo
  - Proxy factors: Constants in `src/lib/constants.ts` with explicit JSDoc warnings
  - App Router: Route groups `(app)` + `(public)`; all API routes under `src/app/api/`
  - `DEMO_COMPANY_ID = "demo-company-001"` as a fixed primary key in constants
  - All pages use `export const dynamic = "force-dynamic"` to prevent static build errors
- **Open Questions Resolved:**
  1. Demo seed: Rich seed chosen (pre-populated demo is more compelling)
  2. Reporting year: Seeded from `REPORTING_YEAR` env var (default 2024), read from `Company.reportingYear` at runtime
  3. PROXY_FACTOR: 0.233 tCO₂e/EUR (as specified; documented as demo placeholder)
  4. Scope 3 categories: All 15 seeded; C1, C3, C4 pre-marked as material for demo
  5. PDF library: `@react-pdf/renderer` (pure JS, minimal deps)
- **Problems Encountered:** None. All decisions were made with clear rationale aligned to the spec constraints.

### Quality Engineer
- **Date:** 2025-07-14
- **Summary:** Read the Feature Specification and Architecture documents for the GreenLedger MVP. Mapped all 30+ acceptance criteria to automated test cases across two layers: unit tests for pure business-logic functions (proxy calculations, constants, utils) and API smoke tests for every route handler (dashboard, suppliers, scope 1/2/3, public form, methodology, PDF export). Defined Prisma mocking strategy (`vi.mock`), shared fixture helpers, coverage targets (≥ 90 % for `src/lib/`, ≥ 80 % for API routes), and edge-case matrix. No UAT test plan required — this MVP has no markdown-rendering output; the PDF is a binary file best verified in the UAT flow via Docker.
- **Artifacts Produced:**
  - `docs/features/001-mvp/test-plan.md` — full test plan with 45 test cases, coverage matrix, fixtures, edge cases, and open questions for the Developer
- **Problems Encountered:**
  - `src/` directory does not yet exist (greenfield); test cases are specified as documentation for the Developer to implement.
  - Proxy calculation logic location (inline vs utility function) is an open question flagged for the Developer — a utility function is strongly recommended for testability.
  - `@react-pdf/renderer` mocking strategy noted as a potential friction point; thin wrapper in `src/lib/pdf/generate-report.ts` recommended.
- **Next Agent:** Task Planner — to break down the specification and test plan into actionable development tasks.

### Task Planner
- **Date:** 2025-07-14
- **Summary:** Read the Feature Specification (`specification.md`), Architecture (`architecture.md`), Test Plan (`test-plan.md`), and `docs/spec.md` thoroughly. Broke down the greenfield MVP implementation into 25 ordered tasks across 7 phases. All 30+ specification acceptance criteria and 45 test cases from the test plan are covered. Tasks include file paths to create, acceptance criteria, dependencies, and implementation notes for the Developer.
- **Artifacts Produced:**
  - `docs/features/001-mvp/tasks.md` — 25 development tasks in 7 phases with acceptance criteria, file paths, and implementation notes
- **Key Decisions:**
  - Phase order: Bootstrap → Core Infrastructure → API Routes → UI Pages → Tests → PDF Export → Public Supplier Form
  - Tests (T-020, T-021) placed after API routes but before PDF/public form to catch regressions early; T-020 unit tests can begin as soon as T-005 is complete
  - PDF report template (T-022) separated from generation orchestrator + API (T-023) to isolate the `@react-pdf/renderer` component from the data-fetching layer — matches architecture's `report-template.tsx` / `generate-report.ts` split
  - Proxy utility functions (T-005) modelled as pure functions in `src/lib/proxy.ts` for unit testability (TC-25–TC-30)
  - `Dockerfile` noted as an open question — not in scope of task planning but flagged for Developer
- **Problems Encountered:** None. Architecture and test plan were detailed and consistent. All 25 tasks map directly to architecture file paths.
- **Next Agent:** Developer — to implement the 25 tasks starting with T-001 (project bootstrap).

### Developer
- **Date:** 2025-03-09
- **Summary:** Implemented the complete GreenLedger MVP from scratch. All 75 files created covering project bootstrap, Prisma schema + seed, core library (proxy, audit, PDF generation), 15 API routes, 7 UI pages, 8 UI primitive components, and 54 passing Vitest tests.
- **Artifacts Produced:**
  - `src/package.json`, config files (tsconfig, tailwind, postcss, eslint, vitest)
  - `src/prisma/schema.prisma` + `src/prisma/seed.ts`
  - `src/lib/` — prisma.ts, constants.ts, utils.ts, audit.ts, proxy.ts, pdf/report-template.tsx, pdf/generate-report.ts
  - All API routes under `src/app/api/`
  - All UI pages under `src/app/(app)/` and `src/app/(public)/`
  - UI components under `src/components/`
  - 54 tests in `src/tests/`
- **Validation:** `npm test` (54/54 ✅), `npm run type-check` (✅), `npm run lint` (✅), `npm run build` (✅)
- **Problems Encountered:**
  - `vite-tsconfig-paths` ESM-only → used `resolve.alias` directly in vitest config
  - `@react-pdf/renderer` required ESM imports + `serverExternalPackages` in next.config.mjs
  - Prisma `Date` vs component `string` types → used `string | Date` unions
  - `Buffer` not assignable to `BodyInit` → wrapped with `new Uint8Array()`
- **Next Agent:** Technical Writer — to update documentation.
