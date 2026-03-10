---
name: run-uat
description: Write automated Python Selenium smoke tests covering all user-facing scenarios for the PR, and post optional manual UAT instructions for the Maintainer.
---

# Run UAT

## Purpose

Execute User Acceptance Testing for a user-facing feature by:

1. Writing automated **Python Selenium smoke tests** committed to `smoke-tests/` at the repo root
2. Optionally guiding the Maintainer through additional manual visual verification via Docker

## Hard Rules

### Must

- Write smoke tests in `smoke-tests/<feature-slug>/test_smoke.py` covering **all user-facing scenarios**
- Use Selenium browser automation — the tests drive a headless Chrome against the live app
- Use the shared fixtures from `smoke-tests/conftest.py` (`driver`, `base_url`)
- Cover every scenario from the test plan — the automated tests are the primary validation
- Present a clear, step-by-step optional verification checklist to the Maintainer
- Wait for explicit PASS/FAIL from the Maintainer before proceeding
- Document results in `docs/features/NNN-<feature-slug>/uat-report.md`

### Must Not

- Claim UAT passed without an explicit Maintainer decision on the manual check
- Place smoke tests inside `src/` (they live at `smoke-tests/` in the repo root)
- Import application source modules in smoke tests (navigate via browser only)

## Actions

### 1. Check for Test Plan

```bash
# Look for feature-specific UAT test plan
ls docs/features/*/uat-test-plan.md
```

If found, use the verification steps from the test plan. Otherwise, derive steps from
the feature specification.

### 2. Write Automated Selenium Smoke Tests

Create `smoke-tests/<feature-slug>/test_smoke.py` using the shared fixtures:

```python
"""Selenium smoke tests for <feature name>."""

import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


def navigate(driver, base_url: str, path: str) -> None:
    driver.get(f"{base_url}{path}")
    WebDriverWait(driver, 15).until(
        lambda d: d.execute_script("return document.readyState") == "complete"
    )


class Test<FeatureName>:
    def test_<scenario>(self, driver, base_url):
        """User can <do something>."""
        navigate(driver, base_url, "/<page>")
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "<selector>"))
        )
```

Commit the smoke test file. CI will run it automatically in the `smoke-tests` job.

### 3. Present Verification Checklist

Post in chat (VS Code) or as a PR comment (coding agent):

```markdown
## 🧪 UAT — Automated Smoke Tests Running + Optional Manual Check

Python Selenium smoke tests have been added and will run in CI (smoke-tests job),
covering all user-facing scenarios from the test plan.

The Maintainer may optionally also verify the feature manually:

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
the smoke test status and the Maintainer's optional manual verification result.
