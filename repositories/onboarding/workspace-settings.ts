import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, InsertTables, UpdateTables } from '@/types/database'

type Row = Database['public']['Tables']['workspace_settings']['Row']

export function createWorkspaceSettingsRepository(db: SupabaseClient<Database>) {
  return {
    async findByWorkspace(workspaceId: string): Promise<Row | null> {
      const { data, error } = await db
        .from('workspace_settings')
        .select('*')
        .eq('workspace_id', workspaceId)
        .maybeSingle()
      if (error) throw error
      return data
    },

    async create(input: InsertTables<'workspace_settings'>): Promise<Row> {
      const { data, error } = await db
        .from('workspace_settings')
        .insert(input)
        .select()
        .single()
      if (error) throw error
      return data
    },

    async update(id: string, input: UpdateTables<'workspace_settings'>): Promise<Row> {
      const { data, error } = await db
        .from('workspace_settings')
        .update(input)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
  }
}

export type WorkspaceSettingsRepository = ReturnType<typeof createWorkspaceSettingsRepository>
