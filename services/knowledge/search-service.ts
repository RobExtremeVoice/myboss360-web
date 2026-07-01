import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type {
  KnowledgeDocument,
  SearchQuery,
  SearchResponse,
  SearchResult,
} from '@/types/knowledge'
import { knowledgeConfig } from '@/config/knowledge'
import { createKnowledgeDocumentsRepository } from '@/repositories/knowledge'

// ─── Search service ───────────────────────────────────────────────────────────
// Provides three search modes:
//   keywordSearch — trigram-indexed full-text search (live)
//   semanticSearch — vector similarity search (future: requires pgvector + embeddings)
//   hybridSearch — combines keyword + semantic with RRF scoring (future)
//
// All three methods share the SearchQuery/SearchResponse contract so callers
// do not need to change when semantic search is wired in Sprint 20+.

function toDocument(row: Database['public']['Tables']['knowledge_documents']['Row']): KnowledgeDocument {
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

// Strip PostgREST filter metacharacters so user input cannot break out of the
// value position in an .or() string (comma separates conditions, parens and
// colon are structural, asterisk is a wildcard modifier).
function sanitizePostgrestValue(value: string): string {
  return value.replace(/[,().:*]/g, ' ').trim()
}

function highlightMatches(content: string, query: string, maxLength = 300): string[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
  const lower = content.toLowerCase()
  const highlights: string[] = []

  for (const term of terms) {
    const idx = lower.indexOf(term)
    if (idx === -1) continue

    const start = Math.max(0, idx - 60)
    const end = Math.min(content.length, idx + term.length + 60)
    const excerpt = (start > 0 ? '…' : '') + content.slice(start, end) + (end < content.length ? '…' : '')
    highlights.push(excerpt.slice(0, maxLength))
  }

  return highlights.slice(0, 3)
}

export function createKnowledgeSearchService(db: SupabaseClient<Database>) {
  const docsRepo = createKnowledgeDocumentsRepository(db)

  return {
    // Live: trigram-indexed keyword search over title and content.
    async keywordSearch(query: SearchQuery): Promise<SearchResponse> {
      const start = Date.now()
      const limit = Math.min(query.limit ?? knowledgeConfig.defaultSearchLimit, knowledgeConfig.maxSearchLimit)

      const safeQuery = sanitizePostgrestValue(query.query)
      let q = db
        .from('knowledge_documents')
        .select('*')
        .eq('workspace_id', query.workspaceId)
        .eq('status', 'published')
        .is('deleted_at', null)
        .or(`title.ilike.%${safeQuery}%,content.ilike.%${safeQuery}%`)
        .order('updated_at', { ascending: false })
        .limit(limit)

      if (query.objectTypes && query.objectTypes.length > 0) {
        q = q.in('object_type', query.objectTypes)
      }
      if (query.categories && query.categories.length > 0) {
        q = q.in('category', query.categories)
      }
      if (query.collectionId !== undefined) {
        if (query.collectionId === null) {
          q = q.is('collection_id', null)
        } else {
          q = q.eq('collection_id', query.collectionId)
        }
      }
      if (query.status) {
        q = q.eq('status', query.status)
      }

      const { data, error } = await q
      if (error) throw error

      const rows = data ?? []
      const results: SearchResult[] = rows.map((row) => {
        const doc = toDocument(row)
        return {
          document: doc,
          score: 1.0,  // keyword search: binary match, scoring reserved for semantic
          highlights: highlightMatches(doc.content, query.query),
          matchType: 'keyword' as const,
        }
      })

      return {
        results,
        total: results.length,
        query: query.query,
        searchType: 'keyword',
        durationMs: Date.now() - start,
      }
    },

    // Future Sprint 20: vector similarity search using pgvector.
    // Returns a mock response until embeddings are available.
    async semanticSearch(query: SearchQuery): Promise<SearchResponse> {
      const start = Date.now()
      // Placeholder: fall back to keyword search until embeddings are wired.
      // When pgvector is enabled, this will:
      //   1. Call embedding provider to vectorize query.query
      //   2. Run: SELECT * FROM knowledge_chunks ORDER BY embedding <-> $1 LIMIT $2
      //   3. Join chunks back to documents, deduplicate, rank by vector score
      const fallback = await this.keywordSearch(query)
      return {
        ...fallback,
        searchType: 'semantic',
        durationMs: Date.now() - start,
      }
    },

    // Future Sprint 20: combines keyword + semantic with Reciprocal Rank Fusion.
    async hybridSearch(query: SearchQuery): Promise<SearchResponse> {
      const start = Date.now()
      // Placeholder: delegates to keyword search until semantic is available.
      // When both are live, RRF scoring will be:
      //   score_rrf = Σ (1 / (k + rank_i)) where k=60 is the RRF constant
      const fallback = await this.keywordSearch(query)
      return {
        ...fallback,
        searchType: 'hybrid',
        durationMs: Date.now() - start,
      }
    },

    // Unified search entry point — chooses mode automatically.
    async search(query: SearchQuery, mode: 'keyword' | 'semantic' | 'hybrid' = 'keyword'): Promise<SearchResponse> {
      switch (mode) {
        case 'semantic':
          return this.semanticSearch(query)
        case 'hybrid':
          return this.hybridSearch(query)
        default:
          return this.keywordSearch(query)
      }
    },

    // Quick document list (no scoring) — used for browse/listing views.
    async listPublished(workspaceId: string, limit = knowledgeConfig.defaultPageSize) {
      return docsRepo.list(workspaceId, { status: 'published', limit })
    },
  }
}

export type KnowledgeSearchService = ReturnType<typeof createKnowledgeSearchService>
