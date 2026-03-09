# Release Notes: Repository Audit — tfplan2md Leftovers Cleanup

## Overview

GreenLedger was bootstrapped from the
[oocx/tfplan2md](https://github.com/oocx/tfplan2md) template project. This
release removes all leftover configuration artifacts from that .NET/Terraform
project that do not belong in a Next.js carbon-accounting application.

No application source code was changed. This is a housekeeping release that
cleans up the repository foundation before feature development begins.

## ✨ What Changed

### Removed dead git submodule definition

Deleted `.gitmodules`, which referenced two submodules (`oocx/tfplan2md-uat` on
GitHub and an Azure DevOps repo) that were never checked out and have no relation
to GreenLedger.

### Removed Terraform MCP tool from agent definitions

The `io.github.hashicorp/terraform-mcp-server/*` tool was removed from 5 agent
definition files. This Terraform-specific tool is irrelevant to a Next.js
project.

### Fixed repository owner references

Replaced 12 occurrences of `owner: "oocx"` with `owner: "StanislavMakhrov"` in
MCP tool examples across `.github/skills/view-pr-github/SKILL.md` (8 places) and
`.github/gh-cli-instructions.md` (4 places). This ensures all tool examples point
to the correct repository.

### Cleaned `.gitattributes`

Removed C#/.NET-specific rules (`*.cs`, `*.csproj`, `*.slnx`, `*.props`),
Scriban template rules (`*.sbn`), and `.dll`/`.exe` binary rules that were
specific to the original .NET project.

## 🔗 Commits

- [`6fb2a3d`](https://github.com/StanislavMakhrov/green-ledger/commit/6fb2a3d) chore: remove tfplan2md leftovers from repository
- [`340d962`](https://github.com/StanislavMakhrov/green-ledger/commit/340d962) docs: update documentation after tfplan2md cleanup
- [`3982876`](https://github.com/StanislavMakhrov/green-ledger/commit/3982876) docs: add repository audit analysis for tfplan2md leftovers
- [`acd2285`](https://github.com/StanislavMakhrov/green-ledger/commit/acd2285) docs: add code review report for repository audit cleanup

## Notes

- **No version bump**: This release does not modify any application code under
  `src/`, so no version tag is created by the CI pipeline.
- **No Docker image impact**: The Docker image is unchanged since no application
  code was modified.
- **Risk**: Zero — only configuration and documentation files were touched.
