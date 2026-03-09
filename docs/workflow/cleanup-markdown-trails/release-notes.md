# Release Notes: Agent & Skill File Cleanup

**Release Type:** Internal workflow improvement (no user-facing changes)

---

## Summary

This release cleans up stale project trail artifacts left over from the project's migration from a C#/.NET CLI tool to a TypeScript/Next.js web application. All agent instruction files and skills now correctly reference TypeScript/npm tooling, consistent UAT requirements, and up-to-date workflow patterns.

---

## ✨ Changes

### Agent instruction files updated to reflect TypeScript/Next.js stack

All `.github/agents/` and `.github/skills/` files previously contained references to the old C#/.NET tech stack. These have been fully updated:

- **Test commands**: `dotnet test` → `npm test`
- **Build commands**: `dotnet build` / bare `docker build` → `npm run build` / `docker compose build`
- **Coverage commands**: .NET-style flags removed; replaced with correct Vitest syntax (`npx vitest run --coverage`)
- **C# conventions removed**: XML doc comments mandate, `_camelCase` private field rule, empty bullets/checkboxes cleaned up
- **Snapshot paths removed**: Old `src/tests/GreenLedger.Tests/TestData/Snapshots/*.md` references removed from reviewer agents

### UAT requirement enforced consistently

The "No UAT test plan needed" anti-pattern has been removed. All agents now use "purely internal change" framing to qualify UAT bypass, making it clear that UAT is required for all user-facing features:

- `code-reviewer.agent.md`: Handoff button updated from "Prepare Release (No UAT Needed)" to "Prepare Release (Purely Internal Change)"
- `rm-no-uat.prompt.md`: Updated with clearer "purely internal change with no user-facing UI or behavior changes" language

### Old artifact generation references removed

References to old demo artifact workflows have been cleaned up:

- `comprehensive-demo.md` generation requirement removed from developer and code reviewer agents
- `uat-plan.json` / `uat-plan.md` CLI generation references removed
- Stale "Terraform practitioners" audience language removed from release manager agents

---

## 🔗 Commits

- [`75ac0fd`](https://github.com/StanislavMakhrov/green-ledger/commit/75ac0fd) workflow: remove C# references and fix UAT requirements across agents
- [`95cb0c4`](https://github.com/StanislavMakhrov/green-ledger/commit/95cb0c4) workflow: fix remaining old project trail issues from code review

---

> **Note:** This is a purely internal change to workflow agent instructions. There are no changes to application source code, APIs, or user-facing behavior.
