# Sprint 20D — Google Drive

**Milestone:** v1.2 Connected Executive  
**Sprint:** 20D  
**Total SP:** 22

---

## ISS-017 — Implement Google Drive API integration

**Labels:** `feature`, `drive`, `integrations`, `high-priority`, `sprint-20`, `v1.2`  
**Story Points:** 3  
**Priority:** P0

### Description

Build the Drive API client and webhook infrastructure. Similar pattern to Calendar (ISS-003) but for file change events.

### Acceptance Criteria

- [ ] `DriveApiClient` wraps Drive API: `listFiles`, `getFile`, `exportFile` (Docs → text), `watchChanges`
- [ ] Change notifications received via Drive webhook push (`changes.watch`)
- [ ] Webhook payload verified and routed to sync worker
- [ ] Supported MIME types documented: `application/vnd.google-apps.document`, `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

### Dependencies

- [ ] ISS-002 (OAuth with `drive.readonly` scope)

### Definition of Done

- [ ] Can list files and receive change webhooks locally

---

## ISS-018 — Build Drive folder sync service

**Labels:** `feature`, `drive`, `knowledge`, `high-priority`, `sprint-20`, `v1.2`  
**Story Points:** 5  
**Priority:** P0

### Description

Allow executives to designate one or more Drive folders for automatic sync into the Knowledge Engine. Files in the folder are parsed, chunked, and stored as knowledge documents.

### Acceptance Criteria

- [ ] Executive can select a Drive folder to sync from Settings → Integrations
- [ ] All supported files in the folder are ingested on initial connection
- [ ] New files added to the folder are ingested within 60 seconds (via webhook)
- [ ] Folder sync config stored in `workspace_integrations.config` as `{ synced_folder_ids: string[] }`
- [ ] Sync exclusion list: files matching configurable name patterns (e.g., `*.tmp`) are skipped
- [ ] `knowledge_sources` record created per synced folder with `source_type: 'integration'`

### Dependencies

- [ ] ISS-017 (Drive API client)
- [ ] Knowledge Engine (v1.1 — shipped)

### Definition of Done

- [ ] Add file to synced folder → appears in Knowledge Engine within 60 seconds
- [ ] `knowledge_documents.source_id` links to the Drive source record

---

## ISS-019 — Add Google Docs to Knowledge Engine pipeline

**Labels:** `feature`, `drive`, `knowledge`, `high-priority`, `sprint-20`, `v1.2`  
**Story Points:** 5  
**Priority:** P0

### Description

Export Google Docs as plain text and ingest via the document pipeline. Preserve document structure (headings as paragraph breaks) for chunking quality.

### Acceptance Criteria

- [ ] Google Docs exported via `files.export(mimeType='text/plain')`
- [ ] Heading hierarchy preserved: `# H1`, `## H2`, etc. before plain text export
- [ ] Exported text passed through `parseDocument()` and `chunkDocument()` (existing pipeline)
- [ ] Document title set from Drive file name
- [ ] `object_type` defaults to `'document'`; executive can override in Settings

### Dependencies

- [ ] ISS-018 (folder sync)

### Definition of Done

- [ ] Google Doc → knowledge document with correct chunks
- [ ] Headings appear as paragraph boundaries for chunk quality

---

## ISS-020 — Add PDF and DOCX parsing from Drive

**Labels:** `feature`, `drive`, `knowledge`, `medium-priority`, `sprint-20`, `v1.2`  
**Story Points:** 5  
**Priority:** P1

### Description

Extend the document pipeline to parse PDF and DOCX files from Drive. No external packages: use streaming text extraction approaches available in the Node.js standard library or already-bundled deps.

### Acceptance Criteria

- [ ] PDF text extraction: use `pdf-parse` (already a transitive dep) or equivalent without adding new packages
- [ ] DOCX text extraction: unzip + extract `word/document.xml`, strip XML tags
- [ ] Extracted text passed to existing `parseDocument()` → `chunkDocument()` pipeline
- [ ] Binary content detection: skip files with non-text binary (images, spreadsheets)
- [ ] Max file size honored: `knowledgeConfig.maxDocumentSizeBytes` (5 MB)

### Dependencies

- [ ] ISS-019 (pipeline integration pattern)

### Definition of Done

- [ ] PDF uploaded to synced folder → chunks created
- [ ] DOCX uploaded → chunks created
- [ ] 6 MB PDF rejected with structured error

---

## ISS-021 — Implement incremental Drive sync (modifiedTime delta)

**Labels:** `feature`, `drive`, `knowledge`, `medium-priority`, `sprint-20`, `v1.2`  
**Story Points:** 4  
**Priority:** P1

### Description

Re-ingest Drive files when they are modified. Compare Drive `modifiedTime` to `knowledge_documents.updated_at` to decide whether re-ingestion is needed. Only re-chunk if content changes.

### Acceptance Criteria

- [ ] On Drive change webhook: fetch file `modifiedTime`, compare to stored `updated_at`
- [ ] If newer: re-parse + re-chunk + save version snapshot (existing `updateDocument` flow)
- [ ] If unchanged (metadata-only change, e.g. rename): update title only, no re-chunk
- [ ] `knowledge_documents.metadata.drive_modified_time` stored for comparison
- [ ] Idempotent: re-running sync on unchanged file produces no changes

### Dependencies

- [ ] ISS-018 (folder sync), ISS-019 (pipeline)

### Definition of Done

- [ ] Edit Drive doc → knowledge document re-chunked within 60 seconds
- [ ] Rename Drive doc (no content change) → title updated, no re-chunk
