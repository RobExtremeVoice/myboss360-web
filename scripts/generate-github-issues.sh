#!/usr/bin/env bash
# generate-github-issues.sh — Create all 82 MyBoss360 issues on GitHub
# Prerequisites: gh auth login, labels created (create-labels.sh), milestones created (create-milestones.sh)
# Usage: bash scripts/generate-github-issues.sh
set -euo pipefail

REPO="${REPO:-$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || echo '')}"
if [[ -z "$REPO" ]]; then
  echo "ERROR: Could not detect repo. Set REPO=owner/repo or run from repo root." >&2
  exit 1
fi

echo "Generating issues on: $REPO"
echo "This will create 82 issues. Press Ctrl+C within 5 seconds to abort."
sleep 5

CREATED=0
FAILED=0

create_issue() {
  local title="$1" labels="$2" milestone="$3" body="$4"
  local tmpfile
  tmpfile=$(mktemp /tmp/issue_XXXXXX.md)
  printf '%s' "$body" > "$tmpfile"
  local url
  if url=$(gh issue create \
    --repo "$REPO" \
    --title "$title" \
    --body-file "$tmpfile" \
    --label "$labels" \
    --milestone "$milestone" 2>&1); then
    local num
    num=$(echo "$url" | grep -oE '[0-9]+$' || echo '?')
    echo "  ✓ #$num — $title"
    (( CREATED++ )) || true
  else
    echo "  ✗ FAILED — $title"
    echo "    $url" | head -2
    (( FAILED++ )) || true
  fi
  rm -f "$tmpfile"
}

# ────────────────────────────────────────────────────────────────────────────
echo ""
echo "═══ Sprint 20A — Google Calendar ═══════════════════════════════════════"
# ────────────────────────────────────────────────────────────────────────────

create_issue \
  "[TASK] Set up Google Cloud project and OAuth 2.0 credentials" \
  "task,calendar,integrations,high-priority,sprint-20,v1.2" \
  "v1.2 — Connected Executive" \
  "$(cat << 'EOF'
## Summary
Create and configure the Google Cloud project backing all Google Workspace integrations (Calendar, Gmail, Contacts, Drive).

## Acceptance Criteria
- [ ] Google Cloud project created with ID documented in `.env.example`
- [ ] Calendar API, Gmail API, People API, and Drive API enabled
- [ ] OAuth consent screen configured with required scopes
- [ ] Credentials added to `.env.local` (gitignored) and `.env.example` (placeholders only)

## Dependencies
- Google Cloud billing account required

## Story Points
3

## Priority
P0

## Definition of Done
- [ ] Developer can run OAuth flow locally
- [ ] No credentials committed to git
- [ ] `.env.example` updated
EOF
)"

create_issue \
  "[FEATURE] Implement Google OAuth 2.0 authorization flow" \
  "feature,calendar,integrations,auth,high-priority,sprint-20,v1.2" \
  "v1.2 — Connected Executive" \
  "$(cat << 'EOF'
## Summary
Build the end-to-end OAuth 2.0 PKCE flow for Google Workspace. Store tokens encrypted in Supabase Vault.

## Acceptance Criteria
- [ ] `GET /api/integrations/google/auth` redirects to Google OAuth consent screen
- [ ] `GET /api/integrations/google/callback` handles authorization code exchange
- [ ] Tokens stored encrypted in `workspace_integrations` table
- [ ] Automatic token refresh before expiry
- [ ] `DELETE /api/integrations/google` revokes access and removes all tokens
- [ ] Settings UI shows connection status

## Dependencies
- [ ] ISS-001: Google Cloud credentials

## Story Points
5

## Priority
P0

## Definition of Done
- [ ] OAuth flow works end-to-end in local + staging
- [ ] Refresh token survives server restart
- [ ] Revocation removes all Google-sourced data
EOF
)"

create_issue \
  "[FEATURE] Create Google Calendar event sync service (webhook + polling)" \
  "feature,calendar,integrations,high-priority,sprint-20,v1.2" \
  "v1.2 — Connected Executive" \
  "$(cat << 'EOF'
## Summary
Build the service that syncs Google Calendar events into `calendar_events` using push notifications (primary) and polling fallback.

## Acceptance Criteria
- [ ] Webhook endpoint receives and verifies push notifications
- [ ] New/updated events upserted within 30 seconds of change
- [ ] Deleted events soft-deleted
- [ ] Channel registration renewed before expiry (max 7 days)
- [ ] Polling fallback runs every 15 minutes

## Dependencies
- [ ] ISS-002: OAuth tokens

## Story Points
8

## Priority
P0

## Definition of Done
- [ ] Create calendar event → in DB within 30 seconds
- [ ] Delete event → soft-deleted in DB
- [ ] Unit tests for webhook verification
EOF
)"

create_issue \
  "[FEATURE] Build Executive Agenda view (/dashboard/agenda)" \
  "feature,calendar,ui,high-priority,sprint-20,v1.2" \
  "v1.2 — Connected Executive" \
  "$(cat << 'EOF'
## Summary
Create the Executive Agenda at `/dashboard/agenda` — unified daily/weekly view combining calendar events, tasks, and deals.

## Acceptance Criteria
- [ ] Today view: events in chronological order, tasks due today, overdue deal follow-ups
- [ ] Week view: 7-day horizontal layout
- [ ] Page loads in < 1 second (SSR)
- [ ] Empty state with helpful copy

## Dependencies
- [ ] ISS-003: Events in database

## Story Points
5

## Priority
P0

## Definition of Done
- [ ] Accessible from sidebar navigation
- [ ] Real data from `calendar_events`
- [ ] Renders on desktop and tablet
EOF
)"

create_issue \
  "[FEATURE] Add meeting context cards (pre-meeting knowledge surface)" \
  "feature,calendar,ai,knowledge,medium-priority,sprint-20,v1.2" \
  "v1.2 — Connected Executive" \
  "$(cat << 'EOF'
## Summary
For each upcoming meeting, surface a context card with relevant knowledge documents, CRM contacts, and open deals.

## Acceptance Criteria
- [ ] Context card shown for meetings starting within 60 minutes
- [ ] Card contains: top 3 knowledge docs, linked CRM contacts, open deals for attendees
- [ ] Card is dismissible
- [ ] Graceful empty state when no relevant context found

## Dependencies
- [ ] ISS-004: Agenda view
- [ ] Knowledge Engine (v1.1 shipped)

## Story Points
3

## Priority
P1

## Definition of Done
- [ ] Context card appears automatically before meetings
- [ ] Empty state shown when no context
EOF
)"

create_issue \
  "[FEATURE] Create post-meeting notes workflow" \
  "feature,calendar,knowledge,medium-priority,sprint-20,v1.2" \
  "v1.2 — Connected Executive" \
  "$(cat << 'EOF'
## Summary
After a meeting ends, prompt the executive to create meeting notes. Pre-populate the editor with meeting metadata.

## Acceptance Criteria
- [ ] 'Add notes' button on past meeting cards
- [ ] Editor pre-filled with meeting title, date, attendees
- [ ] Saved notes create `knowledge_documents` record with `object_type: 'meeting_notes'`
- [ ] Notes linked to attendee CRM contacts via `knowledge_links`

## Dependencies
- [ ] ISS-004: Agenda view
- [ ] Knowledge Engine API (v1.1 shipped)

## Story Points
3

## Priority
P1

## Definition of Done
- [ ] Meeting notes created and searchable
- [ ] Links to CRM contacts present
EOF
)"

# ────────────────────────────────────────────────────────────────────────────
echo ""
echo "═══ Sprint 20B — Google Gmail ══════════════════════════════════════════"
# ────────────────────────────────────────────────────────────────────────────

create_issue \
  "[FEATURE] Implement Gmail API integration with OAuth scopes" \
  "feature,gmail,integrations,auth,high-priority,sprint-20,v1.2" \
  "v1.2 — Connected Executive" \
  "$(cat << 'EOF'
## Summary
Extend Google OAuth with Gmail-specific scopes. Build Gmail API client wrapper with rate limiting and pagination.

## Acceptance Criteria
- [ ] `gmail.readonly` scope in OAuth flow
- [ ] `GmailApiClient` with `listThreads`, `getThread`, `getMessage`, `getProfile`
- [ ] Exponential backoff on 429 responses
- [ ] Pagination handled transparently

## Dependencies
- [ ] ISS-002: OAuth flow

## Story Points
5

## Priority
P0

## Definition of Done
- [ ] Can list and fetch Gmail threads with valid token
- [ ] Rate limit and pagination tested
EOF
)"

create_issue \
  "[FEATURE] Build email thread ingestion pipeline" \
  "feature,gmail,knowledge,high-priority,sprint-20,v1.2" \
  "v1.2 — Connected Executive" \
  "$(cat << 'EOF'
## Summary
Ingest Gmail threads into the Knowledge Engine as `email` type documents. Delta sync via `historyId`.

## Acceptance Criteria
- [ ] Threads ingested incrementally via `historyId`
- [ ] HTML stripped, boilerplate removed
- [ ] Thread metadata in `metadata` JSON
- [ ] Webhook trigger with 15-minute polling fallback

## Dependencies
- [ ] ISS-007: Gmail API client
- [ ] Knowledge Engine (v1.1 shipped)

## Story Points
8

## Priority
P0

## Definition of Done
- [ ] Send email → in Knowledge Engine within 60 seconds
- [ ] Delta sync does not re-ingest unchanged threads
EOF
)"

create_issue \
  "[FEATURE] Create AI-powered email summarization service" \
  "feature,gmail,ai,medium-priority,sprint-20,v1.2" \
  "v1.2 — Connected Executive" \
  "$(cat << 'EOF'
## Summary
Generate AI summaries of ingested Gmail threads and store in document metadata.

## Acceptance Criteria
- [ ] Summary generated async after ingestion
- [ ] Stored in `knowledge_documents.metadata.summary`
- [ ] Format: topic + key points + action items, ≤ 300 words
- [ ] Failure does not block ingestion

## Dependencies
- [ ] ISS-008: Thread ingestion

## Story Points
5

## Priority
P1

## Definition of Done
- [ ] New thread ingested with valid summary
- [ ] Summary failure does not prevent document creation
EOF
)"

create_issue \
  "[FEATURE] Implement contact-to-email thread linking" \
  "feature,gmail,crm,medium-priority,sprint-20,v1.2" \
  "v1.2 — Connected Executive" \
  "$(cat << 'EOF'
## Summary
Match thread participants to CRM contacts by email and create `knowledge_links` entries.

## Acceptance Criteria
- [ ] Exact email match → high confidence link
- [ ] Linked via `knowledge_links` with `link_type: 'related'`
- [ ] Unmatched participants cause no failure

## Dependencies
- [ ] ISS-008: Thread ingestion

## Story Points
3

## Priority
P1

## Definition of Done
- [ ] Email from known CRM contact → link created
- [ ] Unknown sender → no link, no error
EOF
)"

create_issue \
  "[FEATURE] Build action item extraction from email threads" \
  "feature,gmail,ai,medium-priority,sprint-20,v1.2" \
  "v1.2 — Connected Executive" \
  "$(cat << 'EOF'
## Summary
Extract action items and commitments from email threads using AI. Surface as tasks.

## Acceptance Criteria
- [ ] AI extracts: who committed to what by when
- [ ] Created in `tasks` with `source_document_id` link
- [ ] Only clear commitment language extracted
- [ ] Executive can dismiss extracted tasks

## Dependencies
- [ ] ISS-009: Summarization (shares AI call)

## Story Points
5

## Priority
P1

## Definition of Done
- [ ] "I'll send proposal by Friday" → task created
- [ ] Low-confidence extractions not auto-created
EOF
)"

create_issue \
  "[FEATURE] Create daily unread email digest" \
  "feature,gmail,ai,automation,medium-priority,sprint-20,v1.2" \
  "v1.2 — Connected Executive" \
  "$(cat << 'EOF'
## Summary
Daily digest of unread emails requiring attention, delivered as in-app notification at 07:30 local time.

## Acceptance Criteria
- [ ] Generated daily at configurable time (default 07:30)
- [ ] Top 5 threads by AI-ranked importance
- [ ] Pending action items from previous digests
- [ ] "Mark all as reviewed" action

## Dependencies
- [ ] ISS-008: Thread ingestion

## Story Points
2

## Priority
P1

## Definition of Done
- [ ] Digest in notification panel at configured time
- [ ] No digest when no unread threads
EOF
)"

# ────────────────────────────────────────────────────────────────────────────
echo ""
echo "═══ Sprint 20C — Google Contacts ═══════════════════════════════════════"
# ────────────────────────────────────────────────────────────────────────────

create_issue \
  "[FEATURE] Build Google Contacts sync service (People API)" \
  "feature,contacts,integrations,high-priority,sprint-20,v1.2" \
  "v1.2 — Connected Executive" \
  "$(cat << 'EOF'
## Summary
Sync Google Contacts via People API into staging table. Incremental sync via `syncToken`.

## Acceptance Criteria
- [ ] `PeopleApiClient` wraps People API
- [ ] Full sync on first connection, incremental via `syncToken`
- [ ] Stored in `google_contacts_staging`
- [ ] Contacts without name and email skipped

## Dependencies
- [ ] ISS-002: OAuth with contacts scope

## Story Points
5

## Priority
P0

## Definition of Done
- [ ] Full sync imports all contacts
- [ ] Incremental sync only fetches changed contacts
EOF
)"

create_issue \
  "[FEATURE] Implement CRM contact enrichment from Google Contacts" \
  "feature,contacts,crm,high-priority,sprint-20,v1.2" \
  "v1.2 — Connected Executive" \
  "$(cat << 'EOF'
## Summary
Match staged Google contacts to CRM contacts by email and enrich missing fields. Never overwrite user-set fields.

## Acceptance Criteria
- [ ] Exact email match → enrich phone, title, company, photo_url
- [ ] User-locked fields never overwritten
- [ ] Enrichment log in `contacts.metadata.enrichment_log`
- [ ] 'Enriched from Google' badge in UI

## Dependencies
- [ ] ISS-013: Google contacts staging

## Story Points
5

## Priority
P0

## Definition of Done
- [ ] Known CRM contact enriched with Google data
- [ ] Manually set fields not overwritten
EOF
)"

create_issue \
  "[FEATURE] Add bidirectional contact sync (CRM → Google)" \
  "feature,contacts,crm,medium-priority,sprint-20,v1.2" \
  "v1.2 — Connected Executive" \
  "$(cat << 'EOF'
## Summary
Push new CRM contacts to Google Contacts when workspace admin enables this feature.

## Acceptance Criteria
- [ ] Workspace setting: 'Sync CRM contacts to Google' (default off)
- [ ] New CRM contacts pushed to Google within 30 seconds when enabled
- [ ] CRM contact deletes do NOT delete Google contacts

## Dependencies
- [ ] ISS-014: Enrichment and matching

## Story Points
3

## Priority
P1

## Definition of Done
- [ ] New CRM contact appears in Google within 30 seconds
- [ ] Delete in CRM does not delete in Google
EOF
)"

create_issue \
  "[FEATURE] Build deduplication detection UI" \
  "feature,contacts,crm,ui,medium-priority,sprint-20,v1.2" \
  "v1.2 — Connected Executive" \
  "$(cat << 'EOF'
## Summary
Surface medium-confidence contact duplicate candidates for executive review (merge/skip/distinct).

## Acceptance Criteria
- [ ] 'Possible duplicates' section in CRM Contacts view
- [ ] Side-by-side comparison with matching fields highlighted
- [ ] Actions: Merge, Skip, Distinct

## Dependencies
- [ ] ISS-014: Enrichment creates duplicates

## Story Points
1

## Priority
P2

## Definition of Done
- [ ] Duplicate pairs surfaced
- [ ] Merge creates unified record
EOF
)"

# ────────────────────────────────────────────────────────────────────────────
echo ""
echo "═══ Sprint 20D — Google Drive ══════════════════════════════════════════"
# ────────────────────────────────────────────────────────────────────────────

create_issue \
  "[FEATURE] Implement Google Drive API integration" \
  "feature,drive,integrations,high-priority,sprint-20,v1.2" \
  "v1.2 — Connected Executive" \
  "$(cat << 'EOF'
## Summary
Build Drive API client and webhook infrastructure for file change notifications.

## Acceptance Criteria
- [ ] `DriveApiClient`: `listFiles`, `getFile`, `exportFile`, `watchChanges`
- [ ] Change notifications via `changes.watch`
- [ ] Webhook payload verified and routed to sync worker

## Dependencies
- [ ] ISS-002: OAuth with drive scope

## Story Points
3

## Priority
P0

## Definition of Done
- [ ] Can list files and receive change webhooks locally
EOF
)"

create_issue \
  "[FEATURE] Build Drive folder sync service" \
  "feature,drive,knowledge,high-priority,sprint-20,v1.2" \
  "v1.2 — Connected Executive" \
  "$(cat << 'EOF'
## Summary
Allow executives to designate Drive folders for automatic sync into the Knowledge Engine.

## Acceptance Criteria
- [ ] Folder selection in Settings → Integrations
- [ ] All supported files ingested on initial connection
- [ ] New files ingested within 60 seconds via webhook
- [ ] `knowledge_sources` record created per synced folder

## Dependencies
- [ ] ISS-017: Drive API client

## Story Points
5

## Priority
P0

## Definition of Done
- [ ] Add file to folder → in Knowledge Engine within 60 seconds
EOF
)"

create_issue \
  "[FEATURE] Add Google Docs to Knowledge Engine pipeline" \
  "feature,drive,knowledge,high-priority,sprint-20,v1.2" \
  "v1.2 — Connected Executive" \
  "$(cat << 'EOF'
## Summary
Export Google Docs as plain text and ingest via the document pipeline, preserving heading structure.

## Acceptance Criteria
- [ ] Exported via `files.export(mimeType='text/plain')`
- [ ] Heading hierarchy preserved as paragraph boundaries
- [ ] Passed through existing `parseDocument()` + `chunkDocument()`
- [ ] `object_type` defaults to `'document'`

## Dependencies
- [ ] ISS-018: Folder sync

## Story Points
5

## Priority
P0

## Definition of Done
- [ ] Google Doc → knowledge document with correct chunks
EOF
)"

create_issue \
  "[FEATURE] Add PDF and DOCX parsing from Drive" \
  "feature,drive,knowledge,medium-priority,sprint-20,v1.2" \
  "v1.2 — Connected Executive" \
  "$(cat << 'EOF'
## Summary
Extend document pipeline to parse PDF and DOCX files from Drive without adding new packages.

## Acceptance Criteria
- [ ] PDF text extraction without new packages
- [ ] DOCX: unzip + extract `word/document.xml`, strip XML
- [ ] Passed to existing pipeline
- [ ] Files > 5 MB rejected with structured error

## Dependencies
- [ ] ISS-019: Pipeline integration pattern

## Story Points
5

## Priority
P1

## Definition of Done
- [ ] PDF uploaded → chunks created
- [ ] DOCX uploaded → chunks created
EOF
)"

create_issue \
  "[FEATURE] Implement incremental Drive sync (modifiedTime delta)" \
  "feature,drive,knowledge,medium-priority,sprint-20,v1.2" \
  "v1.2 — Connected Executive" \
  "$(cat << 'EOF'
## Summary
Re-ingest Drive files when modified. Compare Drive `modifiedTime` to stored `updated_at` to avoid unnecessary re-chunking.

## Acceptance Criteria
- [ ] Content change → re-parse + re-chunk (via `updateDocument`)
- [ ] Metadata-only change (rename) → update title only, no re-chunk
- [ ] Idempotent on unchanged files

## Dependencies
- [ ] ISS-018, ISS-019

## Story Points
4

## Priority
P1

## Definition of Done
- [ ] Edit Drive doc → re-chunked within 60 seconds
- [ ] Rename only → title updated, no re-chunk
EOF
)"

# ────────────────────────────────────────────────────────────────────────────
echo ""
echo "═══ Sprint 21A — Embeddings ════════════════════════════════════════════"
# ────────────────────────────────────────────────────────────────────────────

create_issue \
  "[TASK] Enable pgvector and add vector column to knowledge_chunks" \
  "task,database,embeddings,vector-search,high-priority,sprint-21,v1.3,migration" \
  "v1.3 — Knowledge Intelligence" \
  "$(cat << 'EOF'
## Summary
Enable pgvector Postgres extension and add `vector(1536)` column to `knowledge_chunks` with IVFFlat index.

## Acceptance Criteria
- [ ] Migration: `CREATE EXTENSION IF NOT EXISTS vector`
- [ ] `ALTER TABLE knowledge_chunks ADD COLUMN embedding vector(1536)`
- [ ] IVFFlat index: `USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)`
- [ ] `types/database.ts` updated
- [ ] Backward-compatible (existing rows have embedding = NULL)

## Dependencies
- [ ] Supabase Pro tier (required for pgvector)

## Story Points
3

## Priority
P0

## Definition of Done
- [ ] Migration runs successfully
- [ ] Existing queries unaffected
EOF
)"

create_issue \
  "[FEATURE] Implement OpenAI text-embedding-3-small integration" \
  "feature,embeddings,ai,high-priority,sprint-21,v1.3" \
  "v1.3 — Knowledge Intelligence" \
  "$(cat << 'EOF'
## Summary
Build embedding provider abstraction and OpenAI `text-embedding-3-small` implementation. Batch size 100, retry on rate limits.

## Acceptance Criteria
- [ ] `EmbeddingProvider` interface: `embed(texts: string[]) → Promise<number[][]>`
- [ ] `OpenAIEmbeddingProvider` using `text-embedding-3-small` (1536 dims)
- [ ] Max 100 texts per batch
- [ ] 3 retries with exponential backoff on 429/503

## Dependencies
- [ ] ISS-022: pgvector column

## Story Points
5

## Priority
P0

## Definition of Done
- [ ] `embed(['hello world'])` returns `number[1536]`
- [ ] Rate limit retry tested
EOF
)"

create_issue \
  "[FEATURE] Build chunk embedding service (create/update hooks)" \
  "feature,embeddings,knowledge,high-priority,sprint-21,v1.3" \
  "v1.3 — Knowledge Intelligence" \
  "$(cat << 'EOF'
## Summary
Integrate embedding generation into the document pipeline. Embed all chunks on document create/update.

## Acceptance Criteria
- [ ] `createDocument` → embed chunks after creation
- [ ] `updateDocument` (content changed) → embed new chunks
- [ ] Embedding failure does not fail document creation
- [ ] Chunks batched in groups of ≤ 100

## Dependencies
- [ ] ISS-022 (vector column), ISS-023 (embedding provider)

## Story Points
8

## Priority
P0

## Definition of Done
- [ ] Create doc → chunks have non-null `embedding`
- [ ] Embedding failure → document still created
EOF
)"

create_issue \
  "[TASK] Create embedding backfill migration for existing chunks" \
  "task,embeddings,database,high-priority,sprint-21,v1.3" \
  "v1.3 — Knowledge Intelligence" \
  "$(cat << 'EOF'
## Summary
Background script to embed all existing chunks with `embedding IS NULL`. Resumable and rate-limit-aware.

## Acceptance Criteria
- [ ] `scripts/backfill-embeddings.ts` processes chunks in batches of 100
- [ ] Progress logged: `Embedded chunk 450/1230...`
- [ ] Resumable: re-running skips already-embedded chunks
- [ ] Respects OpenAI rate limit

## Dependencies
- [ ] ISS-023, ISS-024

## Story Points
5

## Priority
P0

## Definition of Done
- [ ] Script completes on 1000-chunk corpus without error
- [ ] Re-run is idempotent
EOF
)"

create_issue \
  "[TASK] Add embedding cost monitoring and usage tracking" \
  "task,embeddings,medium-priority,sprint-21,v1.3" \
  "v1.3 — Knowledge Intelligence" \
  "$(cat << 'EOF'
## Summary
Track OpenAI embedding API usage per workspace for cost monitoring.

## Acceptance Criteria
- [ ] `embedding_usage_logs` table: workspace_id, chunk_count, token_count, estimated_cost_usd
- [ ] Usage logged after every embedding batch
- [ ] Admin endpoint returns monthly totals

## Dependencies
- [ ] ISS-024

## Story Points
2

## Priority
P2

## Definition of Done
- [ ] Embedding call → usage record created
EOF
)"

# ────────────────────────────────────────────────────────────────────────────
echo ""
echo "═══ Sprint 21B — Vector Search ═════════════════════════════════════════"
# ────────────────────────────────────────────────────────────────────────────

create_issue \
  "[FEATURE] Implement search_knowledge_chunks DB function (cosine similarity)" \
  "feature,vector-search,database,high-priority,sprint-21,v1.3" \
  "v1.3 — Knowledge Intelligence" \
  "$(cat << 'EOF'
## Summary
Create Postgres RPC function for workspace-scoped vector similarity search using pgvector cosine distance.

## Acceptance Criteria
- [ ] `search_knowledge_chunks(query_embedding, workspace_id_filter, match_threshold, match_count)`
- [ ] Returns: chunk_id, document_id, content, similarity
- [ ] Workspace isolation enforced

## Dependencies
- [ ] ISS-022: pgvector column

## Story Points
5

## Priority
P0

## Definition of Done
- [ ] Returns correct chunks for known query
- [ ] Cross-workspace query returns empty
EOF
)"

create_issue \
  "[FEATURE] Replace mock semanticSearch with live pgvector search" \
  "feature,vector-search,rag,high-priority,sprint-21,v1.3" \
  "v1.3 — Knowledge Intelligence" \
  "$(cat << 'EOF'
## Summary
Replace mock `semanticSearch` in `search-service.ts` with live embedding + pgvector implementation.

## Acceptance Criteria
- [ ] Embed query → call `search_knowledge_chunks` RPC → join to documents → return SearchResponse
- [ ] Latency p95 < 200 ms
- [ ] Falls back to keyword on embedding provider error

## Dependencies
- [ ] ISS-023 (embedding provider), ISS-027 (DB function)

## Story Points
5

## Priority
P0

## Definition of Done
- [ ] Semantic search returns relevant documents
- [ ] Graceful fallback on error
EOF
)"

create_issue \
  "[FEATURE] Build semantic search API endpoint with filters" \
  "feature,vector-search,api,medium-priority,sprint-21,v1.3" \
  "v1.3 — Knowledge Intelligence" \
  "$(cat << 'EOF'
## Summary
Extend `GET /api/knowledge?action=search` to support all search modes and filter parameters.

## Acceptance Criteria
- [ ] `mode` param: keyword | semantic | hybrid
- [ ] Filter params: objectTypes, categories, collectionId, status, limit
- [ ] Invalid mode returns HTTP 400

## Dependencies
- [ ] ISS-028

## Story Points
5

## Priority
P1

## Definition of Done
- [ ] All three modes work via API
- [ ] Filters applied correctly
EOF
)"

create_issue \
  "[TEST] Add search relevance testing suite" \
  "test,vector-search,rag,medium-priority,sprint-21,v1.3" \
  "v1.3 — Knowledge Intelligence" \
  "$(cat << 'EOF'
## Summary
Test suite verifying search quality across all three modes using a fixed 20-document corpus. Precision@3 ≥ 0.8.

## Acceptance Criteria
- [ ] 20-document test corpus in `tests/fixtures/knowledge-corpus.ts`
- [ ] 10 query → expected top-3 pairs (golden set)
- [ ] Precision@3 ≥ 0.8 on golden set for all modes
- [ ] Run via `pnpm test:search-quality`

## Dependencies
- [ ] ISS-028, ISS-029

## Story Points
3

## Priority
P1

## Definition of Done
- [ ] `pnpm test:search-quality` passes
EOF
)"

# ────────────────────────────────────────────────────────────────────────────
echo ""
echo "═══ Sprint 21C — Hybrid Retrieval ══════════════════════════════════════"
# ────────────────────────────────────────────────────────────────────────────

create_issue \
  "[FEATURE] Implement Reciprocal Rank Fusion (RRF) scoring algorithm" \
  "feature,rag,vector-search,high-priority,sprint-21,v1.3" \
  "v1.3 — Knowledge Intelligence" \
  "$(cat << 'EOF'
## Summary
Implement RRF as pure TypeScript: `score_rrf(doc) = Σ 1 / (k + rank_i)` with k=60. Unit tests for edge cases.

## Acceptance Criteria
- [ ] `reciprocalRankFusion(keywordResults, semanticResults, k=60)` in `services/knowledge/rrf.ts`
- [ ] 10 unit tests covering edge cases
- [ ] Results sorted by `rrf_score DESC`

## Dependencies
- [ ] ISS-027, ISS-029

## Story Points
5

## Priority
P0

## Definition of Done
- [ ] All 10 unit tests pass
- [ ] RRF scores monotonically decrease
EOF
)"

create_issue \
  "[FEATURE] Replace mock hybridSearch with live RRF implementation" \
  "feature,rag,vector-search,high-priority,sprint-21,v1.3" \
  "v1.3 — Knowledge Intelligence" \
  "$(cat << 'EOF'
## Summary
Replace mock `hybridSearch` with parallel keyword + semantic search combined via RRF.

## Acceptance Criteria
- [ ] `Promise.all([keywordSearch, semanticSearch])` then RRF merge
- [ ] Latency p95 < 300 ms
- [ ] Graceful degradation if one sub-search fails

## Dependencies
- [ ] ISS-028, ISS-031

## Story Points
5

## Priority
P0

## Definition of Done
- [ ] `mode=hybrid` returns merged results
- [ ] Single-source fallback works
EOF
)"

create_issue \
  "[FEATURE] Build unified search endpoint with chunk-level detail" \
  "feature,rag,api,medium-priority,sprint-21,v1.3" \
  "v1.3 — Knowledge Intelligence" \
  "$(cat << 'EOF'
## Summary
Expose hybrid search as default. Add chunk-level detail to responses for AI context injection.

## Acceptance Criteria
- [ ] Default mode changed to `hybrid`
- [ ] Response includes `matchedChunks[]` (top 2 per document)
- [ ] `chunk.content`, `chunk.chunkIndex`, `score` in each result

## Dependencies
- [ ] ISS-032

## Story Points
5

## Priority
P1

## Definition of Done
- [ ] Default search returns hybrid results with chunk detail
EOF
)"

create_issue \
  "[RESEARCH] Add search A/B testing framework" \
  "research,rag,vector-search,low-priority,sprint-21,v1.3" \
  "v1.3 — Knowledge Intelligence" \
  "$(cat << 'EOF'
## Summary
Lightweight framework to log search mode usage and result click-through. Informs default mode selection.

## Acceptance Criteria
- [ ] `search_events` table with query, mode, result_count, selected_document_id
- [ ] Each search request logged async
- [ ] Admin endpoint returns mode breakdown

## Dependencies
- [ ] ISS-033

## Story Points
3

## Priority
P2

## Definition of Done
- [ ] Search logs created for all modes
EOF
)"

# ────────────────────────────────────────────────────────────────────────────
echo ""
echo "═══ Sprint 21D — Knowledge Ranking ═════════════════════════════════════"
# ────────────────────────────────────────────────────────────────────────────

create_issue \
  "[FEATURE] Implement multi-signal document ranking" \
  "feature,rag,knowledge,high-priority,sprint-21,v1.3" \
  "v1.3 — Knowledge Intelligence" \
  "$(cat << 'EOF'
## Summary
Post-retrieval ranking using vector similarity (0.40), recency decay (0.30), access frequency (0.20), author authority (0.10).

## Acceptance Criteria
- [ ] `rankResults(results, query)` in `services/knowledge/ranking.ts`
- [ ] Recency: `exp(-0.05 * days_since_update)`
- [ ] Author authority: executive=1.0, manager=0.7, viewer=0.5
- [ ] 5 unit test ranking scenarios

## Dependencies
- [ ] ISS-032

## Story Points
5

## Priority
P0

## Definition of Done
- [ ] 5 unit tests pass
- [ ] Newer frequently-accessed docs rank above older ones at equal similarity
EOF
)"

create_issue \
  "[FEATURE] Build AI context injection into system prompt (RAG activation)" \
  "feature,rag,ai,high-priority,sprint-21,v1.3" \
  "v1.3 — Knowledge Intelligence" \
  "$(cat << 'EOF'
## Summary
Inject top-K knowledge chunks into AI system prompt per message. Core RAG activation.

## Acceptance Criteria
- [ ] `buildSystemPrompt(context)` accepts `knowledgeChunks: SearchResult[]`
- [ ] Max 5 chunks, max 2000 tokens of knowledge context
- [ ] Each chunk formatted: `[SOURCE: {title}]\n{content}`
- [ ] `POST /api/ai/messages` runs hybrid search before building prompt

## Dependencies
- [ ] ISS-033, ISS-035

## Story Points
5

## Priority
P0

## Definition of Done
- [ ] Ask about knowledge base doc → grounded answer
- [ ] Nothing in KB → AI answers from training data with disclaimer
EOF
)"

create_issue \
  "[TASK] Add document access frequency tracking" \
  "task,knowledge,medium-priority,sprint-21,v1.3" \
  "v1.3 — Knowledge Intelligence" \
  "$(cat << 'EOF'
## Summary
Track how often each knowledge document is retrieved. Used as ranking signal.

## Acceptance Criteria
- [ ] `document_accesses` table: document_id, workspace_id, access_type, created_at
- [ ] Logged on: search result selection, document view, RAG injection
- [ ] `access_count` denormalized column updated

## Dependencies
- [ ] ISS-036

## Story Points
3

## Priority
P1

## Definition of Done
- [ ] Search click → access log created
- [ ] RAG injection → access log created
EOF
)"

create_issue \
  "[FEATURE] Implement knowledge search analytics dashboard" \
  "feature,knowledge,ui,low-priority,sprint-21,v1.3" \
  "v1.3 — Knowledge Intelligence" \
  "$(cat << 'EOF'
## Summary
Analytics page showing top documents, popular queries, and knowledge gaps (zero-result queries).

## Acceptance Criteria
- [ ] `/dashboard/knowledge/analytics` with top 10 docs, top queries, zero-result queries
- [ ] Search volume by mode
- [ ] Accessible to admin and executive roles only

## Dependencies
- [ ] ISS-037, ISS-034

## Story Points
3

## Priority
P2

## Definition of Done
- [ ] Analytics page renders with real data
- [ ] Knowledge gap list accurate
EOF
)"

# ────────────────────────────────────────────────────────────────────────────
echo ""
echo "═══ Sprint 22A — Workflow Engine ═══════════════════════════════════════"
# ────────────────────────────────────────────────────────────────────────────

create_issue \
  "[TASK] Design and implement workflow schema (workflows + workflow_runs)" \
  "task,database,automation,high-priority,sprint-22,v1.4,migration" \
  "v1.4 — Executive Automation" \
  "$(cat << 'EOF'
## Summary
Create `workflows` and `workflow_runs` (append-only) tables with RLS.

## Acceptance Criteria
- [ ] `workflows`: id, workspace_id, name, trigger JSONB, conditions JSONB, actions JSONB, status
- [ ] `workflow_runs`: append-only audit log
- [ ] `workflow_runs` has no UPDATE/DELETE RLS policy

## Story Points
5

## Priority
P0

## Definition of Done
- [ ] Migration runs successfully
- [ ] Workflow run cannot be updated via API
EOF
)"

create_issue \
  "[FEATURE] Build event listener system for workflow triggers" \
  "feature,automation,high-priority,sprint-22,v1.4" \
  "v1.4 — Executive Automation" \
  "$(cat << 'EOF'
## Summary
Event dispatch system detecting state changes and triggering matching workflows. Event types: deal.created, document.created, calendar.event_starting, schedule.cron.

## Acceptance Criteria
- [ ] `EventBus` singleton with `emit` and `subscribe`
- [ ] API routes call `EventBus.emit()` after successful writes
- [ ] Matching: query active workflows with matching trigger type
- [ ] Event processed < 500 ms

## Dependencies
- [ ] ISS-039

## Story Points
8

## Priority
P0

## Definition of Done
- [ ] Create deal → `deal.created` event emitted and matched
EOF
)"

create_issue \
  "[FEATURE] Implement condition evaluator for workflow rules" \
  "feature,automation,high-priority,sprint-22,v1.4" \
  "v1.4 — Executive Automation" \
  "$(cat << 'EOF'
## Summary
Evaluate workflow `conditions` block against event payload using AND/OR rule trees and field operators.

## Acceptance Criteria
- [ ] Operators: equals, not_equals, greater_than, less_than, contains, is_null
- [ ] Dot notation field paths
- [ ] Nested AND/OR depth ≤ 3
- [ ] 20 unit test cases

## Dependencies
- [ ] ISS-040

## Story Points
5

## Priority
P0

## Definition of Done
- [ ] All 20 unit tests pass
EOF
)"

create_issue \
  "[FEATURE] Build action executor (send_notification, create_task, update_record, trigger_approval)" \
  "feature,automation,high-priority,sprint-22,v1.4" \
  "v1.4 — Executive Automation" \
  "$(cat << 'EOF'
## Summary
Execute workflow actions sequentially. Log each action result to `workflow_runs`.

## Acceptance Criteria
- [ ] Action types: send_notification, create_task, update_record, trigger_approval
- [ ] Sequential execution; stop on first error
- [ ] All results logged to `workflow_runs.actions_log`

## Dependencies
- [ ] ISS-041

## Story Points
8

## Priority
P0

## Definition of Done
- [ ] 3-action workflow executes all 3 in order
- [ ] Failure stops chain and marks run as failed
EOF
)"

create_issue \
  "[FEATURE] Create workflow execution audit log UI" \
  "feature,automation,security,medium-priority,sprint-22,v1.4" \
  "v1.4 — Executive Automation" \
  "$(cat << 'EOF'
## Summary
Surface workflow execution history in UI. Failed runs notify the workflow creator.

## Acceptance Criteria
- [ ] `GET /api/workflows/[id]/runs` returns paginated execution history
- [ ] Each run shows status, trigger, conditions, actions, timestamps
- [ ] Failed run triggers in-app notification

## Dependencies
- [ ] ISS-042

## Story Points
4

## Priority
P1

## Definition of Done
- [ ] Run history visible per workflow
- [ ] Failed run notification delivered
EOF
)"

# ────────────────────────────────────────────────────────────────────────────
echo ""
echo "═══ Sprint 22B — Automation Builder ════════════════════════════════════"
# ────────────────────────────────────────────────────────────────────────────

create_issue \
  "[FEATURE] Build no-code Automation Builder UI" \
  "feature,automation,ui,high-priority,sprint-22,v1.4" \
  "v1.4 — Executive Automation" \
  "$(cat << 'EOF'
## Summary
Visual workflow editor at `/dashboard/automations/new` with trigger selector, condition builder, and action list.

## Acceptance Criteria
- [ ] Trigger selector with human-readable event labels
- [ ] Condition builder with AND/OR toggle
- [ ] Action list with per-type config forms
- [ ] Live validation + disabled Save until complete
- [ ] Non-technical executive can build a workflow in < 5 min

## Dependencies
- [ ] ISS-042

## Story Points
8

## Priority
P0

## Definition of Done
- [ ] Workflow created and executes when triggered
EOF
)"

create_issue \
  "[FEATURE] Create workflow list view with run history" \
  "feature,automation,ui,high-priority,sprint-22,v1.4" \
  "v1.4 — Executive Automation" \
  "$(cat << 'EOF'
## Summary
`/dashboard/automations` showing all workflows with status, last run, and run count.

## Acceptance Criteria
- [ ] Table: Name, Status, Trigger, Last run, Run count, Actions
- [ ] Pause/resume toggle works immediately
- [ ] Delete with confirmation dialog

## Dependencies
- [ ] ISS-044

## Story Points
5

## Priority
P0

## Definition of Done
- [ ] All workflows visible with accurate run count
EOF
)"

create_issue \
  "[FEATURE] Add workflow test and dry-run mode" \
  "feature,automation,medium-priority,sprint-22,v1.4" \
  "v1.4 — Executive Automation" \
  "$(cat << 'EOF'
## Summary
Test a workflow with synthetic event payload without executing real actions.

## Acceptance Criteria
- [ ] 'Test workflow' button in Automation Builder
- [ ] Dry-run shows: trigger match, conditions result, actions that would execute
- [ ] No actions executed during dry-run

## Dependencies
- [ ] ISS-044

## Story Points
5

## Priority
P1

## Definition of Done
- [ ] Dry-run shows correct evaluation
- [ ] No actions executed
EOF
)"

create_issue \
  "[FEATURE] Build automation templates library (10 pre-built workflows)" \
  "feature,automation,ui,low-priority,sprint-22,v1.4" \
  "v1.4 — Executive Automation" \
  "$(cat << 'EOF'
## Summary
10 pre-built workflow templates executives can activate in one click.

## Acceptance Criteria
- [ ] Templates page at `/dashboard/automations/templates`
- [ ] Minimum 10 templates (deal stall, meeting prep, new contact task, etc.)
- [ ] 'Use template' creates draft workflow for review

## Dependencies
- [ ] ISS-044

## Story Points
4

## Priority
P2

## Definition of Done
- [ ] 10 templates available
- [ ] Template → draft workflow created
EOF
)"

# ────────────────────────────────────────────────────────────────────────────
echo ""
echo "═══ Sprint 22C — Approval Engine ═══════════════════════════════════════"
# ────────────────────────────────────────────────────────────────────────────

create_issue \
  "[FEATURE] Create approval_requests schema and service" \
  "feature,approval,database,high-priority,sprint-22,v1.4,migration" \
  "v1.4 — Executive Automation" \
  "$(cat << 'EOF'
## Summary
Approval Engine schema (approval_requests, approval_responses) and service with 4 patterns: single, sequential, unanimous, threshold.

## Acceptance Criteria
- [ ] `approval_requests` and `approval_responses` tables with RLS
- [ ] `createApprovalRequest` and `respondToApproval` service methods
- [ ] Status transitions: pending → approved | rejected | expired

## Dependencies
- [ ] ISS-039 (workflow_id)

## Story Points
5

## Priority
P0

## Definition of Done
- [ ] Sequential approval: responder 1 approves → awaiting responder 2
- [ ] Unanimous: one rejection → immediately rejected
EOF
)"

create_issue \
  "[FEATURE] Implement approval routing service" \
  "feature,approval,high-priority,sprint-22,v1.4" \
  "v1.4 — Executive Automation" \
  "$(cat << 'EOF'
## Summary
Evaluate approval responses and advance status per pattern. Emit events on resolution.

## Acceptance Criteria
- [ ] `evaluateApprovalStatus` called after every response
- [ ] Emits `approval.approved` or `approval.rejected` events
- [ ] Expiry job transitions to `expired` within 60s of `expires_at`

## Dependencies
- [ ] ISS-048

## Story Points
5

## Priority
P0

## Definition of Done
- [ ] All 4 patterns evaluated correctly
- [ ] Expiry fires within 60s
EOF
)"

create_issue \
  "[FEATURE] Build approval UI (inbox + creation form)" \
  "feature,approval,ui,high-priority,sprint-22,v1.4" \
  "v1.4 — Executive Automation" \
  "$(cat << 'EOF'
## Summary
Approval inbox at `/dashboard/approvals` + creation form. Real-time updates via Supabase Realtime.

## Acceptance Criteria
- [ ] Pending approvals inbox with approve/reject buttons
- [ ] Submitted approvals tab with status
- [ ] Badge on sidebar with pending count
- [ ] Real-time updates on status change

## Dependencies
- [ ] ISS-049

## Story Points
5

## Priority
P0

## Definition of Done
- [ ] Approver receives card in inbox
- [ ] Approval updates in real time (no page refresh)
EOF
)"

create_issue \
  "[FEATURE] Add approval notification service" \
  "feature,approval,automation,medium-priority,sprint-22,v1.4" \
  "v1.4 — Executive Automation" \
  "$(cat << 'EOF'
## Summary
Notify approvers on new requests and requestors on resolution. 24-hour escalation reminder.

## Acceptance Criteria
- [ ] New request → all approvers notified within 30 seconds
- [ ] Resolution → requestor notified within 30 seconds
- [ ] 24h reminder for no-response

## Dependencies
- [ ] ISS-050

## Story Points
5

## Priority
P1

## Definition of Done
- [ ] New request → all approvers notified
- [ ] 24h reminder fires correctly
EOF
)"

# ────────────────────────────────────────────────────────────────────────────
echo ""
echo "═══ Sprint 23A — Voice Assistant ═══════════════════════════════════════"
# ────────────────────────────────────────────────────────────────────────────

create_issue \
  "[RESEARCH] Design voice assistant architecture and pipeline (ADR)" \
  "research,voice,ai,high-priority,sprint-23,v1.5" \
  "v1.5 — Executive Voice" \
  "$(cat << 'EOF'
## Summary
Architecture spike: evaluate STT/TTS providers, latency budget, browser audio APIs, wake word. Produce ADR.

## Acceptance Criteria
- [ ] STT providers evaluated: Whisper, Deepgram, Google STT
- [ ] TTS providers evaluated: OpenAI TTS-1, ElevenLabs, Google TTS
- [ ] Latency budget: < 800 ms end-to-end
- [ ] ADR written in `docs/architecture/voice-adr.md`

## Story Points
5

## Priority
P0

## Definition of Done
- [ ] ADR written and merged
- [ ] Implementation issues created
EOF
)"

create_issue \
  "[FEATURE] Implement intent classification system" \
  "feature,voice,ai,high-priority,sprint-23,v1.5" \
  "v1.5 — Executive Voice" \
  "$(cat << 'EOF'
## Summary
Classify voice transcript into: knowledge_query, action_command, dictation, unknown. Rule-based fast path + AI fallback.

## Acceptance Criteria
- [ ] `classifyIntent(transcript) → Intent`
- [ ] Keyword fast path for common patterns
- [ ] AI fallback for ambiguous inputs
- [ ] 30 unit test cases

## Dependencies
- [ ] ISS-052

## Story Points
5

## Priority
P0

## Definition of Done
- [ ] 30 unit tests pass
- [ ] p95 < 100 ms
EOF
)"

create_issue \
  "[FEATURE] Build voice command handler (knowledge, action, dictation)" \
  "feature,voice,ai,rag,high-priority,sprint-23,v1.5" \
  "v1.5 — Executive Voice" \
  "$(cat << 'EOF'
## Summary
Route classified intents: knowledge_query → RAG, action_command → API/workflow, dictation → Knowledge Engine.

## Acceptance Criteria
- [ ] `handleVoiceInput(transcript, intent, session)` dispatches correctly
- [ ] Action commands: create task, schedule meeting, find deal, set reminder
- [ ] Returns `{ text, audio? }`

## Dependencies
- [ ] ISS-053, ISS-036

## Story Points
7

## Priority
P0

## Definition of Done
- [ ] "What is our pricing?" → grounded RAG answer
- [ ] "Create task: follow up" → task created
EOF
)"

create_issue \
  "[FEATURE] Create voice session management" \
  "feature,voice,medium-priority,sprint-23,v1.5" \
  "v1.5 — Executive Voice" \
  "$(cat << 'EOF'
## Summary
Persist voice conversation history. Session auto-ends after 5 minutes of silence.

## Acceptance Criteria
- [ ] `voice_sessions` and `voice_turns` tables
- [ ] Session ended after 5 min silence
- [ ] History at `/dashboard/voice/history`

## Dependencies
- [ ] ISS-054

## Story Points
3

## Priority
P1

## Definition of Done
- [ ] Conversation stored and viewable after session
EOF
)"

# ────────────────────────────────────────────────────────────────────────────
echo ""
echo "═══ Sprint 23B — Speech To Text ════════════════════════════════════════"
# ────────────────────────────────────────────────────────────────────────────

create_issue \
  "[FEATURE] Implement Speech-to-Text provider integration" \
  "feature,voice,ai,high-priority,sprint-23,v1.5" \
  "v1.5 — Executive Voice" \
  "$(cat << 'EOF'
## Summary
`SttProvider` interface + streaming implementation for selected provider (from ADR). Languages: en-US, pt-BR.

## Acceptance Criteria
- [ ] `transcribe(audio, options) → TranscriptResult`
- [ ] `streamTranscribe(stream, onPartial, onFinal)` for streaming
- [ ] Accuracy ≥ 95% on clear speech

## Dependencies
- [ ] ISS-052 (ADR provider selection)

## Story Points
5

## Priority
P0

## Definition of Done
- [ ] 10s audio clip transcribed ≥ 95% accuracy
- [ ] Streaming returns partials < 200 ms
EOF
)"

create_issue \
  "[FEATURE] Build real-time audio capture and streaming (Web Audio API)" \
  "feature,voice,ui,high-priority,sprint-23,v1.5" \
  "v1.5 — Executive Voice" \
  "$(cat << 'EOF'
## Summary
`useAudioCapture()` hook using Web Audio API. VAD stops recording after 1.5s silence. 16kHz mono PCM16.

## Acceptance Criteria
- [ ] `{ start, stop, isRecording, audioLevel }` hook API
- [ ] VAD: 1.5s silence stops recording
- [ ] Denied microphone → clear error

## Dependencies
- [ ] ISS-056

## Story Points
5

## Priority
P0

## Definition of Done
- [ ] Speak → captured and sent
- [ ] Silence → recording stops automatically
EOF
)"

create_issue \
  "[FEATURE] Add STT result processing and normalization" \
  "feature,voice,medium-priority,sprint-23,v1.5" \
  "v1.5 — Executive Voice" \
  "$(cat << 'EOF'
## Summary
Post-process STT: punctuation insertion, number normalization, filler word removal ("um", "uh"), business term preservation.

## Acceptance Criteria
- [ ] `normalizeTranscript(raw) → string` pure function
- [ ] 15 unit tests
- [ ] "ten thousand dollars" → "$10,000"

## Dependencies
- [ ] ISS-056, ISS-057

## Story Points
5

## Priority
P1

## Definition of Done
- [ ] 15 unit tests pass
EOF
)"

create_issue \
  "[FEATURE] Implement meeting transcription mode (long-form STT)" \
  "feature,voice,knowledge,medium-priority,sprint-23,v1.5" \
  "v1.5 — Executive Voice" \
  "$(cat << 'EOF'
## Summary
Long-form meeting transcription mode. Draft saved every 30s. Published as `meeting_notes` knowledge document.

## Acceptance Criteria
- [ ] 'Start meeting transcription' button in Agenda meeting cards
- [ ] Up to 60 minutes continuous capture
- [ ] Draft saved every 30 seconds
- [ ] Published doc: title, date, attendees, full transcript

## Dependencies
- [ ] ISS-058, ISS-006

## Story Points
5

## Priority
P1

## Definition of Done
- [ ] 5-minute meeting → knowledge document created
- [ ] Draft saved during recording
EOF
)"

# ────────────────────────────────────────────────────────────────────────────
echo ""
echo "═══ Sprint 23C — Streaming Pipeline ════════════════════════════════════"
# ────────────────────────────────────────────────────────────────────────────

create_issue \
  "[FEATURE] Build low-latency voice response pipeline (< 800ms p95)" \
  "feature,voice,ai,high-priority,sprint-23,v1.5" \
  "v1.5 — Executive Voice" \
  "$(cat << 'EOF'
## Summary
End-to-end pipeline: STT → classify → AI stream → TTS chunks → audio playback. Target: p95 < 800ms.

## Acceptance Criteria
- [ ] TTS begins on first AI sentence (not full response)
- [ ] Total latency p95 < 800 ms
- [ ] Latency breakdown logged per request
- [ ] Mid-response interruption handled

## Dependencies
- [ ] ISS-057, ISS-054, ISS-061

## Story Points
8

## Priority
P0

## Definition of Done
- [ ] p95 < 800ms measured in staging
- [ ] Interruption handled gracefully
EOF
)"

create_issue \
  "[FEATURE] Implement Text-to-Speech provider integration (streaming)" \
  "feature,voice,ai,high-priority,sprint-23,v1.5" \
  "v1.5 — Executive Voice" \
  "$(cat << 'EOF'
## Summary
`TtsProvider` interface + streaming implementation. First audio chunk < 200ms. Response caching for common phrases.

## Acceptance Criteria
- [ ] `synthesize(text, options) → AsyncIterable<AudioChunk>`
- [ ] 2 voice options (user preference)
- [ ] Caching: repeated text from cache
- [ ] First chunk < 200ms

## Dependencies
- [ ] ISS-052 (provider selection)

## Story Points
5

## Priority
P0

## Definition of Done
- [ ] 100-word text → streaming audio
- [ ] Cache hit on repeat call
EOF
)"

create_issue \
  "[FEATURE] Add streaming WebSocket connection for voice (/api/voice/ws)" \
  "feature,voice,api,high-priority,sprint-23,v1.5" \
  "v1.5 — Executive Voice" \
  "$(cat << 'EOF'
## Summary
Full-duplex WebSocket: receives audio chunks from browser, streams AI audio back. Auth via session cookie.

## Acceptance Criteria
- [ ] `ws:///api/voice/ws`
- [ ] Client→server: audio_chunk, end_of_speech, abort
- [ ] Server→client: transcript, ai_chunk, audio_chunk, done, error
- [ ] Auth enforced; unauthenticated connections rejected
- [ ] Max 5 concurrent connections per workspace

## Dependencies
- [ ] ISS-056, ISS-061

## Story Points
5

## Priority
P0

## Definition of Done
- [ ] WebSocket accepts audio and returns audio
- [ ] Auth enforced
EOF
)"

create_issue \
  "[FEATURE] Create VoiceAssistant UI component (floating button)" \
  "feature,voice,ui,high-priority,sprint-23,v1.5" \
  "v1.5 — Executive Voice" \
  "$(cat << 'EOF'
## Summary
Floating mic button with states: idle, listening, processing, speaking. Real-time transcript. Cmd+Shift+V shortcut.

## Acceptance Criteria
- [ ] 4 visual states with animations
- [ ] Real-time partial transcript shown
- [ ] 'Stop speaking' interrupts AI
- [ ] Keyboard shortcut: Cmd+Shift+V / Ctrl+Shift+V
- [ ] Accessible: screen reader announces state transitions

## Dependencies
- [ ] ISS-062, ISS-060

## Story Points
4

## Priority
P0

## Definition of Done
- [ ] Works in Chrome and Firefox
- [ ] Keyboard shortcut activates voice mode
EOF
)"

# ────────────────────────────────────────────────────────────────────────────
echo ""
echo "═══ Sprint 24A — Executive Agent ═══════════════════════════════════════"
# ────────────────────────────────────────────────────────────────────────────

create_issue \
  "[RESEARCH] Design Executive Agent architecture and orchestration runtime (ADR)" \
  "research,agents,ai,high-priority,sprint-24,v2.0" \
  "v2.0 — Multi-Agent System" \
  "$(cat << 'EOF'
## Summary
Architecture spike: agent lifecycle, inter-agent bus, task queue, shared memory, human-in-the-loop gate. Produce ADR.

## Acceptance Criteria
- [ ] Agent execution model documented
- [ ] Inter-agent bus design evaluated
- [ ] Impact classification and approval escalation model
- [ ] ADR: `docs/architecture/multi-agent-adr.md`

## Story Points
8

## Priority
P0

## Definition of Done
- [ ] ADR approved
- [ ] Implementation issues created
EOF
)"

create_issue \
  "[FEATURE] Implement agent context management (Knowledge Graph + working memory)" \
  "feature,agents,ai,knowledge,high-priority,sprint-24,v2.0" \
  "v2.0 — Multi-Agent System" \
  "$(cat << 'EOF'
## Summary
`buildAgentContext(agentId, task)` assembles: system prompt, workspace knowledge (hybrid search), task data, last 10 task summaries.

## Acceptance Criteria
- [ ] Context window budget: max 80,000 tokens
- [ ] Domain boundaries enforced per agent
- [ ] `agent_memory` table (FIFO, max 100 rows per agent)
- [ ] Context built < 500 ms

## Dependencies
- [ ] ISS-064, ISS-036

## Story Points
8

## Priority
P0

## Definition of Done
- [ ] Context built within 500ms
- [ ] Domain boundaries enforced
EOF
)"

create_issue \
  "[FEATURE] Build task delegation system (Executive Agent → sub-agents)" \
  "feature,agents,ai,high-priority,sprint-24,v2.0" \
  "v2.0 — Multi-Agent System" \
  "$(cat << 'EOF'
## Summary
`decomposeGoal` breaks goals into sub-tasks. `delegateTask` routes to sub-agents. Timeout escalates to human approval.

## Acceptance Criteria
- [ ] AI-powered goal decomposition
- [ ] `agent_tasks` queue table
- [ ] Sub-agent timeout (5 min) → Approval Engine escalation

## Dependencies
- [ ] ISS-065

## Story Points
8

## Priority
P0

## Definition of Done
- [ ] Goal → ≥ 3 sub-tasks delegated
- [ ] Timeout escalated to human
EOF
)"

create_issue \
  "[FEATURE] Create Executive Briefing generator (daily + weekly)" \
  "feature,agents,ai,medium-priority,sprint-24,v2.0" \
  "v2.0 — Multi-Agent System" \
  "$(cat << 'EOF'
## Summary
Daily briefing at 08:00 and weekly on Monday. Sections: Business Health, Pipeline, People, Action Items, Priorities.

## Acceptance Criteria
- [ ] Delivered as in-app notification + stored at `/dashboard/briefings`
- [ ] Generation < 60 seconds
- [ ] Past briefings archived and searchable

## Dependencies
- [ ] ISS-066, ISS-069, ISS-072

## Story Points
8

## Priority
P0

## Definition of Done
- [ ] Daily briefing at 08:00 with all sections populated
EOF
)"

create_issue \
  "[FEATURE] Add agent goal decomposition engine (plan mode)" \
  "feature,agents,ai,medium-priority,sprint-24,v2.0" \
  "v2.0 — Multi-Agent System" \
  "$(cat << 'EOF'
## Summary
Executive submits goal in chat. Agent returns decomposition plan. Executive approves or modifies before execution.

## Acceptance Criteria
- [ ] 'Plan mode' toggle in AI assistant
- [ ] Plan returned within 10 seconds
- [ ] Executive can modify plan before approval
- [ ] Plan stored in `agent_goals` table

## Dependencies
- [ ] ISS-066

## Story Points
3

## Priority
P1

## Definition of Done
- [ ] Goal → plan within 10s
- [ ] Executive can modify and approve
EOF
)"

# ────────────────────────────────────────────────────────────────────────────
echo ""
echo "═══ Sprint 24B — Sales Agent ═══════════════════════════════════════════"
# ────────────────────────────────────────────────────────────────────────────

create_issue \
  "[FEATURE] Build Sales Agent core with CRM MCP tool access" \
  "feature,agents,crm,ai,high-priority,sprint-24,v2.0" \
  "v2.0 — Multi-Agent System" \
  "$(cat << 'EOF'
## Summary
Sales Agent with CRM tools: list_deals, get_deal, update_deal_stage, list_contacts. All actions logged to audit trail.

## Acceptance Criteria
- [ ] Sales Agent system prompt with role + CRM scope
- [ ] MCP tools: list_deals, get_deal, update_deal_stage, list_contacts, list_activities, create_activity
- [ ] Cannot access Finance/HR/Operations data
- [ ] All actions logged to audit_logs

## Dependencies
- [ ] ISS-065, ISS-066

## Story Points
8

## Priority
P0

## Definition of Done
- [ ] Sales Agent completes `analyze_pipeline` task
- [ ] Out-of-scope access blocked
EOF
)"

create_issue \
  "[FEATURE] Implement pipeline monitoring and stall detection" \
  "feature,agents,crm,automation,high-priority,sprint-24,v2.0" \
  "v2.0 — Multi-Agent System" \
  "$(cat << 'EOF'
## Summary
Sales Agent detects stalled deals (no activity > 7 days) and surfaces them in daily briefing.

## Acceptance Criteria
- [ ] `detectStalledDeals(workspaceId, thresholdDays)`
- [ ] Stalled deals in Sales briefing section
- [ ] `deal.stalled` event emitted
- [ ] Configurable threshold (default 7 days)

## Dependencies
- [ ] ISS-069

## Story Points
5

## Priority
P0

## Definition of Done
- [ ] Deal with no 8-day activity flagged as stalled
- [ ] Appears in daily briefing
EOF
)"

create_issue \
  "[FEATURE] Create Sales Agent briefing template" \
  "feature,agents,crm,medium-priority,sprint-24,v2.0" \
  "v2.0 — Multi-Agent System" \
  "$(cat << 'EOF'
## Summary
Structured Sales Agent output for Executive Briefing: totalDeals, stalled, atRisk, wonThisWeek, recommendedActions.

## Acceptance Criteria
- [ ] Output schema with all required fields
- [ ] Generation < 15 seconds for ≤ 500 deals
- [ ] Markdown formatted for in-app display

## Dependencies
- [ ] ISS-070, ISS-067

## Story Points
5

## Priority
P1

## Definition of Done
- [ ] Sales section appears in daily briefing with accurate data
EOF
)"

# ────────────────────────────────────────────────────────────────────────────
echo ""
echo "═══ Sprint 24C — Finance Agent ═════════════════════════════════════════"
# ────────────────────────────────────────────────────────────────────────────

create_issue \
  "[FEATURE] Build Finance Agent core with financial data tools" \
  "feature,agents,ai,high-priority,sprint-24,v2.0" \
  "v2.0 — Multi-Agent System" \
  "$(cat << 'EOF'
## Summary
Finance Agent with MCP tools: get_budget, list_expenses, get_runway, list_invoices, get_forecast. New budgets and expenses tables.

## Acceptance Criteria
- [ ] Finance Agent system prompt
- [ ] MCP tools for financial data
- [ ] `budgets` and `expenses` tables with RLS
- [ ] Cannot access CRM/HR/Operations

## Dependencies
- [ ] ISS-065, ISS-066

## Story Points
8

## Priority
P0

## Definition of Done
- [ ] Finance Agent returns budget variance report
- [ ] Data boundary enforced
EOF
)"

create_issue \
  "[FEATURE] Implement budget variance monitoring and alerting" \
  "feature,agents,automation,high-priority,sprint-24,v2.0" \
  "v2.0 — Multi-Agent System" \
  "$(cat << 'EOF'
## Summary
Finance Agent monitors budget vs. actual spend. Alerts executive when category exceeds 10% variance threshold.

## Acceptance Criteria
- [ ] `detectBudgetVariance(workspaceId, thresholdPct)`
- [ ] Over-budget → `finance.budget_exceeded` event
- [ ] Alert via Approval Engine (large variance) or notification (minor)
- [ ] Recommended action per over-budget category

## Dependencies
- [ ] ISS-072

## Story Points
5

## Priority
P0

## Definition of Done
- [ ] 15% over budget → alert sent
- [ ] Alert includes recommended action
EOF
)"

create_issue \
  "[FEATURE] Create Finance Agent briefing template" \
  "feature,agents,medium-priority,sprint-24,v2.0" \
  "v2.0 — Multi-Agent System" \
  "$(cat << 'EOF'
## Summary
Finance Agent output for Executive Briefing: cashRunwayDays, totalSpentMTD, budgetVariances, overdueInvoices, forecast.

## Acceptance Criteria
- [ ] All schema fields populated
- [ ] Generation < 10 seconds
- [ ] Markdown formatted

## Dependencies
- [ ] ISS-073, ISS-067

## Story Points
5

## Priority
P1

## Definition of Done
- [ ] Finance section in daily briefing with accurate figures
EOF
)"

# ────────────────────────────────────────────────────────────────────────────
echo ""
echo "═══ Sprint 24D — Operations Agent ══════════════════════════════════════"
# ────────────────────────────────────────────────────────────────────────────

create_issue \
  "[FEATURE] Build Operations Agent core with project and task data access" \
  "feature,agents,ai,high-priority,sprint-24,v2.0" \
  "v2.0 — Multi-Agent System" \
  "$(cat << 'EOF'
## Summary
Operations Agent with MCP tools: list_projects, list_tasks, get_project_status, list_workflow_runs, get_bottlenecks.

## Acceptance Criteria
- [ ] Operations Agent system prompt
- [ ] MCP tools for projects, tasks, workflows
- [ ] Cannot access financial/CRM/HR data
- [ ] Task types: check_project_health, identify_bottlenecks, summarize_workflow_performance

## Dependencies
- [ ] ISS-065, ISS-066

## Story Points
6

## Priority
P0

## Definition of Done
- [ ] Operations Agent completes check_project_health task
- [ ] Data boundary enforced
EOF
)"

create_issue \
  "[FEATURE] Implement bottleneck detection algorithm" \
  "feature,agents,automation,high-priority,sprint-24,v2.0" \
  "v2.0 — Multi-Agent System" \
  "$(cat << 'EOF'
## Summary
Identify: blocked tasks, overdue milestones, high-failure-rate workflows. Include severity and recommended action.

## Acceptance Criteria
- [ ] Blocked tasks: `status = 'blocked'` OR past due date
- [ ] Overdue milestones: planned date passed and not complete
- [ ] Failed workflows: `workflow_runs.status = 'failed'` in last 24h
- [ ] Severity classification: blocking revenue vs. internal

## Dependencies
- [ ] ISS-075

## Story Points
5

## Priority
P0

## Definition of Done
- [ ] Project 2 weeks overdue → flagged high severity
- [ ] Recommended action provided
EOF
)"

create_issue \
  "[FEATURE] Create Operations Agent briefing template" \
  "feature,agents,medium-priority,sprint-24,v2.0" \
  "v2.0 — Multi-Agent System" \
  "$(cat << 'EOF'
## Summary
Operations Agent output: activeProjects, onTrack/atRisk/blockedCount, topBottlenecks, workflowHealth, recommendedActions.

## Acceptance Criteria
- [ ] All schema fields populated
- [ ] `atRiskCount`: within 14 days deadline with < 80% tasks complete
- [ ] Generation < 10 seconds

## Dependencies
- [ ] ISS-076, ISS-067

## Story Points
5

## Priority
P1

## Definition of Done
- [ ] Operations section in daily briefing
- [ ] Workflow health shows accurate success rate
EOF
)"

# ────────────────────────────────────────────────────────────────────────────
echo ""
echo "═══ Sprint 24E — Knowledge Graph ═══════════════════════════════════════"
# ────────────────────────────────────────────────────────────────────────────

create_issue \
  "[TASK] Design Knowledge Graph schema (kg_entities + kg_relationships)" \
  "task,database,agents,knowledge,high-priority,sprint-24,v2.0,migration" \
  "v2.0 — Multi-Agent System" \
  "$(cat << 'EOF'
## Summary
`kg_entities`, `kg_relationships`, and `kg_document_entities` tables. Entity types: person, company, product, project, decision, event.

## Acceptance Criteria
- [ ] All 3 tables with RLS
- [ ] Indexes: entity(workspace_id, entity_type), relationships(source_entity_id, target_entity_id)
- [ ] `kg_document_entities` junction table

## Story Points
5

## Priority
P0

## Definition of Done
- [ ] Migration runs successfully
- [ ] RLS tested
EOF
)"

create_issue \
  "[FEATURE] Implement entity extraction service (AI-powered)" \
  "feature,agents,knowledge,ai,high-priority,sprint-24,v2.0" \
  "v2.0 — Multi-Agent System" \
  "$(cat << 'EOF'
## Summary
Extract entities from knowledge documents and populate `kg_entities`. Runs async on document create/update.

## Acceptance Criteria
- [ ] `extractEntities(document) → Entity[]`
- [ ] Fuzzy name matching for dedup (threshold 0.9)
- [ ] `kg_document_entities` records created per entity found
- [ ] ≥ 1 entity per 500-word document

## Dependencies
- [ ] ISS-078

## Story Points
8

## Priority
P0

## Definition of Done
- [ ] Create doc mentioning Acme Corp → entity created
- [ ] Same entity from two docs → single entity with two document links
EOF
)"

create_issue \
  "[FEATURE] Build relationship inference engine" \
  "feature,agents,knowledge,ai,high-priority,sprint-24,v2.0" \
  "v2.0 — Multi-Agent System" \
  "$(cat << 'EOF'
## Summary
Infer entity relationships from document text. Confidence scoring: explicit statement=1.0, same sentence=0.8, same paragraph=0.6.

## Acceptance Criteria
- [ ] `inferRelationships(document, entities) → Relationship[]`
- [ ] Confidence < 0.5 not stored
- [ ] Existing relationship confidence updated (max of old and new)

## Dependencies
- [ ] ISS-079

## Story Points
8

## Priority
P0

## Definition of Done
- [ ] "John Smith, CEO of Acme" → works_at relationship inferred
- [ ] Low-confidence relationships not stored
EOF
)"

create_issue \
  "[FEATURE] Add graph traversal API for agent use (MCP tool)" \
  "feature,agents,api,high-priority,sprint-24,v2.0" \
  "v2.0 — Multi-Agent System" \
  "$(cat << 'EOF'
## Summary
Graph traversal API callable by agents: traverse by entity and relationship type, depth 1-3. Latency p95 < 500ms.

## Acceptance Criteria
- [ ] `GET /api/knowledge-graph/traverse?from={entityId}&via={type}&depth={1-3}`
- [ ] `GET /api/knowledge-graph/entity?name={name}&type={type}`
- [ ] `GET /api/knowledge-graph/connected-documents?entityId={id}`
- [ ] Max depth 3

## Dependencies
- [ ] ISS-080

## Story Points
5

## Priority
P0

## Definition of Done
- [ ] Traverse from Acme Corp depth 2 → employees + deals + docs
- [ ] Latency < 500ms on test graph
EOF
)"

create_issue \
  "[FEATURE] Create Knowledge Graph visualization UI (interactive graph)" \
  "feature,agents,ui,knowledge,medium-priority,sprint-24,v2.0" \
  "v2.0 — Multi-Agent System" \
  "$(cat << 'EOF'
## Summary
Interactive force-directed graph at `/dashboard/knowledge/graph`. Nodes colored by entity type. Click → document panel.

## Acceptance Criteria
- [ ] Force-directed layout (check for D3 in transitive deps before adding new package)
- [ ] Nodes: colored by entity type (person=blue, company=green, decision=orange)
- [ ] Click node → linked documents panel
- [ ] Search to center graph on entity
- [ ] Renders ≤ 200 nodes without degradation

## Dependencies
- [ ] ISS-081

## Story Points
4

## Priority
P2

## Definition of Done
- [ ] Graph renders with real entities
- [ ] Click → document list shown
EOF
)"

# ────────────────────────────────────────────────────────────────────────────
echo ""
echo "═══ Summary ════════════════════════════════════════════════════════════"
echo ""
echo "✓ Created: $CREATED issues"
echo "✗ Failed:  $FAILED issues"
echo ""
echo "View issues: https://github.com/$REPO/issues"
