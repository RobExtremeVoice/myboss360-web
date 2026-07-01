import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, InsertTables, UpdateTables } from '@/types/database'

type Row = Database['public']['Tables']['deals']['Row']

export function createDealsRepository(db: SupabaseClient<Database>) {
  return {
    async list(workspaceId: string): Promise<Row[]> {
      const { data, error } = await db
        .from('deals')
        .select('*')
        .eq('workspace_id', workspaceId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },

    async listFiltered(
      workspaceId: string,
      options: {
        query?: string
        stage?: string
        limit?: number
      } = {}
    ): Promise<Row[]> {
      let request = db
        .from('deals')
        .select('*')
        .eq('workspace_id', workspaceId)
        .is('deleted_at', null)

      if (options.stage) {
        request = request.eq('stage', options.stage)
      }

      if (options.query) {
        request = request.or(`title.ilike.%${options.query}%,notes.ilike.%${options.query}%`)
      }

      request = request.order('value', { ascending: false, nullsFirst: false })

      if (options.limit) {
        request = request.limit(options.limit)
      }

      const { data, error } = await request
      if (error) throw error
      return data
    },

    async listByStage(workspaceId: string, stage: string): Promise<Row[]> {
      const { data, error } = await db
        .from('deals')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('stage', stage)
        .is('deleted_at', null)
        .order('value', { ascending: false })
      if (error) throw error
      return data
    },

    async findById(id: string): Promise<Row | null> {
      const { data, error } = await db
        .from('deals')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .maybeSingle()
      if (error) throw error
      return data
    },

    async listByContactIds(workspaceId: string, contactIds: string[]): Promise<Row[]> {
      if (contactIds.length === 0) return []

      const { data, error } = await db
        .from('deals')
        .select('*')
        .eq('workspace_id', workspaceId)
        .in('contact_id', contactIds)
        .is('deleted_at', null)
        .order('value', { ascending: false, nullsFirst: false })
      if (error) throw error
      return data ?? []
    },

    async listByCompanyIds(workspaceId: string, companyIds: string[]): Promise<Row[]> {
      if (companyIds.length === 0) return []

      const { data, error } = await db
        .from('deals')
        .select('*')
        .eq('workspace_id', workspaceId)
        .in('company_id', companyIds)
        .is('deleted_at', null)
        .order('value', { ascending: false, nullsFirst: false })
      if (error) throw error
      return data ?? []
    },

    async create(input: InsertTables<'deals'>): Promise<Row> {
      const { data, error } = await db
        .from('deals')
        .insert([input])
        .select()
        .single()
      if (error) throw error
      return data
    },

    async update(id: string, input: UpdateTables<'deals'>): Promise<Row> {
      const { data, error } = await db
        .from('deals')
        .update(input)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },

    async softDelete(id: string): Promise<void> {
      const { error } = await db
        .from('deals')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
  }
}

export type DealsRepository = ReturnType<typeof createDealsRepository>
