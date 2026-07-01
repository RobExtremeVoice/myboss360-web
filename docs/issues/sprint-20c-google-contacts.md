# Sprint 20C — Google Contacts

**Milestone:** v1.2 Connected Executive  
**Sprint:** 20C  
**Total SP:** 14

---

## ISS-013 — Build Google Contacts sync service

**Labels:** `feature`, `contacts`, `integrations`, `high-priority`, `sprint-20`, `v1.2`  
**Story Points:** 5  
**Priority:** P0

### Description

Build the service that syncs Google Contacts (People API) into the workspace. Use incremental sync via `syncToken`. Only contacts with at minimum a name and email are synced.

### Acceptance Criteria

- [ ] `PeopleApiClient` wraps Google People API: `listConnections`, `getContact`
- [ ] Full sync on first connection; incremental sync via `syncToken` on subsequent runs
- [ ] Synced contacts stored in a staging table `google_contacts_staging` (not directly in CRM)
- [ ] Contacts missing both name and email are skipped
- [ ] Sync runs on schedule (every 6 hours) and on-demand via API
- [ ] `GET /api/integrations/google/contacts/sync-status` returns last sync time and contact count

### Dependencies

- [ ] ISS-002 (OAuth flow with `contacts.readonly` scope)

### Definition of Done

- [ ] First sync imports all Google contacts to staging
- [ ] Incremental sync only fetches changed contacts
- [ ] Deleted Google contacts soft-deleted in staging

---

## ISS-014 — Implement CRM contact enrichment from Google Contacts

**Labels:** `feature`, `contacts`, `crm`, `high-priority`, `sprint-20`, `v1.2`  
**Story Points:** 5  
**Priority:** P0

### Description

Match staged Google contacts to CRM contacts by email address and enrich CRM records with missing fields (phone, company, title, photo URL). Do not overwrite fields the executive has set manually.

### Acceptance Criteria

- [ ] Match algorithm: exact email match → high confidence; name fuzzy match → medium confidence (requires review)
- [ ] Enrichment fills: `phone`, `title`, `company` (if empty in CRM), `photo_url`
- [ ] Fields manually set by user are marked `user_locked: true` and never overwritten by enrichment
- [ ] Enrichment log stored in `contacts.metadata.enrichment_log` (timestamp, fields enriched, source)
- [ ] Enriched contacts shown with a "Enriched from Google" indicator in the UI

### Dependencies

- [ ] ISS-013 (Google contacts in staging)
- [ ] CRM contacts repository (v0.4 — shipped)

### Definition of Done

- [ ] Known CRM contact → enriched with Google Contacts data
- [ ] Manually set fields not overwritten
- [ ] Enrichment log entries present

---

## ISS-015 — Add bidirectional contact sync

**Labels:** `feature`, `contacts`, `crm`, `medium-priority`, `sprint-20`, `v1.2`  
**Story Points:** 3  
**Priority:** P1

### Description

Allow new CRM contacts to optionally be pushed to Google Contacts. Workspace admin controls whether this is enabled. Write operations require `contacts.readwrite` scope (upgrade from `contacts.readonly`).

### Acceptance Criteria

- [ ] Workspace setting: "Sync new CRM contacts to Google" (default: off)
- [ ] When enabled and scope granted, new CRM contacts are created in Google Contacts within 30 seconds
- [ ] Contact updates in CRM synced to Google (fields: name, email, phone, company)
- [ ] CRM contact deletes do NOT delete Google contacts (one-way for deletes)
- [ ] Sync failures logged and surfaced in integration status

### Dependencies

- [ ] ISS-014 (enrichment and matching)

### Definition of Done

- [ ] New CRM contact appears in Google Contacts within 30 seconds
- [ ] Delete in CRM does not delete in Google

---

## ISS-016 — Build deduplication detection UI

**Labels:** `feature`, `contacts`, `crm`, `ui`, `medium-priority`, `sprint-20`, `v1.2`  
**Story Points:** 1  
**Priority:** P2

### Description

Surface medium-confidence contact matches for executive review. The executive sees candidate pairs and can merge, skip, or mark as distinct.

### Acceptance Criteria

- [ ] "Possible duplicates" section in CRM Contacts view
- [ ] Each pair shown with: both records side-by-side, matching fields highlighted, confidence score
- [ ] Actions: Merge (keep fields from selected record), Skip (never suggest again), Distinct (mark as two separate people)
- [ ] Merged contacts have `merged_from_id` reference preserved in metadata

### Dependencies

- [ ] ISS-014 (enrichment creates potential duplicates)

### Definition of Done

- [ ] Duplicate pairs surfaced correctly
- [ ] Merge action creates unified record
