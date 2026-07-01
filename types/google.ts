// Google integration domain types for MyBoss360.

export type GoogleConnectionStatus = 'active' | 'revoked' | 'error'

export interface GoogleConnection {
  id: string
  workspaceId: string
  organizationId: string
  userId: string
  googleAccountEmail: string
  scopes: string[]
  status: GoogleConnectionStatus
  errorMessage: string | null
  createdAt: string
  updatedAt: string
}

export interface GoogleTokens {
  id: string
  connectionId: string
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresAt: string
  createdAt: string
  updatedAt: string
}

export interface CalendarSyncState {
  id: string
  connectionId: string
  calendarId: string
  syncToken: string | null
  nextPageToken: string | null
  lastSyncedAt: string | null
  totalEventsSynced: number
  createdAt: string
  updatedAt: string
}

// ─── Google Calendar API types ────────────────────────────────────────────────

export interface GoogleCalendar {
  id: string
  summary: string
  description?: string
  primary?: boolean
  accessRole: string
  timeZone?: string
}

export interface GoogleCalendarEvent {
  id: string
  summary?: string
  description?: string
  location?: string
  start: { dateTime?: string; date?: string; timeZone?: string }
  end: { dateTime?: string; date?: string; timeZone?: string }
  attendees?: Array<{
    email: string
    displayName?: string
    responseStatus?: string
    self?: boolean
    organizer?: boolean
  }>
  organizer?: { email: string; displayName?: string }
  status?: string
  recurringEventId?: string
  recurrence?: string[]
  htmlLink?: string
}

export interface GoogleCalendarEventsResponse {
  kind: string
  summary?: string
  nextSyncToken?: string
  nextPageToken?: string
  items: GoogleCalendarEvent[]
}

export interface GoogleCalendarListResponse {
  kind: string
  nextSyncToken?: string
  items: GoogleCalendar[]
}

// ─── OAuth types ──────────────────────────────────────────────────────────────

export interface GoogleOAuthTokenResponse {
  access_token: string
  refresh_token?: string
  token_type: string
  expires_in: number
  scope: string
}

export interface GoogleUserInfo {
  id: string
  email: string
  verified_email: boolean
  name?: string
  picture?: string
}

// ─── Agenda types (used by dashboard / calendar page) ────────────────────────

export interface AgendaEvent {
  id: string
  title: string
  startAt: string
  endAt: string
  allDay: boolean
  location: string | null
  attendees: string[]
  isNow: boolean
  minutesUntil: number | null
  source: 'google' | 'local'
}

export interface TodayAgenda {
  date: string
  events: AgendaEvent[]
  meetingCount: number
  freeBlocks: FreeTimeBlock[]
  isConnected: boolean
  googleAccountEmail: string | null
}

export interface FreeTimeBlock {
  startAt: string
  endAt: string
  durationMinutes: number
}
