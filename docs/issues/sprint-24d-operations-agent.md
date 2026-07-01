# Sprint 24D — Operations Agent

**Milestone:** v2.0 Multi-Agent System  
**Sprint:** 24D  
**Total SP:** 16

---

## ISS-075 — Build Operations Agent core with project and task data access

**Labels:** `feature`, `agents`, `ai`, `high-priority`, `sprint-24`, `v2.0`  
**Story Points:** 6  
**Priority:** P0

### Description

Implement the Operations Agent with access to project, task, and workflow execution data. Monitors operational health and flags bottlenecks.

### Acceptance Criteria

- [ ] Operations Agent system prompt: role, scope (projects, tasks, workflows), escalation rules
- [ ] MCP tools: `list_projects`, `list_tasks`, `get_project_status`, `list_workflow_runs`, `get_bottlenecks`
- [ ] Agent cannot access financial records, CRM pipeline, or HR data
- [ ] Task types: `check_project_health`, `identify_bottlenecks`, `summarize_workflow_performance`
- [ ] All queries RLS-scoped to workspace

### Dependencies

- [ ] ISS-065 (context), ISS-066 (delegation)

### Definition of Done

- [ ] Operations Agent completes `check_project_health` and returns structured JSON
- [ ] Data boundary enforced

---

## ISS-076 — Implement bottleneck detection algorithm

**Labels:** `feature`, `agents`, `automation`, `high-priority`, `sprint-24`, `v2.0`  
**Story Points:** 5  
**Priority:** P0

### Description

Identify operational bottlenecks: tasks blocked, projects behind schedule, workflows with high failure rates.

### Acceptance Criteria

- [ ] Bottleneck signals: `{ blockedTasks: Task[], overdueMilestones: Milestone[], failedWorkflows: WorkflowRun[] }`
- [ ] Blocked tasks: tasks with `status = 'blocked'` or `due_date < NOW() AND status != 'done'`
- [ ] Overdue milestones: projects where planned completion date passed and `status != 'complete'`
- [ ] Failed workflows: `workflow_runs.status = 'failed'` in last 24 hours
- [ ] Bottleneck report includes severity (blocking revenue vs. internal only)
- [ ] Recommended action per bottleneck: assign owner, escalate, or defer

### Dependencies

- [ ] ISS-075

### Definition of Done

- [ ] Project 2 weeks overdue flagged as high severity
- [ ] Recommended action provided for each bottleneck

---

## ISS-077 — Create Operations Agent briefing template

**Labels:** `feature`, `agents`, `medium-priority`, `sprint-24`, `v2.0`  
**Story Points:** 5  
**Priority:** P1

### Description

Define the Operations Agent's structured output for the Executive Briefing.

### Acceptance Criteria

- [ ] Output schema: `{ activeProjects, onTrackCount, atRiskCount, blockedCount, topBottlenecks[], workflowHealth: { successRate, failureCount }, recommendedActions[] }`
- [ ] `atRiskCount`: projects within 14 days of deadline with < 80% tasks complete
- [ ] Markdown formatted for in-app display
- [ ] Generation time < 10 seconds

### Dependencies

- [ ] ISS-076, ISS-067

### Definition of Done

- [ ] Operations section appears in daily briefing
- [ ] Workflow health shows accurate success rate
