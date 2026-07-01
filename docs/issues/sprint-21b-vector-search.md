# Sprint 21B — Vector Search

**Milestone:** v1.3 Knowledge Intelligence  
**Sprint:** 21B  
**Total SP:** 18

---

## ISS-027 — Implement semantic_search DB function (cosine similarity)

**Labels:** `feature`, `vector-search`, `database`, `high-priority`, `sprint-21`, `v1.3`  
**Story Points:** 5  
**Priority:** P0

### Description

Create a Postgres RPC function `search_knowledge_chunks` that performs vector similarity search using pgvector cosine distance. The function is workspace-scoped and respects RLS.

### Acceptance Criteria

- [ ] Migration adds function:
  ```sql
  CREATE OR REPLACE FUNCTION search_knowledge_chunks(
    query_embedding vector(1536),
    workspace_id_filter UUID,
    match_threshold FLOAT DEFAULT 0.75,
    match_count INT DEFAULT 10
  ) RETURNS TABLE (
    chunk_id UUID,
    document_id UUID,
    content TEXT,
    similarity FLOAT
  )
  ```
- [ ] Uses `1 - (embedding <=> query_embedding)` as cosine similarity
- [ ] Filters: `workspace_id = workspace_id_filter` AND `deleted_at IS NULL` AND `similarity >= match_threshold`
- [ ] Ordered by `similarity DESC LIMIT match_count`
- [ ] Function callable via Supabase `.rpc('search_knowledge_chunks', {...})`

### Dependencies

- [ ] ISS-022 (pgvector + vector column)

### Definition of Done

- [ ] Function returns correct chunks for a known query
- [ ] Empty result set when no chunks meet threshold (no error)
- [ ] Workspace isolation tested: cross-workspace query returns empty

---

## ISS-028 — Replace mock semanticSearch with live pgvector search

**Labels:** `feature`, `vector-search`, `rag`, `high-priority`, `sprint-21`, `v1.3`  
**Story Points:** 5  
**Priority:** P0

### Description

Replace the mock `semanticSearch` implementation in `services/knowledge/search-service.ts` with a live implementation using the `search_knowledge_chunks` RPC function and the embedding provider.

### Acceptance Criteria

- [ ] `semanticSearch(query)` implementation:
  1. Call embedding provider: `embed([query.query])` → `number[1536]`
  2. Call `db.rpc('search_knowledge_chunks', { query_embedding, workspace_id_filter, match_threshold, match_count })`
  3. Join chunk results to `knowledge_documents` (fetch full document for each unique `document_id`)
  4. Deduplicate to one result per document (keep chunk with highest similarity)
  5. Return `SearchResponse` with `searchType: 'semantic'`
- [ ] Latency target: p95 < 200 ms
- [ ] Falls back to keyword search if embedding provider errors (log warning, return fallback result)

### Dependencies

- [ ] ISS-023 (embedding provider), ISS-027 (DB function)

### Definition of Done

- [ ] `GET /api/knowledge?action=search&q=pricing+strategy&mode=semantic` returns semantically relevant documents
- [ ] Embedding provider error → graceful fallback to keyword results

---

## ISS-029 — Build semantic search API endpoint with filters

**Labels:** `feature`, `vector-search`, `api`, `medium-priority`, `sprint-21`, `v1.3`  
**Story Points:** 5  
**Priority:** P1

### Description

Extend `GET /api/knowledge?action=search` to support all search modes and filter parameters needed for AI context injection (object type, category, collection).

### Acceptance Criteria

- [ ] `mode` query param: `keyword` (default) | `semantic` | `hybrid`
- [ ] Filter params: `objectTypes` (comma-separated), `categories`, `collectionId`, `status`, `limit` (max 50)
- [ ] `matchThreshold` param for semantic search (default 0.75)
- [ ] Response includes `durationMs`, `searchType`, `total` for monitoring
- [ ] Invalid `mode` returns HTTP 400

### Dependencies

- [ ] ISS-028 (semantic search live)

### Definition of Done

- [ ] All three modes work end-to-end via API
- [ ] Filters applied correctly
- [ ] HTTP 400 on invalid mode

---

## ISS-030 — Add search relevance testing suite

**Labels:** `test`, `vector-search`, `rag`, `medium-priority`, `sprint-21`, `v1.3`  
**Story Points:** 3  
**Priority:** P1

### Description

Create a test suite that verifies search quality across all three modes using a fixed corpus of 20 test documents. Tests should detect regressions in search relevance, not just API behavior.

### Acceptance Criteria

- [ ] Test corpus: 20 documents covering all `object_type` values seeded in `tests/fixtures/knowledge-corpus.ts`
- [ ] Golden set: 10 query → expected top-3 document pairs (manually verified)
- [ ] Tests run against real Supabase test database (not mocks)
- [ ] Precision@3 ≥ 0.8 on golden set for all search modes
- [ ] Tests excluded from main `pnpm test` run; invoked via `pnpm test:search-quality`

### Dependencies

- [ ] ISS-028, ISS-029

### Definition of Done

- [ ] `pnpm test:search-quality` passes with precision@3 ≥ 0.8
- [ ] Test corpus checked into repo
