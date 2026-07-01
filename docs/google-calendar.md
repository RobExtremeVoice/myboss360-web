# Google Calendar Integration

Sprint 20A — Connected Executive: Google Identity & Calendar Foundation

---

## Overview

MyBoss360 integrates with Google Calendar via OAuth 2.0. After authorization, events are synced into the `calendar_events` table and surfaced on the `/dashboard/calendar` page. Every synced event also feeds into the Memory Engine and Learning Engine, making calendar data part of the Executive Context available to the AI assistant.

---

## Architecture

```
Browser
  └── GET /api/google/connect?workspaceId=<id>
        └── Redirects to Google OAuth consent screen
              └── Google redirects to GET /api/google/callback?code=<code>&state=<state>
                    ├── Exchanges code for access + refresh tokens
                    ├── Stores tokens encrypted in google_tokens (AES-256-GCM)
                    ├── Stores connection in google_connections
                    └── Redirects to /dashboard/calendar?google_connected=1

Calendar Page (SSR)
  └── createGoogleCalendarApiService.getTodayAgenda(workspaceId, userId)
        └── Reads calendar_events table (populated by sync)
              └── Computes free time blocks

Sync Trigger
  └── POST /api/calendar/events (body: workspaceId, calendarId)
        └── createGoogleCalendarApiService.syncCalendar(...)
              ├── Fetches events from Google Calendar API
              ├── Upserts into calendar_events
              ├── Creates Memory records (type: meeting_summary)
              └── Creates Learning Signals (signal_type: recommended_action)
```

---

## Database Tables

### `google_connections`

Tracks one Google account link per (workspace, user) pair.

| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| workspace_id | UUID | FK → workspaces |
| organization_id | UUID | FK → organizations |
| user_id | UUID | FK → auth.users |
| google_account_email | TEXT | The connected Google account |
| scopes | TEXT[] | Granted OAuth scopes |
| status | TEXT | `active` \| `revoked` \| `error` |
| error_message | TEXT | Last error (if status=error) |

### `google_tokens`

Stores encrypted OAuth tokens per connection. One row per connection.

| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| connection_id | UUID | FK → google_connections |
| access_token_enc | TEXT | AES-256-GCM encrypted access token |
| refresh_token_enc | TEXT | AES-256-GCM encrypted refresh token |
| token_type | TEXT | Always `Bearer` |
| expires_at | TIMESTAMPTZ | Access token expiry |

### `calendar_sync_state`

Tracks incremental sync position per calendar.

| Column | Type | Description |
|---|---|---|
| connection_id | UUID | FK → google_connections |
| calendar_id | TEXT | Google calendar ID (e.g. `primary`) |
| sync_token | TEXT | Google `nextSyncToken` for delta syncs |
| last_synced_at | TIMESTAMPTZ | When the last sync completed |
| total_events_synced | INTEGER | Cumulative event count |

---

## Token Lifecycle

1. **Initial authorization** — user clicks "Connect Google Calendar" → redirected to Google → returns with `code`.
2. **Code exchange** — server exchanges `code` for `access_token` (1-hour TTL) + `refresh_token` (long-lived). Both are encrypted with AES-256-GCM before storage.
3. **Token refresh** — `getActiveTokens(connectionId)` checks `expires_at`. If within 5 minutes of expiry, it automatically calls the Google token endpoint with the refresh token and updates the stored access token.
4. **Revocation** — `revokeConnection(connectionId)` calls `https://oauth2.googleapis.com/revoke`, deletes tokens from DB, and sets connection status to `revoked`.

### Token encryption

Tokens at rest are encrypted with AES-256-GCM using a 32-byte key (`GOOGLE_TOKEN_ENCRYPTION_KEY`).

Each encrypted value is stored as `iv:authTag:ciphertext` (all hex). The IV is randomly generated per encryption. This ensures encrypted values are not reused even if the same token is re-stored.

---

## Sync Process

### Full sync (first run)

Fetches events in a ±7 / +30 day window from Google Calendar API with `singleEvents=true` and stores them in `calendar_events`. The `nextSyncToken` from the last page is saved to `calendar_sync_state`.

### Incremental sync

If a `sync_token` exists, the API call uses it instead of a time range. Google returns only changed/deleted events since the last sync. This is efficient for frequent sync calls.

### sync triggers

- `POST /api/calendar/events` — explicit sync from frontend
- `GET /api/calendar/events?sync=1` — combined fetch + sync
- (Future) Google Calendar Push Notifications webhook → `POST /api/google/webhook`

---

## API Reference

### `GET /api/google/connect?workspaceId=<uuid>`

Redirects to Google OAuth consent screen. Requires auth session.

### `GET /api/google/callback?code=<code>&state=<state>`

OAuth callback. Exchanges code for tokens, stores connection, redirects to calendar page.

### `GET /api/calendar/events`

Returns upcoming events from local `calendar_events` table.

| Param | Default | Description |
|---|---|---|
| workspaceId | first workspace | Target workspace |
| days | 30 | Look-ahead window (max 90) |
| sync | — | Set to `1` to trigger live sync before responding |
| calendarId | primary | Which Google calendar to sync |

Response:
```json
{
  "events": [...],
  "total": 12,
  "isConnected": true,
  "googleAccountEmail": "user@example.com",
  "syncResult": { "synced": 5, "syncToken": "..." }
}
```

### `POST /api/calendar/events`

Triggers a manual sync. Body: `{ workspaceId?, calendarId? }`.

### `GET /api/calendar/today`

Returns today's agenda: events, meeting count, free time blocks.

Response:
```json
{
  "date": "2026-07-01",
  "events": [...],
  "meetingCount": 3,
  "freeBlocks": [
    { "startAt": "...", "endAt": "...", "durationMinutes": 90 }
  ],
  "isConnected": true,
  "googleAccountEmail": "user@example.com"
}
```

---

## Executive Context Integration

Every event synced from Google Calendar produces:

1. **Memory record** (`type: meeting_summary`) — title, attendees, location, and description stored as structured content. Surfaced in AI context window.

2. **Learning signal** (`signal_type: recommended_action`) — for meetings starting within 24 hours, creates a signal prompting the executive to prepare. Feeds into the Recommendation Engine.

---

## Environment Variables

Add to `.env.local`:

```bash
# Google OAuth 2.0 credentials (from Google Cloud Console → Credentials)
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret

# Callback URL registered in Google Cloud Console
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google/callback

# AES-256-GCM token encryption key — 64 hex characters (32 bytes)
# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
GOOGLE_TOKEN_ENCRYPTION_KEY=your_64_char_hex_key

# App URL (used to build redirect URI if GOOGLE_REDIRECT_URI is not set)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Generating `GOOGLE_TOKEN_ENCRYPTION_KEY`

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Google Cloud Console Setup

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project (or select existing)
3. Enable **Google Calendar API** under APIs & Services → Library
4. Go to APIs & Services → Credentials → Create OAuth 2.0 Client ID
   - Application type: Web application
   - Authorized redirect URIs: add `http://localhost:3000/api/google/callback` (dev) and your production URL
5. Copy Client ID and Client Secret to `.env.local`
6. Configure OAuth consent screen with required scopes:
   - `https://www.googleapis.com/auth/calendar.readonly`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `openid`

---

## Future: Webhook (Push Notifications)

The incremental sync architecture is designed for webhook support. Future implementation:

1. Register a push notification channel: `POST https://www.googleapis.com/calendar/v3/calendars/{id}/events/watch`
2. Google sends `POST /api/google/webhook` with change notification
3. Server calls `syncCalendar()` for the affected workspace/calendar
4. Channel registration expires every 7 days — renew via cron job

Webhook secrets (X-Goog-Channel-Token) and channel IDs will be stored in `calendar_sync_state.metadata` (JSONB column, future migration).

---

## Future: Gmail Integration Readiness

The Google OAuth foundation built here is intentionally extensible:

- `google_connections.scopes` is an array — adding Gmail scopes requires only re-authorization
- `google_tokens` stores tokens at connection level — one connection can cover Calendar + Gmail + Contacts + Drive with a single token pair
- `createGoogleOAuthService` is scope-agnostic — `googleConfig.scopes` controls what's requested
- `handleCallback()` accepts any scope combination — Gmail service can call `getActiveTokens()` exactly the same way Calendar does

To add Gmail: update `googleConfig.scopes` to include `https://www.googleapis.com/auth/gmail.readonly`, create `services/google/google-gmail-api.ts` following the same pattern as `google-calendar-api.ts`.
