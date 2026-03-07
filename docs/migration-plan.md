# Migration Plan: green-ledger → GreenLedger

## Overview

Transform this repository from a .NET/C# CLI tool into a clean starter for **GreenLedger** — a Next.js full-stack B2B SaaS for German SME CSRD/ESRS climate reporting.

## How the Original Agents Worked

The original project used a multi-agent AI workflow:

1. **Requirements Engineer** — gathered requirements from the Maintainer, created `specification.md` in `docs/features/NNN-<slug>/`
2. **Architect** — read `specification.md` + `docs/spec.md`, produced `architecture.md` and ADRs
3. **Quality Engineer** — defined test plans and UAT scenarios
4. **Task Planner** — broke architecture into `tasks.md` user stories
5. **Developer** — implemented code and tests following tasks
6. **Technical Writer** — updated documentation
7. **Code Reviewer** — reviewed code quality
8. **UAT Tester** — validated rendered output via real PRs
9. **Release Manager** — created PRs, managed releases
10. **Retrospective** — post-release workflow improvements
11. **Workflow Orchestrator** — automated end-to-end delegation (optional)
12. **Workflow Engineer** — meta-agent for improving the workflow itself
13. **Issue Analyst** — investigated bugs/incidents
14. **Web Designer** — maintained the project website

The **Maintainer** (human) coordinated handoffs in VS Code or assigned issues to `@copilot` on GitHub for autonomous orchestration.

Key files:
- `docs/spec.md` — project specification (the architect reads this to understand what to build)
- `docs/features/NNN-<slug>/specification.md` — per-feature specs
- `docs/features/NNN-<slug>/architecture.md` — per-feature architecture
- `docs/features/NNN-<slug>/tasks.md` — actionable work items
- `.github/agents/*.agent.md` — agent definitions
- `.github/skills/*/SKILL.md` — reusable agent skills
- `.github/prompts/*.prompt.md` — quick-start prompts

## What Changes

### Stack Migration
| Aspect | Old (green-ledger) | New (GreenLedger) |
|--------|-----------------|-------------------|
| Language | C# / .NET 10 | TypeScript / Node.js |
| Framework | CLI tool | Next.js (App Router) |
| Database | N/A | SQLite via Prisma |
| Tests | TUnit (.NET) | Jest or Vitest |
| Build | `dotnet build` | `npm run build` / `next build` |
| Lint | `dotnet format` + markdownlint | ESLint + Prettier + markdownlint |
| Pre-commit | Husky.Net (`dotnet husky`) | Husky (npm) |
| CI test | `dotnet test` via wrapper | `npm test` |
| Docker | NativeAOT binary | Node.js / Next.js |
| Package mgr | NuGet | npm |
| Versioning | Versionize (.NET tool) | standard-version or similar npm tool |

### Files to DELETE (old project artifacts)
- `src/` (already absent — was the .NET source)
- `examples/` (Terraform plan examples — not relevant)
- `website/` (old project website — not relevant)
- `uat-repos/` (old UAT repos — not relevant)
- `artifacts/` (all old demo artifacts)
- `docs/features/` (all old feature specs)
- `docs/issues/` (all old issue analyses)
- `docs/workflow/` (old workflow docs)
- `docs/adr-*` (old architecture decision records)
- `docs/architecture.md`, `docs/architecture-rules.md` (old architecture)
- `docs/testing-strategy.md`, `docs/test-*.md` (old test docs)
- `docs/commenting-guidelines.md` (C# specific)
- `docs/report-style-guide.md`, `docs/markdown-specification.md` (old output format docs)
- `docs/coverage/` (old coverage data)
- `docs/roadmap-*.md` (old roadmap)
- `docs/workflow-orchestrator-implementation.md`, `docs/subagent-commit-push-research.md`
- `docs/code-review-*.md`
- `docs/000-initial-project-setup-architecture.md`
- `docs/ai-model-reference.md`
- `dotnet-tools.json` (replaced by package.json)
- `.versionize` (replaced by npm equivalent config)
- `.editorconfig` C# sections (keep general sections, remove C# specifics)
- `compliance-check-results.md`, `style-guide-implementation-analysis.md` (old analysis)
- `RELEASE_TRIGGER_FIX.md` (old troubleshooting)
- Old scripts that are dotnet-specific: `prepare-test-image.sh`, `test-with-timeout.sh`, `update-test-snapshots.sh`, `generate-demo-artifacts.sh`, `generate-release-screenshots.sh`, `generate-screenshot.sh`, `coverage-*.sh`, `update-azure-api-mappings.py`, `update-homebrew-formula.sh`, `green-ledger.rb.template`, `validate-azure-cli-commands.sh`, `website-*.sh`
- `scripts/hooks/deny-unauthorized-subagents.sh` (keep if generic)

### Files to REWRITE (adapt to new stack)
- `docs/features.md` (old feature list) - make them clear with template
- `docs/spec.md` — new GreenLedger specification
- `README.md` — new project README
- `CONTRIBUTING.md` — adapt for Next.js/npm
- `CLAUDE.md` — update references
- `.github/copilot-instructions.md` — adapt coding instructions for TypeScript/Next.js
- `.github/workflows/pr-validation.yml` — npm test + next build
- `.github/workflows/ci.yml` — npm-based versioning
- `.github/workflows/release.yml` — npm + Docker (Next.js)
- `.github/workflows/copilot-setup-steps.yml` — Node.js setup (remove .NET)
- `.github/workflows/coverage-data.yml` — npm coverage
- `.husky/` — npm-based husky
- `.gitignore` — Next.js patterns
- `.editorconfig` — remove C# rules, add TS/JS rules
- `.dockerignore` — Next.js patterns
- `.github/dependabot.yml` — npm ecosystem
- Agent definitions — remove C#/.NET references, add TS/Next.js context
- Skills — rewrite dotnet-specific skills to npm equivalents

### Skills to DELETE (website/azure specific)
- `website-accessibility-check`
- `website-create-examples`
- `website-devtools`
- `website-quality-check`
- `website-visual-assets`
- `generate-release-screenshots` (dotnet HtmlRenderer tool)
- `generate-demo-artifacts` (dotnet CLI tool)
- `update-test-snapshots` (dotnet test snapshots)
- `detect-diagram-crossings` (website SVG)
- `watch-uat-azdo-pr` (Azure DevOps)
- `create-pr-azdo` (Azure DevOps)

### Skills to REWRITE (stack adaptation)
- `run-dotnet-tests` → `run-tests` (npm test)
- `run-uat` — simplify for Next.js app
- `coding-agent-workflow` — update stack references

### Skills to KEEP (generic workflow)
- `agent-file-structure`
- `agent-model-selection`
- `agent-tool-selection`
- `analyze-chat-export`
- `arc42-documentation`
- `create-agent-skill`
- `create-pr-github`
- `git-rebase-main`
- `merge-conflict-resolution`
- `next-issue-number`
- `validate-agent`
- `view-pr-github`
- `watch-uat-github-pr`

### Workflows to DELETE
- `deploy-website.yml` (website)
- `uat-validate.yml` (old UAT shell tests)
- `coverage-data.yml` (dotnet coverage tooling)

### Workflows to KEEP and REWRITE
- `pr-validation.yml` — npm test + next build
- `ci.yml` — npm versioning
- `release.yml` — simplified (GitHub Release + Docker image)
- `copilot-setup-steps.yml` — Node.js only setup

## Execution Order

1. Create `docs/migration-plan.md` (this file)
2. Delete old project artifacts (artifacts/, docs/features/, docs/issues/, etc.)
3. Delete website/azure-specific skills
4. Delete dotnet-specific files and configs
5. Rewrite `docs/spec.md` for GreenLedger
6. Rewrite workflows for npm/Next.js stack
7. Rewrite `copilot-setup-steps.yml`
8. Rewrite pre-commit hooks for npm
9. Rewrite skills for npm stack
10. Update all agent definitions (remove dotnet refs)
11. Rewrite `README.md`, `CONTRIBUTING.md`, `CLAUDE.md`
12. Update `.editorconfig`, `.gitignore`, `.dockerignore`, `dependabot.yml`
13. Create initial `package.json` placeholder
14. Final repo-wide search for "green-ledger" — must be ZERO

