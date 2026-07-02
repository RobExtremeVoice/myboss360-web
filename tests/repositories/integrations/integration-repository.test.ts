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
