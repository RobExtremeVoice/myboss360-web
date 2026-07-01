import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, InsertTables, UpdateTables } from '@/types/database'

type TagRow = Database['public']['Tables']['knowledge_tags']['Row']

export function createKnowledgeTagsRepository(db: SupabaseClient<Database>) {
  return {
    async findById(id: string): Promise<TagRow | null> {
      const { data, error } = await db
        .from('knowledge_tags')
        .select('*')
        .eq('id', id)
        .maybeSingle()
      if (error) throw error
      return data
    },

    async findBySlug(workspaceId: string, slug: string): Promise<TagRow | null> {
      const { data, error } = await db
        .from('knowledge_tags')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('slug', slug)
        .maybeSingle()
      if (error) throw error
      return data
    },

    async list(workspaceId: string): Promise<TagRow[]> {
      const { data, error } = await db
        .from('knowledge_tags')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('name', { ascending: true })
      if (error) throw error
      return data ?? []
    },

    async create(input: InsertTables<'knowledge_tags'>): Promise<TagRow> {
      const { data, error } = await db
        .from('knowledge_tags')
        .insert(input)
        .select()
        .single()
      if (error) throw error
      return data
    },

    async update(id: string, input: UpdateTables<'knowledge_tags'>): Promise<TagRow> {
      const { data, error } = await db
        .from('knowledge_tags')
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },

    async delete(id: string): Promise<void> {
      const { error } = await db
        .from('knowledge_tags')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
  }
}

export type KnowledgeTagsRepository = ReturnType<typeof createKnowledgeTagsRepository>
