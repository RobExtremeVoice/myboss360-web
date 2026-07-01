# Sprint 20B — Google Gmail

**Milestone:** v1.2 Connected Executive  
**Sprint:** 20B  
**Total SP:** 28

---

## ISS-007 — Implement Gmail API integration with OAuth scopes

**Labels:** `feature`, `gmail`, `integrations`, `auth`, `high-priority`, `sprint-20`, `v1.2`  
**Story Points:** 5  
**Priority:** P0

### Description

Extend the Google OAuth integration (ISS-002) with Gmail-specific scopes. Build the Gmail API client wrapper with automatic token refresh, rate limit handling, and pagination support.

### Acceptance Criteria

- [ ] Gmail API scope `gmail.readonly` included in OAuth flow
- [ ] `GmailApiClient` class wraps Google Gmail API with: `listThreads`, `getThread`, `getMessage`, `getProfile`
- [ ] Automatic token refresh before expiry
- [ ] Rate limit handling: exponential backoff on 429 responses
- [ ] Pagination: `nextPageToken` handled transparently by client
- [ ] `GET /api/integrations/google/gmail/status` returns connection health

### Dependencies

- [ ] ISS-002 (OAuth flow)

### Definition of Done

- [ ] Can list and fetch Gmail threads with a valid OAuth token
- [ ] Rate limit and pagination tested with mocked API responses
- [ ] No raw API tokens logged

---

## ISS-008 — Build email thread ingestion pipeline

**Labels:** `feature`, `gmail`, `knowledge`, `high-priority`, `sprint-20`, `v1.2`  
**Story Points:** 8  
**Priority:** P0

### Description

Build the pipeline that ingests Gmail threads into the Knowledge Engine as `email` type documents. Only threads where the workspace user is a participant are ingested. Configurable by label scope.

### Acceptance Criteria

- [ ] Threads matching configured label scopes are fetched incrementally (using `historyId` for delta sync)
- [ ] Each thread creates a `knowledge_documents` record: `object_type: 'email'`, `category: 'meeting'` (or user-configured)
- [ ] Thread body stripped of HTML, boilerplate footers, and forwarded headers before storage
- [ ] Thread metadata stored in `metadata` JSON: `thread_id`, `subject`, `participants`, `date`, `label_ids`
- [ ] Ingestion runs on a webhook trigger (Gmail push notification) with 15-minute polling fallback
- [ ] Ingested documents visible in Knowledge Engine search

### Dependencies

- [ ] ISS-007 (Gmail API client)
- [ ] Knowledge Engine (v1.1 — shipped)

### Definition of Done

- [ ] Send an email → thread appears in Knowledge Engine within 60 seconds
- [ ] HTML stripped correctly from thread body
- [ ] Delta sync does not re-ingest unchanged threads

---

## ISS-009 — Create AI-powered email summarization service

**Labels:** `feature`, `gmail`, `ai`, `medium-priority`, `sprint-20`, `v1.2`  
**Story Points:** 5  
**Priority:** P1

### Description

After ingesting a Gmail thread, generate an AI summary and store it in the document `metadata`. The summary should capture: main topic, key decisions, action items, and next steps.

### Acceptance Criteria

- [ ] Summary generated on thread ingestion (async, does not block ingestion)
- [ ] Summary stored in `knowledge_documents.metadata.summary`
- [ ] Summary format: topic sentence + bullet list of key points + action items
- [ ] Summaries capped at 300 words
- [ ] If summarization fails, ingestion still succeeds (summary is optional)
- [ ] Summary shown in thread knowledge card in the UI

### Dependencies

- [ ] ISS-008 (thread ingestion)
- [ ] OpenAI provider (v0.6 — shipped)

### Definition of Done

- [ ] New email thread ingested with valid summary
- [ ] Summary generation failure does not prevent document creation
- [ ] Cost estimate per summary logged for monitoring

---

## ISS-010 — Implement contact-to-email thread linking

**Labels:** `feature`, `gmail`, `crm`, `medium-priority`, `sprint-20`, `v1.2`  
**Story Points:** 3  
**Priority:** P1

### Description

After a Gmail thread is ingested, match thread participants to CRM contacts by email address and create `knowledge_links` entries connecting the email document to the matched contacts.

### Acceptance Criteria

- [ ] Each thread participant email matched against `contacts.email` in the workspace CRM
- [ ] Matched contacts linked via `knowledge_links` (`link_type: 'related'`)
- [ ] Unmatched participants do not cause ingestion failure
- [ ] Contact's knowledge panel shows linked email threads

### Dependencies

- [ ] ISS-008 (thread ingestion)
- [ ] CRM contacts (v0.4 — shipped)

### Definition of Done

- [ ] Email from a known CRM contact → link created
- [ ] Unknown sender → no link, no error

---

## ISS-011 — Build action item extraction from email threads

**Labels:** `feature`, `gmail`, `ai`, `medium-priority`, `sprint-20`, `v1.2`  
**Story Points:** 5  
**Priority:** P1

### Description

Extract action items and commitments from ingested email threads using AI. Surface extracted items as tasks in the workspace task list with the email thread as source.

### Acceptance Criteria

- [ ] AI extracts action items: who committed to what by when
- [ ] Extracted items stored in `tasks` table: `title`, `assignee` (matched to workspace member), `due_date` (if mentioned), `source_document_id` (the email document)
- [ ] Tasks appear in the workspace task list with `[Email]` source badge
- [ ] Extraction confidence threshold: only items with clear commitment language are extracted
- [ ] Executive can dismiss extracted tasks without creating them

### Dependencies

- [ ] ISS-009 (email summarization — shares AI call)
- [ ] Tasks system (v0.2 — shipped)

### Definition of Done

- [ ] "I'll send the proposal by Friday" → task created for matching member
- [ ] Low-confidence extractions not created automatically

---

## ISS-012 — Create daily unread email digest

**Labels:** `feature`, `gmail`, `ai`, `automation`, `medium-priority`, `sprint-20`, `v1.2`  
**Story Points:** 2  
**Priority:** P1

### Description

Generate a daily digest of unread emails requiring the executive's attention. Delivered as an in-app notification at 07:30 local time (configurable). Powered by AI summarization of the day's unread threads.

### Acceptance Criteria

- [ ] Digest generated daily at configurable time (default 07:30 local time)
- [ ] Contains: count of unread threads, top 5 threads by importance (AI-ranked), pending action items from previous digests
- [ ] Delivered as in-app notification and optionally by email
- [ ] "Mark all as reviewed" clears the digest
- [ ] If no unread threads, digest is suppressed

### Dependencies

- [ ] ISS-008 (thread ingestion)
- [ ] Notification system (Sprint 22 — planned; stub with in-app only for v1.2)

### Definition of Done

- [ ] Digest appears in notification panel at configured time
- [ ] AI ranking is not random (most recent + most participants ranked higher)
