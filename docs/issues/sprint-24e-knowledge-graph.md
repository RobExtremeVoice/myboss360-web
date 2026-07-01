# Sprint 24E — Knowledge Graph

**Milestone:** v2.0 Multi-Agent System  
**Sprint:** 24E  
**Total SP:** 30

---

## ISS-078 — Design Knowledge Graph schema (entities + relationships)

**Labels:** `task`, `database`, `agents`, `knowledge`, `high-priority`, `sprint-24`, `v2.0`  
**Story Points:** 5  
**Priority:** P0

### Description

Design and implement the Knowledge Graph schema extending the Knowledge Engine. Entities represent real-world objects; relationships represent typed connections between them.

### Acceptance Criteria

- [ ] `kg_entities` table: `id`, `workspace_id`, `entity_type` (`person`|`company`|`product`|`project`|`decision`|`event`), `name`, `external_id` (CRM ID, Calendar ID, etc.), `properties JSONB`, `created_at`
- [ ] `kg_relationships` table: `id`, `workspace_id`, `source_entity_id`, `target_entity_id`, `relationship_type` (`works_at`|`manages`|`made`|`references`|`supersedes`|`involves`|`related_to`), `properties JSONB`, `confidence FLOAT`, `created_at`
- [ ] `kg_document_entities` junction: links `knowledge_documents` to `kg_entities`
- [ ] Indexes: `kg_entities(workspace_id, entity_type)`, `kg_relationships(source_entity_id)`, `kg_relationships(target_entity_id)`
- [ ] Full RLS on all graph tables

### Dependencies

- [ ] Knowledge Engine (v1.1 — shipped)

### Definition of Done

- [ ] Migration runs successfully
- [ ] Graph tables accessible via Supabase
- [ ] RLS tested: cross-workspace query returns empty

---

## ISS-079 — Implement entity extraction service

**Labels:** `feature`, `agents`, `knowledge`, `ai`, `high-priority`, `sprint-24`, `v2.0`  
**Story Points:** 8  
**Priority:** P0

### Description

Extract entities from knowledge documents using AI and populate `kg_entities`. Run on document creation and update.

### Acceptance Criteria

- [ ] `extractEntities(document) → Entity[]` calls AI to identify: people (name, title, email), companies (name), products, projects, decisions, dates
- [ ] Extracted entities matched to existing `kg_entities` by name (fuzzy match, threshold 0.9)
- [ ] New entities created; matched entities updated with new properties
- [ ] `kg_document_entities` records created for each entity found in document
- [ ] Extraction integrated into `createDocument` and `updateDocument` pipeline (async, non-blocking)
- [ ] Entity extraction rate: ≥ 1 entity per 500-word document (quality floor)

### Dependencies

- [ ] ISS-078 (schema)

### Definition of Done

- [ ] Create document mentioning "Acme Corp" → `kg_entities` record created with `entity_type: 'company'`
- [ ] Same entity extracted from two docs → single entity with two document links

---

## ISS-080 — Build relationship inference engine

**Labels:** `feature`, `agents`, `knowledge`, `ai`, `high-priority`, `sprint-24`, `v2.0`  
**Story Points:** 8  
**Priority:** P0

### Description

Infer relationships between entities using AI and co-occurrence patterns. E.g., "John Smith, CEO of Acme Corp" → `John Smith -[works_at]→ Acme Corp`.

### Acceptance Criteria

- [ ] `inferRelationships(document, entities) → Relationship[]` extracts entity relationships from document text
- [ ] Confidence scoring: explicit statement (1.0), co-occurrence in same sentence (0.8), co-occurrence in same paragraph (0.6)
- [ ] Relationships with confidence < 0.5 not stored
- [ ] Existing relationship updated (confidence re-scored as max of existing and new evidence)
- [ ] Graph density target: ≥ 0.5 relationships per entity after processing 100 documents

### Dependencies

- [ ] ISS-079 (entity extraction)

### Definition of Done

- [ ] "Meeting with John Smith (CEO, Acme)" → `John Smith -[works_at]→ Acme Corp` relationship inferred
- [ ] Low-confidence relationships not stored

---

## ISS-081 — Add graph traversal API for agent use

**Labels:** `feature`, `agents`, `api`, `high-priority`, `sprint-24`, `v2.0`  
**Story Points:** 5  
**Priority:** P0

### Description

Build a graph traversal API that agents can call via MCP to navigate the Knowledge Graph and retrieve structured context.

### Acceptance Criteria

- [ ] `GET /api/knowledge-graph/traverse?from={entityId}&via={relationshipType}&depth={1-3}` returns entity + relationship graph
- [ ] `GET /api/knowledge-graph/entity?name={name}&type={type}` entity lookup by name + type
- [ ] `GET /api/knowledge-graph/connected-documents?entityId={id}` returns documents linked to entity
- [ ] Response includes: matched entities, traversed relationships, linked documents
- [ ] Max depth: 3 (prevent runaway graph traversal)
- [ ] Latency target: p95 < 500 ms at depth 3 for graphs ≤ 100,000 entities

### Dependencies

- [ ] ISS-080

### Definition of Done

- [ ] Traverse from "Acme Corp" depth 2 → returns employees, deals, related documents
- [ ] Latency < 500 ms on test graph

---

## ISS-082 — Create Knowledge Graph visualization UI

**Labels:** `feature`, `agents`, `ui`, `knowledge`, `medium-priority`, `sprint-24`, `v2.0`  
**Story Points:** 4  
**Priority:** P2

### Description

Interactive graph visualization at `/dashboard/knowledge/graph` allowing executives to explore entity relationships visually.

### Acceptance Criteria

- [ ] Force-directed graph layout (using D3.js or similar — check if already available as transitive dep before adding)
- [ ] Nodes: colored by entity type (person=blue, company=green, decision=orange)
- [ ] Edges: labeled by relationship type
- [ ] Click node → shows entity details panel with linked documents
- [ ] Search: type entity name to center graph on that node
- [ ] Pan and zoom
- [ ] Performance: renders ≤ 200 nodes without degradation

### Dependencies

- [ ] ISS-081

### Definition of Done

- [ ] Graph renders with real entities from workspace
- [ ] Click → document list shown for entity
