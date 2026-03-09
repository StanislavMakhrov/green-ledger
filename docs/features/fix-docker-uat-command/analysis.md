# Issue: Missing Docker UAT Command in CI Logs After Successful Build

## Problem Description

After a successful Docker image build in the **UAT Docker Build** workflow (`.github/workflows/uat.yml`), the CI logs display only a generic success message:

> ✅ Docker image built successfully. Ready for UAT.

There is **no actionable Docker pull/run command** printed for the user to copy-paste and use for local UAT testing. The user expects to see a command like `docker pull ghcr.io/…` or `docker compose up` so they can run the image locally and verify the feature.

## Steps to Reproduce

1. Trigger the **UAT Docker Build** workflow manually via `workflow_dispatch` on a branch that has `src/Dockerfile`.
2. Wait for the workflow to complete successfully.
3. Open the workflow run logs.
4. Look at the **"Report result"** step output.
5. **Observe**: Only the generic "Ready for UAT" message is displayed — no Docker command is provided.

## Expected Behavior

After a successful Docker image build, the CI log should display clear, copy-pasteable commands that tell the user how to pull (if applicable) and run the Docker image for UAT. For example:

```
✅ Docker image built successfully. Ready for UAT.

To run the app locally for UAT testing:

  git fetch origin && git checkout feature/042-my-feature   # ← the branch shown in the workflow run
  docker compose up

Then open http://localhost:3000
```

## Actual Behavior

The "Report result" step in `uat.yml` (lines 49-56) only outputs:

```
✅ Docker image built successfully. Ready for UAT.
```

No further instructions, no Docker commands, and no URL to access the app.

## Root Cause Analysis

### Affected Components

| File | Lines | Description |
|------|-------|-------------|
| `.github/workflows/uat.yml` | 49-56 | The "Report result" step has minimal output |
| `.github/skills/run-uat/SKILL.md` | 33-38 | Skill references `docker compose build`/`up` but these aren't echoed in CI |
| `.github/agents/uat-tester-coding-agent.agent.md` | 57-61 | Agent template shows `docker compose up` instructions but CI doesn't |

### What's Broken

The `uat.yml` workflow's **"Report result"** step is incomplete. It confirms the build succeeded but fails to provide the user with:

1. **Docker run/compose commands** to start the app locally for UAT.
2. **The branch name** the image was built from (needed for `git checkout`).
3. **The URL** where the app will be accessible (`http://localhost:3000`).

The relevant code in `uat.yml` lines 49-56:

```yaml
- name: Report result
  run: |
    if [ "${{ steps.dockerfile_check.outputs.exists }}" = "true" ]; then
      echo "✅ Docker image built successfully. Ready for UAT."
    else
      echo "ℹ️  No Dockerfile present on this branch yet. UAT Docker build skipped."
      echo "Add a Dockerfile at src/Dockerfile to enable UAT builds."
    fi
```

The success branch only echoes a single line with no actionable instructions.

### Additional Context: Release Workflow Also Lacks Pull Command

The **Release** workflow (`.github/workflows/release.yml`) pushes Docker images to GHCR at `ghcr.io/stanislavmakhrov/green-ledger:<version>`, but its `docker` job (lines 230-280) also **does not print a `docker pull` command** after a successful push. This is a secondary gap — after a release build+push, the logs should show:

```
docker pull ghcr.io/stanislavmakhrov/green-ledger:<version>
docker run -p 3000:3000 ghcr.io/stanislavmakhrov/green-ledger:<version>
```

### Why It Happened

The UAT workflow was designed as a build-validation-only step. The "Report result" step was written as a simple pass/fail indicator without considering that users reading the CI logs need actionable next-step commands. The UAT Tester agent and the `run-uat` skill document the correct commands (`docker compose build`, `docker compose up -d`), but these instructions exist only in agent/skill Markdown files — but the CI workflow does not display these instructions to users.

## Suggested Fix Approach

### Fix 1: Enhance `uat.yml` "Report result" step (Primary fix)

Update `.github/workflows/uat.yml` lines 49-56 to output actionable UAT commands after a successful build:

```yaml
- name: Report result
  run: |
    BRANCH="${{ github.event.inputs.branch || github.ref_name }}"
    if [ "${{ steps.dockerfile_check.outputs.exists }}" = "true" ]; then
      echo "✅ Docker image built successfully. Ready for UAT."
      echo ""
      echo "To run the app locally for UAT testing:"
      echo ""
      echo "  git fetch origin && git checkout ${BRANCH}"
      echo "  docker compose up"
      echo ""
      echo "Then open http://localhost:3000"
    else
      echo "ℹ️  No Dockerfile present on this branch yet. UAT Docker build skipped."
      echo "Add a Dockerfile at src/Dockerfile to enable UAT builds."
    fi
```

### Fix 2: Add pull command to `release.yml` docker job (Secondary improvement)

Add a new step after the "Build and push" step in `release.yml`:

```yaml
- name: Print pull command
  run: |
    VERSION="${{ needs.release.outputs.version }}"
    REPO="ghcr.io/${{ github.repository_owner }}/green-ledger"
    REPO=$(echo "$REPO" | tr '[:upper:]' '[:lower:]')
    echo "✅ Docker image pushed to GHCR."
    echo ""
    echo "To pull and run the image:"
    echo ""
    echo "  docker pull ${REPO}:${VERSION}"
    echo "  docker run -p 3000:3000 ${REPO}:${VERSION}"
    echo ""
    echo "Or use the latest tag:"
    echo ""
    echo "  docker pull ${REPO}:latest"
    echo "  docker run -p 3000:3000 ${REPO}:latest"
```

### Fix 3: Use GitHub Actions Job Summary (Enhancement)

Use `$GITHUB_STEP_SUMMARY` to make the commands visible in the workflow run summary page (not just buried in logs):

```yaml
- name: Report result
  run: |
    BRANCH="${{ github.event.inputs.branch || github.ref_name }}"
    if [ "${{ steps.dockerfile_check.outputs.exists }}" = "true" ]; then
      echo "✅ Docker image built successfully. Ready for UAT." | tee -a "$GITHUB_STEP_SUMMARY"
      {
        echo ""
        echo "### How to run UAT locally"
        echo ""
        echo '```bash'
        echo "git fetch origin && git checkout ${BRANCH}"
        echo "docker compose up"
        echo '```'
        echo ""
        echo "Then open http://localhost:3000"
      } | tee -a "$GITHUB_STEP_SUMMARY"
    else
      echo "ℹ️  No Dockerfile present on this branch yet. UAT Docker build skipped." | tee -a "$GITHUB_STEP_SUMMARY"
      echo "Add a Dockerfile at \`src/Dockerfile\` to enable UAT builds." | tee -a "$GITHUB_STEP_SUMMARY"
    fi
```

## Related Tests

Since this is a CI workflow change (YAML only), there are no unit tests. Verification should be done by:

- [ ] Trigger the UAT workflow on a branch with `src/Dockerfile` and verify the new output appears in logs
- [ ] Trigger the UAT workflow on a branch **without** `src/Dockerfile` and verify the skip message still works
- [ ] If Fix 2 is applied, verify the release workflow shows pull commands after a successful GHCR push
- [ ] If Fix 3 is applied, verify the commands appear in the GitHub Actions job summary

## Recommendation

**Fix 1 is the minimum required change** — it directly addresses the bug report by adding UAT commands to the CI logs. **Fix 3 (Job Summary) should be implemented together with Fix 1** since it makes the commands visible in the workflow summary page without requiring users to dig through log output — both fixes modify the same "Report result" step and complement each other.

Fix 2 is a secondary improvement for the release workflow and can be addressed separately.

## Additional Context

- The UAT workflow is `workflow_dispatch`-only (manual trigger), so changes can be tested immediately by dispatching the workflow.
- The `run-uat` SKILL.md and `uat-tester-coding-agent.agent.md` already document the correct commands — this fix brings those commands into the CI output.
- The `docker-compose.yml` maps port 3000 and builds from `./src`, confirming `http://localhost:3000` is the correct URL.
