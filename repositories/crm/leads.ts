import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, InsertTables, UpdateTables } from '@/types/database'

type Row = Database['public']['Tables']['leads']['Row']

export function createLeadsRepository(db: SupabaseClient<Database>) {
  return {
    async list(workspaceId: string): Promise<Row[]> {
      const { data, error } = await db
        .from('leads')
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
        status?: string
        limit?: number
      } = {}
    ): Promise<Row[]> {
      let request = db
        .from('leads')
        .select('*')
        .eq('workspace_id', workspaceId)
        .is('deleted_at', null)

      if (options.status) {
        request = request.eq('status', options.status)
      }

      if (options.query) {
        request = request.or(
          `title.ilike.%${options.query}%,source.ilike.%${options.query}%,notes.ilike.%${options.query}%`
        )
      }

      request = request.order('created_at', { ascending: false })

      if (options.limit) {
        request = request.limit(options.limit)
      }

      const { data, error } = await request
      if (error) throw error
      return data
    },

    async listByStatus(workspaceId: string, status: string): Promise<Row[]> {
      const { data, error } = await db
        .from('leads')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('status', status)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },

    async findById(id: string): Promise<Row | null> {
      const { data, error } = await db
        .from('leads')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .maybeSingle()
      if (error) throw error
      return data
    },

    async create(input: InsertTables<'leads'>): Promise<Row> {
      const { data, error } = await db
        .from('leads')
        .insert([input])
        .select()
        .single()
      if (error) throw error
      return data
    },

    async update(id: string, input: UpdateTables<'leads'>): Promise<Row> {
      const { data, error } = await db
        .from('leads')
        .update(input)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },

    async softDelete(id: string): Promise<void> {
      const { error } = await db
        .from('leads')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
  }
}

export type LeadsRepository = ReturnType<typeof createLeadsRepository>
