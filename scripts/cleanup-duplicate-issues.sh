#!/usr/bin/env bash
# cleanup-duplicate-issues.sh — Delete all GitHub issues with number > 82
# Keeps #1–#82 untouched. Idempotent: safe to re-run.
# Usage: bash scripts/cleanup-duplicate-issues.sh
set -euo pipefail

REPO="${REPO:-$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || echo '')}"
if [[ -z "$REPO" ]]; then
  echo "ERROR: Could not detect repo. Set REPO=owner/repo or run from repo root." >&2
  exit 1
fi

echo "Repository: $REPO"
echo "Fetching all issues with number > 82..."
echo ""

# List all issues (open + closed), filter to number > 82, sort ascending
ISSUES=$(gh issue list \
  --repo "$REPO" \
  --state all \
  --limit 9999 \
  --json number \
  --jq '[.[] | select(.number > 82) | .number] | sort | .[]' 2>/dev/null || echo "")

if [[ -z "$ISSUES" ]]; then
  echo "No duplicate issues found."
  echo ""
  REMAINING=$(gh issue list --repo "$REPO" --state all --limit 9999 --json number --jq '[.[] | .number] | length' 2>/dev/null || echo "unknown")
  echo "Remaining issues:  $REMAINING"
  echo "Deleted issues:    0"
  echo "Failed deletions:  0"
  exit 0
fi

DELETED=0
FAILED=0

while IFS= read -r NUMBER; do
  if gh issue delete "$NUMBER" --repo "$REPO" --yes 2>/dev/null; then
    echo "  Deleted #$NUMBER"
    DELETED=$((DELETED + 1))
  else
    echo "  Failed  #$NUMBER"
    FAILED=$((FAILED + 1))
  fi
  sleep 0.5
done <<< "$ISSUES"

echo ""
REMAINING=$(gh issue list --repo "$REPO" --state all --limit 9999 --json number --jq '[.[] | .number] | length' 2>/dev/null || echo "unknown")

echo "Remaining issues:  $REMAINING"
echo "Deleted issues:    $DELETED"
echo "Failed deletions:  $FAILED"
