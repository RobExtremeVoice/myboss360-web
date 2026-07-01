# Sprint 24C — Finance Agent

**Milestone:** v2.0 Multi-Agent System  
**Sprint:** 24C  
**Total SP:** 18

---

## ISS-072 — Build Finance Agent core with financial data tools

**Labels:** `feature`, `agents`, `ai`, `high-priority`, `sprint-24`, `v2.0`  
**Story Points:** 8  
**Priority:** P0

### Description

Implement the Finance Agent with access to financial records, budget data, and expense tracking tools.

### Acceptance Criteria

- [ ] Finance Agent system prompt: role, financial data scope, compliance constraints, output format
- [ ] MCP tools: `get_budget`, `list_expenses`, `get_runway`, `list_invoices`, `get_forecast`
- [ ] Finance Agent cannot access CRM deal details, HR records, or Operations data
- [ ] Financial data schema (new tables): `budgets (workspace_id, category, allocated_amount, spent_amount, period)`, `expenses (workspace_id, category, amount, date, status, submitted_by)`
- [ ] All financial queries RLS-scoped to workspace

### Dependencies

- [ ] ISS-065 (context), ISS-066 (delegation)

### Definition of Done

- [ ] Finance Agent returns budget variance report
- [ ] Data access boundary enforced

---

## ISS-073 — Implement budget variance monitoring and alerting

**Labels:** `feature`, `agents`, `automation`, `high-priority`, `sprint-24`, `v2.0`  
**Story Points:** 5  
**Priority:** P0

### Description

Finance Agent monitors budget vs. actual spend and alerts the Executive Agent when a category exceeds a configurable variance threshold (default: 10% over budget).

### Acceptance Criteria

- [ ] `detectBudgetVariance(workspaceId, thresholdPct) → Variance[]` compares `budgets.spent_amount` to `budgets.allocated_amount`
- [ ] Variance categories: `under_budget` (< 90% spent), `on_track` (90–110%), `over_budget` (> 110%)
- [ ] Over-budget categories emit `finance.budget_exceeded` event
- [ ] Finance Agent recommends corrective action for each over-budget category
- [ ] Alert delivered to executive via Approval Engine (for large variances) or notification (for minor)

### Dependencies

- [ ] ISS-072 (Finance Agent core)

### Definition of Done

- [ ] Marketing category 15% over budget → alert sent to executive
- [ ] Alert includes recommended action

---

## ISS-074 — Create Finance Agent briefing template

**Labels:** `feature`, `agents`, `medium-priority`, `sprint-24`, `v2.0`  
**Story Points:** 5  
**Priority:** P1

### Description

Define the Finance Agent's structured output for the Executive Briefing.

### Acceptance Criteria

- [ ] Output schema: `{ cashRunwayDays, totalSpentMTD, budgetVariances[], overdueInvoices[], cashFlowForecast30d, recommendedActions[] }`
- [ ] Cash runway: `current_cash / monthly_burn_rate` (manual input or integrated from accounting tool)
- [ ] Briefing section Markdown formatted for in-app display
- [ ] Generation time < 10 seconds

### Dependencies

- [ ] ISS-073, ISS-067

### Definition of Done

- [ ] Finance section appears in daily Executive Briefing with accurate figures
