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
