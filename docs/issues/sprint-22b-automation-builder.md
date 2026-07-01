# Sprint 22B — Automation Builder

**Milestone:** v1.4 Executive Automation  
**Sprint:** 22B  
**Total SP:** 22

---

## ISS-044 — Build no-code Automation Builder UI

**Labels:** `feature`, `automation`, `ui`, `high-priority`, `sprint-22`, `v1.4`  
**Story Points:** 8  
**Priority:** P0

### Description

Create the visual workflow editor at `/dashboard/automations/new`. The editor has three sections: Trigger selector, Condition builder (optional), and Action list.

### Acceptance Criteria

- [ ] Trigger selector: dropdown of event types with human-readable labels (e.g., "When a deal stage changes")
- [ ] Trigger filter: additional field to narrow trigger (e.g., "only for deals worth > $10,000")
- [ ] Condition builder: add/remove rules with field, operator, value inputs; AND/OR toggle
- [ ] Action list: add/remove/reorder actions; each action type has a dedicated config form
- [ ] Live validation: disabled Save button until required fields completed
- [ ] Preview panel: shows JSON representation of the workflow (debug mode)
- [ ] Saved workflows appear in `/dashboard/automations` list

### Dependencies

- [ ] ISS-042 (Workflow Engine capable of executing)

### Definition of Done

- [ ] Non-technical executive can create a "notify me when deal stalls" workflow in < 5 min
- [ ] Created workflow stored in `workflows` table and executed when triggered

---

## ISS-045 — Create workflow list view with run history

**Labels:** `feature`, `automation`, `ui`, `high-priority`, `sprint-22`, `v1.4`  
**Story Points:** 5  
**Priority:** P0

### Description

Build the workflow management page at `/dashboard/automations` showing all workspace workflows with status, last run time, and run count.

### Acceptance Criteria

- [ ] Table columns: Name, Status (active/paused), Trigger, Last run, Run count (30 days), Actions (Edit / Pause / Delete)
- [ ] Click workflow → opens run history panel
- [ ] Pause/resume toggle changes `workflows.status`
- [ ] Delete shows confirmation dialog; soft-deletes the workflow
- [ ] Empty state with CTA to create first automation

### Dependencies

- [ ] ISS-044

### Definition of Done

- [ ] All workflows visible with accurate run count
- [ ] Pause toggle works immediately

---

## ISS-046 — Add workflow test and dry-run mode

**Labels:** `feature`, `automation`, `medium-priority`, `sprint-22`, `v1.4`  
**Story Points:** 5  
**Priority:** P1

### Description

Allow testing a workflow with a synthetic event payload before activating. Show what would happen without executing actual actions.

### Acceptance Criteria

- [ ] "Test workflow" button in Automation Builder
- [ ] Opens modal: paste or generate a sample event payload (JSON)
- [ ] Dry-run: evaluates trigger match + conditions + lists actions that would execute (does NOT execute them)
- [ ] Shows: "Trigger: MATCH", "Conditions: 2/3 PASS", "Actions: [list]"
- [ ] Dry-run result stored temporarily in session (not persisted to DB)

### Dependencies

- [ ] ISS-044

### Definition of Done

- [ ] Dry-run shows correct evaluation for a known event + conditions
- [ ] No actions executed during dry-run

---

## ISS-047 — Build automation templates library

**Labels:** `feature`, `automation`, `ui`, `low-priority`, `sprint-22`, `v1.4`  
**Story Points:** 4  
**Priority:** P2

### Description

Provide pre-built workflow templates that executives can activate in one click. Templates cover the most common executive automation patterns.

### Acceptance Criteria

- [ ] Templates page at `/dashboard/automations/templates`
- [ ] Minimum 10 templates covering: deal stall notifications, meeting prep reminders, new contact welcome task, overdue task escalation, weekly pipeline digest, document expiry warning
- [ ] Each template: name, description, trigger preview, action preview
- [ ] "Use template" creates a draft workflow (status: `paused`) for the executive to review before activating
- [ ] Templates stored as static JSON in `config/automation-templates.ts`

### Dependencies

- [ ] ISS-044 (Automation Builder to edit templates)

### Definition of Done

- [ ] 10 templates available
- [ ] Template → draft workflow created on activation
