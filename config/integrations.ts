import type { IntegrationDefinition } from '@/types/integrations'

export const INTEGRATION_REGISTRY: IntegrationDefinition[] = [
  // ── Google Workspace ────────────────────────────────────────────────────────
  {
    id: 'google_gmail',
    name: 'Gmail',
    description: 'Sync your inbox to extract signals, relationship context, and action items from every thread.',
    category: 'google_workspace',
    connectHref: '/api/google/connect',
    syncHref: '/api/gmail/sync',
  },
  {
    id: 'google_calendar',
    name: 'Google Calendar',
    description: 'Import meetings, build your executive agenda, and surface context before every call.',
    category: 'google_workspace',
    connectHref: '/api/google/connect',
    syncHref: '/api/calendar/sync',
  },
  {
    id: 'google_contacts',
    name: 'Google Contacts',
    description: 'Enrich your CRM with contact details and relationship history from Google Contacts.',
    category: 'google_workspace',
    connectHref: '/api/google/connect',
  },
  {
    id: 'google_drive',
    name: 'Google Drive',
    description: 'Ingest documents and files from Drive into the Knowledge Engine for AI-powered retrieval.',
    category: 'google_workspace',
    connectHref: '/api/google/connect',
  },
  // ── Microsoft 365 ───────────────────────────────────────────────────────────
  {
    id: 'microsoft_outlook',
    name: 'Outlook',
    description: 'Sync Outlook email and calendar to power your executive intelligence layer.',
    category: 'microsoft_365',
  },
  {
    id: 'microsoft_onedrive',
    name: 'OneDrive',
    description: 'Connect OneDrive to feed the Knowledge Engine with documents and files.',
    category: 'microsoft_365',
  },
  {
    id: 'microsoft_teams',
    name: 'Microsoft Teams',
    description: 'Ingest Teams messages and meeting transcripts for relationship and decision tracking.',
    category: 'microsoft_365',
  },
  // ── CRM ────────────────────────────────────────────────────────────────────
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'Bi-directional CRM sync — pull contacts, deals, and activities from Salesforce.',
    category: 'crm',
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'Import HubSpot contacts, companies, and pipeline data into your executive workspace.',
    category: 'crm',
  },
  // ── Communication ───────────────────────────────────────────────────────────
  {
    id: 'slack',
    name: 'Slack',
    description: 'Extract signals, decisions, and relationship context from Slack channels and DMs.',
    category: 'communication',
  },
  {
    id: 'zoom',
    name: 'Zoom',
    description: 'Ingest meeting recordings and transcripts for automatic note-taking and follow-up.',
    category: 'communication',
  },
  // ── AI Providers ────────────────────────────────────────────────────────────
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'Connect your OpenAI API key to power the AI Assistant with GPT-4o.',
    category: 'ai_providers',
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Use Claude as the AI backbone for executive reasoning and context assembly.',
    category: 'ai_providers',
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'Route AI requests to Gemini for multimodal understanding and long-context analysis.',
    category: 'ai_providers',
  },
  {
    id: 'ollama',
    name: 'Ollama',
    description: 'Run open-source models locally via Ollama for privacy-first AI processing.',
    category: 'ai_providers',
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    description: 'Add real-time web search to executive briefings and AI-powered research.',
    category: 'ai_providers',
  },
]

export const INTEGRATION_CATEGORIES: Record<string, string> = {
  google_workspace: 'Google Workspace',
  microsoft_365: 'Microsoft 365',
  crm: 'CRM',
  communication: 'Communication',
  ai_providers: 'AI Providers',
}
