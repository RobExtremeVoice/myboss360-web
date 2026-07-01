# Sprint 21A — Embeddings

**Milestone:** v1.3 Knowledge Intelligence  
**Sprint:** 21A  
**Total SP:** 23

---

## ISS-022 — Enable pgvector and add vector column to knowledge_chunks

**Labels:** `task`, `database`, `embeddings`, `vector-search`, `high-priority`, `sprint-21`, `v1.3`  
**Story Points:** 3  
**Priority:** P0

### Description

Enable the `pgvector` Postgres extension and add a `vector(1536)` column to `knowledge_chunks`. Create an IVFFlat index for approximate nearest-neighbor search.

### Acceptance Criteria

- [ ] Migration file `supabase/migrations/20261001000001_pgvector.sql` created
- [ ] `CREATE EXTENSION IF NOT EXISTS vector` in migration
- [ ] `ALTER TABLE knowledge_chunks ADD COLUMN embedding vector(1536)` in migration
- [ ] IVFFlat index created: `CREATE INDEX ON knowledge_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)`
- [ ] `types/database.ts` updated: `embedding` column typed as `string | null` (JSON array serialized)
- [ ] Migration is backward-compatible: existing rows have `embedding = NULL` (not an error)

### Dependencies

- [ ] Supabase Pro tier (required for pgvector)

### Definition of Done

- [ ] Migration runs successfully on local Supabase
- [ ] `knowledge_chunks` table has `embedding` column
- [ ] Existing queries unaffected

---

## ISS-023 — Implement OpenAI text-embedding-3-small integration

**Labels:** `feature`, `embeddings`, `ai`, `high-priority`, `sprint-21`, `v1.3`  
**Story Points:** 5  
**Priority:** P0

### Description

Build the embedding provider abstraction and OpenAI `text-embedding-3-small` implementation. Provider interface allows future swap to Cohere, Anthropic, or local models without changing callers.

### Acceptance Criteria

- [ ] `EmbeddingProvider` interface: `embed(texts: string[]): Promise<number[][]>`
- [ ] `OpenAIEmbeddingProvider` implements interface using `text-embedding-3-small` (1536 dims)
- [ ] Batch size: max 100 texts per API call (OpenAI limit)
- [ ] Retry logic: 3 retries with exponential backoff on 429/503 errors
- [ ] Token count per request logged for cost monitoring
- [ ] `OPENAI_EMBEDDING_MODEL` env var controls model (defaults to `text-embedding-3-small`)

### Dependencies

- [ ] ISS-022 (pgvector column exists)
- [ ] OpenAI API key (already in `.env.local`)

### Definition of Done

- [ ] `embed(['hello world'])` returns a `number[1536]` array
- [ ] Batch of 100 texts embedded in a single API call
- [ ] Rate limit retry tested with mocked 429 response

---

## ISS-024 — Build chunk embedding service (create/update hooks)

**Labels:** `feature`, `embeddings`, `knowledge`, `high-priority`, `sprint-21`, `v1.3`  
**Story Points:** 8  
**Priority:** P0

### Description

Integrate embedding generation into the document pipeline. When a document is created or re-chunked (on content update), embed all new chunks and store vectors in `knowledge_chunks.embedding`.

### Acceptance Criteria

- [ ] `createDocument` in `knowledge-service.ts`: after `chunksRepo.createMany()`, call `embedChunks(chunks)`
- [ ] `updateDocument` (content changed): after re-chunk, embed new chunks
- [ ] `embedChunks(chunks)` batches by 100, calls embedding provider, calls `chunksRepo.updateEmbeddingId` (repurposed: store serialized vector in a new column or update embedding directly)
- [ ] Embedding failures logged but do not fail document creation (embeddings are optional for v1.1 compatibility)
- [ ] `knowledge_chunks.embedding` is `null` until embedding completes (async acceptable)
- [ ] Existing `embedding_id TEXT` column retained for backward compatibility; new `embedding vector(1536)` is the live column

### Dependencies

- [ ] ISS-022 (vector column), ISS-023 (embedding provider)

### Definition of Done

- [ ] `POST /api/knowledge` (create doc) → chunks have non-null `embedding` after creation
- [ ] Embedding failure → document still created, chunk embedding is null
- [ ] No extra API round-trips: chunks batched in groups of ≤ 100

---

## ISS-025 — Create embedding backfill migration for existing chunks

**Labels:** `task`, `embeddings`, `database`, `high-priority`, `sprint-21`, `v1.3`  
**Story Points:** 5  
**Priority:** P0

### Description

Embed all existing `knowledge_chunks` that have `embedding IS NULL`. Run as a background job (not a blocking migration) to avoid downtime and API rate limit exhaustion.

### Acceptance Criteria

- [ ] `scripts/backfill-embeddings.ts` script processes chunks in batches of 100
- [ ] Processes chunks in ascending `created_at` order
- [ ] Writes progress to stdout: `Embedded chunk 450/1230...`
- [ ] Resumable: re-running skips chunks that already have embeddings
- [ ] Respects OpenAI rate limit: max 500 RPM (inserts 500ms delay between batches if needed)
- [ ] Script exits with code 0 on success, 1 on error

### Dependencies

- [ ] ISS-023 (embedding provider), ISS-024 (chunk embedding service pattern)

### Definition of Done

- [ ] Running script on a 1000-chunk corpus completes without error
- [ ] Re-running script on same corpus changes nothing (idempotent)
- [ ] All chunks in `knowledge_chunks` have non-null `embedding` after script

---

## ISS-026 — Add embedding cost monitoring and usage tracking

**Labels:** `task`, `embeddings`, `medium-priority`, `sprint-21`, `v1.3`  
**Story Points:** 2  
**Priority:** P2

### Description

Track OpenAI embedding API usage (token count, request count, estimated cost) per workspace so operators can monitor spend and forecast costs.

### Acceptance Criteria

- [ ] `embedding_usage_logs` table: `workspace_id`, `chunk_count`, `token_count`, `estimated_cost_usd`, `model`, `created_at`
- [ ] Usage logged after every embedding batch
- [ ] `GET /api/admin/embedding-usage` returns monthly totals per workspace (admin only)
- [ ] Cost estimate: `token_count * 0.00000002` (text-embedding-3-small pricing)

### Dependencies

- [ ] ISS-024 (chunk embedding service)

### Definition of Done

- [ ] Embedding call → usage record created
- [ ] Admin endpoint returns correct monthly aggregate
