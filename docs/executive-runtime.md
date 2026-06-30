# Executive Intelligence Runtime

## Overview

Sprint 16 adds the **Executive Intelligence Runtime** — the layer that transforms MyBoss360 from a traditional SaaS into a **Living Executive Operating System**. This runtime runs entirely on structured data (no LLM calls, no external API dependencies) and assembles a rich intelligence context from signals, patterns, memories, and recommendations already stored in the database.

---

## Architecture

```
GET /api/intelligence/context
        ↓
IntelligenceService.getIntelligenceContext()
        ├── IntelligenceRepository.getWorkspaceSnapshot()   ← live DB aggregation
        ├── MemoryService.getExecutiveContext()             ← Memory Engine (Sprint 15.5)
        ├── LearningService.listRecommendations()           ← Learning Engine (Sprint 15.5)
        └── learning_signals (raw query)                    ← recent unresolved signals
                ↓
        IntelligenceContext (typed JSON payload)
        ├── executiveMetrics
        ├── recentMemories
        ├── activeRecommendations
        ├── learningSignals
        ├── topRisks
        ├── topOpportunities
        ├── todayAgenda
        └── importantTasks
```

### How signals enter the system

1. **Event-driven (CRM hooks):** When a deal is created or updated, `emitDealSignals()` runs fire-and-forget in the CRM service. If the deal is approaching its close date or has low probability in a late stage, a `deal_risk` signal is stored.

2. **Service hooks:** `TaskService`, `ProjectService`, and `CalendarService` call the appropriate signal emitter after create/update. Tasks past due → `task_delay`. At-risk projects → `recurring_bottleneck`. Imminent calendar events → `recommended_action`.

3. **Full workspace scan:** `scanWorkspaceSignals()` can be called on a schedule (e.g., daily Supabase Edge Function) to scan all workspace data at once and emit any signals not yet captured by event hooks.

4. **Advanced pattern detection:** `detectAdvancedPatterns()` queries raw database tables to find multi-entity patterns (stalled pipeline, follow-up gap, revenue trend) and persists them via the Learning Engine.

---

## Files Created / Modified

### New files

| File | Purpose |
|---|---|
| `types/intelligence.ts` | IntelligenceContext, ExecutiveRisk, ExecutiveOpportunity, ExecutiveMetrics, TodayAgendaItem, ImportantTask |
| `config/intelligence.ts` | Thresholds, stage lists, max-item limits |
| `repositories/intelligence/intelligence-repo.ts` | Cross-table DB aggregation for workspace snapshot |
| `repositories/intelligence/index.ts` | Barrel export |
| `services/intelligence/signal-engine.ts` | `emitDealSignals`, `emitTaskSignals`, `emitProjectSignals`, `scanWorkspaceSignals` |
| `services/intelligence/pattern-detector.ts` | `detectAdvancedPatterns` — multi-entity heuristic pattern detection |
| `services/intelligence/recommendation-engine.ts` | `generateRecommendations`, `extractTopRisks`, `extractTopOpportunities` |
| `services/intelligence/intelligence-service.ts` | `createIntelligenceService` — orchestrator service |
| `app/api/intelligence/context/route.ts` | `GET /api/intelligence/context` — returns IntelligenceContext JSON |
| `services/tasks/task-service.ts` | Task CRUD + signal hooks |
| `services/projects/project-service.ts` | Project CRUD + signal hooks |
| `services/calendar/calendar-service.ts` | Calendar event CRUD + signal hooks |

### Modified files

| File | Change |
|---|---|
| `services/crm/crm-service.ts` | Added fire-and-forget `emitDealSignals` hooks in `createDeal` and `updateDeal` |
| `repositories/index.ts` | Added `export * from './intelligence'` |

---

## API — `/api/intelligence/context`

**Method:** `GET`  
**Auth:** Session cookie required (returns 401 if unauthenticated)  
**Query params:** `?workspaceId=<uuid>` (optional; defaults to user's first workspace)

**Response shape:**

```typescript
{
  workspaceId: string
  organizationId: string
  executiveMetrics: {
    totalPipelineValue: number
    activeDeals: number
    overdueTasksCount: number
    atRiskDealsCount: number
    atRiskProjectsCount: number
    staleContactsCount: number
    upcomingMeetingsCount: number
    avgDealAgedays: number
    closedWonThisMonth: number
    closedWonValueThisMonth: number
  }
  recentMemories: Memory[]          // from Memory Engine
  activeRecommendations: Recommendation[]  // from Learning Engine
  learningSignals: LearningSignal[] // recent unresolved signals
  topRisks: ExecutiveRisk[]         // up to 5 warning-type recommendations
  topOpportunities: ExecutiveOpportunity[]  // up to 5 opportunity-type recommendations
  todayAgenda: TodayAgendaItem[]    // calendar events today
  importantTasks: ImportantTask[]   // high/urgent priority tasks
  generatedAt: string               // ISO timestamp
}
```

---

## Signal Types

| Signal type | Triggered by | Severity |
|---|---|---|
| `deal_risk` | Deal approaching close date or late stage with low probability | info → critical based on days remaining |
| `task_delay` | Task past due_date in active status | info → critical based on days overdue |
| `recurring_bottleneck` | Project marked as at-risk | warning → critical based on days to due |
| `recommended_action` | Calendar event within 24 hours | info → warning |
| `performance_trend` | 5+ overdue tasks in workspace | warning → critical |

---

## Pattern Detection

`detectAdvancedPatterns()` runs heuristic analysis on raw DB tables:

| Pattern | Detection logic |
|---|---|
| Pipeline stalling | Deals not updated in 14+ days (non-terminal stage) |
| Task overload | 3+ overdue tasks in workspace |
| Follow-up gap | New contacts in last 30 days with no activity logged |
| Revenue trend | Closed-won value this month < 70% of last month |

Patterns detected above threshold are persisted to `learning_patterns` via the Learning Engine and become the basis for recommendation generation.

---

## Recommendation Engine

`generateRecommendations()` converts `PatternDetectionResult.recommendations` into `Recommendation` database records:

- Deduplicates by title (no duplicate pending recommendations)
- Caps total pending per workspace at `maxTopOpportunities × 2`
- Sets 7-day expiry on all generated recommendations
- Maps to `action`, `insight`, `warning`, or `opportunity` types

`extractTopRisks()` and `extractTopOpportunities()` convert pending recommendations into the `topRisks` / `topOpportunities` arrays in the executive context, sorted by priority.

---

## Configuration

All numeric thresholds live in `config/intelligence.ts`:

| Key | Default | Meaning |
|---|---|---|
| `dealRiskDaysToClose` | 14 | Days before close date triggers deal_risk signal |
| `dealLowProbabilityThreshold` | 30 | % probability below which late-stage deals are flagged |
| `staleContactDays` | 30 | Days without activity before contact is stale |
| `followUpThresholdDays` | 7 | Days before follow-up signal fires |
| `taskOverdueThresholdDays` | 0 | Grace period after due_date before signal fires |
| `maxTopRisks` | 5 | Max risks in executive context |
| `maxTopOpportunities` | 5 | Max opportunities in executive context |
| `maxImportantTasks` | 10 | Max important tasks in executive context |
| `maxTodayAgendaItems` | 10 | Max agenda items in executive context |

---

## Next Sprint — Executive AI Assistant

Sprint 17 will wire the Executive Intelligence Runtime to an LLM provider:

1. Pass `IntelligenceContext` as grounded prompt context to the AI assistant
2. The assistant reads `topRisks`, `topOpportunities`, and `importantTasks` to generate briefing summaries
3. AI-generated insights are written back to `memories` (type: `ai_insight`) via `MemoryService.createMemory()`
4. AI-generated recommendations are written back to `recommendations` via `LearningService.createRecommendation()`
5. User feedback on AI recommendations closes the learning loop via `recordRecommendationFeedback()`

The runtime was designed with this flow in mind — no structural changes will be needed to plug in the AI layer.
