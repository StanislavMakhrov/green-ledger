# Work Protocol — Audit Repo Files

## Developer — 2025-03-09

**Summary:** Implemented all 4 cleanup tasks to remove tfplan2md template leftovers from the repository.

**Changes (9 files, 17 insertions, 34 deletions):**

1. Deleted `.gitmodules` (referenced `oocx/tfplan2md-uat` and Azure DevOps repos)
2. Removed `io.github.hashicorp/terraform-mcp-server/*` from tools array in 5 agent definitions:
   - `.github/agents/code-reviewer.agent.md`
   - `.github/agents/developer.agent.md`
   - `.github/agents/issue-analyst.agent.md`
   - `.github/agents/requirements-engineer.agent.md`
   - `.github/agents/workflow-engineer.agent.md`
3. Replaced `owner: "oocx"` → `owner: "StanislavMakhrov"` in:
   - `.github/skills/view-pr-github/SKILL.md` (8 occurrences)
   - `.github/gh-cli-instructions.md` (4 occurrences)
4. Cleaned `.gitattributes`:
   - Removed C# section (*.cs, *.csproj, *.slnx, *.props)
   - Removed Scriban section (*.sbn)
   - Removed *.dll and *.exe from binary files

**Validation:**

- Code review: no issues
- CodeQL: no analyzable code (config/docs only)
- Markdownlint: all errors are pre-existing on main, none introduced

**Problems:** None.
