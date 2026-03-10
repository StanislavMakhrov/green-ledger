# Work Protocol: GreenLedger MVP (001)

**Work Item:** `docs/features/001-mvp/`
**Branch:** `feature/001-mvp`
**Workflow Type:** Feature
**Created:** 2025-07-14

## Required Agents

| Agent | Required | Status |
|-------|----------|--------|
| Requirements Engineer | ✅ Required | ✅ Completed |
| Architect | ✅ Required | ✅ Completed |
| Quality Engineer | ✅ Required | ✅ Completed |
| Task Planner | ✅ Required | ✅ Completed |
| Developer | ✅ Required | ✅ In Progress (T01-T07 complete) |
| Technical Writer | ✅ Required | ⏳ Pending |
| Code Reviewer | ✅ Required | ⏳ Pending |
| UAT Tester | ⚠️ If user-facing | ⏳ Pending |
| Release Manager | ✅ Required | ⏳ Pending |
| Retrospective | ✅ Required | ⏳ Pending |

## Agent Work Log

### Quality Engineer

- **Date:** 2025-07-14
- **Summary:** Created comprehensive test plan and UAT test plan for the GreenLedger MVP. Mapped all acceptance criteria to 24 test cases across unit, API smoke, and build validation categories. Test cases cover proxy calculations, dashboard total aggregation, supplier token generation, supplier form submission (happy path, error path, audit trail), API route smoke tests for all key endpoints, and `next build` validation. Also produced a step-by-step UAT test plan guiding manual verification of all user-facing flows.
- **Artifacts Produced:**
  - `docs/features/001-mvp/test-plan.md` — 24 test cases mapped to acceptance criteria; coverage matrix; edge cases; non-functional requirements
  - `docs/features/001-mvp/uat-test-plan.md` — 10-step manual verification plan with checklist for the running application
- **Problems Encountered:** `docs/testing-strategy.md` does not yet exist (greenfield project). Followed conventions from the architecture document and specification directly.



### Requirements Engineer

- **Date:** 2025-07-14
- **Summary:** Synthesised the complete GreenLedger MVP product specification from `docs/spec.md` into a formal Feature Specification document. Covers all 8 pages, all 8 domain models with full field definitions, all business rules, tech stack requirements, full API route table, non-goals, success criteria per feature area, and the 5-minute demo flow.
- **Artifacts Produced:** `docs/features/001-mvp/specification.md`, `docs/features/001-mvp/work-protocol.md`
- **Problems Encountered:** None — requirements were fully defined in the existing product spec.

### Architect

- **Date:** 2025-07-14
- **Summary:** Analysed the GreenLedger MVP specification against the greenfield codebase (zero application code). Created four Architecture Decision Records covering the full tech stack, PDF generation approach, single-company demo pattern, and supplier token-based public form access. Produced a comprehensive architecture overview document describing directory structure, key patterns, database access, API design, PDF generation flow, audit trail pattern, proxy calculations, and components affected.
- **Artifacts Produced:**
  - `docs/adr-001-tech-stack.md` — Next.js App Router, TypeScript strict, TailwindCSS, SQLite/Prisma, Vitest
  - `docs/adr-002-pdf-generation.md` — Puppeteer (headless Chromium) chosen over React-PDF, html-pdf-node, jsPDF, WeasyPrint
  - `docs/adr-003-single-company-demo.md` — Hardcoded `DEMO_COMPANY_ID` constant, no multi-tenancy for MVP
  - `docs/adr-004-supplier-token-auth.md` — Random UUID token in URL, no user auth, token stored on Supplier model
  - `docs/features/001-mvp/architecture.md` — Full architecture overview with directory structure and implementation guidance
- **Problems Encountered:** None.

### Task Planner

- **Date:** 2025-07-14
- **Summary:** Created a comprehensive implementation task plan for the GreenLedger MVP. Decomposed
  the feature into 35 tasks across 6 groups (Project Scaffolding, Core API Routes, Business Logic,
  UI Pages, Tests, Validation). Each task includes a description, file list, prioritised acceptance
  criteria, and explicit task dependencies. Added a "Notes for Developer" section resolving
  implementation ambiguities (e.g., `calculations.ts` vs `proxy.ts` naming, hyphen vs no-hyphen
  API route directories, Puppeteer Docker setup, seed idempotency). Provided a 17-step
  implementation order table derived from the dependency graph.
- **Artifacts Produced:**
  - `docs/features/001-mvp/tasks.md` — 35 tasks (T01–T35), prioritised P1/P2, with acceptance
    criteria mapped to the test plan (TC-01–TC-24), implementation order table, and developer notes.
- **Problems Encountered:** None — specification, architecture, and test plan were fully defined.

### Developer

- **Date:** 2025-07-15
- **Summary:** Implemented Tasks T01-T07 (Project Scaffolding group). Scaffolded the entire Next.js 15 App Router project with TypeScript strict mode, TailwindCSS, ESLint, and Vitest. Set up all 8 Prisma domain models with SQLite. Created lib/constants.ts and lib/prisma.ts. Added seed file for demo data. Created Docker configuration.
- **Artifacts Produced:**
  - `src/package.json` — Next.js 15.5.12 (patched), React 19, Prisma 6, Puppeteer 24.15.0, Vitest
  - `src/next.config.mjs` — Next.js config with `output: 'standalone'`
  - `src/tsconfig.json` — TypeScript strict mode with `@/*` path alias
  - `src/eslint.config.mjs` — ESLint with Next.js recommended config, ignoring generated files
  - `src/tailwind.config.ts` — TailwindCSS config
  - `src/vitest.config.ts` — Vitest config with React plugin and `@` alias
  - `src/app/layout.tsx` — Root layout with minimal HTML wrapper
  - `src/app/page.tsx` — Root redirect to /dashboard
  - `src/app/(app)/layout.tsx` — App layout with sidebar navigation
  - `src/app/(app)/*/page.tsx` — Placeholder pages for all 7 routes
  - `src/app/(public)/public/supplier/[token]/page.tsx` — Public supplier form placeholder
  - `src/prisma/schema.prisma` — All 8 domain models and 9 enums
  - `src/prisma.config.ts` — Prisma config using `defineConfig`
  - `src/prisma/seed.ts` — Idempotent seed with demo company, 15 Scope3 categories, 3 suppliers
  - `src/lib/constants.ts` — Emission factors and DEMO_COMPANY_ID
  - `src/lib/prisma.ts` — Singleton PrismaClient
  - `src/tests/constants.test.ts` — 7 unit tests for constants
  - `src/Dockerfile` — Multi-stage Docker build with Chromium for Puppeteer
  - `Makefile` — Convenience targets for dev, build, up, down, seed
- **Problems Encountered:**
  - `next@15.2.1` (originally specified) had critical CVEs; upgraded to patched `15.5.12`
  - `puppeteer@22.x` was deprecated; upgraded to `24.15.0`
  - `prisma.config.ts` required `defineConfig` from `prisma/config` (not raw object with `satisfies PrismaConfig`)
  - `earlyAccess: true` and `seed:` fields don't exist in Prisma 6.19.2 config type
  - Next.js 15 requires `params` in dynamic routes to be `Promise<{...}>`
  - ESLint was linting Prisma's generated client files; added `app/generated/**` to ignore list
