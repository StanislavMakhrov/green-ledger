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
| Task Planner | ✅ Required | ⬜ Pending |
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
