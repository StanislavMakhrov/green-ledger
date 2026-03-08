---
name: run-uat
description: Run User Acceptance Testing by building and running the Docker image, then asking the Maintainer to manually verify the feature.
---

# Run UAT

## Purpose
Execute User Acceptance Testing by building and running the GreenLedger Docker image locally, then guiding the Maintainer through manual verification of the feature.

## Hard Rules
### Must
- Build the Docker image before asking for verification
- Present a clear, step-by-step verification checklist to the Maintainer
- Wait for explicit PASS/FAIL from the Maintainer before proceeding
- Document results in `docs/features/NNN-<feature-slug>/uat-report.md`
- Clean up Docker containers after testing

### Must Not
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

### 2. Build and Start the App
```bash
docker compose build
docker compose up -d
```
Wait until the app is accessible at http://localhost:3000.

### 3. Present Verification Checklist
Post in chat:
```
UAT Verification — Please check the following:

The app is running at http://localhost:3000

- [ ] Step 1: Navigate to /dashboard and verify KPI cards display
- [ ] Step 2: ...
- [ ] Step N: ...

When done, please reply:
- PASS — if everything works
- FAIL: <description> — what went wrong, which page, expected vs actual
```

### 4. Record Maintainer Decision
Wait for the Maintainer's explicit PASS or FAIL response.
If FAIL, the description is required and becomes the "Issues" section of the UAT report.

### 5. Cleanup
```bash
docker compose down
```

### 6. Write UAT Report
Create `docs/features/NNN-<feature-slug>/uat-report.md` documenting the result.
