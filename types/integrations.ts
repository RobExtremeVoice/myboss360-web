export type IntegrationProvider =
  | 'google_gmail'
  | 'google_calendar'
  | 'google_contacts'
  | 'google_drive'
  | 'microsoft_outlook'
  | 'microsoft_onedrive'
  | 'microsoft_teams'
  | 'salesforce'
  | 'hubspot'
  | 'slack'
  | 'zoom'
  | 'openai'
  | 'anthropic'
  | 'gemini'
  | 'ollama'
  | 'perplexity'

export type IntegrationCategory =
  | 'google_workspace'
  | 'microsoft_365'
  | 'crm'
  | 'communication'
  | 'ai_providers'

export type IntegrationStatus = 'connected' | 'disconnected' | 'coming_soon' | 'error'

export interface IntegrationDefinition {
  id: IntegrationProvider
  name: string
  description: string
  category: IntegrationCategory
  /** href for the Connect button — undefined means the integration is coming soon */
  connectHref?: string
  /** API path to trigger a sync — e.g. '/api/gmail/sync' */
  syncHref?: string
}

export interface IntegrationState {
  definition: IntegrationDefinition
  status: IntegrationStatus
  accountEmail: string | null
  lastSync: string | null
  errorMessage: string | null
}
