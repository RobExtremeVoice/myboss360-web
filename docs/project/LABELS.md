# Label Application Guide

This document explains when and how to apply each label. For the full label list and colors, see [../../.github/labels.md](../../.github/labels.md).

---

## Rule: Every Issue Must Have

1. **One type label** (`feature`, `bug`, `task`, `epic`, `research`, `documentation`)
2. **One or more domain labels** (`ai`, `knowledge`, `calendar`, `crm`, etc.)
3. **One priority label** (`high-priority`, `medium-priority`, `low-priority`)
4. **One sprint label** (`sprint-20`, `sprint-21`, etc.) — when assigned to a sprint
5. **One release label** (`v1.2`, `v1.3`, etc.) — when target release is known

---

## Type Label Decision Tree

```
Is it a confirmed defect?
  └─ YES → bug

Is it a large multi-sprint body of work?
  └─ YES → epic

Is it a time-boxed investigation with no implementation output?
  └─ YES → research

Is it infrastructure, refactor, migration, or tooling (no user-visible change)?
  └─ YES → task

Is it a documentation-only change?
  └─ YES → documentation

Is it a security vulnerability or hardening?
  └─ YES → security

Otherwise → feature
```

---

## Priority Label Guide

| Priority | Use when |
|---|---|
| `high-priority` | Blocks the sprint goal or another issue; must ship this sprint |
| `medium-priority` | Planned for near-term sprint; important but not blocking |
| `low-priority` | Nice-to-have; will be addressed when higher-priority work is clear |

---

## Domain Labels — Quick Reference

| Label | Apply when the issue involves... |
|---|---|
| `ai` | AI provider integration, system prompt, inference, streaming |
| `knowledge` | Knowledge Engine, documents, chunks, parsing, tagging |
| `calendar` | Google Calendar API, event sync, Executive Agenda |
| `gmail` | Google Gmail API, email ingestion, thread summarization |
| `contacts` | Google Contacts, CRM contact enrichment |
| `drive` | Google Drive API, document import |
| `crm` | Companies, contacts, deals, activities |
| `automation` | Workflow Engine, triggers, actions, Automation Builder |
| `approval` | Approval Engine, approval requests, approvers |
| `voice` | Voice assistant, wake word, STT, TTS |
| `embeddings` | Vector embeddings, embedding provider |
| `vector-search` | pgvector, semantic search queries |
| `rag` | Retrieval-Augmented Generation, context injection |
| `agents` | Multi-agent system, agent orchestration |
| `auth` | Authentication, session management, cookies |
| `database` | Schema changes, migrations, RLS policies |
| `security` | Vulnerability, input validation, encryption |
| `api` | REST API routes, request/response contracts |
| `ui` | React components, pages, styling |
| `integrations` | Third-party APIs, OAuth, webhooks |

---

## Combining Labels — Examples

| Scenario | Labels to Apply |
|---|---|
| New Google Calendar sync feature | `feature`, `calendar`, `integrations`, `high-priority`, `sprint-20`, `v1.2` |
| Bug: semantic search returns empty | `bug`, `vector-search`, `rag`, `high-priority`, `sprint-21`, `v1.3` |
| Refactor: extract workflow runner | `task`, `automation`, `technical-debt`, `medium-priority`, `sprint-22`, `v1.4` |
| Research: evaluate STT providers | `research`, `voice`, `medium-priority`, `sprint-23`, `v1.5` |
| Knowledge Graph schema design | `feature`, `database`, `agents`, `high-priority`, `sprint-24`, `v2.0` |

---

## Labels to Avoid Combining

| Combination | Why |
|---|---|
| `bug` + `feature` | A bug is not a feature request; open a separate issue |
| `high-priority` + `low-priority` | Pick one |
| `wontfix` + any sprint label | If wontfix, remove sprint assignment |
| `blocked` + `in-progress` | A blocked issue is not in progress |
