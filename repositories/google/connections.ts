import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, InsertTables, UpdateTables } from '@/types/database'

type ConnectionRow = Database['public']['Tables']['google_connections']['Row']

export function createGoogleConnectionsRepository(db: SupabaseClient<Database>) {
  return {
    async findByWorkspaceAndUser(workspaceId: string, userId: string): Promise<ConnectionRow | null> {
      const { data, error } = await db
        .from('google_connections')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId)
        .maybeSingle()
      if (error) throw error
      return data
    },

    async findById(id: string): Promise<ConnectionRow | null> {
      const { data, error } = await db
        .from('google_connections')
        .select('*')
        .eq('id', id)
        .maybeSingle()
      if (error) throw error
      return data
    },

    async listByWorkspace(workspaceId: string): Promise<ConnectionRow[]> {
      const { data, error } = await db
        .from('google_connections')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('status', 'active')
        .order('created_at', { ascending: true })
      if (error) throw error
      return data ?? []
    },

    async upsert(input: InsertTables<'google_connections'>): Promise<ConnectionRow> {
      const { data, error } = await db
        .from('google_connections')
        .upsert(input, { onConflict: 'workspace_id,user_id' })
        .select()
        .single()
      if (error) throw error
      return data
    },

    async update(id: string, input: UpdateTables<'google_connections'>): Promise<ConnectionRow> {
      const { data, error } = await db
        .from('google_connections')
        .update(input)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },

    async setStatus(id: string, status: string, errorMessage?: string | null): Promise<void> {
      const { error } = await db
        .from('google_connections')
        .update({ status, error_message: errorMessage ?? null })
        .eq('id', id)
      if (error) throw error
    },

    async delete(id: string): Promise<void> {
      const { error } = await db
        .from('google_connections')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
  }
}

export type GoogleConnectionsRepository = ReturnType<typeof createGoogleConnectionsRepository>
