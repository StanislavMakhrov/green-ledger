# Work Protocol: GreenLedger MVP Implementation

**Work Item:** `docs/features/001-mvp/`
**Branch:** `copilot/implement-green-ledger-mvp`
**Workflow Type:** Feature
**Created:** 2025-01-30

## Agent Work Log

<!-- Each agent appends their entry below when they complete their work. -->

### Requirements Engineer
- **Date:** 2025-01-30
- **Summary:** Read `docs/spec.md` thoroughly and produced a complete Feature Specification covering all MVP requirements: domain model, functional requirements (FR-001 through FR-012), non-functional requirements (NFR-001 through NFR-009), UI/UX page inventory, API endpoint inventory, acceptance criteria, and open questions.
- **Artifacts Produced:**
  - `docs/features/001-mvp/specification.md` — Full MVP Feature Specification
  - `docs/features/001-mvp/work-protocol.md` — This file
- **Problems Encountered:** The branch name `copilot/implement-green-ledger-mvp` uses the `copilot/` prefix (auto-created by GitHub Copilot) rather than the project's documented `feature/NNN-slug` convention. No functional impact on the specification itself.

### Architect
- **Date:** 2025-01-30
- **Summary:** Read the Feature Specification and project spec. Resolved all six open questions from the specification. Created five ADRs covering the major architectural decisions, plus an architecture overview document for the 001-mvp feature.
- **Artifacts Produced:**
  - `docs/features/001-mvp/architecture.md` — Architecture overview: component diagram, `src/` directory structure, DB schema overview, API design principles, decision summary
  - `docs/adr-001-nextjs-app-router.md` — App Router with server components + root redirect to `/dashboard`
  - `docs/adr-002-prisma-sqlite.md` — Prisma + SQLite, UUID PKs, `findFirst()` single-company pattern
  - `docs/adr-003-pdf-rendering.md` — Puppeteer for HTML→PDF rendering
  - `docs/adr-004-seed-strategy.md` — Explicit `npm run seed` with idempotency guard; Company pre-seeded only; Scope 3 categories in seed script
  - `docs/adr-005-proxy-factor.md` — PROXY_FACTOR = 0.4 kgCO₂e/€ named constant in `lib/constants.ts`
- **Problems Encountered:** None. All open questions were resolved using standard industry practices and the constraints in the specification. No maintainer clarification was required.
