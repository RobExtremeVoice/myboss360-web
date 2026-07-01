# Sprint 22A — Workflow Engine

**Milestone:** v1.4 Executive Automation  
**Sprint:** 22A  
**Total SP:** 30

---

## ISS-039 — Design and implement workflow schema

**Labels:** `task`, `database`, `automation`, `high-priority`, `sprint-22`, `v1.4`  
**Story Points:** 5  
**Priority:** P0

### Description

Create the database schema for the Workflow Engine: `workflows` table (definitions) and `workflow_runs` table (execution log).

### Acceptance Criteria

- [ ] `workflows` table: `id`, `workspace_id`, `name`, `description`, `trigger JSONB`, `conditions JSONB`, `actions JSONB`, `status` (`active`|`paused`|`archived`), `created_by`, `created_at`, `updated_at`
- [ ] `workflow_runs` table (append-only): `id`, `workflow_id`, `workspace_id`, `trigger_data JSONB`, `status` (`success`|`failed`|`pending`), `actions_log JSONB`, `started_at`, `completed_at`
- [ ] RLS on both tables via `is_workspace_member()`
- [ ] `workflow_runs` has no UPDATE/DELETE RLS policy (append-only)
- [ ] Indexes: `workflows(workspace_id, status)`, `workflow_runs(workflow_id)`, `workflow_runs(workspace_id, started_at)`

### Dependencies

- [ ] None (new tables)

### Definition of Done

- [ ] Migration runs successfully
- [ ] Both tables accessible via Supabase client
- [ ] Workflow run cannot be updated or deleted via API

---

## ISS-040 — Build event listener system

**Labels:** `feature`, `automation`, `high-priority`, `sprint-22`, `v1.4`  
**Story Points:** 8  
**Priority:** P0

### Description

Build the event dispatch system that detects state changes across CRM, Knowledge, and Calendar and triggers matching workflows.

### Acceptance Criteria

- [ ] `EventBus` (singleton in server context) with `emit(event: WorkflowEvent)` and `subscribe(type, handler)` methods
- [ ] Event types: `deal.created`, `deal.updated`, `deal.stalled`, `contact.created`, `document.created`, `calendar.event_starting` (15 min before), `schedule.cron`
- [ ] Each API route that mutates relevant entities calls `EventBus.emit()` after successful write
- [ ] Event payload: `{ type, workspaceId, resourceType, resourceId, data, timestamp }`
- [ ] Matching: for each emitted event, query `workflows` table for active workflows with matching trigger type and workspace

### Dependencies

- [ ] ISS-039 (schema)

### Definition of Done

- [ ] Create a deal → `deal.created` event emitted
- [ ] Update a deal stage → `deal.updated` event emitted
- [ ] Event matched to workflow in < 500 ms

---

## ISS-041 — Implement condition evaluator

**Labels:** `feature`, `automation`, `high-priority`, `sprint-22`, `v1.4`  
**Story Points:** 5  
**Priority:** P0

### Description

Evaluate the `conditions` block of a workflow definition against the event payload. Conditions use a simple expression language: field comparisons and logical AND/OR.

### Acceptance Criteria

- [ ] Condition format: `{ operator: 'AND'|'OR', rules: [{ field, op, value }] }`
- [ ] Supported field ops: `equals`, `not_equals`, `greater_than`, `less_than`, `contains`, `starts_with`, `is_null`, `is_not_null`
- [ ] Field paths support dot notation: `data.deal.value`, `data.contact.email`
- [ ] Nested AND/OR groups supported (depth ≤ 3)
- [ ] `evaluateConditions(conditions, event) → boolean` pure function
- [ ] Unit tests: 20 test cases including edge cases (null values, type coercion)

### Dependencies

- [ ] ISS-040 (event system)

### Definition of Done

- [ ] All 20 unit tests pass
- [ ] Invalid condition schema returns `false` (not an exception)

---

## ISS-042 — Build action executor

**Labels:** `feature`, `automation`, `high-priority`, `sprint-22`, `v1.4`  
**Story Points:** 8  
**Priority:** P0

### Description

Execute workflow actions sequentially after conditions pass. Each action type has its own handler. Execution is logged to `workflow_runs`.

### Acceptance Criteria

- [ ] Action types for v1.4: `send_notification`, `create_task`, `update_record`, `trigger_approval`
- [ ] `executeAction(action, context) → ActionResult` dispatches to correct handler
- [ ] Actions execute sequentially in array order; stop on first error
- [ ] Each action result appended to `workflow_runs.actions_log`
- [ ] `send_notification` handler: creates record in `notifications` table + in-app delivery
- [ ] `create_task` handler: inserts row into `tasks` with `source_workflow_id`
- [ ] `update_record` handler: updates `contacts`, `deals`, or `documents` field via repository

### Dependencies

- [ ] ISS-041 (conditions)

### Definition of Done

- [ ] Workflow with 3 chained actions executes all 3 in order
- [ ] Action failure stops chain and sets `workflow_runs.status = 'failed'`
- [ ] Action log contains result of each action

---

## ISS-043 — Create workflow execution audit log

**Labels:** `feature`, `automation`, `security`, `medium-priority`, `sprint-22`, `v1.4`  
**Story Points:** 4  
**Priority:** P1

### Description

Surface workflow execution history in the UI and ensure all runs are logged immutably for compliance.

### Acceptance Criteria

- [ ] `GET /api/workflows/[id]/runs` returns execution history (paginated, newest first)
- [ ] Each run shows: status, trigger event, conditions evaluated (pass/fail), actions executed, timestamps, error message if failed
- [ ] Workflow run detail page in Automation Builder UI
- [ ] Runs older than 90 days pruned by a scheduled job (retains summary)
- [ ] Failed run triggers in-app notification to workflow creator

### Dependencies

- [ ] ISS-042 (action executor populates runs)

### Definition of Done

- [ ] Run history visible per workflow in UI
- [ ] Failed run notification delivered
