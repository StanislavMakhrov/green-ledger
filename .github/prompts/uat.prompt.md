---
name: uat
description: Default UAT prompt (matches Code Reviewer handoff)
agent: UAT Tester
---

The code review is approved. Build the Docker image, start the app, and ask the Maintainer to manually verify the feature. Document the PASS/FAIL result in a UAT report; if issues are found, do not fix code—handoff to Developer with clear repro steps.
