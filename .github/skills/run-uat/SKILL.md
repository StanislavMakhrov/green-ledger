---
name: run-uat
description: Write automated smoke tests for the PR's user-facing scenarios and post manual UAT instructions for the Maintainer.
---

# Run UAT

## Purpose

Execute User Acceptance Testing for a user-facing feature by:

1. Writing automated HTTP smoke tests committed to `src/smoke-tests/`
2. Guiding the Maintainer through manual visual verification via Docker

## Hard Rules

### Must

- Write smoke tests in `src/smoke-tests/<feature-slug>/smoke.test.ts` before asking for manual verification
- Use `fetch()` for smoke tests — no browser automation, no Prisma imports
- Include `const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000'` in every smoke test file
- Present a clear, step-by-step verification checklist to the Maintainer
- Wait for explicit PASS/FAIL from the Maintainer before proceeding
- Document results in `docs/features/NNN-<feature-slug>/uat-report.md`

### Must Not

- Claim UAT passed without an explicit Maintainer decision
- Add smoke tests to the regular unit-test suite (they live in `src/smoke-tests/` only)
- Import application source modules in smoke tests (call the HTTP API instead)

## Actions

### 1. Check for Test Plan

```bash
# Look for feature-specific UAT test plan
ls docs/features/*/uat-test-plan.md
```

If found, use the verification steps from the test plan. Otherwise, derive steps from
the feature specification.

### 2. Write Automated Smoke Tests

Create `src/smoke-tests/<feature-slug>/smoke.test.ts`:

```typescript
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000'

function get(path: string): Promise<Response> {
  return fetch(`${BASE_URL}${path}`)
}

describe('<Feature Name> — smoke', () => {
  it('GET /<key-page> responds with 200', async () => {
    const res = await get('/<key-page>')
    expect(res.status).toBe(200)
  })

  it('GET /api/<endpoint> returns expected shape', async () => {
    const res = await get('/api/<endpoint>')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('data')
  })
})
```

Commit the smoke test file. CI will run it automatically in the `smoke-tests` job.

### 3. Present Verification Checklist

Post in chat (VS Code) or as a PR comment (coding agent):

```markdown
## 🧪 UAT Verification Required

Automated smoke tests have been added and will run in CI.
Please also verify the feature manually:

### How to run

docker pull ghcr.io/<repo>:pr-<N>
docker run --rm -p 3000:3000 ghcr.io/<repo>:pr-<N>

Then open http://localhost:3000

### Checklist

- [ ] Step 1: Navigate to /dashboard and verify KPI cards display
- [ ] Step 2: ...
- [ ] Step N: ...

### How to respond

Reply with:

- PASS — everything works as expected
- FAIL: <page>, <expected>, <actual>
```

### 4. Record Maintainer Decision

Wait for the Maintainer's explicit PASS or FAIL response.
If FAIL, the description is required and becomes the "Issues" section of the UAT report.

### 5. Write UAT Report

Create `docs/features/NNN-<feature-slug>/uat-report.md` documenting both
the smoke test status and the Maintainer's manual verification result.
