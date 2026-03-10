# Work Protocol: Separate Requirements and Conventions (002)

**Work Item:** `docs/workflow/002-separate-requirements-and-conventions/`
**Branch:** `copilot/separate-requirements-and-conventions`
**Workflow Type:** Workflow/Documentation
**Created:** 2026-03-10

## Context

This is a documentation restructuring task. `docs/spec.md` was split into two focused
files — `docs/requirements.md` and `docs/conventions.md` — to improve navigation and
clarity for both humans and agents. All cross-references across the repo were updated
to point to the appropriate new file. Additionally, redundant project-name headings were
removed from all docs except `README.md` and `docs/requirements.md`.

## Required Agents

| Agent | Required | Status |
|-------|----------|--------|
| Workflow Engineer | ✅ Required | ✅ Completed |
| Release Manager | ✅ Required | ✅ Completed |
| Retrospective | ✅ Required | ⏳ Pending |

## Agent Work Log

### Workflow Engineer

- **Date:** 2026-03-10
- **Summary:** Implemented the documentation restructuring. Split `docs/spec.md` into
  `docs/requirements.md` (project requirements, overview, tech stack) and
  `docs/conventions.md` (coding standards, CI/CD conventions). Updated all 30+ files
  that previously referenced `docs/spec.md` to point to the correct new file. Removed
  redundant project-name headings from all `.md` files except `README.md` and
  `docs/requirements.md`.
- **Artifacts Produced:**
  - `docs/requirements.md` — Project requirements, overview, MVP scope, tech stack
  - `docs/conventions.md` — Coding conventions, CI/CD, versioning, commit format
  - Updated `.github/agents/*.agent.md`, `.github/skills/`, `CLAUDE.md`, `CONTRIBUTING.md`,
    `SECURITY.md`, `README.md`, `docs/adr-*.md`, `docs/agents.md`, `docs/features.md`,
    `docs/features/001-mvp/*.md`

### Release Manager

- **Date:** 2026-03-10
- **Summary:** Verified PR #43 exists, reviewed CI status (action_required — awaiting
  maintainer workflow approval for Copilot bot PR). Created work-protocol.md and
  release-notes.md for this work item. PR is a draft; maintainer must approve the
  workflow run and then mark the PR ready for review.
- **Artifacts Produced:**
  - `docs/workflow/002-separate-requirements-and-conventions/work-protocol.md`
  - `docs/workflow/002-separate-requirements-and-conventions/release-notes.md`
- **Problems Encountered:**
  - CI shows `action_required` (0 jobs ran) because GitHub requires maintainer approval
    before running Actions on bot-originated PRs. Maintainer must approve in the GitHub
    Actions tab.
  - PR is still in draft state; maintainer must mark it ready for review.
