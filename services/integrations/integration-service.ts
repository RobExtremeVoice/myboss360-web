import { INTEGRATION_REGISTRY } from '@/config/integrations'
import type { IntegrationRepository } from '@/repositories/integrations'
import type { IntegrationState, IntegrationStatus } from '@/types/integrations'

const GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly'
const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly'

// Integrations fully live — status derived from google_connections scopes
const LIVE_GOOGLE_IDS = new Set(['google_gmail', 'google_calendar'])

// Integrations that share the Google OAuth flow but scope isn't wired yet
const COMING_SOON_GOOGLE_IDS = new Set(['google_contacts', 'google_drive'])

export function createIntegrationService(repo: IntegrationRepository) {
  return {
    async listWorkspaceIntegrations(
      workspaceId: string,
      userId: string
    ): Promise<IntegrationState[]> {
      const data = await repo.getWorkspaceIntegrationData(workspaceId, userId)
      const { googleConnection, gmailLastSync, calendarLastSync } = data

      return INTEGRATION_REGISTRY.map((definition) => {
        // Non-Google or not-yet-wired Google integrations
        if (!LIVE_GOOGLE_IDS.has(definition.id)) {
          // Contacts + Drive are not wired in current OAuth flow
          if (COMING_SOON_GOOGLE_IDS.has(definition.id)) {
            return { definition, status: 'coming_soon', accountEmail: null, lastSync: null, errorMessage: null }
          }
          // All other categories
          if (definition.category !== 'google_workspace') {
            return { definition, status: 'coming_soon', accountEmail: null, lastSync: null, errorMessage: null }
          }
        }

        // Gmail
        if (definition.id === 'google_gmail') {
          return resolveGoogleStatus(
            definition,
            googleConnection,
            GMAIL_SCOPE,
            gmailLastSync
          )
        }

        // Calendar
        if (definition.id === 'google_calendar') {
          return resolveGoogleStatus(
            definition,
            googleConnection,
            CALENDAR_SCOPE,
            calendarLastSync
          )
        }

        // Fallback (should not be reached given the registry)
        return { definition, status: 'coming_soon', accountEmail: null, lastSync: null, errorMessage: null }
      })
    },
  }
}

function resolveGoogleStatus(
  definition: IntegrationState['definition'],
  googleConnection: { google_account_email: string; scopes: string[]; status: string; error_message: string | null } | null,
  requiredScope: string,
  lastSync: string | null
): IntegrationState {
  if (!googleConnection) {
    return { definition, status: 'disconnected', accountEmail: null, lastSync: null, errorMessage: null }
  }

  if (googleConnection.status === 'error') {
    return {
      definition,
      status: 'error',
      accountEmail: googleConnection.google_account_email,
      lastSync,
      errorMessage: googleConnection.error_message,
    }
  }

  const hasScope = googleConnection.scopes.includes(requiredScope)
  const status: IntegrationStatus = hasScope && googleConnection.status === 'active' ? 'connected' : 'disconnected'

  return {
    definition,
    status,
    accountEmail: googleConnection.google_account_email,
    lastSync,
    errorMessage: null,
  }
}

export type IntegrationService = ReturnType<typeof createIntegrationService>
