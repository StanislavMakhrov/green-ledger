# Docs: Split `spec.md` into `requirements.md` and `conventions.md`

**Branch:** `copilot/separate-requirements-and-conventions`
**PR:** [#43 — Separate project requirements and conventions into two files](https://github.com/StanislavMakhrov/green-ledger/pull/43)

---

## What Changed

The monolithic `docs/spec.md` file has been split into two focused documents:

- **`docs/requirements.md`** — Project requirements: overview, pain points, MVP demo
  goal, strict scope/non-goals, tech stack, and project organisation.
- **`docs/conventions.md`** — Coding conventions: TypeScript/Next.js standards, code
  quality tooling, CI/CD pipeline, versioning strategy, commit message format, and
  workflow guardrails.

All references to `docs/spec.md` across the repository (~30 files) have been updated to
point to whichever new file holds the relevant content. Redundant project-name headings
were also cleaned up everywhere except `README.md` and `docs/requirements.md`.

## Why This Matters

The original `spec.md` mixed two conceptually distinct concerns: _what_ the project
should do (requirements) and _how_ developers should work on it (conventions). Splitting
them makes it easier to:

- **Navigate quickly** — agents and contributors know exactly where to look.
- **Update independently** — requirements can evolve without touching coding standards,
  and vice versa.
- **Onboard faster** — new contributors read `conventions.md` once; product discussions
  reference `requirements.md`.

## Files Changed

| File | Change |
|------|--------|
| `docs/requirements.md` | **New** — project requirements (from former `spec.md`) |
| `docs/conventions.md` | **New** — coding conventions (from former `spec.md`) |
| `.github/agents/*.agent.md` (11 files) | Updated `spec.md` references |
| `.github/copilot-instructions.md` | Updated `spec.md` references |
| `.github/skills/*/SKILL.md` (3 files) | Updated `spec.md` references |
| `CLAUDE.md`, `CONTRIBUTING.md`, `README.md`, `SECURITY.md` | Updated references; removed redundant project-name headings |
| `docs/adr-*.md` (4 files) | Updated references |
| `docs/agents.md`, `docs/features.md` | Updated references |
| `docs/features/001-mvp/*.md` (3 files) | Updated references |

## 🔗 Commits

| SHA | Summary |
|-----|---------|
| [`7bb3dd9`](https://github.com/StanislavMakhrov/green-ledger/commit/7bb3dd938f1314ed0486011975e386cf44f9fc30) | docs: split spec.md into requirements.md and conventions.md, remove project name from docs |
