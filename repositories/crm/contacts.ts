import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, InsertTables, UpdateTables } from '@/types/database'

type Row = Database['public']['Tables']['contacts']['Row']

export function createContactsRepository(db: SupabaseClient<Database>) {
  return {
    async list(workspaceId: string): Promise<Row[]> {
      const { data, error } = await db
        .from('contacts')
        .select('*')
        .eq('workspace_id', workspaceId)
        .is('deleted_at', null)
        .order('first_name')
      if (error) throw error
      return data
    },

    async search(workspaceId: string, query: string): Promise<Row[]> {
      const { data, error } = await db
        .from('contacts')
        .select('*')
        .eq('workspace_id', workspaceId)
        .is('deleted_at', null)
        .or(
          `first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%,job_title.ilike.%${query}%`
        )
        .order('first_name')
      if (error) throw error
      return data
    },

    async listByIds(ids: string[]): Promise<Row[]> {
      if (ids.length === 0) {
        return []
      }

      const { data, error } = await db
        .from('contacts')
        .select('*')
        .in('id', ids)
        .is('deleted_at', null)
        .order('first_name')
      if (error) throw error
      return data
    },

    async listByCompany(companyId: string): Promise<Row[]> {
      const { data, error } = await db
        .from('contacts')
        .select('*')
        .eq('company_id', companyId)
        .is('deleted_at', null)
        .order('first_name')
      if (error) throw error
      return data
    },

    async findById(id: string): Promise<Row | null> {
      const { data, error } = await db
        .from('contacts')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .maybeSingle()
      if (error) throw error
      return data
    },

    async create(input: InsertTables<'contacts'>): Promise<Row> {
      const { data, error } = await db
        .from('contacts')
        .insert([input])
        .select()
        .single()
      if (error) throw error
      return data
    },

    async update(id: string, input: UpdateTables<'contacts'>): Promise<Row> {
      const { data, error } = await db
        .from('contacts')
        .update(input)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },

    async softDelete(id: string): Promise<void> {
      const { error } = await db
        .from('contacts')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
  }
}

export type ContactsRepository = ReturnType<typeof createContactsRepository>
