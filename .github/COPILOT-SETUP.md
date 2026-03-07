# GitHub Copilot Coding Agent Configuration

This repository uses GitHub Copilot coding agents for automated development workflows. This document describes the required repository configuration.

## Required Secrets

GitHub Copilot coding agents require secrets to be configured in a special `copilot` environment for security and isolation.

### Setting Up the `copilot` Environment

1. Navigate to **Repository Settings > Environments**
2. Create or select the environment named `copilot`
3. Add the following secrets:

| Secret Name | Description | Required For |
|-------------|-------------|--------------|
| `GH_UAT_TOKEN` | GitHub Personal Access Token for UAT repository access | UAT Tester agent |

### Token Requirements

#### GH_UAT_TOKEN

- **Type**: GitHub Personal Access Token (classic or fine-grained)
- **Scopes Required**:
  - `repo` (full control of private repositories)
  - `workflow` (update GitHub Actions workflows)
- **Repository Access**: Must have write access to `StanislavMakhrov/green-ledger-uat`

## How It Works

1. **Setup Workflow**: `.github/workflows/copilot-setup-steps.yml`
   - Runs before the coding agent starts working
   - Installs Node.js and npm dependencies
   - Authenticates GitHub CLI using `GH_UAT_TOKEN` (if configured)

2. **Agent Definitions**: `.github/agents/*.agent.md`
   - Define agent roles, tools, and instructions
   - Referenced by VS Code and GitHub Copilot

3. **Agent Skills**: `.github/skills/*/SKILL.md`
   - Reusable workflows for common tasks (PR creation, testing, UAT)

## Troubleshooting

### Agent cannot push code

Ensure the `RELEASE_TOKEN` secret is configured in repository settings (not the copilot environment) with `contents: write` permission.

### UAT tests fail

Ensure `GH_UAT_TOKEN` is configured in the `copilot` environment with the required scopes.
