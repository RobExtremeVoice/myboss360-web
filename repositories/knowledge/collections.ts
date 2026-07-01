import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, InsertTables, UpdateTables } from '@/types/database'

type CollectionRow = Database['public']['Tables']['knowledge_collections']['Row']

export function createKnowledgeCollectionsRepository(db: SupabaseClient<Database>) {
  return {
    async findById(id: string): Promise<CollectionRow | null> {
      const { data, error } = await db
        .from('knowledge_collections')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .maybeSingle()
      if (error) throw error
      return data
    },

    async findDefault(workspaceId: string): Promise<CollectionRow | null> {
      const { data, error } = await db
        .from('knowledge_collections')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('is_default', true)
        .is('deleted_at', null)
        .maybeSingle()
      if (error) throw error
      return data
    },

    async list(workspaceId: string): Promise<CollectionRow[]> {
      const { data, error } = await db
        .from('knowledge_collections')
        .select('*')
        .eq('workspace_id', workspaceId)
        .is('deleted_at', null)
        .order('name', { ascending: true })
      if (error) throw error
      return data ?? []
    },

    async create(input: InsertTables<'knowledge_collections'>): Promise<CollectionRow> {
      const { data, error } = await db
        .from('knowledge_collections')
        .insert(input)
        .select()
        .single()
      if (error) throw error
      return data
    },

    async update(id: string, input: UpdateTables<'knowledge_collections'>): Promise<CollectionRow> {
      const { data, error } = await db
        .from('knowledge_collections')
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq('id', id)
        .is('deleted_at', null)
        .select()
        .single()
      if (error) throw error
      return data
    },

    async softDelete(id: string): Promise<void> {
      const { error } = await db
        .from('knowledge_collections')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
  }
}

export type KnowledgeCollectionsRepository = ReturnType<typeof createKnowledgeCollectionsRepository>
