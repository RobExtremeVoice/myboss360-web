import { describe, it, expect } from 'vitest'
import { createDealsRepository } from '../../../repositories/crm/deals'

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
  or(value: string) { this.calls.push(['or', value]); return this }
  order(column: string, options?: Record<string, unknown>) {
    this.calls.push(['order', column, options ?? null]); return this
  }
  limit(value: number) { this.calls.push(['limit', value]); return this }

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

describe('deals repository', () => {
  it('applies workspace, stage, query, and limit filters', async () => {
    const calls: RecordedCall[] = []
    const db = createMockDb(calls, [{ id: 'deal-1' }])
    const repo = createDealsRepository(db as never)

    const deals = await repo.listFiltered('workspace-9', {
      query: 'renewal',
      stage: 'proposal',
      limit: 3,
    })

    expect(deals).toEqual([{ id: 'deal-1' }])
    expect(calls).toEqual([
      ['from', 'deals'],
      ['select', '*'],
      ['eq', 'workspace_id', 'workspace-9'],
      ['is', 'deleted_at', null],
      ['eq', 'stage', 'proposal'],
      ['or', 'title.ilike.%renewal%,notes.ilike.%renewal%'],
      ['order', 'value', { ascending: false, nullsFirst: false }],
      ['limit', 3],
    ])
  })
})
