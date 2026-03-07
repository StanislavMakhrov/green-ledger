#!/usr/bin/env bash
# UAT Wrapper Script (GitHub + Azure DevOps)
#
# Purpose: Reduce Maintainer approval fatigue by batching UAT into one stable command.
#
# Usage:
#   scripts/uat-run.sh \
#     --report <feature-artifact.md> --instructions "<test-instructions>" \
#     [--report <another.md>        --instructions "<instructions2>"] \
#     [--platform both|github|azdo] \
#     [--create-only]
#
#   scripts/uat-run.sh --cleanup-last [--state-file <path>]
#
# Required:
#   --report <file>        Path to a feature-specific markdown artifact.
#   --instructions <text>  Detailed, resource-specific validation instructions for the
#                          preceding --report. Every --report must have one --instructions.
#
# Optional:
#   --platform both|github|azdo  (default: both)
#   --create-only                Create PRs but do not poll; save state for later cleanup.
#   --cleanup-last               Clean up PRs and branches from the last --create-only run.
#   --state-file <path>          Override default state file path.
#
# Behaviour:
# - Creates a temporary, unique UAT branch in the UAT repos (not in this repo).
# - Creates UAT PR(s) with all feature-specific reports posted as PR comments.
#   Each comment includes test instructions and the report content.
# - Automatically appends the comprehensive demo as a regression test comment.
# - Validates that all provided artifacts are up-to-date before posting.
# - Auto-configures GitHub/AzDO authentication for coding agent environments.
# - Polls for approval, then cleans up PR(s) and branches.
#
# Examples:
#   scripts/uat-run.sh \
#     --report docs/features/072-parent-child/uat-plan.md \
#     --instructions "In azurerm_virtual_network, verify subnets are grouped under their parent VNet"
#
#   scripts/uat-run.sh \
#     --report artifacts/my-feature.md \
#     --instructions "Verify role assignments show principal names instead of GUIDs" \
#     --platform github

set -euo pipefail

# Prevent interactive pagers from blocking automation
export GH_PAGER=cat
export GH_FORCE_TTY=false
export AZURE_CORE_PAGER=cat
export PAGER=cat

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $*"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*" >&2; }
# Source shared helpers (credential helper setup, artifact validation, etc.)
_uat_run_script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "$_uat_run_script_dir/uat-helpers.sh"

state_file_default=".tmp/uat-run/last-run.json"
uat_submodule_github_default="uat-repos/github"
uat_submodule_azdo_default="uat-repos/azdo"

get_submodule_head() {
  local path="$1"
  if [[ -e "$path/.git" ]]; then
    git -C "$path" rev-parse HEAD 2>/dev/null || echo ""
    return 0
  fi
  echo ""
}

restore_submodule_head() {
  local path="$1"
  local head="$2"
  if [[ -z "$path" || -z "$head" ]]; then
    return 0
  fi
  if [[ ! -e "$path/.git" ]]; then
    return 0
  fi
  git -C "$path" checkout --detach "$head" >/dev/null 2>&1 || true
  git -C "$path" reset --hard "$head" >/dev/null 2>&1 || true
  git -C "$path" clean -fd >/dev/null 2>&1 || true
}

die_usage() {
  log_error "Usage: $0 --report <file> --instructions <text> [--report <file2> --instructions <text2>] [--platform both|github|azdo] [--create-only]"
  log_error "       $0 --cleanup-last [--state-file <path>]"
  log_error ""
  log_error "Required (at least one pair):"
  log_error "  --report <file>         Feature-specific artifact to post as a PR comment"
  log_error "  --instructions <text>   Validation instructions for the preceding --report"
  log_error ""
  log_error "Example:"
  log_error "  $0 \\"
  log_error "    --report docs/features/072-parent-child/uat-plan.md \\"
  log_error "    --instructions 'In azurerm_virtual_network, verify subnets are grouped under their parent VNet'"
  exit 2
}

cmd_cleanup_last() {
  local state_file="$1"

  if [[ ! -f "$state_file" ]]; then
    log_error "State file not found: $state_file"
    log_error "Run with --create-only first (or pass --state-file)."
    exit 1
  fi

  local original_branch
  original_branch="$(jq -r '.original_branch // ""' "$state_file" 2>/dev/null || echo "")"
  local uat_branch
  uat_branch="$(jq -r '.uat_branch // ""' "$state_file" 2>/dev/null || echo "")"
  local gh_pr
  gh_pr="$(jq -r '.github.pr // ""' "$state_file" 2>/dev/null || echo "")"
  local azdo_pr
  azdo_pr="$(jq -r '.azdo.pr // ""' "$state_file" 2>/dev/null || echo "")"

  if [[ -z "$uat_branch" ]]; then
    log_error "Invalid state file (missing uat_branch): $state_file"
    exit 1
  fi

  if [[ -n "$original_branch" && "$(git branch --show-current)" != "$original_branch" ]]; then
    log_warn "Not on original branch '$original_branch' (current: $(git branch --show-current))."
  fi

  log_info "Cleaning up UAT PRs from state: $state_file"
  if [[ -n "$gh_pr" && "$gh_pr" != "null" ]]; then
    ensure_github_credential_helper || true
    scripts/uat-github.sh cleanup "$gh_pr" || true
  fi
  if [[ -n "$azdo_pr" && "$azdo_pr" != "null" ]]; then
    scripts/uat-azdo.sh cleanup "$azdo_pr" || true
  fi

  local uat_submodule_github
  uat_submodule_github="$(jq -r '.submodules.github.path // .submodules.github // ""' "$state_file" 2>/dev/null || echo "")"
  local uat_submodule_github_head
  uat_submodule_github_head="$(jq -r '.submodules.github.head // ""' "$state_file" 2>/dev/null || echo "")"
  local uat_submodule_azdo
  uat_submodule_azdo="$(jq -r '.submodules.azdo.path // .submodules.azdo // ""' "$state_file" 2>/dev/null || echo "")"
  local uat_submodule_azdo_head
  uat_submodule_azdo_head="$(jq -r '.submodules.azdo.head // ""' "$state_file" 2>/dev/null || echo "")"

  log_info "Deleting remote branches: $uat_branch"
  if [[ -n "$uat_submodule_github" && -e "$uat_submodule_github/.git" ]]; then
    git -C "$uat_submodule_github" push origin --delete "$uat_branch" >/dev/null 2>&1 || log_warn "Failed to delete GitHub UAT branch '$uat_branch' (may already be deleted)."
  fi
  if [[ -n "$uat_submodule_azdo" && -e "$uat_submodule_azdo/.git" ]]; then
    ensure_azdo_credential_helper "$uat_submodule_azdo"
    git -C "$uat_submodule_azdo" push origin --delete "$uat_branch" >/dev/null 2>&1 || log_warn "Failed to delete AzDO UAT branch '$uat_branch' (may already be deleted)."
  fi

  # Restore submodules to their original HEADs so the parent repo stays clean.
  restore_submodule_head "$uat_submodule_github" "$uat_submodule_github_head"
  restore_submodule_head "$uat_submodule_azdo" "$uat_submodule_azdo_head"

  if [[ -n "$original_branch" ]] && git rev-parse --verify "$original_branch" >/dev/null 2>&1; then
    log_info "Restoring original branch: $original_branch"
    git switch "$original_branch" >/dev/null 2>&1 || true
  fi

  log_info "Cleanup complete."
}

create_only=false
cleanup_last=false
state_file="$state_file_default"

if [[ "${1:-}" == "--cleanup-last" ]]; then
  cleanup_last=true
  shift || true
fi

while [[ $# -gt 0 ]]; do
  case "$1" in
    --state-file)
      state_file="${2:-}"
      shift 2
      ;;
    --cleanup-last)
      cleanup_last=true
      shift
      ;;
    --create-only)
      create_only=true
      shift
      ;;
    *)
      break
      ;;
  esac
done

if [[ "$cleanup_last" == "true" ]]; then
  cmd_cleanup_last "$state_file"
  exit 0
fi

# Parse --report/--instructions pairs (and optional --platform/--create-only)
declare -a report_files=()
declare -a report_instructions=()
platform="both"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --report)
      report_files+=("${2:?--report requires a file argument}")
      shift 2
      ;;
    --instructions)
      report_instructions+=("${2:?--instructions requires a text argument}")
      shift 2
      ;;
    --platform)
      platform="${2:-}"
      shift 2
      ;;
    --create-only)
      create_only=true
      shift
      ;;
    *)
      die_usage
      ;;
  esac
done

if [[ "$platform" != "both" && "$platform" != "github" && "$platform" != "azdo" ]]; then
  log_error "Invalid --platform value: $platform"
  die_usage
fi

# Validate: at least one --report/--instructions pair is required
if [[ ${#report_files[@]} -eq 0 ]]; then
  log_error "At least one --report/--instructions pair is required."
  die_usage
fi

# Validate: equal number of --report and --instructions
if [[ ${#report_files[@]} -ne ${#report_instructions[@]} ]]; then
  log_error "Each --report must have a corresponding --instructions (got ${#report_files[@]} reports, ${#report_instructions[@]} instructions)."
  die_usage
fi

# Validate all report files exist
for i in "${!report_files[@]}"; do
  if [[ ! -f "${report_files[$i]}" ]]; then
    log_error "Report file not found: ${report_files[$i]}"
    log_error "Ensure the artifact exists before running UAT."
    exit 1
  fi
done

original_branch="$(git branch --show-current)"
if [[ "$original_branch" == "main" ]]; then
  log_error "Refusing to run UAT from 'main'. Switch to a feature branch first."
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  log_error "Working tree is not clean. Commit or stash changes before running UAT."
  exit 1
fi

# Ensure UAT git submodules are initialized (automatic, no manual step needed)
ensure_git_submodules || exit 1

# Comprehensive demo artifacts (always appended automatically as regression tests)
regression_artifact_github="artifacts/comprehensive-demo-simple-diff.md"
regression_artifact_azdo="artifacts/comprehensive-demo.md"

# Validate freshness of all provided feature reports
log_info "Validating artifact freshness..."
for i in "${!report_files[@]}"; do
  check_artifact_freshness "${report_files[$i]}" || exit 1
done

# Validate freshness of comprehensive demo artifacts (used for regression)
if [[ "$platform" == "both" || "$platform" == "github" ]]; then
  if [[ -f "$regression_artifact_github" ]]; then
    check_artifact_freshness "$regression_artifact_github" || exit 1
  else
    log_warn "Regression artifact not found: $regression_artifact_github (will be skipped)"
  fi
fi
if [[ "$platform" == "both" || "$platform" == "azdo" ]]; then
  if [[ -f "$regression_artifact_azdo" ]]; then
    check_artifact_freshness "$regression_artifact_azdo" || exit 1
  else
    log_warn "Regression artifact not found: $regression_artifact_azdo (will be skipped)"
  fi
fi

log_info "Feature reports: ${#report_files[@]}"
for i in "${!report_files[@]}"; do
  log_info "  Report $((i+1)): ${report_files[$i]}"
done
log_info "Regression artifacts: $regression_artifact_github (GitHub), $regression_artifact_azdo (AzDO)"

timestamp="$(date -u +%Y%m%d%H%M%S)"
# Create a unique, safe UAT branch name in the UAT repositories (not this repo).
safe_original="${original_branch//\//-}"
uat_branch="uat/${safe_original}-uat-${timestamp}"

gh_pr=""
azdo_pr=""
gh_url=""
azdo_url=""

print_pr_links_block() {
  echo ""
  echo "UAT PR links (copy/paste):"
  if [[ -n "${gh_url:-}" ]]; then
    echo "  GitHub: ${gh_url}"
  fi
  if [[ -n "${azdo_url:-}" ]]; then
    echo "  Azure DevOps: ${azdo_url}"
  fi
  echo ""
}

uat_submodule_github="${UAT_GITHUB_SUBMODULE_PATH:-$uat_submodule_github_default}"
uat_submodule_azdo="${AZDO_SUBMODULE_PATH:-$uat_submodule_azdo_default}"

uat_submodule_github_head_before="$(get_submodule_head "$uat_submodule_github")"
uat_submodule_azdo_head_before="$(get_submodule_head "$uat_submodule_azdo")"

# Set up credentials in this process so env var changes (GH_TOKEN, AZURE_DEVOPS_EXT_PAT)
# propagate to all subsequent subprocess calls (uat-github.sh, uat-azdo.sh).
if [[ "$platform" == "both" || "$platform" == "github" ]]; then
  ensure_github_credential_helper || exit 1
fi
if [[ "$platform" == "both" || "$platform" == "azdo" ]]; then
  ensure_azdo_credential_helper "$uat_submodule_azdo" || exit 1
fi

if [[ "$platform" == "both" || "$platform" == "github" ]]; then
  log_info "Creating GitHub UAT PR..."
  # Create PR using the first feature report and its instructions
  gh_out="$(scripts/uat-github.sh create "${report_files[0]}" "${report_instructions[0]}" --branch "$uat_branch" | cat)"
  gh_pr="$(echo "$gh_out" | grep -oE 'PR created: #[0-9]+' | grep -oE '[0-9]+' | tail -n 1)"
  gh_url="$(echo "$gh_out" | grep -oE 'PR created: #[0-9]+ \((.*)\)' | sed -E 's/.*PR created: #[0-9]+ \((.*)\)/\1/' | tail -n 1)"
  if [[ -z "$gh_pr" ]]; then
    log_error "Failed to parse GitHub PR number from output."
    exit 1
  fi
  log_info "GitHub PR: #$gh_pr ($gh_url)"

  # Post additional feature reports (each with its own test instructions)
  for i in "${!report_files[@]}"; do
    if [[ $i -gt 0 ]]; then
      log_info "Adding feature report $((i+1)) to GitHub PR..."
      scripts/uat-github.sh comment "$gh_pr" "${report_files[$i]}" --instructions "${report_instructions[$i]}"
    fi
  done

  # Always append the comprehensive demo as a regression test comment
  if [[ -f "$regression_artifact_github" ]]; then
    log_info "Adding comprehensive demo (regression test) to GitHub PR..."
    scripts/uat-github.sh comment "$gh_pr" "$regression_artifact_github"
  fi
fi

if [[ "$platform" == "both" || "$platform" == "azdo" ]]; then
  log_info "Ensuring Azure DevOps setup..."
  scripts/uat-azdo.sh setup

  log_info "Creating Azure DevOps UAT PR..."
  # Create PR using the first feature report and its instructions
  azdo_out="$(scripts/uat-azdo.sh create "${report_files[0]}" "${report_instructions[0]}" --branch "$uat_branch" | cat)"
  azdo_pr="$(echo "$azdo_out" | grep -oE 'PR created: #[0-9]+' | grep -oE '[0-9]+' | tail -n 1)"
  azdo_url="$(echo "$azdo_out" | grep -oE 'PR created: #[0-9]+ \((.*)\)' | sed -E 's/.*PR created: #[0-9]+ \((.*)\)/\1/' | tail -n 1)"
  if [[ -z "$azdo_pr" ]]; then
    log_error "Failed to parse Azure DevOps PR id from output."
    exit 1
  fi
  log_info "Azure DevOps PR: #$azdo_pr ($azdo_url)"

  # Post additional feature reports (each with its own test instructions)
  for i in "${!report_files[@]}"; do
    if [[ $i -gt 0 ]]; then
      log_info "Adding feature report $((i+1)) to Azure DevOps PR..."
      scripts/uat-azdo.sh comment "$azdo_pr" "${report_files[$i]}" --instructions "${report_instructions[$i]}"
    fi
  done

  # Always append the comprehensive demo as a regression test comment
  if [[ -f "$regression_artifact_azdo" ]]; then
    log_info "Adding comprehensive demo (regression test) to Azure DevOps PR..."
    scripts/uat-azdo.sh comment "$azdo_pr" "$regression_artifact_azdo"
  fi
fi

print_pr_links_block

if [[ "$create_only" == "true" ]]; then
  mkdir -p "$(dirname "$state_file")"
  jq -n \
    --arg original_branch "$original_branch" \
    --arg uat_branch "$uat_branch" \
    --arg platform "$platform" \
    --arg uat_submodule_github "$uat_submodule_github" \
    --arg uat_submodule_github_head_before "$uat_submodule_github_head_before" \
    --arg uat_submodule_azdo "$uat_submodule_azdo" \
    --arg uat_submodule_azdo_head_before "$uat_submodule_azdo_head_before" \
    --arg gh_pr "$gh_pr" \
    --arg gh_url "${gh_url:-}" \
    --arg azdo_pr "$azdo_pr" \
    --arg azdo_url "${azdo_url:-}" \
    '{
      original_branch: $original_branch,
      uat_branch: $uat_branch,
      platform: $platform,
      submodules: {
        github: { path: $uat_submodule_github, head: $uat_submodule_github_head_before },
        azdo: { path: $uat_submodule_azdo, head: $uat_submodule_azdo_head_before }
      },
      github: { pr: $gh_pr, url: $gh_url },
      azdo: { pr: $azdo_pr, url: $azdo_url }
    }' > "$state_file"

  log_info "Create-only complete. State saved to: $state_file"
  echo ""
  echo "Next steps:"
  echo "  1. Review the PR(s) in the browser"
  echo "  2. Decide PASS/FAIL (record decision in chat)"
  echo "  3. Cleanup when ready: $0 --cleanup-last"
  exit 0
fi

poll_interval_seconds=15
timeout_seconds=$((60 * 60))
start_epoch="$(date +%s)"

while true; do
  now_epoch="$(date +%s)"
  elapsed=$((now_epoch - start_epoch))
  if [[ $elapsed -gt $timeout_seconds ]]; then
    log_error "Timed out waiting for approval after $elapsed seconds."
    log_error "Check the PR comments for feedback and re-run once resolved."
    exit 1
  fi

  gh_ok=0
  azdo_ok=0

  if [[ -n "$gh_pr" ]]; then
    scripts/uat-github.sh poll "$gh_pr" && gh_ok=1 || {
      rc=$?
      if [[ $rc -eq 2 ]]; then
        log_error "UAT FAILED: Negative feedback or rejection detected on GitHub (PR #$gh_pr)."
        exit 1
      fi
      gh_ok=0
    }
  else
    gh_ok=1
  fi

  if [[ -n "$azdo_pr" ]]; then
    scripts/uat-azdo.sh poll "$azdo_pr" && azdo_ok=1 || {
      rc=$?
      if [[ $rc -eq 2 ]]; then
        log_error "UAT FAILED: Negative feedback or rejection detected on Azure DevOps (PR #$azdo_pr)."
        exit 1
      fi
      azdo_ok=0
    }
  else
    azdo_ok=1
  fi

  if [[ $gh_ok -eq 1 && $azdo_ok -eq 1 ]]; then
    log_info "UAT approved on selected platform(s)."
    break
  fi

  sleep "$poll_interval_seconds"
done

log_info "Cleaning up UAT PRs..."
if [[ -n "$gh_pr" ]]; then
  scripts/uat-github.sh cleanup "$gh_pr"
fi

if [[ -n "$azdo_pr" ]]; then
  scripts/uat-azdo.sh cleanup "$azdo_pr"
fi

log_info "Deleting remote branch: $uat_branch"
if [[ "$platform" == "both" || "$platform" == "github" ]]; then
  if [[ -e "$uat_submodule_github/.git" ]]; then
    git -C "$uat_submodule_github" push origin --delete "$uat_branch" >/dev/null 2>&1 || log_warn "Failed to delete GitHub UAT branch '$uat_branch' (may already be deleted)."
  fi
fi
if [[ "$platform" == "both" || "$platform" == "azdo" ]]; then
  if [[ -e "$uat_submodule_azdo/.git" ]]; then
    ensure_azdo_credential_helper "$uat_submodule_azdo"
    git -C "$uat_submodule_azdo" push origin --delete "$uat_branch" >/dev/null 2>&1 || log_warn "Failed to delete AzDO UAT branch '$uat_branch' (may already be deleted)."
  fi
fi

log_info "UAT run complete."
