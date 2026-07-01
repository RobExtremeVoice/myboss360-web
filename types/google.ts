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

// ─── Gmail API types ──────────────────────────────────────────────────────────

export interface GmailProfile {
  emailAddress: string
  messagesTotal: number
  threadsTotal: number
  historyId: string
}

export interface GmailThreadRef {
  id: string
  threadId: string
  snippet: string
}

export interface GmailThreadsListResponse {
  threads?: GmailThreadRef[]
  nextPageToken?: string
  resultSizeEstimate: number
}

export interface GmailMessageHeader {
  name: string
  value: string
}

export interface GmailMessagePart {
  partId?: string
  mimeType: string
  filename?: string
  headers?: GmailMessageHeader[]
  body?: {
    attachmentId?: string
    size: number
    data?: string
  }
  parts?: GmailMessagePart[]
}

export interface GmailMessage {
  id: string
  threadId: string
  labelIds?: string[]
  snippet?: string
  historyId?: string
  internalDate?: string
  payload?: GmailMessagePart
  sizeEstimate?: number
}

export interface GmailThread {
  id: string
  historyId?: string
  snippet?: string
  messages?: GmailMessage[]
}

export interface GmailHistoryMessage {
  id: string
  threadId: string
}

export interface GmailHistoryItem {
  id: string
  messages?: GmailHistoryMessage[]
  messagesAdded?: Array<{ message: GmailHistoryMessage }>
  messagesDeleted?: Array<{ message: GmailHistoryMessage }>
  labelsAdded?: Array<{ message: GmailHistoryMessage; labelIds: string[] }>
  labelsRemoved?: Array<{ message: GmailHistoryMessage; labelIds: string[] }>
}

export interface GmailHistoryResponse {
  history?: GmailHistoryItem[]
  nextPageToken?: string
  historyId: string
}

// ─── Gmail sync domain types ──────────────────────────────────────────────────

export interface GmailSyncState {
  id: string
  connectionId: string
  historyId: string | null
  lastSyncAt: string | null
  totalThreadsSynced: number
  createdAt: string
  updatedAt: string
}

export interface GmailSyncResult {
  threadIds: string[]
  historyId: string
  synced: number
  isInitial: boolean
}

// ─── Thread Intelligence types (Part 3) ──────────────────────────────────────

export type ThreadStatus =
  | 'open'
  | 'waiting_for_us'
  | 'waiting_for_customer'
  | 'closed'

export type ResponseStatus =
  | 'waiting_for_me'
  | 'waiting_for_customer'
  | 'conversation_closed'
  | 'conversation_active'

export type FollowUpPriority = 'low' | 'medium' | 'high' | 'critical'

export type ThreadHealth = 'healthy' | 'watch' | 'stale' | 'critical' | 'closed'

export interface NormalizedMessage {
  messageId: string
  fromEmail: string
  fromName: string | null
  toEmails: string[]
  ccEmails: string[]
  subject: string | null
  snippet: string | null
  bodyText: string | null
  labelIds: string[]
  sentAt: Date
  isOutbound: boolean
}

export interface AnalyzedThread {
  threadId: string
  subject: string | null
  snippet: string | null
  status: ThreadStatus
  messageCount: number
  firstMessageAt: Date | null
  latestReplyAt: Date | null
  lastSenderEmail: string | null
  participantEmails: string[]
  avgResponseLatencyMs: number | null
  lastResponseLatencyMs: number | null
  labelIds: string[]
  messages: NormalizedMessage[]
}

// ─── Contact Extraction types (Part 4) ───────────────────────────────────────

export interface ExtractedContact {
  email: string
  displayName: string | null
  domain: string
  organization: string | null
  signatureHint: string | null
}

export interface ExtractedParticipant {
  contact: ExtractedContact
  role: 'sender' | 'recipient' | 'cc'
  messageCount: number
}
