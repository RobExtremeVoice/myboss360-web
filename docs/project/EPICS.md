# Epics

Each epic represents a complete capability vertical that ships over one or more sprints.

---

## EPIC-01 — Connected Executive (v1.2)

**Goal:** Connect Google Workspace so executives never need to manually import data.

| Sprint | Issues | Story Points | Status |
|---|---|---|---|
| 20A — Google Calendar | ISS-001 to ISS-006 | 27 SP | Planned |
| 20B — Google Gmail | ISS-007 to ISS-012 | 28 SP | Planned |
| 20C — Google Contacts | ISS-013 to ISS-016 | 14 SP | Planned |
| 20D — Google Drive | ISS-017 to ISS-021 | 22 SP | Planned |
| **Total** | **22 issues** | **91 SP** | Planned |

**Dependencies:** Google Cloud project, OAuth 2.0 credentials, Supabase Vault

---

## EPIC-02 — Knowledge Intelligence (v1.3)

**Goal:** Activate the RAG layer — every AI response is grounded in the organization's knowledge.

| Sprint | Issues | Story Points | Status |
|---|---|---|---|
| 21A — Embeddings | ISS-022 to ISS-026 | 23 SP | Planned |
| 21B — Vector Search | ISS-027 to ISS-030 | 18 SP | Planned |
| 21C — Hybrid Retrieval | ISS-031 to ISS-034 | 18 SP | Planned |
| 21D — Knowledge Ranking | ISS-035 to ISS-038 | 16 SP | Planned |
| **Total** | **17 issues** | **75 SP** | Planned |

**Dependencies:** pgvector extension, OpenAI API key, EPIC-01 (v1.2 ships document corpus)

---

## EPIC-03 — Executive Automation (v1.4)

**Goal:** Automate repetitive coordination work so executives focus on decisions, not follow-ups.

| Sprint | Issues | Story Points | Status |
|---|---|---|---|
| 22A — Workflow Engine | ISS-039 to ISS-043 | 30 SP | Planned |
| 22B — Automation Builder | ISS-044 to ISS-047 | 22 SP | Planned |
| 22C — Approval Engine | ISS-048 to ISS-051 | 20 SP | Planned |
| **Total** | **13 issues** | **72 SP** | Planned |

**Dependencies:** EPIC-02 audit logs, Supabase pg_cron, email provider (Resend/SendGrid)

---

## EPIC-04 — Executive Voice (v1.5)

**Goal:** Voice-native interaction with the Executive OS — ask questions and trigger actions hands-free.

| Sprint | Issues | Story Points | Status |
|---|---|---|---|
| 23A — Voice Assistant | ISS-052 to ISS-055 | 20 SP | Planned |
| 23B — Speech To Text | ISS-056 to ISS-059 | 20 SP | Planned |
| 23C — Streaming Pipeline | ISS-060 to ISS-063 | 22 SP | Planned |
| **Total** | **12 issues** | **62 SP** | Planned |

**Dependencies:** EPIC-02 RAG (knowledge context in voice), STT/TTS provider, EPIC-03 (voice-triggered automations)

---

## EPIC-05 — Multi-Agent System (v2.0)

**Goal:** Specialized AI agents that operate continuously on behalf of the executive organization.

| Sprint | Issues | Story Points | Status |
|---|---|---|---|
| 24A — Executive Agent | ISS-064 to ISS-068 | 35 SP | Planned |
| 24B — Sales Agent | ISS-069 to ISS-071 | 18 SP | Planned |
| 24C — Finance Agent | ISS-072 to ISS-074 | 18 SP | Planned |
| 24D — Operations Agent | ISS-075 to ISS-077 | 16 SP | Planned |
| 24E — Knowledge Graph | ISS-078 to ISS-082 | 30 SP | Planned |
| **Total** | **19 issues** | **117 SP** | Planned |

**Dependencies:** All v1.x epics, MCP, agent orchestration runtime, inter-agent bus

---

## Epic Summary

| Epic | Release | Issues | Story Points | Status |
|---|---|---|---|---|
| EPIC-01 Connected Executive | v1.2 | 22 | 91 SP | Planned |
| EPIC-02 Knowledge Intelligence | v1.3 | 17 | 75 SP | Planned |
| EPIC-03 Executive Automation | v1.4 | 13 | 72 SP | Planned |
| EPIC-04 Executive Voice | v1.5 | 12 | 62 SP | Planned |
| EPIC-05 Multi-Agent System | v2.0 | 19 | 117 SP | Planned |
| **Total** | | **83** | **417 SP** | |
