#!/usr/bin/env bash
# create-milestones.sh — Create MyBoss360 GitHub milestones
# Usage: bash scripts/create-milestones.sh [--repo OWNER/REPO]
set -euo pipefail

REPO="${REPO:-$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || echo '')}"
if [[ -z "$REPO" ]]; then
  echo "ERROR: Could not detect repo. Set REPO=owner/repo or run from repo root." >&2
  exit 1
fi

echo "Creating milestones on: $REPO"
echo ""

create_milestone() {
  local title="$1" due_date="$2" desc="$3"
  local payload
  payload=$(printf '{"title":%s,"due_on":%s,"description":%s}' \
    "$(echo -n "$title" | jq -Rs .)" \
    "$(echo -n "${due_date}T23:59:59Z" | jq -Rs .)" \
    "$(echo -n "$desc" | jq -Rs .)")

  local result
  result=$(gh api "repos/$REPO/milestones" \
    --method POST \
    --input - <<< "$payload" 2>&1) || true

  if echo "$result" | grep -q '"number"'; then
    local number
    number=$(echo "$result" | grep -o '"number":[0-9]*' | head -1 | grep -o '[0-9]*')
    echo "  ✓ Created: $title (milestone #$number) — due $due_date"
  elif echo "$result" | grep -qi "already_exists\|already exists"; then
    echo "  ↻ Already exists: $title"
  else
    echo "  ✗ Failed: $title"
    echo "    $result" | head -3
  fi
}

echo "── v1.2 — Connected Executive ──────────────────────────"
create_milestone \
  "v1.2 — Connected Executive" \
  "2026-09-15" \
  "Google Calendar, Gmail, Contacts, Drive integration. Executive Agenda view."

echo ""
echo "── v1.3 — Knowledge Intelligence ──────────────────────"
create_milestone \
  "v1.3 — Knowledge Intelligence" \
  "2026-11-30" \
  "Embeddings, pgvector, semantic search, hybrid RAG, AI context injection."

echo ""
echo "── v1.4 — Executive Automation ─────────────────────────"
create_milestone \
  "v1.4 — Executive Automation" \
  "2027-02-28" \
  "Workflow Engine, Automation Builder, Approval Engine, notifications."

echo ""
echo "── v1.5 — Executive Voice ──────────────────────────────"
create_milestone \
  "v1.5 — Executive Voice" \
  "2027-05-31" \
  "Voice assistant, STT, TTS, streaming pipeline, wake word."

echo ""
echo "── v2.0 — Multi-Agent System ───────────────────────────"
create_milestone \
  "v2.0 — Multi-Agent System" \
  "2027-09-30" \
  "Executive Agent, Sales Agent, Finance Agent, Operations Agent, Knowledge Graph."

echo ""
echo "✓ All milestones provisioned on $REPO"
echo ""
echo "View milestones: https://github.com/$REPO/milestones"
