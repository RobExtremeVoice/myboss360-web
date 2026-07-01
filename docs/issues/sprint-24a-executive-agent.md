# Sprint 24A — Executive Agent

**Milestone:** v2.0 Multi-Agent System  
**Sprint:** 24A  
**Total SP:** 35

---

## ISS-064 — Design Executive Agent architecture and orchestration runtime

**Labels:** `research`, `agents`, `ai`, `high-priority`, `sprint-24`, `v2.0`  
**Story Points:** 8  
**Priority:** P0

### Description

Architecture spike for the multi-agent orchestration runtime. Covers agent lifecycle, inter-agent messaging, task queue, shared memory, and the human-in-the-loop approval gate.

### Acceptance Criteria

- [ ] Agent execution model documented: process isolation strategy, context window management
- [ ] Inter-agent bus design: Supabase Realtime vs. Postgres NOTIFY vs. dedicated queue
- [ ] Task schema: `{ id, agent_id, type, input, status, result, created_at, completed_at }`
- [ ] Shared memory model: Knowledge Graph + per-agent working memory (in-context)
- [ ] Human-in-the-loop gate: impact classification (low/medium/high/critical) + approval escalation
- [ ] ADR written: `docs/architecture/multi-agent-adr.md`
- [ ] Follow-up implementation issues created

### Dependencies

- [ ] All v1.x epics (foundation required)

### Definition of Done

- [ ] ADR approved by team
- [ ] Implementation issues created for all Sprint 24 sub-sprints

---

## ISS-065 — Implement agent context management

**Labels:** `feature`, `agents`, `ai`, `knowledge`, `high-priority`, `sprint-24`, `v2.0`  
**Story Points:** 8  
**Priority:** P0

### Description

Build the agent context manager that assembles an agent's context window for each task: system prompt, workspace knowledge, task-specific data, and prior turns from working memory.

### Acceptance Criteria

- [ ] `AgentContext` type: `{ systemPrompt, workspaceKnowledge: SearchResult[], taskData, workingMemory: string[] }`
- [ ] `buildAgentContext(agentId, task) → AgentContext` assembles context from Knowledge Graph + workspace data
- [ ] Context window budget: max 80,000 tokens total (model-dependent)
- [ ] Knowledge retrieval: hybrid search scoped to agent's permitted domains
- [ ] Working memory: last 10 task summaries from the agent's `agent_memory` table
- [ ] `agent_memory` table: `id`, `agent_id`, `workspace_id`, `task_summary`, `created_at` (FIFO, max 100 rows per agent)

### Dependencies

- [ ] ISS-064 (ADR), ISS-036 (RAG), ISS-033 (search)

### Definition of Done

- [ ] Agent context built within 500 ms for a 50,000-token context
- [ ] Context respects domain permissions (Sales Agent cannot see Finance data)

---

## ISS-066 — Build task delegation system

**Labels:** `feature`, `agents`, `ai`, `high-priority`, `sprint-24`, `v2.0`  
**Story Points:** 8  
**Priority:** P0

### Description

Build the Executive Agent's task delegation engine: receives a goal from the executive, decomposes it into sub-tasks, delegates to appropriate sub-agents, and monitors completion.

### Acceptance Criteria

- [ ] `decomposeGoal(goal, context) → Task[]` uses AI to break a goal into delegatable sub-tasks
- [ ] `delegateTask(task, agentId)` inserts task into `agent_tasks` queue for the target agent
- [ ] `monitorDelegation(goalId) → DelegationStatus` tracks which tasks are complete/failed/pending
- [ ] Timeout: if a sub-agent task exceeds 5 minutes, escalate to human via Approval Engine
- [ ] Sub-agent results aggregated and returned to Executive Agent for synthesis
- [ ] `agent_tasks` table: `id`, `goal_id`, `assigned_agent`, `task_type`, `input JSONB`, `status`, `result JSONB`, `created_at`, `completed_at`

### Dependencies

- [ ] ISS-065 (context management)

### Definition of Done

- [ ] "Prepare weekly business review" decomposed into ≥ 3 sub-tasks for different agents
- [ ] Sub-task timeout escalated to human approval

---

## ISS-067 — Create Executive Briefing generator

**Labels:** `feature`, `agents`, `ai`, `medium-priority`, `sprint-24`, `v2.0`  
**Story Points:** 8  
**Priority:** P0

### Description

The Executive Agent generates a structured daily/weekly briefing by orchestrating sub-agents and synthesizing their outputs into a coherent executive summary.

### Acceptance Criteria

- [ ] Daily briefing generated at 08:00 local time via scheduled workflow
- [ ] Weekly briefing generated every Monday at 07:00
- [ ] Briefing sections: 1) Business Health (from Finance + Operations agents), 2) Pipeline Update (from Sales agent), 3) People (from HR agent), 4) Action Items (from all agents), 5) Recommended Priorities (Executive Agent synthesis)
- [ ] Briefing delivered as in-app notification with full text in `/dashboard/briefings`
- [ ] Past briefings archived and searchable
- [ ] Briefing generation time < 60 seconds

### Dependencies

- [ ] ISS-066 (delegation), ISS-069 (Sales), ISS-072 (Finance)

### Definition of Done

- [ ] Daily briefing appears at 08:00 with all sections populated
- [ ] Briefing archived and accessible in `/dashboard/briefings`

---

## ISS-068 — Add agent goal decomposition engine

**Labels:** `feature`, `agents`, `ai`, `medium-priority`, `sprint-24`, `v2.0`  
**Story Points:** 3  
**Priority:** P1

### Description

Executive can submit a high-level goal via chat or voice. The Executive Agent decomposes it into a plan and shows the executive the plan before executing.

### Acceptance Criteria

- [ ] `/dashboard/ai-assistant`: "Plan mode" toggle activates goal decomposition
- [ ] Executive types goal → Agent returns decomposition plan with sub-tasks and assigned agents
- [ ] Executive approves plan → tasks delegated to sub-agents
- [ ] Executive modifies plan (remove/add task, change agent) before approval
- [ ] Plan stored in `agent_goals` table for audit

### Dependencies

- [ ] ISS-066

### Definition of Done

- [ ] Goal submitted → plan returned within 10 seconds
- [ ] Executive can approve or modify plan before execution
