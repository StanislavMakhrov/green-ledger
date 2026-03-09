# Testing Strategy

## Overview

GreenLedger uses a lightweight testing strategy appropriate for an MVP: fast unit tests
for pure business logic, TypeScript compilation as integration validation, and manual
UAT via Docker for user-facing behaviour.

## Unit Tests (Vitest)

Located in `src/__tests__/` and `src/tests/`.

| File | What it tests |
|------|--------------|
| `calculations.test.ts` | `calculateProxyEmissions` — all three emission paths, error cases, output fields |
| `dashboard-totals.test.ts` | Scope 1+2+3 arithmetic, zero values, decimal precision |
| `api-smoke.test.ts` | Module exports exist with correct types and values |
| `supplier-token.test.ts` | UUID format, uniqueness, URL construction |
| `constants.test.ts` | All emission-factor constants are positive numbers with non-empty source strings |

Run with:

```bash
cd src && npm test
```

## Integration Validation

`next build` compiles every page and API route, catching TypeScript errors, missing
imports, and invalid JSX. This acts as a lightweight integration check without
requiring a running database.

```bash
cd src && npm run build
```

Prisma client generation (`npx prisma generate`) must run before the build so that
generated types are available.

## UAT (Manual, via Docker)

The Docker image bundles the app with a seeded SQLite database. A UAT Tester pulls
the image built by CI and manually verifies every user-facing feature.

```bash
docker compose up   # from repo root
# open http://localhost:3000
```

## What Is NOT Tested in the MVP

- **End-to-end (Playwright/Cypress)** — not set up; UAT covers this manually
- **Database integration tests** — no test database; Prisma schema correctness is
  verified by `prisma migrate dev` / `prisma db push` during development
- **API route HTTP tests** — routes require a live database; smoke tests verify module
  structure instead
- **PDF rendering** — Puppeteer output verified manually during UAT

## Rationale

The MVP ships fast by keeping automated tests focused on pure logic (zero
infrastructure needed) and delegating UI/DB verification to Docker-based UAT. As the
product matures, database integration tests and E2E tests should be added.
