# Sprint 24B — Sales Agent

**Milestone:** v2.0 Multi-Agent System  
**Sprint:** 24B  
**Total SP:** 18

---

## ISS-069 — Build Sales Agent core with CRM tool access

**Labels:** `feature`, `agents`, `crm`, `ai`, `high-priority`, `sprint-24`, `v2.0`  
**Story Points:** 8  
**Priority:** P0

### Description

Implement the Sales Agent with a specialized system prompt and CRM tool access via MCP. The agent can query pipeline data, analyze deal health, and draft communications.

### Acceptance Criteria

- [ ] Sales Agent system prompt: role description, CRM data access rules, escalation triggers, output format requirements
- [ ] MCP tools available to Sales Agent: `list_deals`, `get_deal`, `update_deal_stage`, `list_contacts`, `get_contact`, `list_activities`, `create_activity`
- [ ] Agent cannot access Finance, HR, or Operations data (permission boundary enforced)
- [ ] All agent actions logged to `audit_logs`
- [ ] Agent task input types: `analyze_pipeline`, `score_opportunity`, `draft_followup`, `identify_stalled_deals`

### Dependencies

- [ ] ISS-065 (context management), ISS-066 (task delegation)

### Definition of Done

- [ ] Sales Agent completes `analyze_pipeline` task and returns structured JSON
- [ ] Out-of-scope data access attempt blocked and logged

---

## ISS-070 — Implement pipeline monitoring and stall detection

**Labels:** `feature`, `agents`, `crm`, `automation`, `high-priority`, `sprint-24`, `v2.0`  
**Story Points:** 5  
**Priority:** P0

### Description

Sales Agent continuously monitors the CRM pipeline and flags stalled deals. A deal is stalled when there has been no activity for more than a configurable threshold (default: 7 days).

### Acceptance Criteria

- [ ] `detectStalledDeals(workspaceId, thresholdDays) → Deal[]` query: `last_activity_at < NOW() - thresholdDays AND status = 'active'`
- [ ] Stalled deals surfaced to Executive Agent with: deal name, value, last activity date, assigned contact
- [ ] Executive Agent routes stalled deal notifications to Sales briefing
- [ ] Executive can configure stall threshold per workspace (default 7 days)
- [ ] `deal.stalled` event emitted for each stalled deal (triggers workflow if configured)

### Dependencies

- [ ] ISS-069 (Sales Agent), ISS-040 (event bus)

### Definition of Done

- [ ] Deal with no activity for 8 days flagged as stalled
- [ ] Stall notification appears in daily briefing

---

## ISS-071 — Create Sales Agent briefing template

**Labels:** `feature`, `agents`, `crm`, `medium-priority`, `sprint-24`, `v2.0`  
**Story Points:** 5  
**Priority:** P1

### Description

Define the structured output format for the Sales Agent's contribution to the Executive Briefing.

### Acceptance Criteria

- [ ] Output schema: `{ totalDeals, totalValue, stageBreakdown, stalledDeals[], atRiskDeals[], wonThisWeek[], recommendedActions[] }`
- [ ] `atRiskDeals`: deals with close date within 14 days and no activity in 5 days
- [ ] `recommendedActions`: ranked list of next best actions (follow up with X, send proposal to Y)
- [ ] Briefing section formatted as clean Markdown for in-app display
- [ ] Generation time < 15 seconds for pipeline of ≤ 500 deals

### Dependencies

- [ ] ISS-070, ISS-067 (Executive Briefing consumer)

### Definition of Done

- [ ] Sales briefing section appears in daily Executive Briefing
- [ ] Recommended actions are actionable (not generic)
