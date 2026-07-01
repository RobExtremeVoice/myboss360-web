// Google OAuth 2.0 configuration for MyBoss360.
// Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI in .env.local.
// Set GOOGLE_TOKEN_ENCRYPTION_KEY to a 64-character hex string (32 bytes) for AES-256-GCM.

export const googleConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID ?? '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
  redirectUri:
    process.env.GOOGLE_REDIRECT_URI ??
    `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/google/callback`,

  // OAuth 2.0 endpoints
  authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  revokeUrl: 'https://oauth2.googleapis.com/revoke',
  userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',

  // Requested scopes — identity + calendar read + gmail read
  // All scopes requested in a single OAuth flow so one connection covers both Calendar and Gmail.
  scopes: [
    'openid',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/gmail.readonly',
  ],

  // Calendar API
  calendarApiBase: 'https://www.googleapis.com/calendar/v3',

  // Gmail API
  gmailApiBase: 'https://gmail.googleapis.com/gmail/v1',
  gmailSyncLookBackDays: 90,
  gmailMaxThreadsPerPage: 500,

  // Token encryption key — 64 hex chars = 32 bytes for AES-256-GCM
  tokenEncryptionKey: process.env.GOOGLE_TOKEN_ENCRYPTION_KEY ?? '',

  // Sync settings
  defaultSyncLookAheadDays: 30,
  defaultSyncLookBehindDays: 7,
  maxEventsPerPage: 250,

  // Token expiry buffer: refresh 5 minutes before actual expiry
  tokenRefreshBufferMs: 5 * 60 * 1000,
} as const

export function isGoogleConfigured(): boolean {
  return Boolean(googleConfig.clientId && googleConfig.clientSecret)
}

export const GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly'

export function connectionHasGmailScope(scopes: string[]): boolean {
  return scopes.includes(GMAIL_SCOPE)
}
