# Knowledge Engine

The Knowledge Engine is MyBoss360's permanent knowledge layer — a structured store of institutional memory that AI features query to produce grounded, context-aware executive assistance.

## Architecture

```
raw content
    │
    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Document Pipeline                           │
│                                                                     │
│   parse  ──►  normalize  ──►  chunk  ──►  store                   │
│                                                 │                   │
│                                         knowledge_documents         │
│                                         knowledge_chunks            │
└─────────────────────────────────────────────────────────────────────┘
                                                  │
                                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Search Layer                                │
│                                                                     │
│   keyword  ──►  trigram index (live)                               │
│   semantic ──►  pgvector + embeddings (Sprint 20)                  │
│   hybrid   ──►  RRF scoring (Sprint 20)                            │
└─────────────────────────────────────────────────────────────────────┘
```

## Database Schema

Nine tables form the knowledge layer (migration `20260701000001_knowledge_schema.sql`):

| Table | Purpose |
|---|---|
| `knowledge_collections` | Logical groupings of documents per workspace |
| `knowledge_sources` | Origin system registry (CRM, email, calendar, manual) |
| `knowledge_documents` | Core document entity with versioning + soft deletes |
| `knowledge_chunks` | RAG fragments; each chunk holds `embedding_id` for future pgvector |
| `knowledge_tags` | Workspace-scoped taxonomy |
| `document_tags` | Junction: many documents ↔ many tags |
| `knowledge_links` | Typed doc-to-doc relationships (references, supersedes, related) |
| `document_versions` | Immutable version history snapshot before each update |
| `document_permissions` | Per-document ACL (user or role, not both) |

All tables have full RLS enforced via `is_workspace_member()` or EXISTS subqueries. Trigram GIN indexes on `knowledge_documents.title` and `knowledge_documents.content` power keyword search without full-text-search config.

## Document Pipeline

`services/knowledge/document-pipeline.ts` — zero external dependencies.

### Parse

`parseDocument(rawContent, mimeType)` normalizes raw text into clean content plus metadata (word count, character count, parsed timestamp). The MIME type parameter is reserved for binary parsers (PDF, DOCX) to be wired in Sprint 20.

### Chunk Strategies

| Strategy | Description |
|---|---|
| `paragraph` | Split on `\n\n`; merge short paragraphs up to `maxChunkSize` tokens |
| `sentence` | Split on `.?!` boundaries; merge short sentences |
| `fixed_size` | Fixed word-count windows with configurable overlap |
| `semantic` | Placeholder — falls back to `paragraph` until NLP model is available |

Default is `paragraph` with 512-token max and 50-token overlap. Each chunk carries an estimated token count (`Math.ceil(chars / 4)`).

### Pipeline Config (`config/knowledge.ts`)

```
defaultChunkStrategy:   'paragraph'
defaultMaxChunkSize:    512 tokens
defaultChunkOverlap:    50 tokens
maxChunksPerDocument:   1000
maxDocumentSizeBytes:   5 MB
defaultPageSize:        20
maxPageSize:            100
defaultSearchLimit:     10
maxSearchLimit:         50
semanticScoreThreshold: 0.75
```

## Object Model

Documents are typed by `object_type` and `category`:

**Object types** (15): `company_profile`, `policy`, `procedure`, `sop`, `product`, `service`, `playbook`, `contract`, `meeting_notes`, `document`, `email`, `calendar_event`, `executive_decision`, `customer_notes`, `project_documentation`

**Categories** (9): `executive`, `meeting`, `policy`, `playbook`, `hr`, `finance`, `legal`, `marketing`, `operations`

## Services

### `createKnowledgeService(db)`

Full CRUD over documents, collections, and tags. On `createDocument`, automatically runs the parse→chunk pipeline and stores chunks. On `updateDocument`, saves a version snapshot first, then re-chunks if content changed.

### `createKnowledgeSearchService(db)`

Three search modes sharing a common `SearchQuery`/`SearchResponse` contract:

- **`keywordSearch`** — live: Supabase `ilike` on title + content with trigram acceleration
- **`semanticSearch`** — mock: falls back to keyword; reserved for Sprint 20 pgvector
- **`hybridSearch`** — mock: falls back to keyword; reserved for Sprint 20 RRF scoring

### Repositories

| Repository | Key methods |
|---|---|
| `createKnowledgeDocumentsRepository` | `findById`, `list`, `listByTag`, `create`, `update`, `softDelete`, `setTags`, `count` |
| `createKnowledgeChunksRepository` | `listByDocument`, `createMany`, `deleteByDocument`, `updateEmbeddingId` |
| `createKnowledgeCollectionsRepository` | `findById`, `findDefault`, `list`, `create`, `update`, `softDelete` |
| `createKnowledgeTagsRepository` | `findById`, `findBySlug`, `list`, `create`, `update`, `delete` |

## API

`app/api/knowledge/route.ts` exposes the full knowledge layer via four HTTP verbs:

| Method | Action | Description |
|---|---|---|
| GET | (default) | List documents with filters (status, objectType, category, collectionId) |
| GET | `action=search&q=` | Keyword / semantic / hybrid search |
| GET | `action=collections` | List collections |
| GET | `action=tags` | List tags |
| POST | (default) | Create document (runs pipeline, stores chunks) |
| POST | `action=createCollection` | Create collection |
| POST | `action=createTag` | Create tag |
| PATCH | — | Update document (saves version, re-chunks if content changed) |
| DELETE | `?id=` | Soft-delete document |

All routes authenticate via Supabase SSR, resolve workspace, and wrap handlers in try/catch returning JSON 500.

## Future Roadmap

### Sprint 20 — Embeddings & Vector Search

- Enable `pgvector` extension in Supabase
- Add `vector(1536)` column to `knowledge_chunks`
- Integrate embedding provider (OpenAI `text-embedding-3-small` or equivalent)
- On `createDocument`/`updateDocument`: call embedding API per chunk, store vector
- Implement true `semanticSearch`: vectorize query → `ORDER BY embedding <-> $1 LIMIT $2`
- Wire `embedding_id` column to track which chunks have embeddings

### Sprint 21 — Hybrid RAG

- Implement Reciprocal Rank Fusion: `score_rrf = Σ 1 / (60 + rank_i)` across keyword + semantic result lists
- Surface `hybridSearch` as default search mode for AI assistant
- Add re-ranking pass (optional: cross-encoder model)

### Sprint 22 — Source Integrations

- Wire `knowledge_sources` to live connectors: CRM events, calendar, email
- Auto-ingest: new meeting → parse transcript → chunk → embed → store
- Incremental sync: re-embed only changed chunks (compare content hash)

### Sprint 23 — Executive Context Injection

- Modify AI assistant system prompt construction to run a hybrid knowledge search per user message
- Inject top-K matching chunks as context blocks with source attribution
- Gate chunk injection on `document_permissions` ACL

### Sprint 24 — Knowledge UI

- Knowledge browser in dashboard (list + search)
- Document editor with auto-chunk preview
- Collection and tag management
- Version history viewer
