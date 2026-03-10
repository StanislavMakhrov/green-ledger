# Testing Strategy

## Overview

GreenLedger uses a layered testing strategy: fast unit tests for pure business logic,
TypeScript compilation as integration validation, automated Python Selenium smoke tests
against the Docker container in CI (covering all user-facing scenarios), and optional
manual UAT for additional visual/UX verification.

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

## Smoke Tests (Automated, Docker-based, Selenium)

Located in `smoke-tests/<feature-slug>/test_smoke.py` at the **repository root**.

Smoke tests drive a **headless Chrome browser** against the running application from
outside the Docker container. They cover **all user-facing scenarios** from the test
plan: navigation, page content, UI interactions, and user flows. The tests use Python
`selenium` with `pytest`.

```bash
# Run against a locally-started Docker container
docker run --rm -p 3000:3000 ghcr.io/<repo>:pr-<N>
BASE_URL=http://localhost:3000 pytest smoke-tests/ -v
```

**CI integration:** The `smoke-tests` job in `pr-validation.yml` runs after the
`docker` job. It pulls the just-built image, starts the container, waits for the
app to be ready, installs Python + Selenium, then runs `pytest smoke-tests/ -v`.

The `BASE_URL` environment variable controls the target host (default:
`http://localhost:3000`).

**Dependencies:** `smoke-tests/requirements.txt` — `selenium`, `pytest`, `pytest-html`.
Chrome is installed in CI via the `browser-actions/setup-chrome` action.

**UAT Tester responsibility:** The UAT Tester agent writes smoke tests as part of
every user-facing feature PR. New smoke test files follow the pattern:

```text
smoke-tests/<feature-slug>/test_smoke.py
```

The shared pytest fixtures (headless Chrome `driver`, `base_url`) live in:

```text
smoke-tests/conftest.py
```

## UAT (Optional Manual Check, via Docker)

The Docker image bundles the app with a seeded SQLite database. After CI smoke
tests pass, the UAT Tester posts optional manual verification instructions in the PR
comment. The Maintainer can pull the image and verify the UI visually as an
additional check.

```bash
docker pull ghcr.io/<repo>:pr-<N>
docker run --rm -p 3000:3000 ghcr.io/<repo>:pr-<N>
# open http://localhost:3000
```

The Maintainer replies to the PR comment with **PASS** or **FAIL**.

## What Is NOT Tested in the MVP

- **Database integration tests** — no test database; Prisma schema correctness is
  verified by `prisma migrate dev` / `prisma db push` during development
- **PDF rendering** — Puppeteer output verified manually during UAT

## Test Configuration Files

| File | Purpose |
|------|---------|
| `src/vitest.config.ts` | Unit tests configuration |
| `smoke-tests/conftest.py` | Shared pytest fixtures (headless Chrome driver, base_url) |
| `smoke-tests/requirements.txt` | Python dependencies for smoke tests |

## Rationale

Unit tests cover pure logic with zero infrastructure. Selenium smoke tests provide
automated browser-level confidence that the Docker image works end-to-end and that
all user-facing scenarios pass — catching integration issues (routing, DB seed, env
vars, UI rendering) that unit tests cannot. Manual UAT is an optional additional
check for visual/UX verification. As the product matures, database integration tests
should be added.
