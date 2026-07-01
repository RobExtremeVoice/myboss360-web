import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, InsertTables, UpdateTables } from '@/types/database'

type DocumentRow = Database['public']['Tables']['knowledge_documents']['Row']
type TagRow = Database['public']['Tables']['knowledge_tags']['Row']

export function createKnowledgeDocumentsRepository(db: SupabaseClient<Database>) {
  return {
    async findById(id: string): Promise<DocumentRow | null> {
      const { data, error } = await db
        .from('knowledge_documents')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .maybeSingle()
      if (error) throw error
      return data
    },

    async findEmailByThreadId(
      workspaceId: string,
      threadId: string
    ): Promise<DocumentRow | null> {
      const { data, error } = await db
        .from('knowledge_documents')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('object_type', 'email')
        .contains('metadata', { thread_id: threadId })
        .is('deleted_at', null)
        .maybeSingle()
      if (error) throw error
      return data
    },

    async list(
      workspaceId: string,
      options: {
        status?: string
        objectType?: string
        category?: string
        collectionId?: string | null
        limit?: number
        offset?: number
      } = {}
    ): Promise<DocumentRow[]> {
      let q = db
        .from('knowledge_documents')
        .select('*')
        .eq('workspace_id', workspaceId)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false })

      if (options.status) q = q.eq('status', options.status)
      if (options.objectType) q = q.eq('object_type', options.objectType)
      if (options.category) q = q.eq('category', options.category)
      if (options.collectionId !== undefined) {
        if (options.collectionId === null) {
          q = q.is('collection_id', null)
        } else {
          q = q.eq('collection_id', options.collectionId)
        }
      }
      if (options.limit !== undefined) q = q.limit(options.limit)
      if (options.offset !== undefined) q = q.range(options.offset, options.offset + (options.limit ?? 20) - 1)

      const { data, error } = await q
      if (error) throw error
      return data ?? []
    },

    async listByTag(workspaceId: string, tagId: string, limit = 20): Promise<DocumentRow[]> {
      const { data, error } = await db
        .from('document_tags')
        .select('document_id')
        .eq('tag_id', tagId)
      if (error) throw error

      const ids = (data ?? []).map((r) => r.document_id)
      if (ids.length === 0) return []

      const { data: docs, error: docsErr } = await db
        .from('knowledge_documents')
        .select('*')
        .eq('workspace_id', workspaceId)
        .in('id', ids)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false })
        .limit(limit)
      if (docsErr) throw docsErr
      return docs ?? []
    },

    async create(input: InsertTables<'knowledge_documents'>): Promise<DocumentRow> {
      const { data, error } = await db
        .from('knowledge_documents')
        .insert(input)
        .select()
        .single()
      if (error) throw error
      return data
    },

    async update(id: string, input: UpdateTables<'knowledge_documents'>): Promise<DocumentRow> {
      const { data, error } = await db
        .from('knowledge_documents')
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
        .from('knowledge_documents')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },

    async listTags(documentId: string): Promise<TagRow[]> {
      const { data, error } = await db
        .from('document_tags')
        .select('tag_id')
        .eq('document_id', documentId)
      if (error) throw error

      const tagIds = (data ?? []).map((r) => r.tag_id)
      if (tagIds.length === 0) return []

      const { data: tags, error: tagsErr } = await db
        .from('knowledge_tags')
        .select('*')
        .in('id', tagIds)
      if (tagsErr) throw tagsErr
      return tags ?? []
    },

    async setTags(documentId: string, tagIds: string[]): Promise<void> {
      const { error: delErr } = await db
        .from('document_tags')
        .delete()
        .eq('document_id', documentId)
      if (delErr) throw delErr

      if (tagIds.length === 0) return

      const { error: insErr } = await db
        .from('document_tags')
        .insert(tagIds.map((tag_id) => ({ document_id: documentId, tag_id })))
      if (insErr) throw insErr
    },

    async count(workspaceId: string, options: { status?: string } = {}): Promise<number> {
      let q = db
        .from('knowledge_documents')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .is('deleted_at', null)

      if (options.status) q = q.eq('status', options.status)

      const { count, error } = await q
      if (error) throw error
      return count ?? 0
    },
  }
}

export type KnowledgeDocumentsRepository = ReturnType<typeof createKnowledgeDocumentsRepository>
