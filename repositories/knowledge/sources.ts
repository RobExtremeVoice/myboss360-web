import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, InsertTables, UpdateTables } from '@/types/database'

type Row = Database['public']['Tables']['knowledge_sources']['Row']

export function createKnowledgeSourcesRepository(db: SupabaseClient<Database>) {
  return {
    async findById(id: string): Promise<Row | null> {
      const { data, error } = await db
        .from('knowledge_sources')
        .select('*')
        .eq('id', id)
        .maybeSingle()
      if (error) throw error
      return data
    },

    async findByName(workspaceId: string, sourceType: string, name: string): Promise<Row | null> {
      const { data, error } = await db
        .from('knowledge_sources')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('source_type', sourceType)
        .ilike('name', name)
        .maybeSingle()
      if (error) throw error
      return data
    },

    async create(input: InsertTables<'knowledge_sources'>): Promise<Row> {
      const { data, error } = await db
        .from('knowledge_sources')
        .insert(input)
        .select()
        .single()
      if (error) throw error
      return data
    },

    async update(id: string, input: UpdateTables<'knowledge_sources'>): Promise<Row> {
      const { data, error } = await db
        .from('knowledge_sources')
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
  }
}

export type KnowledgeSourcesRepository = ReturnType<typeof createKnowledgeSourcesRepository>
