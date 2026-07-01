# Sprint 21C — Hybrid Retrieval

**Milestone:** v1.3 Knowledge Intelligence  
**Sprint:** 21C  
**Total SP:** 18

---

## ISS-031 — Implement Reciprocal Rank Fusion (RRF) scoring algorithm

**Labels:** `feature`, `rag`, `vector-search`, `high-priority`, `sprint-21`, `v1.3`  
**Story Points:** 5  
**Priority:** P0

### Description

Implement the RRF algorithm as a pure TypeScript function. Given two ranked result lists (keyword and semantic), produce a merged ranked list.

### Acceptance Criteria

- [ ] `reciprocalRankFusion(keywordResults, semanticResults, k = 60): SearchResult[]` in `services/knowledge/rrf.ts`
- [ ] Formula: `score_rrf(doc) = Σ 1 / (k + rank_i)` where rank is 1-indexed
- [ ] Documents appearing in both lists get contributions from both
- [ ] Documents in only one list get contribution from that list only
- [ ] Results sorted by `rrf_score DESC`
- [ ] Unit tests: 10 test cases covering edge cases (empty list, all same docs, disjoint lists)

### Dependencies

- [ ] ISS-027 (semantic search), ISS-029 (search API)

### Definition of Done

- [ ] All 10 unit tests pass
- [ ] RRF scores monotonically decrease in sorted output

---

## ISS-032 — Replace mock hybridSearch with live RRF implementation

**Labels:** `feature`, `rag`, `vector-search`, `high-priority`, `sprint-21`, `v1.3`  
**Story Points:** 5  
**Priority:** P0

### Description

Replace the mock `hybridSearch` in `search-service.ts` with a real implementation that runs keyword and semantic search in parallel and combines results via RRF.

### Acceptance Criteria

- [ ] `hybridSearch(query)`:
  1. Run `keywordSearch(query)` and `semanticSearch(query)` in parallel (`Promise.all`)
  2. Apply `reciprocalRankFusion(keywordResults, semanticResults)`
  3. Return merged `SearchResponse` with `searchType: 'hybrid'`
- [ ] Both sub-searches use `query.limit * 2` to gather enough candidates before RRF
- [ ] Final result count capped at `query.limit`
- [ ] Latency target: p95 < 300 ms (parallel execution)
- [ ] If one sub-search fails, use the other alone (graceful degradation)

### Dependencies

- [ ] ISS-028 (semantic), ISS-031 (RRF)

### Definition of Done

- [ ] `mode=hybrid` returns merged results
- [ ] Keyword-only fallback when semantic errors
- [ ] Semantic-only fallback when keyword errors

---

## ISS-033 — Build unified search endpoint (keyword + semantic + hybrid)

**Labels:** `feature`, `rag`, `api`, `medium-priority`, `sprint-21`, `v1.3`  
**Story Points:** 5  
**Priority:** P1

### Description

Expose hybrid search as the new default in the API. Add response metadata needed for AI context injection: source document titles, chunk positions, similarity scores.

### Acceptance Criteria

- [ ] Default mode changed from `keyword` to `hybrid` in `GET /api/knowledge?action=search`
- [ ] Each `SearchResult` includes: `document.title`, `matchedChunks[].content`, `matchedChunks[].chunkIndex`, `score`, `highlights[]`
- [ ] `matchedChunks` capped at top 2 per document (most relevant chunks per document)
- [ ] `hybrid` mode is the new default; `keyword` and `semantic` available as explicit options

### Dependencies

- [ ] ISS-032

### Definition of Done

- [ ] Default search returns hybrid results with chunk-level detail
- [ ] AI context injection service can consume this response directly

---

## ISS-034 — Add search A/B testing framework

**Labels:** `research`, `rag`, `vector-search`, `low-priority`, `sprint-21`, `v1.3`  
**Story Points:** 3  
**Priority:** P2

### Description

Lightweight framework to log which search mode is used, which results are clicked, and what the subsequent AI response quality was. Data informs which default mode to use.

### Acceptance Criteria

- [ ] `search_events` table: `workspace_id`, `query_text`, `search_mode`, `result_count`, `selected_document_id` (nullable), `session_id`, `created_at`
- [ ] Each search request logs an event (async, does not block response)
- [ ] Document click from search results logs `selected_document_id`
- [ ] Admin endpoint: `GET /api/admin/search-events?days=30` returns mode breakdown

### Dependencies

- [ ] ISS-033

### Definition of Done

- [ ] Search logs created for all modes
- [ ] Click tracking wired in knowledge UI
