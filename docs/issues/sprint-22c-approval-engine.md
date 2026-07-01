# Sprint 22C — Approval Engine

**Milestone:** v1.4 Executive Automation  
**Sprint:** 22C  
**Total SP:** 20

---

## ISS-048 — Create approval_requests schema and service

**Labels:** `feature`, `approval`, `database`, `high-priority`, `sprint-22`, `v1.4`  
**Story Points:** 5  
**Priority:** P0

### Description

Design the Approval Engine schema and service. Supports four approval patterns: single, sequential, unanimous, and threshold (M of N).

### Acceptance Criteria

- [ ] `approval_requests` table: `id`, `workspace_id`, `workflow_id`, `requestor_id`, `title`, `description`, `resource_type`, `resource_id`, `pattern` (`single`|`sequential`|`unanimous`|`threshold`), `approvers JSONB`, `threshold INT`, `status`, `expires_at`, `created_at`
- [ ] `approval_responses` table: `id`, `request_id`, `responder_id`, `decision` (`approved`|`rejected`), `reason`, `responded_at`
- [ ] `createApprovalRequest(input)` service method
- [ ] `respondToApproval(requestId, responderId, decision, reason)` service method
- [ ] Status transitions: `pending → approved | rejected | expired`
- [ ] Sequential pattern: only current approver (in order) can respond

### Dependencies

- [ ] ISS-039 (workflow schema for `workflow_id`)

### Definition of Done

- [ ] Sequential approval: responder 1 approves → status moves to awaiting responder 2
- [ ] Unanimous: one rejection → status = rejected immediately
- [ ] Threshold (2 of 3): 2 approvals → status = approved

---

## ISS-049 — Implement approval routing service

**Labels:** `feature`, `approval`, `high-priority`, `sprint-22`, `v1.4`  
**Story Points:** 5  
**Priority:** P0

### Description

Build the service layer that evaluates approval responses and advances request status according to the pattern.

### Acceptance Criteria

- [ ] `evaluateApprovalStatus(requestId) → 'pending' | 'approved' | 'rejected'` called after every response
- [ ] On approval: if status becomes `approved`, emit `approval.approved` event (triggers next workflow action)
- [ ] On rejection: status immediately `rejected`, emit `approval.rejected` event
- [ ] Expiry check: background job checks `expires_at`; transitions to `expired` and emits `approval.expired`
- [ ] Audit trail: every status transition logged to `audit_logs`

### Dependencies

- [ ] ISS-048

### Definition of Done

- [ ] All four patterns evaluated correctly
- [ ] Expiry job fires within 60 seconds of `expires_at`

---

## ISS-050 — Build approval UI (request creation + review)

**Labels:** `feature`, `approval`, `ui`, `high-priority`, `sprint-22`, `v1.4`  
**Story Points:** 5  
**Priority:** P0

### Description

Create the approval request UI: a form for creating requests and a review interface for approvers.

### Acceptance Criteria

- [ ] Create approval request form: title, description, approvers selector (workspace members), pattern selector, expiry date
- [ ] Approval inbox at `/dashboard/approvals`: pending approvals requiring the current user's response
- [ ] Each approval card: title, requestor, description, resource link, approve/reject buttons, reason textarea (required for rejection)
- [ ] Submitted approvals tab: requests the user has sent (with status)
- [ ] Badge on sidebar navigation icon showing pending approval count
- [ ] Real-time updates via Supabase Realtime when approval status changes

### Dependencies

- [ ] ISS-049

### Definition of Done

- [ ] Approver receives card in inbox
- [ ] Approving updates status in real time (no page refresh needed)

---

## ISS-051 — Add approval notification service

**Labels:** `feature`, `approval`, `automation`, `medium-priority`, `sprint-22`, `v1.4`  
**Story Points:** 5  
**Priority:** P1

### Description

Notify approvers when their response is required, and requestors when the approval resolves.

### Acceptance Criteria

- [ ] On new approval request: in-app notification to each approver (+ email if enabled)
- [ ] For sequential: notify next approver only after previous approves
- [ ] On approval resolution (approved/rejected/expired): in-app notification to requestor
- [ ] Escalation reminder: if no response within 24 hours, send reminder notification
- [ ] Notification content: title, requestor name, description excerpt, link to approval

### Dependencies

- [ ] ISS-050 (approval UI provides links), ISS-042 (notification action type)

### Definition of Done

- [ ] New request → all approvers notified within 30 seconds
- [ ] Resolution → requestor notified within 30 seconds
- [ ] 24h reminder fires correctly
