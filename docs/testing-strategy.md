# Testing Strategy

## Overview

GreenLedger uses a layered testing strategy: fast unit tests for pure business logic,
TypeScript compilation as integration validation, automated HTTP smoke tests against
the Docker container in CI, and manual UAT for visual/UX verification.

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

## Smoke Tests (Automated, Docker-based)

Located in `src/smoke-tests/<feature-slug>/smoke.test.ts`.

Smoke tests call the **running application over HTTP** from outside the Docker
container. They verify that key pages return HTTP 200 and that core API endpoints
return the expected response shape. The tests use the built-in `fetch()` API — no
browser automation, no Prisma imports.

```bash
# Run against a locally-started Docker container
docker run --rm -p 3000:3000 ghcr.io/<repo>:pr-<N>
BASE_URL=http://localhost:3000 npm run smoke-test
```

**CI integration:** The `smoke-tests` job in `pr-validation.yml` runs after the
`docker` job. It pulls the just-built image, starts the container, waits for the
app to be ready, then runs `npm run smoke-test`.

The `BASE_URL` environment variable controls the target host (default:
`http://localhost:3000`).

**UAT Tester responsibility:** The UAT Tester agent writes smoke tests as part of
every user-facing feature PR. New smoke test files follow the pattern:

```text
src/smoke-tests/<feature-slug>/smoke.test.ts
```

## UAT (Manual, via Docker)

The Docker image bundles the app with a seeded SQLite database. After CI smoke
tests pass, the UAT Tester posts manual verification instructions in the PR comment.
The Maintainer pulls the image and verifies the UI visually.

```bash
docker pull ghcr.io/<repo>:pr-<N>
docker run --rm -p 3000:3000 ghcr.io/<repo>:pr-<N>
# open http://localhost:3000
```

The Maintainer replies to the PR comment with **PASS** or **FAIL**.

## What Is NOT Tested in the MVP

- **End-to-end (Playwright/Cypress)** — not set up; UAT covers UI flows manually
- **Database integration tests** — no test database; Prisma schema correctness is
  verified by `prisma migrate dev` / `prisma db push` during development
- **PDF rendering** — Puppeteer output verified manually during UAT

## Test Configuration Files

| File | Purpose |
|------|---------|
| `src/vitest.config.ts` | Unit tests — excludes `smoke-tests/` |
| `src/vitest.smoke.config.ts` | Smoke tests — only includes `smoke-tests/**/*.smoke.test.ts` |

## Rationale

Unit tests cover pure logic with zero infrastructure. Smoke tests provide automated
HTTP-level confidence that the Docker image works end-to-end — catching integration
issues (routing, DB seed, env vars) that unit tests cannot. Manual UAT remains for
visual/UX verification that automated checks cannot replace. As the product matures,
database integration tests and E2E browser tests should be added.
