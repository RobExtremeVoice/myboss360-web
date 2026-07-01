import { describe, it, expect } from 'vitest'
import { createCompaniesRepository } from '../../../repositories/crm/companies'

type RecordedCall = [method: string, ...args: unknown[]]

class QueryBuilder {
  calls: RecordedCall[]
  response: { data: unknown; error: unknown }

  constructor(calls: RecordedCall[], response: { data: unknown; error: unknown }) {
    this.calls = calls
    this.response = response
  }

  select(value: string) { this.calls.push(['select', value]); return this }
  eq(column: string, value: unknown) { this.calls.push(['eq', column, value]); return this }
  is(column: string, value: unknown) { this.calls.push(['is', column, value]); return this }
  order(column: string) { this.calls.push(['order', column]); return this }
  update(value: Record<string, unknown>) { this.calls.push(['update', value]); return this }

  then<T>(ok?: ((v: { data: unknown; error: unknown }) => T) | null) {
    return Promise.resolve(this.response).then(ok ?? undefined)
  }
}

function createMockDb(calls: RecordedCall[], data: unknown) {
  return {
    from(table: string) {
      calls.push(['from', table])
      return new QueryBuilder(calls, { data, error: null })
    },
  }
}

describe('companies repository', () => {
  it('scopes list queries to workspace and non-deleted records', async () => {
    const calls: RecordedCall[] = []
    const db = createMockDb(calls, [{ id: 'company-1' }])
    const repo = createCompaniesRepository(db as never)

    const companies = await repo.list('workspace-1')

    expect(companies).toEqual([{ id: 'company-1' }])
    expect(calls).toEqual([
      ['from', 'companies'],
      ['select', '*'],
      ['eq', 'workspace_id', 'workspace-1'],
      ['is', 'deleted_at', null],
      ['order', 'name'],
    ])
  })

  it('soft deletes by setting deleted_at', async () => {
    const calls: RecordedCall[] = []
    const db = createMockDb(calls, null)
    const repo = createCompaniesRepository(db as never)

    await repo.softDelete('company-42')

    expect(calls[0]).toEqual(['from', 'companies'])
    expect(calls[1]?.[0]).toBe('update')
    expect(typeof (calls[1]?.[1] as { deleted_at?: unknown }).deleted_at).toBe('string')
    expect(calls[2]).toEqual(['eq', 'id', 'company-42'])
  })
})
