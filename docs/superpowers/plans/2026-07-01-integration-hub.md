# Sprint 21.0 — Integration Hub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete Settings → Integrations page at `/dashboard/settings/integrations` showing all platform integrations, reusing existing `google_connections` and `google_tokens` tables, following existing design patterns.

**Architecture:** Three-layer (repository → service → API) feeds a server-rendered page with React component grid. Google integrations pull live status from the DB. All other integrations are statically `coming_soon`. No new OAuth flows.

**Tech Stack:** Next.js 16 App Router, TypeScript strict, Supabase SSR, Tailwind CSS v4, shadcn/ui, Lucide icons, Vitest

## Global Constraints

- Do NOT modify `app/api/google/connect/route.ts`, `app/api/google/callback/route.ts`, or any file under `services/google/` or `repositories/google/`
- Do NOT add new database migrations or change any schema
- Reuse existing `google_connections` and `google_tokens` tables (read-only from `repositories/google/connections.ts` and `repositories/google/calendar-sync.ts`)
- Use `gmail_sync_state.last_sync_at` for Gmail last sync
- Use `calendar_sync_state.last_synced_at` for Calendar last sync
- Google scopes that signal which integrations are active:
  - Gmail: `https://www.googleapis.com/auth/gmail.readonly`
  - Calendar: `https://www.googleapis.com/auth/calendar.readonly`
  - Contacts: `https://www.googleapis.com/auth/contacts.readonly` (not yet in OAuth flow → always disconnected for now)
  - Drive: `https://www.googleapis.com/auth/drive.readonly` (not yet in OAuth flow → always disconnected for now)
- All non-Google integrations have status `coming_soon`
- Connect button for Google integrations links to `GET /api/google/connect?workspaceId=<id>`
- Sync Now for Gmail → `POST /api/gmail/sync?workspaceId=<id>`, Calendar → `POST /api/calendar/sync?workspaceId=<id>` (call from client, fire-and-forget, no new routes needed)
- Disconnect button → `DELETE /api/google/connect?workspaceId=<id>` (add DELETE handler to existing route — one new handler only, do not touch GET)
- Page must be a Next.js server component; only the IntegrationCard action buttons are client-side
- Follow existing design system: `SectionCard`, `DashboardPageHeader`, border radius `rounded-[1.75rem]`, `text-slate-950`, `border-black/6`, shadow `shadow-[0_18px_48px_-36px_rgba(15,23,42,0.18)]`
- Export pattern: named exports only (no default exports for components)
- All new files in TypeScript strict — no `any`
- Run `npm run lint && npm run build && npm test` before marking each task done
- No new npm dependencies

---

## Task 1: Types + Integration Registry Config

**Files:**
- Create: `types/integrations.ts`
- Create: `config/integrations.ts`

**Interfaces:**
- Produces:
  - `IntegrationProvider` — union of all provider keys
  - `IntegrationCategory` — union: `'google_workspace' | 'microsoft_365' | 'crm' | 'communication' | 'ai_providers'`
  - `IntegrationStatus` — `'connected' | 'disconnected' | 'coming_soon' | 'error'`
  - `IntegrationDefinition` — static metadata per integration (id, name, description, category, provider, connectHref?, syncHref?)
  - `IntegrationState` — runtime state (definition + status + accountEmail + lastSync + errorMessage)
  - `INTEGRATION_REGISTRY: IntegrationDefinition[]` — exported array of all 16 integrations

- [ ] **Step 1: Write failing test for INTEGRATION_REGISTRY shape**

```typescript
// tests/config/integrations.test.ts
import { describe, it, expect } from 'vitest'
import { INTEGRATION_REGISTRY } from '../../config/integrations'

describe('INTEGRATION_REGISTRY', () => {
  it('contains exactly 16 integrations', () => {
    expect(INTEGRATION_REGISTRY).toHaveLength(16)
  })

  it('every entry has required fields', () => {
    for (const def of INTEGRATION_REGISTRY) {
      expect(typeof def.id).toBe('string')
      expect(def.id.length).toBeGreaterThan(0)
      expect(typeof def.name).toBe('string')
      expect(typeof def.description).toBe('string')
      expect(['google_workspace', 'microsoft_365', 'crm', 'communication', 'ai_providers']).toContain(def.category)
    }
  })

  it('Google Workspace integrations have connectHref', () => {
    const googleIntegrations = INTEGRATION_REGISTRY.filter(i => i.category === 'google_workspace')
    expect(googleIntegrations.length).toBe(4) // Gmail, Calendar, Contacts, Drive
    for (const def of googleIntegrations) {
      expect(def.connectHref).toBeDefined()
    }
  })

  it('non-Google integrations have no connectHref', () => {
    const nonGoogle = INTEGRATION_REGISTRY.filter(i => i.category !== 'google_workspace')
    for (const def of nonGoogle) {
      expect(def.connectHref).toBeUndefined()
    }
  })
})
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npm test -- tests/config/integrations.test.ts
```
Expected: FAIL — "Cannot find module"

- [ ] **Step 3: Write `types/integrations.ts`**

```typescript
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
```

- [ ] **Step 4: Write `config/integrations.ts`**

```typescript
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
```

- [ ] **Step 5: Run test — verify it passes**

```bash
npm test -- tests/config/integrations.test.ts
```
Expected: 4 tests PASS

- [ ] **Step 6: Run full quality gate**

```bash
npm run lint && npm run build && npm test
```
Expected: all clean

- [ ] **Step 7: Commit**

```bash
git add types/integrations.ts config/integrations.ts tests/config/integrations.test.ts
git commit -m "feat(integrations): types + integration registry config"
```

---

## Task 2: Integration Repository

**Files:**
- Create: `repositories/integrations/integration-repository.ts`
- Create: `repositories/integrations/index.ts` (barrel)

**Interfaces:**
- Consumes: `google_connections` table, `gmail_sync_state` table, `calendar_sync_state` table (via Supabase `db` client passed in)
- Produces:
  - `IntegrationConnectionData` interface with: `googleConnection` (row | null), `gmailLastSync` (string | null), `calendarLastSync` (string | null)
  - `createIntegrationRepository(db)` factory
  - `repo.getWorkspaceIntegrationData(workspaceId, userId): Promise<IntegrationConnectionData>`

- [ ] **Step 1: Write failing test**

```typescript
// tests/repositories/integrations/integration-repository.test.ts
import { describe, it, expect, vi } from 'vitest'
import { createIntegrationRepository } from '../../../repositories/integrations/integration-repository'

function makeMockDb(googleConn: unknown, gmailSync: unknown, calSync: unknown) {
  const makeQuery = (data: unknown) => ({
    select: () => ({
      eq: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data, error: null }),
          order: () => ({
            limit: () => ({ then: (f: (v: unknown) => unknown) => Promise.resolve(f({ data, error: null })) }),
            then: (f: (v: unknown) => unknown) => Promise.resolve(f({ data, error: null })),
          }),
          then: (f: (v: unknown) => unknown) => Promise.resolve(f({ data, error: null })),
        }),
        maybeSingle: () => Promise.resolve({ data, error: null }),
        order: () => ({
          limit: () => ({ then: (f: (v: unknown) => unknown) => Promise.resolve(f({ data, error: null })) }),
          then: (f: (v: unknown) => unknown) => Promise.resolve(f({ data, error: null })),
        }),
      }),
    }),
    maybeSingle: () => Promise.resolve({ data, error: null }),
  })

  return {
    from: vi.fn((table: string) => {
      if (table === 'google_connections') return makeQuery(googleConn)
      if (table === 'gmail_sync_state') return makeQuery(gmailSync)
      if (table === 'calendar_sync_state') return makeQuery(calSync)
      return makeQuery(null)
    }),
  }
}

describe('createIntegrationRepository', () => {
  it('returns null googleConnection when no Google connection exists', async () => {
    const db = makeMockDb(null, null, null)
    const repo = createIntegrationRepository(db as never)
    const result = await repo.getWorkspaceIntegrationData('ws-1', 'user-1')
    expect(result.googleConnection).toBeNull()
    expect(result.gmailLastSync).toBeNull()
    expect(result.calendarLastSync).toBeNull()
  })

  it('returns googleConnection and sync times when data exists', async () => {
    const conn = { id: 'c-1', workspace_id: 'ws-1', google_account_email: 'x@y.com', scopes: [], status: 'active' }
    const gmailSync = { last_sync_at: '2024-01-01T00:00:00Z' }
    const calSync = { last_synced_at: '2024-01-02T00:00:00Z' }
    const db = makeMockDb(conn, gmailSync, calSync)
    const repo = createIntegrationRepository(db as never)
    const result = await repo.getWorkspaceIntegrationData('ws-1', 'user-1')
    expect(result.googleConnection?.id).toBe('c-1')
  })
})
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npm test -- tests/repositories/integrations/integration-repository.test.ts
```
Expected: FAIL — "Cannot find module"

- [ ] **Step 3: Write `repositories/integrations/integration-repository.ts`**

```typescript
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

type GoogleConnectionRow = Database['public']['Tables']['google_connections']['Row']

export interface IntegrationConnectionData {
  googleConnection: GoogleConnectionRow | null
  gmailLastSync: string | null
  calendarLastSync: string | null
}

export function createIntegrationRepository(db: SupabaseClient<Database>) {
  return {
    async getWorkspaceIntegrationData(
      workspaceId: string,
      userId: string
    ): Promise<IntegrationConnectionData> {
      // Fetch Google connection for this workspace+user
      const { data: googleConnection } = await db
        .from('google_connections')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId)
        .maybeSingle()

      let gmailLastSync: string | null = null
      let calendarLastSync: string | null = null

      if (googleConnection) {
        // Gmail last sync — from gmail_sync_state joined to connection
        const { data: gmailSync } = await db
          .from('gmail_sync_state')
          .select('last_sync_at')
          .eq('connection_id', googleConnection.id)
          .maybeSingle()
        gmailLastSync = gmailSync?.last_sync_at ?? null

        // Calendar last sync — most recent calendar sync state for this connection
        const { data: calSyncs } = await db
          .from('calendar_sync_state')
          .select('last_synced_at')
          .eq('connection_id', googleConnection.id)
          .order('last_synced_at', { ascending: false })
          .limit(1)
          .then(({ data, error }) => ({ data: data ?? [], error }))
        calendarLastSync = calSyncs?.[0]?.last_synced_at ?? null
      }

      return {
        googleConnection: googleConnection ?? null,
        gmailLastSync,
        calendarLastSync,
      }
    },
  }
}

export type IntegrationRepository = ReturnType<typeof createIntegrationRepository>
```

- [ ] **Step 4: Write `repositories/integrations/index.ts`**

```typescript
export { createIntegrationRepository } from './integration-repository'
export type { IntegrationConnectionData, IntegrationRepository } from './integration-repository'
```

- [ ] **Step 5: Run test — verify it passes**

```bash
npm test -- tests/repositories/integrations/integration-repository.test.ts
```
Expected: 2 tests PASS

- [ ] **Step 6: Full quality gate**

```bash
npm run lint && npm run build && npm test
```

- [ ] **Step 7: Commit**

```bash
git add repositories/integrations/ tests/repositories/integrations/
git commit -m "feat(integrations): integration repository"
```

---

## Task 3: Integration Service

**Files:**
- Create: `services/integrations/integration-service.ts`

**Interfaces:**
- Consumes: `IntegrationConnectionData` from Task 2; `INTEGRATION_REGISTRY` from Task 1
- Produces: `createIntegrationService(db).listWorkspaceIntegrations(workspaceId, userId): Promise<IntegrationState[]>`

The service maps the 16 static definitions against the live `IntegrationConnectionData` to produce statuses:

```
google_gmail:
  - status='connected' if googleConnection exists AND scopes includes gmail scope AND status='active'
  - status='error'     if googleConnection exists AND status='error'
  - status='disconnected' otherwise

google_calendar:
  - status='connected' if googleConnection exists AND scopes includes calendar scope AND status='active'
  - status='error'     if googleConnection exists AND status='error'
  - status='disconnected' otherwise

google_contacts / google_drive:
  - Always 'coming_soon' (scope not in current OAuth flow)

all others:
  - Always 'coming_soon'
```

Scope constants:
- `GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly'`
- `CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly'`

- [ ] **Step 1: Write failing tests**

```typescript
// tests/services/integrations/integration-service.test.ts
import { describe, it, expect, vi } from 'vitest'
import { createIntegrationService } from '../../../services/integrations/integration-service'
import type { IntegrationConnectionData } from '../../../repositories/integrations/integration-repository'

const GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly'
const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly'

function makeConn(overrides: Partial<{
  scopes: string[]
  status: string
  google_account_email: string
}> = {}) {
  return {
    id: 'c-1',
    workspace_id: 'ws-1',
    organization_id: 'org-1',
    user_id: 'user-1',
    google_account_email: overrides.google_account_email ?? 'test@gmail.com',
    scopes: overrides.scopes ?? [GMAIL_SCOPE, CALENDAR_SCOPE],
    status: overrides.status ?? 'active',
    error_message: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }
}

function makeRepo(data: IntegrationConnectionData) {
  return {
    getWorkspaceIntegrationData: vi.fn().mockResolvedValue(data),
  }
}

describe('createIntegrationService', () => {
  it('returns 16 integrations', async () => {
    const repo = makeRepo({ googleConnection: null, gmailLastSync: null, calendarLastSync: null })
    const service = createIntegrationService(repo as never)
    const result = await service.listWorkspaceIntegrations('ws-1', 'user-1')
    expect(result).toHaveLength(16)
  })

  it('gmail is connected when google_connections has gmail scope', async () => {
    const repo = makeRepo({
      googleConnection: makeConn({ scopes: [GMAIL_SCOPE, CALENDAR_SCOPE] }),
      gmailLastSync: '2024-01-01T10:00:00Z',
      calendarLastSync: null,
    })
    const service = createIntegrationService(repo as never)
    const result = await service.listWorkspaceIntegrations('ws-1', 'user-1')
    const gmail = result.find(i => i.definition.id === 'google_gmail')
    expect(gmail?.status).toBe('connected')
    expect(gmail?.accountEmail).toBe('test@gmail.com')
    expect(gmail?.lastSync).toBe('2024-01-01T10:00:00Z')
  })

  it('calendar is connected when google_connections has calendar scope', async () => {
    const repo = makeRepo({
      googleConnection: makeConn({ scopes: [GMAIL_SCOPE, CALENDAR_SCOPE] }),
      gmailLastSync: null,
      calendarLastSync: '2024-02-01T09:00:00Z',
    })
    const service = createIntegrationService(repo as never)
    const result = await service.listWorkspaceIntegrations('ws-1', 'user-1')
    const cal = result.find(i => i.definition.id === 'google_calendar')
    expect(cal?.status).toBe('connected')
    expect(cal?.lastSync).toBe('2024-02-01T09:00:00Z')
  })

  it('gmail is disconnected when no google connection', async () => {
    const repo = makeRepo({ googleConnection: null, gmailLastSync: null, calendarLastSync: null })
    const service = createIntegrationService(repo as never)
    const result = await service.listWorkspaceIntegrations('ws-1', 'user-1')
    const gmail = result.find(i => i.definition.id === 'google_gmail')
    expect(gmail?.status).toBe('disconnected')
    expect(gmail?.accountEmail).toBeNull()
  })

  it('google_contacts and google_drive are coming_soon even if google is connected', async () => {
    const repo = makeRepo({
      googleConnection: makeConn({ scopes: [GMAIL_SCOPE, CALENDAR_SCOPE] }),
      gmailLastSync: null,
      calendarLastSync: null,
    })
    const service = createIntegrationService(repo as never)
    const result = await service.listWorkspaceIntegrations('ws-1', 'user-1')
    expect(result.find(i => i.definition.id === 'google_contacts')?.status).toBe('coming_soon')
    expect(result.find(i => i.definition.id === 'google_drive')?.status).toBe('coming_soon')
  })

  it('all non-google integrations are coming_soon', async () => {
    const repo = makeRepo({ googleConnection: null, gmailLastSync: null, calendarLastSync: null })
    const service = createIntegrationService(repo as never)
    const result = await service.listWorkspaceIntegrations('ws-1', 'user-1')
    const nonGoogle = result.filter(i => i.definition.category !== 'google_workspace')
    expect(nonGoogle.every(i => i.status === 'coming_soon')).toBe(true)
  })

  it('gmail is error when google connection status is error', async () => {
    const repo = makeRepo({
      googleConnection: makeConn({ status: 'error', scopes: [GMAIL_SCOPE] }),
      gmailLastSync: null,
      calendarLastSync: null,
    })
    const service = createIntegrationService(repo as never)
    const result = await service.listWorkspaceIntegrations('ws-1', 'user-1')
    const gmail = result.find(i => i.definition.id === 'google_gmail')
    expect(gmail?.status).toBe('error')
  })
})
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npm test -- tests/services/integrations/integration-service.test.ts
```
Expected: FAIL

- [ ] **Step 3: Write `services/integrations/integration-service.ts`**

```typescript
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

        // Fallback
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
```

- [ ] **Step 4: Run test — verify all 7 tests pass**

```bash
npm test -- tests/services/integrations/integration-service.test.ts
```

- [ ] **Step 5: Full quality gate**

```bash
npm run lint && npm run build && npm test
```

- [ ] **Step 6: Commit**

```bash
git add services/integrations/ tests/services/integrations/
git commit -m "feat(integrations): integration service with Google scope detection"
```

---

## Task 4: API Route + Disconnect Handler

**Files:**
- Create: `app/api/integrations/route.ts` — `GET /api/integrations`
- Modify: `app/api/google/connect/route.ts` — add `DELETE` handler only (DO NOT TOUCH GET)

**Interfaces:**
- GET /api/integrations?workspaceId=<uuid> → `{ integrations: IntegrationState[] }`

The DELETE handler in `app/api/google/connect/route.ts` disconnects (deletes) the Google connection row for the authenticated user in the specified workspace. It calls `db.from('google_connections').delete().eq('workspace_id', ws.id).eq('user_id', user.id)`.

- [ ] **Step 1: Write `app/api/integrations/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createWorkspacesRepository } from '@/repositories/workspaces'
import { createIntegrationRepository } from '@/repositories/integrations'
import { createIntegrationService } from '@/services/integrations/integration-service'

// GET /api/integrations?workspaceId=<uuid>
export async function GET(request: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const workspaceIdHint = url.searchParams.get('workspaceId') ?? undefined

    const workspacesRepo = createWorkspacesRepository(supabase)
    const workspaces = await workspacesRepo.listForUser(user.id)
    if (workspaces.length === 0) {
      return NextResponse.json({ error: 'No workspace found.' }, { status: 404 })
    }
    const workspace = workspaceIdHint
      ? (workspaces.find(w => w.id === workspaceIdHint) ?? workspaces[0])
      : workspaces[0]

    const integrationRepo = createIntegrationRepository(supabase)
    const integrationService = createIntegrationService(integrationRepo)
    const integrations = await integrationService.listWorkspaceIntegrations(workspace.id, user.id)

    return NextResponse.json({ integrations, workspaceId: workspace.id })
  } catch (error) {
    console.error('[GET /api/integrations]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Add DELETE handler to `app/api/google/connect/route.ts`**

Important: Open the file and APPEND the DELETE handler at the end. Do NOT change the existing GET handler at all.

```typescript
// DELETE /api/google/connect?workspaceId=<uuid>
// Removes the Google connection for the authenticated user in the specified workspace.
export async function DELETE(request: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const workspaceIdHint = url.searchParams.get('workspaceId') ?? undefined

    const workspacesRepo = createWorkspacesRepository(supabase)
    const workspaces = await workspacesRepo.listForUser(user.id)
    if (workspaces.length === 0) {
      return NextResponse.json({ error: 'No workspace found.' }, { status: 404 })
    }
    const workspace = workspaceIdHint
      ? (workspaces.find(w => w.id === workspaceIdHint) ?? workspaces[0])
      : workspaces[0]

    const { error } = await supabase
      .from('google_connections')
      .delete()
      .eq('workspace_id', workspace.id)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/google/connect]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 3: Run full quality gate**

```bash
npm run lint && npm run build && npm test
```
Expected: build shows `/api/integrations` as a new route, all tests pass

- [ ] **Step 4: Commit**

```bash
git add app/api/integrations/route.ts app/api/google/connect/route.ts
git commit -m "feat(integrations): GET /api/integrations + DELETE /api/google/connect"
```

---

## Task 5: UI Components

**Files:**
- Create: `components/settings/integrations/IntegrationStatusBadge.tsx`
- Create: `components/settings/integrations/IntegrationCard.tsx`
- Create: `components/settings/integrations/IntegrationGrid.tsx`
- Create: `components/settings/integrations/IntegrationLogoIcon.tsx` (logo/icon per provider)
- Create: `components/settings/integrations/index.ts` (barrel)

**Interfaces:**
- `IntegrationStatusBadge` props: `{ status: IntegrationStatus }`
- `IntegrationCard` props: `{ state: IntegrationState; workspaceId: string }` — `"use client"` — handles connect/disconnect/sync actions via fetch
- `IntegrationGrid` props: `{ states: IntegrationState[]; workspaceId: string }` — pure layout, no `"use client"` needed (delegates interaction to cards)
- `IntegrationLogoIcon` props: `{ provider: IntegrationProvider; className?: string }` — returns styled SVG or letter icon

**IntegrationStatusBadge design:**
```
connected    → emerald border/bg/text  label: "Connected"
disconnected → slate border/bg/text   label: "Not Connected"
coming_soon  → indigo border/bg/text  label: "Coming Soon"
error        → rose border/bg/text    label: "Error"
```
Style: `inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold`

**IntegrationCard design** (follow existing pattern from `HealthRow` and `SectionCard`):
- Outer: `rounded-[1.25rem] border border-black/6 bg-white p-5 shadow-[0_4px_12px_-6px_rgba(15,23,42,0.08)] transition-all hover:border-black/10`
- Header row: logo icon (40×40, rounded-xl bg-slate-50 border) + name (font-semibold) + status badge
- Description: `text-sm text-slate-500 leading-6 mt-2`
- Details row (if connected): `text-[11px] text-slate-400` — account email + last sync
- Actions row: Connect button (for disconnected) / Disconnect + Sync Now buttons (for connected) / Coming Soon chip (for coming_soon)
- Button style: match existing button pattern — `rounded-full border border-black/8 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-[0_4px_12px_-6px_rgba(15,23,42,0.10)] transition-all hover:bg-slate-50`
- Connect href for Google: `connectHref + '?workspaceId=' + workspaceId` (anchor tag, not button)
- Disconnect: `fetch('/api/google/connect?workspaceId='+workspaceId, { method: 'DELETE' })` then `router.refresh()`
- Sync Now: `fetch(syncHref + '?workspaceId='+workspaceId, { method: 'POST' })` fire-and-forget with loading state

**IntegrationLogoIcon:**
For Google (all 4): render a small `G` in the official Google colors (blue-green-yellow-red quadrant) or a simple colored letter icon. Do NOT embed large base64 images. Use a simple SVG path or styled `div`.

Provider → letter/bg color map:
```
google_*       → "G" · bg-slate-50 · text using inline SVG Google G mark (simple 4-color circles or just a styled "G" in #4285F4)
microsoft_*    → "M" · bg-[#00A4EF]/10 text-[#00A4EF]
salesforce     → "S" · bg-[#00A1E0]/10 text-[#00A1E0]
hubspot        → "H" · bg-[#FF7A59]/10 text-[#FF7A59]
slack          → "#" · bg-[#4A154B]/10 text-[#4A154B]
zoom           → "Z" · bg-[#2D8CFF]/10 text-[#2D8CFF]
openai         → "AI"· bg-slate-950/10 text-slate-950
anthropic      → "C" · bg-[#D4A574]/10 text-[#B8860B]
gemini         → "G" · bg-[#8B5CF6]/10 text-[#8B5CF6] (different shade from Google)
ollama         → "O" · bg-emerald-50 text-emerald-700
perplexity     → "P" · bg-[#20B2AA]/10 text-teal-600
```

**IntegrationGrid design:**
Group cards by category. Each category section has:
- Category heading: `text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 mb-3`
- Card grid: `grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3`
- Sections separated by `space-y-8`

- [ ] **Step 1: Write `IntegrationStatusBadge.tsx`**

```typescript
import type { IntegrationStatus } from '@/types/integrations'

const BADGE_STYLES: Record<IntegrationStatus, string> = {
  connected:    'border-emerald-200 bg-emerald-50 text-emerald-700',
  disconnected: 'border-slate-200 bg-slate-50 text-slate-500',
  coming_soon:  'border-indigo-100 bg-indigo-50 text-indigo-600',
  error:        'border-rose-200 bg-rose-50 text-rose-700',
}

const BADGE_LABELS: Record<IntegrationStatus, string> = {
  connected:    'Connected',
  disconnected: 'Not Connected',
  coming_soon:  'Coming Soon',
  error:        'Error',
}

type Props = { status: IntegrationStatus }

export function IntegrationStatusBadge({ status }: Props) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
        BADGE_STYLES[status],
      ].join(' ')}
    >
      {BADGE_LABELS[status]}
    </span>
  )
}
```

- [ ] **Step 2: Write `IntegrationLogoIcon.tsx`**

Use styled divs with letter abbreviations. No external images.

- [ ] **Step 3: Write `IntegrationCard.tsx`**

Full card component with "use client", handles Connect/Disconnect/Sync Now via fetch + router.refresh(). Shows loading states on action buttons.

- [ ] **Step 4: Write `IntegrationGrid.tsx`**

Groups `IntegrationState[]` by `definition.category`, renders sections with headings and a responsive card grid.

- [ ] **Step 5: Write barrel `index.ts`**

- [ ] **Step 6: Full quality gate**

```bash
npm run lint && npm run build && npm test
```

- [ ] **Step 7: Commit**

```bash
git add components/settings/integrations/
git commit -m "feat(integrations): IntegrationStatusBadge, IntegrationCard, IntegrationGrid UI components"
```

---

## Task 6: Integrations Page

**Files:**
- Create: `app/(dashboard)/dashboard/settings/integrations/page.tsx`

**Interfaces:**
- Consumes: `IntegrationGrid` from Task 5; `DashboardPageHeader`, `SectionCard` from existing design system
- Server component — fetches integration data directly (no API round-trip from the page, call service directly)
- Workspace guard: redirect to `/dashboard/settings` if no workspace (same pattern as existing settings page)

**Page structure:**
```tsx
<div className="space-y-8 lg:space-y-10">
  <DashboardPageHeader
    title="Integrations"
    description={`Workspace: ${workspace.name}`}
    greeting=""
  />
  {/* Section intro */}
  <SectionCard
    title="Connected Integrations"
    description="Connect your tools to give the Executive OS access to your email, calendar, CRM, and AI providers."
  >
    <IntegrationGrid states={integrations} workspaceId={workspace.id} />
  </SectionCard>
</div>
```

The page resolves workspace, instantiates `createIntegrationRepository(supabase)` + `createIntegrationService(repo)`, calls `listWorkspaceIntegrations(workspace.id, user.id)`, passes result to `IntegrationGrid`.

- [ ] **Step 1: Write the page**

(Follow the existing settings page pattern exactly for auth guard, workspace resolution, and empty state)

- [ ] **Step 2: Full quality gate**

```bash
npm run lint && npm run build && npm test
```
Build output must include `/dashboard/settings/integrations` route.

- [ ] **Step 3: Commit**

```bash
git add app/\(dashboard\)/dashboard/settings/integrations/
git commit -m "feat(integrations): /dashboard/settings/integrations page"
```
