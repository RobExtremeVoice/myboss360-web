# People Intelligence Engine

Sprint 20C adds the **People Intelligence Engine** — a deterministic, source-unified layer that merges CRM contacts, Gmail contacts, and Calendar attendees into scored relationship profiles.

---

## Architecture

```
Source Data
  └─ CRM contacts (job title, company, deal association)
  └─ Gmail contacts (email frequency, first/last seen)
  └─ Calendar events (meeting attendance via attendees array)
        │
        ▼
people-engine.ts — merge + score + classify (in-memory, no LLM)
        │
        ├─ IntelligenceContext.peopleIntelligence (context assembly)
        ├─ GET /api/people             (list profiles)
        ├─ GET /api/people/[id]        (single profile by email)
        ├─ GET /api/people/insights    (categorized insights)
        └─ Dashboard widgets (5 panels)
```

### Key files

| Purpose | File |
|---|---|
| Merge + scoring engine | `services/people/people-engine.ts` |
| High-level service factory | `services/people/people-service.ts` |
| Profile repository | `repositories/people/people-profiles.ts` |
| Interaction repository | `repositories/people/people-interactions.ts` |
| Type definitions | `types/people.ts` |
| Scoring config | `config/people.ts` |
| Migration | `supabase/migrations/20260701000008_people_intelligence.sql` |

---

## Data Model

Five tables (all workspace + organization scoped, RLS enabled):

| Table | Purpose |
|---|---|
| `people_profiles` | Unified person entity, deduplicated by `(workspace_id, email)` |
| `people_relationships` | Executive ↔ person relationship metadata per context |
| `people_interactions` | Individual interaction events (email, meeting, CRM activity) |
| `people_signals` | Intelligence signals (going cold, champion detected, etc.) |
| `people_scores` | Score snapshots for trend analysis |

---

## Merge Strategy

Deduplication key: **email address** (case-insensitive, per workspace).

Source priority for name and job title: **CRM > Gmail > Calendar**.

Sources are collected additively — a profile may have `sources: ['crm', 'gmail', 'calendar']`.

---

## Scoring Algorithms

All scores are integers 0–100 computed deterministically (no LLM).

### Relationship Strength

| Component | Points |
|---|---|
| Last interaction < 7 days | +25 |
| Last interaction < 30 days | +15 |
| Last interaction < 90 days | +5 |
| Both inbound AND outbound emails | +20 |
| Email frequency (`email_count × 2.5`, max 25) | 0–25 |
| Meeting attendance (`meeting_count × 10`, max 20) | 0–20 |
| Associated with an active deal | +10 |

### Engagement Score

| Component | Points |
|---|---|
| Email frequency (`email_count × 5`, max 50) | 0–50 |
| Meeting frequency (`meeting_count × 10`, max 30) | 0–30 |
| Last interaction < 7 days | +20 |

### Influence Score

| Component | Points |
|---|---|
| Base | 20 |
| C-suite title (CEO, CTO, CFO, President, Founder, etc.) | +40 |
| Senior title (VP, Director, Head, Partner, Principal) | +25 |
| Mid-level title (Manager, Lead) | +10 |
| Active deal association | +20 |
| Email volume (`email_count × 2`, max 20) | 0–20 |

---

## Classification

| Flag | Criteria |
|---|---|
| `is_champion` | relationship_strength ≥ 70 AND engagement_score ≥ 60 AND last interaction ≤ 30 days |
| `is_decision_maker` | job title contains C-suite / VP / Director keywords |
| `is_stale` | last interaction > 30 days AND has at least 1 email or meeting on record |
| `is_new_relationship` | first interaction < 14 days ago |
| `awaiting_reply` | email appears in a Gmail thread with status `waiting_for_me` |

---

## API Endpoints

### `GET /api/people`

Returns all scored profiles for the current workspace.

**Query params:** `?workspaceId=<uuid>` (optional, defaults to first workspace)

**Response:**
```json
{
  "profiles": [
    {
      "id": "virtual:alice@acme.com",
      "email": "alice@acme.com",
      "fullName": "Alice Johnson",
      "jobTitle": "VP of Sales",
      "companyName": "Acme Corp",
      "sources": ["crm", "gmail"],
      "relationshipStrength": 82,
      "engagementScore": 75,
      "influenceScore": 65,
      "isChampion": true,
      "isDecisionMaker": true,
      "isStale": false,
      "isNewRelationship": false,
      "emailCount": 14,
      "meetingCount": 3,
      "lastInteractionAt": "2026-06-28T09:00:00Z",
      "awaitingReply": false
    }
  ],
  "total": 42
}
```

### `GET /api/people/[id]`

Returns a single profile. The `[id]` segment is the URL-encoded email address.

### `GET /api/people/insights`

Returns categorized people intelligence.

**Response:**
```json
{
  "totalProfiles": 42,
  "champions": [...],
  "decisionMakers": [...],
  "topRelationships": [...],
  "staleRelationships": [...],
  "newRelationships": [...],
  "awaitingReply": [...],
  "needingFollowUp": [...],
  "sourceCounts": { "crm": 18, "gmail": 38, "calendar": 12 }
}
```

---

## Dashboard Widgets

Five widgets appear in the "People Intelligence" section (below Executive Intelligence):

| Widget | Data source |
|---|---|
| Top Relationships | `context.peopleIntelligence.topRelationships` |
| Champions | `context.peopleIntelligence.champions` |
| Decision Makers | `context.peopleIntelligence.decisionMakers` |
| New Relationships | `context.peopleIntelligence.newRelationships` |
| Going Cold | `context.peopleIntelligence.staleRelationships` |

All widgets show a graceful empty state when no data is available.

---

## AI Prompt Integration

The prompt builder (`services/ai/prompt-builder.ts`) includes a `--- PEOPLE INTELLIGENCE ---` section in the system prompt when the intelligence context contains people data. The section covers top relationships, champions, decision makers, going-cold contacts, and awaiting-reply contacts — providing the AI assistant with relationship context for better answers.

---

## Configuration

`config/people.ts` controls all thresholds:

| Key | Default | Description |
|---|---|---|
| `staleRelationshipDays` | 30 | Days without interaction → stale |
| `newRelationshipDays` | 14 | Days since first interaction → new |
| `championMinRelationshipStrength` | 70 | Minimum strength for champion |
| `championMinEngagementScore` | 60 | Minimum engagement for champion |
| `scoringWindowDays` | 90 | Lookback window for calendar events |
| `maxPeoplePerCategory` | 10 | Max profiles per insight category |
| `minEmailsForTopRelationship` | 2 | Min email count to appear in top relationships |

---

## Known Limitations

- **No write to `people_profiles`**: The v1 engine computes scores on-the-fly from source tables on every request. The `people_profiles` table exists as a persistent store for future background scoring jobs.
- **Meeting count is workspace-wide**: Calendar attendees are counted from all calendar events in the workspace, not just events where the executive is the organizer.
- **Awaiting reply detection**: A contact is flagged as `awaiting_reply` if their email appears in any thread participant list where `response_status = 'waiting_for_me'`. This is an approximation — it does not distinguish whether the executive's reply is owed to that specific contact.
- **Outbound email count**: The Gmail contacts table provides a total `message_count` per contact. The engine treats this as inbound for now. True directional split (inbound vs. outbound) would require querying `gmail_messages.is_outbound` per contact — available in a future scoring pass.
- **Self-exclusion**: The executive's own email is excluded when the user email is passed to the engine. When called from the intelligence service without a user email (for context assembly), no self-exclusion occurs.
