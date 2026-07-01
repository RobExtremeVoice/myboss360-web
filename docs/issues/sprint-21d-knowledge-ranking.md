# Sprint 21D — Knowledge Ranking

**Milestone:** v1.3 Knowledge Intelligence  
**Sprint:** 21D  
**Total SP:** 16

---

## ISS-035 — Implement multi-signal document ranking

**Labels:** `feature`, `rag`, `knowledge`, `high-priority`, `sprint-21`, `v1.3`  
**Story Points:** 5  
**Priority:** P0

### Description

Add a post-retrieval ranking pass that scores search results by vector similarity, recency, and document authority before returning results to the caller.

### Acceptance Criteria

- [ ] `rankResults(results, query)` in `services/knowledge/ranking.ts`
- [ ] Signals: vector similarity (0.40), recency decay (0.30), access frequency (0.20), author authority (0.10)
- [ ] Recency decay: `exp(-lambda * days_since_update)` with lambda = 0.05 (half-life ~14 days)
- [ ] Access frequency: `document_access_count / max_access_count_in_result_set`
- [ ] Author authority: `executive` role = 1.0, `manager` = 0.7, `viewer` = 0.5
- [ ] Final score: weighted sum of normalized signals
- [ ] `SearchResult.score` updated with re-ranked score

### Dependencies

- [ ] ISS-032 (hybrid search provides base results)

### Definition of Done

- [ ] Newer, frequently accessed docs rank above older, less-accessed ones at equal similarity
- [ ] Unit tests: 5 ranking scenarios with expected ordering

---

## ISS-036 — Build AI context injection into system prompt

**Labels:** `feature`, `rag`, `ai`, `high-priority`, `sprint-21`, `v1.3`  
**Story Points:** 5  
**Priority:** P0

### Description

Inject top-K knowledge chunks into the AI assistant's system prompt for every message. This is the core RAG activation that makes the AI assistant context-aware.

### Acceptance Criteria

- [ ] `buildSystemPrompt(context)` in `services/ai/prompt-builder.ts` accepts `knowledgeChunks: SearchResult[]`
- [ ] Chunks injected in order of relevance score
- [ ] Each chunk formatted as: `[SOURCE: {document.title}]\n{chunk.content}`
- [ ] Maximum 5 chunks injected per message (configurable via `RAG_MAX_CHUNKS` env)
- [ ] Maximum 2,000 tokens of knowledge context total (truncate lowest-scored chunks first)
- [ ] `POST /api/ai/messages` performs hybrid search before building prompt, then builds prompt

### Dependencies

- [ ] ISS-033 (search API), ISS-035 (ranking)

### Definition of Done

- [ ] Ask AI about a document in the knowledge base → correct grounded answer
- [ ] Ask about something not in knowledge base → AI answers from training data with disclaimer

---

## ISS-037 — Add document access frequency tracking

**Labels:** `task`, `knowledge`, `medium-priority`, `sprint-21`, `v1.3`  
**Story Points:** 3  
**Priority:** P1

### Description

Track how often each knowledge document is retrieved (via search or direct view). Used as a ranking signal in ISS-035.

### Acceptance Criteria

- [ ] `document_accesses` table: `document_id`, `workspace_id`, `accessed_by`, `access_type` (`search` | `view` | `rag_injection`), `created_at`
- [ ] Access logged on: search result selection, document page view, RAG context injection
- [ ] `knowledge_documents.access_count` column updated via trigger or background job (denormalized for performance)
- [ ] Access logs retained for 90 days then pruned

### Dependencies

- [ ] ISS-036 (RAG injection as access type)

### Definition of Done

- [ ] Search result click → access log created
- [ ] Document view → access log created
- [ ] RAG injection → access log created

---

## ISS-038 — Implement knowledge search analytics dashboard

**Labels:** `feature`, `knowledge`, `ui`, `low-priority`, `sprint-21`, `v1.3`  
**Story Points:** 3  
**Priority:** P2

### Description

Add a knowledge analytics section in the dashboard showing: most-accessed documents, search query frequency, top knowledge gaps (queries with zero results).

### Acceptance Criteria

- [ ] `/dashboard/knowledge/analytics` page with:
  - Top 10 most-accessed documents (last 30 days)
  - Top 10 search queries (last 30 days)
  - Zero-result queries (knowledge gaps)
  - Search volume by mode (keyword / semantic / hybrid)
- [ ] Data refreshed daily (cached, not real-time)
- [ ] Accessible to `admin` and `executive` roles only

### Dependencies

- [ ] ISS-037 (access tracking), ISS-034 (search events)

### Definition of Done

- [ ] Analytics page renders with real data
- [ ] Knowledge gap list shows queries that returned zero results
