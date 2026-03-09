# Code Review: Remove C# References and Fix UAT Requirements

**Branch:** `copilot/cleanup-markdown-trails`
**Commit:** `75ac0fd`
**Reviewer:** Code Reviewer Agent
**Date:** 2026-03-09

---

## Summary

This commit removes C#/dotnet references from all agent instruction files and replaces them with TypeScript/npm equivalents. It also strengthens UAT requirements, replacing "No UAT needed" language with clearer "purely internal change" framing.

The overall direction is **correct and necessary** — the project has clearly migrated from a .NET C# CLI tool to a TypeScript/Next.js web application, and the agent files were badly out of sync. The bulk of the changes are clean and well-executed. However, the cleanup is **incomplete**: approximately 15 residual C# / old-product references remain across several files, and the work-protocol.md is missing entirely (a Blocker per process rules).

---

## Verification Results

- **Tests:** N/A — this is a documentation-only change (agent `.md` files and skills)
- **Build:** N/A
- **Docker:** N/A
- **Errors:** None

---

## Specification Compliance

| Objective | Implemented | Complete | Notes |
|-----------|-------------|----------|-------|
| Remove `dotnet`/C# tool commands from agents | ✅ | ⚠️ | ~90% complete; several residual issues below |
| Replace `run-dotnet-tests` → `run-tests` skill | ✅ | ✅ | Done across all agents |
| Remove C# coding conventions | ✅ | ⚠️ | XML doc comment line left in `developer.agent.md` |
| Remove snapshot/SNAPSHOT_UPDATE_OK | ✅ | ⚠️ | Path `src/tests/GreenLedger.Tests/TestData/Snapshots/*.md` still in two reviewer agents |
| Remove comprehensive-demo artifact requirements | ✅ | ⚠️ | Two references remain in `developer.agent.md` and `code-reviewer.agent.md` |
| Remove uat-plan.json/uat-plan.md CLI generation | ✅ | ✅ | Done |
| UAT mandatory for user-facing features | ✅ | ⚠️ | `code-reviewer.agent.md` handoff button still says "No UAT Needed" |
| Remove `/rm-no-uat` from quick commands | ✅ | ✅ | Removed from `docs/agents.md` |
| Update `rm-no-uat.prompt.md` | ✅ | ✅ | Updated with "purely internal" language |
| Update release manager screenshot instructions | ✅ | ✅ | Replaced .NET ScreenshotGenerator with docker compose |

---

## Adversarial Testing

| Test Case | Result | Notes |
|-----------|--------|-------|
| Search for `dotnet` in changed files | Pass | No remaining dotnet commands |
| Search for `.csproj`, `NuGet`, `xUnit` | Pass | None found in changed files |
| Search for `run-dotnet-tests` | Pass | All replaced with `run-tests` |
| Search for `C# code changes` phrase | **Fail** | 3 occurrences in `workflow-engineer.agent.md` (lines 35, 627, 642) |
| Search for `GreenLedger.Tests/TestData/Snapshots` | **Fail** | Remains in both reviewer agents |
| Search for `PDF export` in reviewer agents | **Fail** | Line 109 of `code-reviewer-coding-agent.agent.md` |
| Search for `Comprehensive demo passes markdownlint` | **Fail** | `developer.agent.md` line 368 |
| Search for `docker build` (bare, not compose) | **Fail** | `code-reviewer.agent.md` line 106, `developer.agent.md` line 366 |
| Search for `Terraform practitioners` | **Fail** | Both release-manager variants |
| Search for malformed Vitest coverage commands | **Fail** | `.NET`-style flags in coverage commands |

---

## Review Decision

**Status:** Changes Requested

The commit successfully removes the bulk of C# references and correctly tightens UAT framing, but leaves too many incomplete substitutions and process violations to approve as-is. All findings below are Minor or lower (no Blockers beyond the missing work-protocol), so the rework is straightforward.

---

## Work Protocol & Documentation Verification

### ⛔ BLOCKER — Missing `work-protocol.md`

This branch is a workflow-type change (`copilot/cleanup-markdown-trails`). Per `docs/agents.md § Work Protocol`, the Workflow Engineer is the **required first agent** for workflow improvements and **must create `work-protocol.md`** in the work item folder (`docs/workflow/<NNN>-<topic-slug>/`).

- **`work-protocol.md` does not exist anywhere in the repository.**
- The branch name does not follow the standard `workflow/<NNN>-<slug>` naming convention (no issue number prefix).
- The Workflow Engineer has no log entry.
- The Release Manager has no log entry.

Before this can be approved, the Maintainer or Workflow Engineer must create the work-protocol.md and log the agent's contributions.

---

## Issues Found

### Blockers

**B1 — Missing `work-protocol.md` (Process Violation)**

The repository has no `docs/workflow/` directory and no `work-protocol.md` for this change. Per `docs/agents.md`:
> "The Work Protocol itself must exist. If it is missing entirely, this is a **Blocker**."

Required agents for a workflow improvement: Workflow Engineer ✅ (this commit is their work), Release Manager (not yet run).
Required action: Create `docs/workflow/<NNN>-cleanup-markdown-trails/work-protocol.md` with the Workflow Engineer's log entry.

---

### Major Issues

None.

---

### Minor Issues

**M1 — `workflow-engineer.agent.md` lines 35, 627, 642: Stale "C# code changes" phrase**

The commands were correctly updated (`dotnet test` → `npm test`), but the trailing qualifier was not. Three lines still read `when C# code changes` or `required when C# code changes`.

The `workflow-engineer-coding-agent.agent.md` (the coding-agent variant) was correctly updated to `when source code under 'src/' changes`. The `.agent.md` (VS Code local) version was missed.

**Files:**

- `.github/agents/workflow-engineer.agent.md`, lines 35, 627, 642

**Fix:** Replace `when C# code changes` with `when source code under 'src/' changes` (matching the coding-agent variant).

---

**M2** — Both reviewer agents: Stale C# snapshot path

The commit removed `SNAPSHOT_UPDATE_OK`, the snapshot checklist items, and the "Snapshot Changes" review report section — but left a standalone bullet referencing the old C# test path. This path no longer exists in a TypeScript project:

```
src/tests/GreenLedger.Tests/TestData/Snapshots/*.md
```

**Files:**

- `.github/agents/code-reviewer-coding-agent.agent.md`, line 106
- `.github/agents/code-reviewer.agent.md`, line 117

**Fix:** Remove these lines entirely, or update to reference TypeScript test snapshots if applicable.

---

**M3 — `code-reviewer-coding-agent.agent.md` line 109: "PDF export" reference**

The coding-agent reviewer's UAT handoff rule still lists "PDF export" as an example of a user-facing feature:
> "For user-facing features (UI changes, **PDF export**, API behavior changes…)"

PDF export was a feature of the old .NET CLI product, not the current TypeScript/Next.js app.

**Fix:** Remove "PDF export" from the list. The non-coding-agent `code-reviewer.agent.md` already has this cleaned up correctly.

---

**M4 — `developer.agent.md` line 366: `docker build` instead of `docker compose build`**

The developer checklist item still uses the old bare `docker build` command:

```
- [ ] Docker image builds successfully (`docker build`)
```

The rest of the file (line 309) correctly uses `docker compose build`. The commit updated the build step command but missed this checklist item.

**File:** `.github/agents/developer.agent.md`, line 366

**Fix:** Change `` `docker build` `` to `` `docker compose build` ``.

---

**M5 — `developer.agent.md` line 368: Old "Comprehensive demo" checklist item**

The developer Definition of Done checklist still contains:

```
- [ ] Comprehensive demo passes markdownlint with 0 errors (REQUIRED)
```

The comprehensive-demo artifact concept was removed from the project in this commit. This item is now meaningless and potentially confusing.

**File:** `.github/agents/developer.agent.md`, line 368

**Fix:** Remove this item, or replace with a relevant TypeScript build quality check (e.g., `npm run lint` passes).

---

**M6 — `code-reviewer.agent.md` line 107: Old "comprehensive demo" instruction**

The code reviewer's "Always Do" section still says:
> "Generate comprehensive demo output and verify it passes markdownlint (always, not just when feature impacts markdown)"

This instruction was correctly removed from `code-reviewer-coding-agent.agent.md` but remains in the VS Code local variant.

**File:** `.github/agents/code-reviewer.agent.md`, line 107

**Fix:** Remove this line. The coding-agent version already has the correct equivalent.

---

**M7 — `code-reviewer.agent.md` handoff button: Still says "No UAT Needed"**

The YAML frontmatter of `code-reviewer.agent.md` defines the VS Code handoff buttons. The button that bypasses UAT still uses the old label and prompt:

```yaml
- label: Prepare Release (No UAT Needed)
  agent: "Release Manager"
  prompt: The code review is approved and this change does not require UAT. Prepare the release.
```

The commit updated `rm-no-uat.prompt.md` and `docs/agents.md` to use "purely internal" framing, but the handoff button itself was not updated.

**File:** `.github/agents/code-reviewer.agent.md`, lines 16–18

**Fix:** Update the label to e.g. `Prepare Release (Purely Internal Change)` and align the prompt text with `rm-no-uat.prompt.md`: "this change does not require UAT (it is a purely internal change with no user-facing UI or behavior changes)."

---

**M8** — Both reviewer agents: Malformed Vitest coverage commands

The coverage section in both reviewer agents uses .NET-style flags incorrectly placed in a Vitest command:

```bash
cd src && npx vitest run --configuration Release -- --coverage --coverage-output coverage.cobertura.xml --coverage-output-format cobertura
# (not applicable) -- --report ./src/TestResults/coverage.cobertura.xml --line-threshold 84.48 --branch-threshold 72.80
```

Problems:

1. `--configuration Release` is a `dotnet test` flag, not a Vitest flag. Vitest uses `--mode production` or similar.
2. `--coverage-output` and `--coverage-output-format` are dotnet coverage flags. Vitest uses `--coverage.reporter` and `--coverage.provider`.
3. The `# (not applicable)` commented-out line is the old dotnet `CoverageEnforcer` tool command and should be removed entirely.
4. The coverage thresholds (84.48% line, 72.80% branch) appear to be carried over from the old C# project's actual measured baselines — they are not appropriate defaults for a new TypeScript project.

**Files:**

- `.github/agents/code-reviewer.agent.md`, lines 225–227
- `.github/agents/developer.agent.md`, corresponding section

**Fix:** Replace with correct Vitest coverage command (e.g., `npx vitest run --coverage`) and remove the commented-out dotnet line. Revisit whether these specific threshold values apply to the TypeScript project.

---

**M9 — `developer.agent.md` line 57: Empty bullet left by C# removal**

A blank bullet (`-`) was left in the "Always Do" section where the `_camelCase` private fields rule used to be.

**File:** `.github/agents/developer.agent.md`, line 57

**Fix:** Remove the empty bullet.

---

**M10 — `code-reviewer.agent.md` line 234: Empty checkbox left by C# removal**

A blank checkbox item (`- [ ]`) appears in the Code Quality checklist where the `_camelCase` rule used to be.

**File:** `.github/agents/code-reviewer.agent.md`, line 234

**Fix:** Remove the empty checkbox item.

---

**M11 — `developer.agent.md` line 176: Double-dash formatting bug**

A merge artifact left a double-dash prefix:

```
- - Comments must explain "why" not just "what"
```

The first `-` is from an old line that should have been removed (the C# XML doc comment mandate), and the second `-` is the correct replacement line.

Additionally, the line immediately above (`- **All members must have XML doc comments** (public, internal, AND private)`) is a C# XML doc comment requirement that should have been removed but was not.

**File:** `.github/agents/developer.agent.md`, lines 174–176

**Fix:** Remove the XML doc comments mandate line, and fix the double-dash to a single-dash on the "Comments must explain 'why'" line.

---

### Suggestions

**S1 — `release-manager-coding-agent.agent.md` lines 266, 269: Stale "Terraform practitioners" language**

The release notes template still references the old product's audience:

- Line 266: "New terraform feature support" (example of user-facing change)
- Line 269: "Technical blog-post style written by a developer for Terraform practitioners (not marketing copy)"

The `release-manager.agent.md` variant had line 266 removed but line 269 retained; the `-coding-agent` variant missed both. These should be updated to reference the actual user audience of the TypeScript/Next.js app.

**File:** `.github/agents/release-manager-coding-agent.agent.md`, lines 266, 269

---

**S2 — `code-reviewer.agent.md` line 111: Stale "feature-specific demo artifact" language**

The "Always Do" section contains:
> "**Verify feature-specific demo artifact coverage** — If a UAT test plan exists, confirm that the feature-specific demo artifact exercises EVERY acceptance criterion. For cross-cutting rendering features (icons, summaries, display names), verify all resource types and touch-points are covered."

The "demo artifact" concept (uat-plan.md, comprehensive-demo.md) was removed in this commit. The underlying intent (verifying UAT coverage) is valid, but the language still refers to old artifact formats and "rendering features" specific to the C# Terraform report generator.

**File:** `.github/agents/code-reviewer.agent.md`, line 111

---

## Critical Questions Answered

**What could make this code fail?**
Agents following the updated instructions will encounter internal inconsistencies: a developer told to run `docker compose build` in one place but `docker build` in a checklist item; a workflow engineer told "run tests when C# code changes" instead of "when source code changes." These aren't critical failures, but they undermine the intent of the cleanup.

**What edge cases might not be handled?**
The UAT bypass path via the "Prepare Release (No UAT Needed)" button (M7) is not updated — an agent using VS Code local mode could still use the old "no UAT needed" label/prompt without the new "purely internal" qualification.

**Are all error paths tested?**
Not applicable — documentation change. The "test" is whether the instructions are internally consistent; several are not (per findings above).

---

## Checklist Summary

| Category | Status |
|----------|--------|
| Correctness (documentation consistency) | ⚠️ Minor gaps |
| Spec Compliance (all 3 objectives) | ⚠️ ~90% complete |
| Code/Doc Quality | ⚠️ Empty bullets, double-dash bug |
| Architecture | ✅ Direction correct |
| Testing | N/A |
| Work Protocol | ❌ Missing entirely (Blocker) |

---

## Next Steps

1. **Blocker (B1):** Create `docs/workflow/<NNN>-cleanup-markdown-trails/work-protocol.md` and log the Workflow Engineer's entry.
2. **Minor issues M1–M11:** Fix the 11 residual C# / stale references identified above. These are all straightforward one-line edits.
3. **Suggestions S1–S2:** Optional improvements to Terraform/demo-artifact language.
4. After rework: hand off to Code Reviewer for re-approval, then Release Manager.

---

## Agent Work Log

| Agent | Date | Summary |
|-------|------|---------|
| Code Reviewer | 2026-03-09 | Reviewed commit 75ac0fd. Found 1 Blocker (missing work-protocol.md), 11 Minor issues (stale C# references, formatting bugs), and 2 Suggestions. Status: Changes Requested. |
