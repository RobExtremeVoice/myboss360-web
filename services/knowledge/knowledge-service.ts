import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type {
  CreateCollectionInput,
  CreateDocumentInput,
  CreateTagInput,
  KnowledgeCollection,
  KnowledgeDocument,
  KnowledgeTag,
  ListDocumentsOptions,
  UpdateDocumentInput,
} from '@/types/knowledge'
import {
  createKnowledgeChunksRepository,
  createKnowledgeCollectionsRepository,
  createKnowledgeDocumentsRepository,
  createKnowledgeTagsRepository,
} from '@/repositories/knowledge'
import { runDocumentPipeline } from './document-pipeline'

type DocumentRow = Database['public']['Tables']['knowledge_documents']['Row']
type CollectionRow = Database['public']['Tables']['knowledge_collections']['Row']
type TagRow = Database['public']['Tables']['knowledge_tags']['Row']

function toDocument(row: DocumentRow): KnowledgeDocument {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    organizationId: row.organization_id,
    collectionId: row.collection_id,
    sourceId: row.source_id,
    title: row.title,
    content: row.content,
    objectType: row.object_type as KnowledgeDocument['objectType'],
    category: row.category as KnowledgeDocument['category'],
    status: row.status as KnowledgeDocument['status'],
    version: row.version,
    wordCount: row.word_count,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  }
}

function toCollection(row: CollectionRow): KnowledgeCollection {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    organizationId: row.organization_id,
    name: row.name,
    description: row.description,
    slug: row.slug,
    isDefault: row.is_default,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  }
}

function toTag(row: TagRow): KnowledgeTag {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    slug: row.slug,
    color: row.color,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)
}

export function createKnowledgeService(db: SupabaseClient<Database>) {
  const docsRepo = createKnowledgeDocumentsRepository(db)
  const chunksRepo = createKnowledgeChunksRepository(db)
  const collectionsRepo = createKnowledgeCollectionsRepository(db)
  const tagsRepo = createKnowledgeTagsRepository(db)

  return {
    // ─── Documents ────────────────────────────────────────────────────────────

    async getDocument(id: string): Promise<KnowledgeDocument | null> {
      const row = await docsRepo.findById(id)
      return row ? toDocument(row) : null
    },

    async listDocuments(
      workspaceId: string,
      options: ListDocumentsOptions = {}
    ): Promise<KnowledgeDocument[]> {
      const rows = await docsRepo.list(workspaceId, {
        status: options.status,
        objectType: options.objectType,
        category: options.category,
        collectionId: options.collectionId,
        limit: options.limit,
        offset: options.offset,
      })
      return rows.map(toDocument)
    },

    async createDocument(
      workspaceId: string,
      organizationId: string,
      userId: string,
      input: CreateDocumentInput
    ): Promise<KnowledgeDocument> {
      const pipeline = runDocumentPipeline({ rawContent: input.content })

      const row = await docsRepo.create({
        workspace_id: workspaceId,
        organization_id: organizationId,
        collection_id: input.collectionId ?? null,
        source_id: input.sourceId ?? null,
        title: input.title,
        content: pipeline.parsed.content,
        object_type: input.objectType,
        category: input.category,
        status: input.status ?? 'draft',
        word_count: pipeline.parsed.wordCount,
        metadata: (input.metadata ?? {}) as Database['public']['Tables']['knowledge_documents']['Insert']['metadata'],
        created_by: userId,
        updated_by: userId,
      })

      // Apply tags
      if (input.tagIds && input.tagIds.length > 0) {
        await docsRepo.setTags(row.id, input.tagIds)
      }

      // Chunk the document for future RAG
      if (input.autoChunk !== false) {
        const { chunked } = pipeline
        if (chunked.totalChunks > 0) {
          await chunksRepo.createMany(
            chunked.chunks.map((c) => ({
              document_id: row.id,
              workspace_id: workspaceId,
              chunk_index: c.chunkIndex,
              content: c.content,
              chunk_strategy: chunked.strategy,
              token_count: c.tokenCount,
              embedding_id: null,
              metadata: c.metadata as Database['public']['Tables']['knowledge_chunks']['Insert']['metadata'],
            }))
          )
        }
      }

      return toDocument(row)
    },

    async updateDocument(
      id: string,
      userId: string,
      input: UpdateDocumentInput
    ): Promise<KnowledgeDocument> {
      const existing = await docsRepo.findById(id)
      if (!existing) throw new Error(`Document ${id} not found.`)

      // Save version snapshot before update
      const { error: vErr } = await db
        .from('document_versions')
        .insert({
          document_id: existing.id,
          version: existing.version,
          content: existing.content,
          title: existing.title,
          changed_by: userId,
          change_note: input.changeNote ?? null,
          metadata: {},
        })
      if (vErr) throw vErr

      const needsReparse = typeof input.content === 'string'
      const parsed = needsReparse
        ? runDocumentPipeline({ rawContent: input.content! }).parsed
        : null

      const row = await docsRepo.update(id, {
        title: input.title,
        content: parsed?.content ?? undefined,
        object_type: input.objectType,
        category: input.category,
        collection_id: input.collectionId,
        status: input.status,
        word_count: parsed?.wordCount ?? undefined,
        version: existing.version + 1,
        metadata: (input.metadata ?? existing.metadata) as Database['public']['Tables']['knowledge_documents']['Update']['metadata'],
        updated_by: userId,
      })

      // Re-chunk if content changed
      if (needsReparse && input.autoChunk !== false && parsed) {
        await chunksRepo.deleteByDocument(id)
        const rechunked = runDocumentPipeline({ rawContent: parsed.content }).chunked
        if (rechunked.totalChunks > 0) {
          await chunksRepo.createMany(
            rechunked.chunks.map((c) => ({
              document_id: id,
              workspace_id: existing.workspace_id,
              chunk_index: c.chunkIndex,
              content: c.content,
              chunk_strategy: rechunked.strategy,
              token_count: c.tokenCount,
              embedding_id: null,
              metadata: c.metadata as Database['public']['Tables']['knowledge_chunks']['Insert']['metadata'],
            }))
          )
        }
      }

      return toDocument(row)
    },

    async deleteDocument(id: string): Promise<void> {
      await docsRepo.softDelete(id)
    },

    async countDocuments(workspaceId: string): Promise<number> {
      return docsRepo.count(workspaceId)
    },

    // ─── Collections ──────────────────────────────────────────────────────────

    async listCollections(workspaceId: string): Promise<KnowledgeCollection[]> {
      const rows = await collectionsRepo.list(workspaceId)
      return rows.map(toCollection)
    },

    async createCollection(
      workspaceId: string,
      organizationId: string,
      input: CreateCollectionInput
    ): Promise<KnowledgeCollection> {
      const row = await collectionsRepo.create({
        workspace_id: workspaceId,
        organization_id: organizationId,
        name: input.name,
        description: input.description ?? null,
        slug: input.slug ?? slugify(input.name),
        is_default: input.isDefault ?? false,
        metadata: (input.metadata ?? {}) as Database['public']['Tables']['knowledge_collections']['Insert']['metadata'],
      })
      return toCollection(row)
    },

    async ensureDefaultCollection(
      workspaceId: string,
      organizationId: string
    ): Promise<KnowledgeCollection> {
      const existing = await collectionsRepo.findDefault(workspaceId)
      if (existing) return toCollection(existing)

      return this.createCollection(workspaceId, organizationId, {
        name: 'General',
        slug: 'general',
        isDefault: true,
      })
    },

    // ─── Tags ─────────────────────────────────────────────────────────────────

    async listTags(workspaceId: string): Promise<KnowledgeTag[]> {
      const rows = await tagsRepo.list(workspaceId)
      return rows.map(toTag)
    },

    async createTag(workspaceId: string, input: CreateTagInput): Promise<KnowledgeTag> {
      const row = await tagsRepo.create({
        workspace_id: workspaceId,
        name: input.name,
        slug: input.slug ?? slugify(input.name),
        color: input.color ?? null,
      })
      return toTag(row)
    },

    async getDocumentTags(documentId: string): Promise<KnowledgeTag[]> {
      const rows = await docsRepo.listTags(documentId)
      return rows.map(toTag)
    },
  }
}

export type KnowledgeService = ReturnType<typeof createKnowledgeService>
