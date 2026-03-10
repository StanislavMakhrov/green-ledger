---
name: run-uat
description: Run User Acceptance Testing by writing automated smoke tests and running the Docker image for Maintainer manual verification.
---

# Run UAT

## Purpose

Execute User Acceptance Testing by:

1. Writing automated HTTP-based smoke tests that the CI pipeline runs against the Docker image
2. Running the GreenLedger Docker image locally and guiding the Maintainer through manual verification

## Hard Rules

### Must

- Read the test plan before writing smoke tests
- Write smoke tests covering every key acceptance scenario from the test plan
- Save smoke tests to `src/tests/smoke/<feature-slug>.smoke.test.ts`
- Use `process.env.BASE_URL || 'http://localhost:3000'` as the base URL — never hardcode it
- Build the Docker image and run smoke tests before asking for manual verification
- Present a clear, step-by-step verification checklist to the Maintainer
- Wait for explicit PASS/FAIL from the Maintainer before proceeding
- Document results in `docs/features/NNN-<feature-slug>/uat-report.md`
- Clean up Docker containers after testing

### Must Not

- Write smoke tests that import application source code (HTTP `fetch` only)
- Claim UAT passed without an explicit Maintainer decision
- Skip the Docker build step
- Make assumptions about whether the feature works correctly

## Actions

### 1. Check for Test Plan

```bash
# Look for feature-specific UAT test plan
ls docs/features/*/uat-test-plan.md
```

If found, use the verification steps from the test plan. Otherwise, derive steps from the feature specification.

### 2. Write Smoke Tests

Create `src/tests/smoke/<feature-slug>.smoke.test.ts`:

```typescript
/**
 * Smoke tests for <Feature Name>
 * Run: BASE_URL=http://localhost:3000 npm run test:smoke
 */
import { describe, it, expect } from 'vitest'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

describe('<Feature Name> smoke tests', () => {
  it('GET / returns 200', async () => {
    const res = await fetch(`${BASE_URL}/`)
    expect(res.status).toBe(200)
  })

  it('GET /<key-route> is accessible', async () => {
    const res = await fetch(`${BASE_URL}/<key-route>`, { redirect: 'manual' })
    expect(res.status).toBeLessThan(400)
  })

  // Add one test per key acceptance scenario from the test plan
})
```

### 3. Build and Start the App

```bash
docker compose build
docker compose up -d
```

Wait until the app is accessible at <http://localhost:3000>.

### 4. Run Smoke Tests Locally

```bash
cd src && BASE_URL=http://localhost:3000 npm run test:smoke
```

### 5. Present Verification Checklist

Post in chat:

```text
UAT Verification — Please check the following:

The app is running at <http://localhost:3000>

Automated smoke tests: ✅ passed (or describe any failures)

- [ ] Step 1: Navigate to /dashboard and verify KPI cards display
- [ ] Step 2: ...
- [ ] Step N: ...

When done, please reply:
- PASS — if everything works
- FAIL: <description> — what went wrong, which page, expected vs actual
```

### 6. Record Maintainer Decision

Wait for the Maintainer's explicit PASS or FAIL response.
If FAIL, the description is required and becomes the "Issues" section of the UAT report.

### 7. Cleanup

```bash
docker compose down
```

### 8. Write UAT Report

Create `docs/features/NNN-<feature-slug>/uat-report.md` documenting the result, including smoke test coverage and Maintainer verdict.
