# Executive Experience Layer — Demo Guide

Sprint 20.5 adds the **Executive Experience Layer** on top of the Gmail Intelligence Engine (Sprint 20B). This document covers architecture, demo flow, endpoints, setup, and known limitations.

---

## Architecture Overview

All intelligence flows through the **Executive Context**, assembled by `createIntelligenceService`. Every feature in this sprint reads from that single source rather than querying business tables directly.

```
Executive Sources
  └─ Gmail (threads, contacts, follow-ups)
  └─ Calendar (events, today agenda)
  └─ CRM (deals, contacts, tasks, companies)
  └─ Memory (observations, decisions, insights)
  └─ Learning (signals, patterns, recommendations)
  └─ Knowledge (documents, chunks)
        │
        ▼
createIntelligenceService.getIntelligenceContext()
   → IntelligenceContext (types/intelligence.ts)
        │
        ├─ Dashboard widgets (8 panels)
        ├─ /api/executive/briefing
        ├─ /api/executive/health
        └─ AI Assistant (Boss Intelligence Panel + Prompt Preview)
```

### Key files

| Purpose | File |
|---|---|
| Intelligence aggregator | `services/intelligence/intelligence-service.ts` |
| Executive types (briefing, health) | `types/executive.ts` |
| Health diagnostics | `services/executive/executive-health-service.ts` |
| Dashboard page | `app/(dashboard)/dashboard/page.tsx` |
| AI assistant page | `app/(dashboard)/dashboard/ai-assistant/page.tsx` |
| AI assistant layout | `app/(dashboard)/dashboard/ai-assistant/AIAssistantLayout.tsx` |

---

## Part 1 — Executive Overview Dashboard Widgets

Eight widgets are rendered on the dashboard page when `IntelligenceContext` is available. They appear as a grid section between the KPI cards and the existing executive sections.

| Widget | Data source |
|---|---|
| Today's Meetings | `context.todayAgenda` (type: meeting) |
| Needs Your Attention | `context.learningSignals` (severity: critical/warning) |
| Waiting For Your Reply | `context.emailIntelligence.awaitingReplies` |
| Critical Customers | `context.emailIntelligence.criticalThreads` + `topRisks` |
| High Priority Emails | `context.emailIntelligence.highPriorityThreads` |
| Recent Memories | `context.recentMemories` |
| Recommendations | `context.activeRecommendations` |
| Knowledge Updates | `knowledge_documents` table (recent 10) |

All widgets show a graceful empty state when no data is available. The entire widget section is hidden when the intelligence context cannot be loaded (e.g., no workspace).

---

## Part 2 — Executive Daily Briefing

**Endpoint:** `GET /api/executive/briefing`

**Query params:** `?workspaceId=<uuid>` (optional; defaults to first workspace)

**Authentication:** Requires a valid session cookie (same-origin).

**Response shape** (`types/executive.ts → ExecutiveBriefing`):

```json
{
  "generatedAt": "2026-07-01T12:00:00Z",
  "executive": { "name": "Jane Smith", "email": "jane@company.com", "workspaceId": "..." },
  "calendar": { "todayMeetings": [...], "upcomingMeetingCount": 4 },
  "gmail": {
    "awaitingReplies": [...],
    "criticalThreads": [...],
    "highPriorityThreads": [...],
    "overdueFollowUps": [...],
    "totalThreadsInContext": 12
  },
  "crm": { "pipelineValue": 890000, "activeDeals": 4, "atRiskDeals": 2, "overdueTasks": 3 },
  "memory": { "recent": [...], "count": 24 },
  "learning": { "signals": [...], "signalCount": 4, "patternCount": 2 },
  "knowledge": { "documentCount": 4, "recentDocuments": [...] },
  "recommendations": [...],
  "topRisks": [...],
  "topOpportunities": [...]
}
```

---

## Part 3 — Boss Intelligence Panel

Located inside the AI Assistant (`/dashboard/ai-assistant`), in the right panel below the existing "Live context" card.

Shows:
- **Sources** — Google connection status, Gmail scope
- **Intelligence counts** — Memories, Knowledge docs, Active signals, Recommendations, Awaiting replies
- **Last sync** — Gmail and Calendar last sync timestamps (relative time)

Data is fetched server-side in `ai-assistant/page.tsx` and serialized as `BossIntelligenceSummary` (see `types/executive.ts`).

---

## Part 4 — Executive Health

**Endpoint:** `GET /api/executive/health`

**Query params:** `?workspaceId=<uuid>` (optional)

**Response:** Returns HTTP 200 for `healthy`/`degraded`, 503 for `critical`.

**Checks performed:**

| Check | Healthy | Degraded |
|---|---|---|
| `connections` | Google connected, both scopes | Not connected or missing scope |
| `calendarSync` | Last sync < 6h ago | Last sync > 6h ago or never synced |
| `gmailSync` | Last sync < 6h ago | Last sync > 6h ago or never synced |
| `memory` | At least 1 memory | No memories |
| `learning` | At least 1 signal or pattern | Empty |
| `knowledge` | At least 1 document | No documents |
| `recommendations` | Any recommendations | None |

**Overall status logic:**
- `critical` — any check returns `error`
- `degraded` — any check returns `warn`
- `healthy` — all checks are `ok` or `empty`

---

## Part 5 — Demo Dataset

```bash
# Install dependencies first
pnpm install

# Run the seed script (requires env vars)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
bun scripts/demo/seed-executive-demo.ts \
  --workspace-id <workspace-uuid> \
  --organization-id <org-uuid> \
  --user-id <user-uuid>
```

**Seeded data:**
- 5 companies (Acme Corp, Global Ventures, TechForward, Meridian Health, Northstar Capital)
- 6 contacts with realistic job titles and emails
- 5 deals across all pipeline stages ($80K–$350K)
- 6 tasks (some overdue, some upcoming)
- 4 calendar events (today + next 48h)
- 6 memories (decisions, observations, insights)
- 4 learning signals (critical, warning, info)
- 4 recommendations (action, warning, opportunity, insight)
- 4 knowledge documents

**Note:** The seed script uses the Supabase service-role key and bypasses RLS. Never run it with production credentials in an automated CI pipeline.

---

## Part 6 — Developer Prompt Preview

Available only when `NODE_ENV !== "production"`. Visible in the AI Assistant right panel as a collapsible "Dev: Prompt Preview" section with an amber border.

Shows:
- Estimated token count (characters ÷ 4)
- Memory count, signal count, recommendation count
- Active source labels (Gmail, Calendar, Memory, etc.)
- Full system prompt in a readonly textarea

---

## Setup

### Prerequisites
1. Supabase project with all Sprint 20B migrations applied
2. Google OAuth configured (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`)
3. Gmail and Calendar scopes authorized for at least one workspace user

### Environment variables
```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...   # server-only
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Demo flow
1. Register and complete onboarding to create a workspace
2. Connect Google account via `/dashboard/settings`
3. Trigger Gmail sync: `POST /api/gmail/sync`
4. Run the seed script to populate realistic demo data
5. Visit `/dashboard` to see all 8 intelligence widgets
6. Visit `/dashboard/ai-assistant` to see the Boss Intelligence Panel
7. Call `GET /api/executive/briefing` to inspect the unified briefing
8. Call `GET /api/executive/health` to check system health

---

## Known Limitations

- **Knowledge Updates widget** counts only the most recent 10 documents returned by the dashboard page query; it does not reflect the true total document count across all collections.
- **BossIntelligencePanel** memory count shows `context.recentMemories.length` (capped by the intelligence service limit of 50), not the true database total.
- **Token estimate** in the Prompt Preview uses characters ÷ 4, which is accurate for GPT-4 / Claude tokenizers but will vary for other models.
- **Seed script upserts** use `name` for companies and `email` for contacts as conflict targets; running the script twice on the same workspace updates existing rows rather than duplicating them.
- **Health check** does not distinguish between a workspace that has never synced vs. one where sync failed — both report `never` status for the relevant sync check.
