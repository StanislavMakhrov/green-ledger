# Retrospective: Separate Requirements and Conventions (Workflow 002)

**Date:** 2026-03-10
**Work Item:** `docs/workflow/002-separate-requirements-and-conventions/`
**PR:** [#43 — Separate project requirements and conventions into two files](https://github.com/StanislavMakhrov/green-ledger/pull/43)
**Branch:** `copilot/separate-requirements-and-conventions`
**Participants:** Maintainer, Workflow Engineer, Release Manager, Retrospective

---

## Summary

This was a documentation restructuring workflow — no production code was touched.
`docs/spec.md` was split into `docs/requirements.md` (project requirements) and
`docs/conventions.md` (coding standards), and all cross-references across ~35 files were
updated in a single clean commit. The scope was well-defined, execution was fast (~25
minutes of active agent work), and the output is correct.

The main friction point was a platform constraint: GitHub requires maintainer approval
before running Actions on bot-originated PRs, so CI never executed on any of the three
commits. All PR Validation runs ended with `action_required` and zero jobs ran. This
blocked automated verification for the entire cycle. The PR also remained in `[WIP]`
draft state because the Release Manager could not un-draft it — that step requires
maintainer action.

---

## Scoring Rubric

| # | Deduction | Evidence |
|---|-----------|----------|
| 1 | −1 | CI never ran (`action_required`) on all 3 runs — no automated validation during the cycle |
| 2 | −1 | Release Manager did not post an explicit PR comment directing the maintainer to approve CI and un-draft — the handoff steps exist only in `work-protocol.md`, which is not surfaced to the maintainer in the PR UI |

**Starting score:** 10
**Deductions:** −2
**Final workflow rating: 8/10**

---

## Session Overview

### Evidence Sources

- Git commit history (3 commits, timestamps from `git log`)
- PR metadata from GitHub API (PR #43)
- Work Protocol (`work-protocol.md`)
- Release Notes (`release-notes.md`)
- GitHub Actions workflow run list (branch filter)
- **Chat logs:** Not exported — per-agent metrics are **Unavailable**

### Time Breakdown

| Metric | Value |
|--------|-------|
| **Session Start** | 2026-03-10 13:05:23 UTC (PR creation / "Initial plan" commit) |
| **Session End** | 2026-03-10 13:33:28 UTC (last PR update timestamp) |
| **Session Duration** | ~28 minutes |
| **Commits** | 3 |
| **Files Changed** | 37 (35 in implementation commit + 2 new work-item docs) |
| **Additions / Deletions** | +274 / −143 |
| **Tests Added** | 0 (documentation-only change) |

### Evidence Timeline

| Time (UTC) | Event |
|------------|-------|
| 13:05:23 | PR #43 opened (draft); "Initial plan" commit (`2b57b8b`) pushed; CI run #102 triggers → `action_required` |
| 13:26:11 | Workflow Engineer: implementation commit (`7bb3dd9`) — 35 files updated; CI run #104 triggers → `action_required` |
| 13:30:45 | Release Manager: `work-protocol.md` + `release-notes.md` added (`b8b80fd`); CI run #105 triggers → `action_required` |
| 13:33:28 | PR last updated |

---

## Agent Analysis

> **Agent attribution note:** No chat logs were exported for this session. Per-agent
> request counts, model usage, and automation effectiveness metrics are **Unavailable**.
> The analysis below is based on git history, PR metadata, and the work-protocol entries.

### Work Protocol Analysis

| Agent | Required | Logged | Notes |
|-------|----------|--------|-------|
| Workflow Engineer | ✅ | ✅ | Detailed entry with artifacts and scope |
| Release Manager | ✅ | ✅ | Flagged CI and draft-PR blockers clearly |
| Retrospective | ✅ | ✅ (this entry) | — |

The Work Protocol was created and populated correctly by the Release Manager. All required
agents for a workflow task completed their entries. No gaps found.

---

## Rejection Analysis

> **Note:** Without exported chat logs, detailed tool-rejection counts and model-level
> rejection rates are **Unavailable**. The only observable "rejection" is CI-level:
> all three PR Validation runs ended with `action_required` before any job executed.

### CI / Status Checks Summary

| Run # | Trigger Commit | Status | Conclusion | Notes |
|-------|---------------|--------|------------|-------|
| 102 | `2b57b8b` (Initial plan) | completed | `action_required` | 0 jobs ran |
| 104 | `7bb3dd9` (Implementation) | completed | `action_required` | 0 jobs ran |
| 105 | `b8b80fd` (Work docs) | completed | `action_required` | 0 jobs ran |

**Root cause:** GitHub requires a maintainer to explicitly approve Actions runs on PRs
from the Copilot bot (`copilot-swe-agent`). Until approved, all CI is blocked regardless
of PR content.

**Impact:** No automated linting, markdownlint, or build checks ran during the entire
cycle. The Workflow Engineer self-validated markdownlint compliance, but this was not
independently verified by CI.

---

## Agent Performance

| Agent | Rating | Strengths | Improvements Needed |
|-------|--------|-----------|---------------------|
| Workflow Engineer | ⭐⭐⭐⭐⭐ | Single focused commit covering all 35 files; correct reference routing (requirements vs conventions); markdownlint self-validated; clear commit message | None identified — scope was tight and output correct |
| Release Manager | ⭐⭐⭐⭐ | Created both required artifacts; clearly documented the CI `action_required` blocker and draft-PR limitation in work-protocol; did not attempt workarounds outside role boundaries | PR was handed off still in `[WIP]` draft state; could have added an explicit handoff comment prompting the maintainer to approve CI and un-draft |
| Retrospective (self) | ⭐⭐⭐⭐ | Evidence-based analysis; all required sections present; correct deductions cited | Brief by design (no chat logs available); would benefit from exported session data |

**Overall Workflow Rating: 8/10** — Execution was fast and correct. The score reflects
the structural friction of CI never validating anything (platform constraint) and the PR
remaining in an incomplete release state.

---

## Automation Opportunities

### Known Platform Constraint

The `action_required` CI pattern is a recurring cost for every Copilot-bot PR. It cannot
be automated by the agents themselves, but it can be made more visible.

| Opportunity | Proposed Solution | Evidence | Verification |
|------------|-------------------|----------|--------------|
| Maintainer needs to remember to approve CI on every bot PR | Add a checklist item to the PR description template reminding the maintainer to approve the Actions run | Observed on all 3 CI runs; also documented by Release Manager | CI runs complete (not `action_required`) after next bot PR is opened |
| PR left in draft / `[WIP]` after agent work completes | Release Manager should post an explicit PR comment instructing maintainer to un-draft and approve CI | Release Manager work-protocol entry documents this as a known gap | PR description no longer contains `[WIP]` at handoff |

---

## Model Effectiveness Assessment

> **Unavailable** — No chat logs were exported. Model usage and response time data cannot
> be derived from git history or PR metadata alone.

---

## What Went Well

- **Scope was crystal-clear.** The split between requirements (what) and conventions (how)
  is an obvious and well-motivated boundary; no ambiguity required re-work.
- **Single-commit implementation.** All 35 files were updated atomically, making the diff
  easy to review and revert if needed.
- **Self-contained change.** No production code, no tests, no database migrations — pure
  documentation, so risk was minimal.
- **Work Protocol maintained correctly.** Both agents logged entries with sufficient detail
  for the retrospective to proceed without needing chat logs.
- **Release Manager correctly scoped its role.** It identified and documented blockers
  rather than attempting workarounds outside its boundaries.

## What Didn't Go Well

- **CI never ran.** All three PR Validation runs ended with `action_required` and zero jobs
  executed. The entire cycle had no automated verification — markdownlint compliance,
  link checking, and any other checks were unverified by the pipeline.
- **No explicit handoff PR comment from Release Manager.** The two required maintainer
  actions (approve the Actions run; un-draft the PR) were documented in `work-protocol.md`
  but not surfaced as a PR comment in the GitHub UI — where the maintainer actually looks.
  The Release Manager agent has no existing instructions covering this step.
- **No chat logs exported.** Per-agent metrics (model usage, request counts, rejection
  rates, response times) are unavailable, making this retrospective less quantitative than
  it could be.

---

## Improvement Opportunities

| Issue | Proposed Solution | Action Item |
|-------|-------------------|-------------|
| CI blocked by `action_required` on every bot PR | Add a prominent reminder in the standard PR description checklist (used by all bot PRs) that the maintainer must approve the workflow run before CI executes | Update the PR description template or `docs/agents.md` release checklist. **Verification:** next bot PR has CI run within 5 minutes of opening, without maintainer being surprised. |
| PR handed off with no explicit PR comment for maintainer | Release Manager agent instructions should include a step to post a PR comment listing the required manual actions (approve Actions run; un-draft PR) — this is not currently in `release-manager-coding-agent.agent.md` | Update `release-manager-coding-agent.agent.md` to add the handoff PR comment step (confirmed absent via grep). **Verification:** next bot PR includes an explicit maintainer-action PR comment at the end of the Release Manager phase. |
| No session chat logs available for metrics | Establish a convention that the Maintainer exports the session chat before invoking the Retrospective agent | Add a note to `docs/agents.md` in the Retrospective section. **Verification:** next retrospective has per-agent metric tables populated. |

---

## User Feedback (Verbatim)

> "Write a brief retrospective report in
> `docs/workflow/002-separate-requirements-and-conventions/retrospective.md`."
> — Maintainer task instruction (2026-03-10)

No prior draft notes were recorded during the development cycle. No retro-specific
feedback was collected during the interactive phase (brief retrospective mode, no
interactive questions asked).

**Mapping to improvement opportunities:**

- "Brief retrospective" instruction → confirms that the no-chat-log path must remain
  viable; see action item 3 (chat-log export convention).

---

## Retrospective DoD Checklist

- [x] Evidence sources enumerated (PR metadata, git history, work-protocol, CI run list)
- [x] Evidence timeline normalized across lifecycle phases
- [x] Findings clustered by theme (CI blocking, draft-PR handoff, missing chat logs)
- [x] No unsupported claims (assumptions labeled or omitted; per-agent metrics marked Unavailable)
- [x] No guessed agent attribution (agent identity derived from work-protocol entries and git author)
- [x] Action items include where + verification
- [x] Required metrics and required sections present
- [x] CI / Status Checks Summary present
- [x] All retro-related user feedback captured verbatim
- [x] Work Protocol Analysis included
- [x] Scoring Rubric with explicit deductions included
