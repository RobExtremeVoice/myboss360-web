import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, InsertTables } from '@/types/database'

type ChunkRow = Database['public']['Tables']['knowledge_chunks']['Row']

export function createKnowledgeChunksRepository(db: SupabaseClient<Database>) {
  return {
    async listByDocument(documentId: string): Promise<ChunkRow[]> {
      const { data, error } = await db
        .from('knowledge_chunks')
        .select('*')
        .eq('document_id', documentId)
        .order('chunk_index', { ascending: true })
      if (error) throw error
      return data ?? []
    },

    async findById(id: string): Promise<ChunkRow | null> {
      const { data, error } = await db
        .from('knowledge_chunks')
        .select('*')
        .eq('id', id)
        .maybeSingle()
      if (error) throw error
      return data
    },

    async createMany(chunks: InsertTables<'knowledge_chunks'>[]): Promise<ChunkRow[]> {
      if (chunks.length === 0) return []
      const { data, error } = await db
        .from('knowledge_chunks')
        .insert(chunks)
        .select()
      if (error) throw error
      return data ?? []
    },

    async deleteByDocument(documentId: string): Promise<void> {
      const { error } = await db
        .from('knowledge_chunks')
        .delete()
        .eq('document_id', documentId)
      if (error) throw error
    },

    async updateEmbeddingId(id: string, embeddingId: string): Promise<void> {
      const { error } = await db
        .from('knowledge_chunks')
        .update({ embedding_id: embeddingId })
        .eq('id', id)
      if (error) throw error
    },

    async countByDocument(documentId: string): Promise<number> {
      const { count, error } = await db
        .from('knowledge_chunks')
        .select('id', { count: 'exact', head: true })
        .eq('document_id', documentId)
      if (error) throw error
      return count ?? 0
    },
  }
}

export type KnowledgeChunksRepository = ReturnType<typeof createKnowledgeChunksRepository>
