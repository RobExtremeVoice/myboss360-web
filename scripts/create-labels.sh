#!/usr/bin/env bash
# create-labels.sh — Provision all MyBoss360 GitHub labels
# Usage: bash scripts/create-labels.sh [--repo OWNER/REPO]
set -euo pipefail

REPO="${REPO:-$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || echo '')}"
if [[ -z "$REPO" ]]; then
  echo "ERROR: Could not detect repo. Set REPO=owner/repo or run from repo root." >&2
  exit 1
fi

echo "Creating labels on: $REPO"
echo ""

create_label() {
  local name="$1" color="$2" desc="$3"
  if gh label create "$name" --color "$color" --description "$desc" --repo "$REPO" 2>/dev/null; then
    echo "  ✓ Created: $name"
  elif gh label edit "$name" --color "$color" --description "$desc" --repo "$REPO" 2>/dev/null; then
    echo "  ↻ Updated: $name"
  else
    echo "  ✗ Failed:  $name"
  fi
}

echo "── Type Labels ─────────────────────────────────────────"
create_label "feature"       "0075ca" "New capability or enhancement"
create_label "bug"           "d73a4a" "Confirmed defect or regression"
create_label "task"          "e4e669" "Infrastructure, refactor, or tooling work"
create_label "epic"          "0052cc" "Large body of work spanning multiple issues"
create_label "research"      "c5def5" "Time-boxed investigation / spike"
create_label "documentation" "0075ca" "Documentation only"
create_label "security"      "b60205" "Security vulnerability or hardening"
create_label "chore"         "ededed" "Dependency updates, housekeeping"
create_label "test"          "bfd4f2" "Test additions or fixes only"
create_label "release"       "0e8a16" "Release preparation or changelog"

echo ""
echo "── Domain Labels ───────────────────────────────────────"
create_label "ai"             "7B68EE" "AI assistant, providers, or inference"
create_label "knowledge"      "8B4513" "Knowledge Engine, documents, chunking"
create_label "calendar"       "1a73e8" "Google Calendar integration"
create_label "gmail"          "ea4335" "Google Gmail integration"
create_label "contacts"       "34a853" "Google Contacts integration"
create_label "drive"          "fbbc04" "Google Drive integration"
create_label "crm"            "ff6d00" "CRM (companies, contacts, deals)"
create_label "automation"     "ff9900" "Workflow Engine and Automation Builder"
create_label "approval"       "f9a825" "Approval Engine"
create_label "voice"          "00c853" "Voice assistant, STT, TTS"
create_label "embeddings"     "aa00ff" "Vector embeddings"
create_label "vector-search"  "6200ea" "pgvector and semantic search"
create_label "rag"            "4a148c" "Retrieval-Augmented Generation"
create_label "agents"         "1b5e20" "Multi-agent system"
create_label "onboarding"     "01579b" "User onboarding flow"
create_label "auth"           "880e4f" "Authentication and authorization"
create_label "database"       "3e2723" "Schema, migrations, RLS"
create_label "api"            "006064" "REST API routes"
create_label "ui"             "f3e5f5" "Frontend and UI components"
create_label "integrations"   "e8f5e9" "Third-party integrations"

echo ""
echo "── Priority Labels ─────────────────────────────────────"
create_label "high-priority"   "b60205" "Must ship in current sprint"
create_label "medium-priority" "ff9900" "Important, planned for near-term sprint"
create_label "low-priority"    "cfd3d7" "Nice-to-have, no hard deadline"

echo ""
echo "── Sprint Labels ───────────────────────────────────────"
create_label "sprint-20" "1d76db" "Sprint 20 - Google Workspace"
create_label "sprint-21" "0052cc" "Sprint 21 - Knowledge Intelligence"
create_label "sprint-22" "0075ca" "Sprint 22 - Executive Automation"
create_label "sprint-23" "006b75" "Sprint 23 - Executive Voice"
create_label "sprint-24" "5319e7" "Sprint 24 - Multi-Agent System"

echo ""
echo "── Release Labels ──────────────────────────────────────"
create_label "v1.2" "c2e0c6" "Target release: v1.2 Connected Executive"
create_label "v1.3" "bfd4f2" "Target release: v1.3 Knowledge Intelligence"
create_label "v1.4" "fef2c0" "Target release: v1.4 Executive Automation"
create_label "v1.5" "f9d0c4" "Target release: v1.5 Executive Voice"
create_label "v2.0" "e6b8a2" "Target release: v2.0 Multi-Agent System"

echo ""
echo "── Workflow Labels ─────────────────────────────────────"
create_label "good-first-issue" "7057ff" "Suitable for new contributors"
create_label "help-wanted"      "008672" "Looking for contributors"
create_label "blocked"          "d93f0b" "Cannot proceed - dependency unresolved"
create_label "in-progress"      "0e8a16" "Actively being worked on"
create_label "needs-review"     "fbca04" "Awaiting code review"
create_label "needs-design"     "c5def5" "Awaiting design input"
create_label "on-hold"          "ededed" "Intentionally paused"
create_label "wontfix"          "ffffff" "Will not be fixed or implemented"
create_label "duplicate"        "cfd3d7" "Duplicate of an existing issue"
create_label "invalid"          "e4e669" "Does not meet issue quality bar"

echo ""
echo "── Special Labels ──────────────────────────────────────"
create_label "technical-debt"  "ffd700" "Known code quality issue to be addressed"
create_label "performance"     "ff6d00" "Latency, throughput, or resource usage"
create_label "breaking-change" "b60205" "Changes a public API or contract"
create_label "migration"       "5319e7" "Requires database migration"
create_label "infrastructure"  "006b75" "CI/CD, deployment, hosting changes"
create_label "compliance"      "880e4f" "SOC 2, GDPR, HIPAA-related work"
create_label "enterprise"      "0052cc" "Enterprise-tier feature"

echo ""
echo "✓ All labels provisioned on $REPO"
