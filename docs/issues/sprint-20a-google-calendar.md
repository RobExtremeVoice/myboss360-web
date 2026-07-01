# Sprint 20A — Google Calendar

**Milestone:** v1.2 Connected Executive  
**Sprint:** 20A  
**Total SP:** 27

---

## ISS-001 — Set up Google Cloud project and OAuth 2.0 credentials

**Labels:** `task`, `calendar`, `integrations`, `high-priority`, `sprint-20`, `v1.2`  
**Story Points:** 3  
**Priority:** P0

### Description

Create and configure the Google Cloud project that backs all Google Workspace integrations (Calendar, Gmail, Contacts, Drive). Enable required APIs, configure OAuth consent screen, and document credential management.

### Acceptance Criteria

- [ ] Google Cloud project created with project ID documented in `.env.example`
- [ ] Google Calendar API, Gmail API, People API, and Drive API all enabled
- [ ] OAuth 2.0 consent screen configured (app name, scopes, test users)
- [ ] OAuth client ID and secret added to `.env.local` (gitignored) and `.env.example` (placeholders only)
- [ ] Required scopes documented: `calendar.readonly`, `gmail.readonly`, `contacts.readonly`, `drive.readonly`

### Dependencies

- [ ] Google Cloud billing account required

### Definition of Done

- [ ] Developer can run OAuth flow locally against this project
- [ ] No credentials committed to git
- [ ] `.env.example` updated with all new variable names

---

## ISS-002 — Implement Google OAuth 2.0 authorization flow

**Labels:** `feature`, `calendar`, `integrations`, `auth`, `high-priority`, `sprint-20`, `v1.2`  
**Story Points:** 5  
**Priority:** P0

### Description

Build the end-to-end OAuth 2.0 PKCE flow that allows a workspace to connect their Google account. Store tokens encrypted in Supabase Vault. Handle token refresh automatically.

### Acceptance Criteria

- [ ] `GET /api/integrations/google/auth` redirects to Google OAuth consent screen
- [ ] `GET /api/integrations/google/callback` handles authorization code exchange
- [ ] Access token and refresh token stored encrypted in `workspace_integrations` table
- [ ] Token refresh runs automatically before expiry (proactive refresh, not reactive)
- [ ] `DELETE /api/integrations/google` revokes access and removes all tokens
- [ ] Connection status shown in Settings UI (`Connected as <email>` or `Connect Google`)

### Dependencies

- [ ] ISS-001 (Google Cloud credentials)
- [ ] `workspace_integrations` table migration

### Definition of Done

- [ ] OAuth flow works end-to-end in local + staging environment
- [ ] Refresh token survives server restart
- [ ] Revocation removes all Google-sourced data from workspace

---

## ISS-003 — Create Google Calendar event sync service

**Labels:** `feature`, `calendar`, `integrations`, `high-priority`, `sprint-20`, `v1.2`  
**Story Points:** 8  
**Priority:** P0

### Description

Build the service that syncs Google Calendar events into `calendar_events`. Use Google Calendar push notifications (webhooks) as the primary mechanism; poll every 15 minutes as fallback.

### Acceptance Criteria

- [ ] `POST /api/integrations/google/webhook/calendar` receives and verifies push notifications
- [ ] Webhook signature verified using `X-Goog-Channel-Token` header
- [ ] New/updated events upserted into `calendar_events` table within 30 seconds of change
- [ ] Deleted events soft-deleted (set `deleted_at`)
- [ ] Webhook channel registration renewed before expiry (max 7 days)
- [ ] Fallback polling runs every 15 minutes when webhook registration fails
- [ ] Sync limited to events ± 30 days from today (configurable)

### Dependencies

- [ ] ISS-002 (OAuth tokens available)
- [ ] `calendar_events` table (already in Sprint 9 schema)

### Definition of Done

- [ ] Create a Google Calendar event → appears in DB within 30 seconds
- [ ] Edit event → `calendar_events` record updated
- [ ] Delete event → soft-deleted in DB
- [ ] Unit tests for webhook verification + upsert logic

---

## ISS-004 — Build Executive Agenda view

**Labels:** `feature`, `calendar`, `ui`, `high-priority`, `sprint-20`, `v1.2`  
**Story Points:** 5  
**Priority:** P0

### Description

Create the Executive Agenda page at `/dashboard/agenda` — a unified daily and weekly view combining calendar events, tasks due, deals requiring attention, and an AI-generated daily briefing.

### Acceptance Criteria

- [ ] `/dashboard/agenda` route renders server-side
- [ ] Today view: events in chronological order, tasks due today, deals with follow-up overdue
- [ ] Week view: 7-day horizontal layout with event cards
- [ ] Meeting cards show: title, time, attendees, location/video link
- [ ] "No events today" empty state with encouraging copy
- [ ] Page loads in < 1 second (server-side rendered, no waterfall)

### Dependencies

- [ ] ISS-003 (events in database)

### Definition of Done

- [ ] Executive Agenda accessible from sidebar navigation
- [ ] Data is real (not mocked) from `calendar_events` table
- [ ] Renders correctly on desktop (1280px+) and tablet (768px)

---

## ISS-005 — Add meeting context cards (pre-meeting knowledge surface)

**Labels:** `feature`, `calendar`, `ai`, `knowledge`, `medium-priority`, `sprint-20`, `v1.2`  
**Story Points:** 3  
**Priority:** P1

### Description

For each upcoming meeting, surface a context card showing relevant knowledge, contacts, and deals. The card appears in the Executive Agenda 15 minutes before the meeting and is powered by a knowledge search using the meeting title and attendees.

### Acceptance Criteria

- [ ] Context card shown for meetings starting within the next 60 minutes
- [ ] Card contains: relevant knowledge documents (top 3 by keyword search), linked CRM contacts (matched by attendee email), open deals associated with attendees
- [ ] Card is dismissible (persisted in user preferences)
- [ ] Knowledge search falls back gracefully if no results found

### Dependencies

- [ ] ISS-004 (Agenda view)
- [ ] Knowledge Engine (v1.1 — shipped)
- [ ] CRM contacts (v0.4 — shipped)

### Definition of Done

- [ ] Context card appears automatically before meetings
- [ ] Search is scoped to the meeting's workspace
- [ ] Empty state shown when no relevant context found

---

## ISS-006 — Create post-meeting notes workflow

**Labels:** `feature`, `calendar`, `knowledge`, `medium-priority`, `sprint-20`, `v1.2`  
**Story Points:** 3  
**Priority:** P1

### Description

After a meeting ends, prompt the executive to create meeting notes. Pre-populate the Knowledge Engine document with meeting metadata (title, date, attendees). Support voice dictation (placeholder — activates with Sprint 23).

### Acceptance Criteria

- [ ] "Add notes" button appears on past meeting cards in the Agenda
- [ ] Clicking "Add notes" opens a document editor pre-filled with: meeting title, date, attendees list
- [ ] Saved notes create a `knowledge_documents` record with `object_type: 'meeting_notes'` and `category: 'meeting'`
- [ ] Meeting notes linked to attendee CRM contacts via `knowledge_links`
- [ ] Notes searchable from the Knowledge Engine immediately after save

### Dependencies

- [ ] ISS-004 (Agenda view)
- [ ] Knowledge Engine API (v1.1 — shipped)

### Definition of Done

- [ ] Meeting notes created and visible in knowledge search
- [ ] Links to CRM contacts present in `knowledge_links` table
- [ ] Document auto-tagged with attendee names
