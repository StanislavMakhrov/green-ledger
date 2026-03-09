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
| Quality Engineer | ✅ Required | ⏳ Pending |
| Task Planner | ✅ Required | ⏳ Pending |
| Developer | ✅ Required | ⏳ Pending |
| Technical Writer | ✅ Required | ⏳ Pending |
| Code Reviewer | ✅ Required | ⏳ Pending |
| UAT Tester | ⚠️ If user-facing | ⏳ Pending |
| Release Manager | ✅ Required | ⏳ Pending |
| Retrospective | ✅ Required | ⏳ Pending |

## Agent Work Log

<!-- Each agent appends their entry below when they complete their work. -->

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
