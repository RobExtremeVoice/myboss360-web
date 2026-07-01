import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, InsertTables, UpdateTables } from '@/types/database'

type Row = Database['public']['Tables']['companies']['Row']

export function createCompaniesRepository(db: SupabaseClient<Database>) {
  return {
    async list(workspaceId: string): Promise<Row[]> {
      const { data, error } = await db
        .from('companies')
        .select('*')
        .eq('workspace_id', workspaceId)
        .is('deleted_at', null)
        .order('name')
      if (error) throw error
      return data
    },

    async search(workspaceId: string, query: string): Promise<Row[]> {
      const { data, error } = await db
        .from('companies')
        .select('*')
        .eq('workspace_id', workspaceId)
        .is('deleted_at', null)
        .or(
          `name.ilike.%${query}%,domain.ilike.%${query}%,industry.ilike.%${query}%`
        )
        .order('name')
      if (error) throw error
      return data
    },

    async listByIds(ids: string[]): Promise<Row[]> {
      if (ids.length === 0) {
        return []
      }

      const { data, error } = await db
        .from('companies')
        .select('*')
        .in('id', ids)
        .is('deleted_at', null)
        .order('name')
      if (error) throw error
      return data
    },

    async findById(id: string): Promise<Row | null> {
      const { data, error } = await db
        .from('companies')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .maybeSingle()
      if (error) throw error
      return data
    },

    async findByDomain(workspaceId: string, domain: string): Promise<Row | null> {
      const { data, error } = await db
        .from('companies')
        .select('*')
        .eq('workspace_id', workspaceId)
        .ilike('domain', domain)
        .is('deleted_at', null)
        .maybeSingle()
      if (error) throw error
      return data
    },

    async findByName(workspaceId: string, name: string): Promise<Row | null> {
      const { data, error } = await db
        .from('companies')
        .select('*')
        .eq('workspace_id', workspaceId)
        .ilike('name', name)
        .is('deleted_at', null)
        .maybeSingle()
      if (error) throw error
      return data
    },

    async create(input: InsertTables<'companies'>): Promise<Row> {
      const { data, error } = await db
        .from('companies')
        .insert([input])
        .select()
        .single()
      if (error) throw error
      return data
    },

    async update(id: string, input: UpdateTables<'companies'>): Promise<Row> {
      const { data, error } = await db
        .from('companies')
        .update(input)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },

    async softDelete(id: string): Promise<void> {
      const { error } = await db
        .from('companies')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
  }
}

export type CompaniesRepository = ReturnType<typeof createCompaniesRepository>
