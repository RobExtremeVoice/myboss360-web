// Knowledge Engine domain types — Sprint 19

export type KnowledgeObjectType =
  | 'company_profile'
  | 'policy'
  | 'procedure'
  | 'sop'
  | 'product'
  | 'service'
  | 'playbook'
  | 'contract'
  | 'meeting_notes'
  | 'document'
  | 'email'
  | 'calendar_event'
  | 'executive_decision'
  | 'customer_notes'
  | 'project_documentation'

export type KnowledgeCategory =
  | 'executive'
  | 'meeting'
  | 'policy'
  | 'playbook'
  | 'hr'
  | 'finance'
  | 'legal'
  | 'marketing'
  | 'operations'

export type KnowledgeStatus = 'draft' | 'published' | 'archived'

export type ChunkStrategy = 'paragraph' | 'sentence' | 'fixed_size' | 'semantic'

export type SourceType = 'manual' | 'import' | 'crm' | 'calendar' | 'email' | 'integration'

export type LinkType = 'references' | 'supersedes' | 'related' | 'prerequisite'

export type PermissionType = 'read' | 'edit' | 'admin'

// ─── Domain objects ───────────────────────────────────────────────────────────

export interface KnowledgeCollection {
  id: string
  workspaceId: string
  organizationId: string
  name: string
  description: string | null
  slug: string
  isDefault: boolean
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface KnowledgeSource {
  id: string
  workspaceId: string
  organizationId: string
  name: string
  sourceType: SourceType
  config: Record<string, unknown>
  lastSyncAt: string | null
  createdAt: string
  updatedAt: string
}

export interface KnowledgeDocument {
  id: string
  workspaceId: string
  organizationId: string
  collectionId: string | null
  sourceId: string | null
  title: string
  content: string
  objectType: KnowledgeObjectType
  category: KnowledgeCategory
  status: KnowledgeStatus
  version: number
  wordCount: number | null
  metadata: Record<string, unknown>
  createdBy: string
  updatedBy: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface KnowledgeChunk {
  id: string
  documentId: string
  workspaceId: string
  chunkIndex: number
  content: string
  chunkStrategy: ChunkStrategy
  tokenCount: number | null
  embeddingId: string | null
  metadata: Record<string, unknown>
  createdAt: string
}

export interface KnowledgeTag {
  id: string
  workspaceId: string
  name: string
  slug: string
  color: string | null
  createdAt: string
  updatedAt: string
}

export interface KnowledgeLink {
  id: string
  workspaceId: string
  sourceDocumentId: string
  targetDocumentId: string
  linkType: LinkType
  metadata: Record<string, unknown>
  createdAt: string
}

export interface DocumentVersion {
  id: string
  documentId: string
  version: number
  content: string
  title: string
  changedBy: string
  changeNote: string | null
  metadata: Record<string, unknown>
  createdAt: string
}

export interface DocumentPermission {
  id: string
  documentId: string
  workspaceId: string
  userId: string | null
  roleId: string | null
  permissionType: PermissionType
  createdAt: string
}

// ─── Pipeline types ───────────────────────────────────────────────────────────

export interface ParseResult {
  content: string
  wordCount: number
  characterCount: number
  metadata: Record<string, unknown>
}

export interface ChunkInput {
  content: string
  strategy: ChunkStrategy
  maxChunkSize?: number  // tokens, default 512
  overlapSize?: number   // tokens, default 50
}

export interface ChunkOutput {
  chunks: Array<{
    content: string
    chunkIndex: number
    tokenCount: number
    metadata: Record<string, unknown>
  }>
  strategy: ChunkStrategy
  totalChunks: number
}

// ─── Search interfaces (future RAG implementation) ────────────────────────────

export interface SearchQuery {
  query: string
  workspaceId: string
  organizationId: string
  objectTypes?: KnowledgeObjectType[]
  categories?: KnowledgeCategory[]
  collectionId?: string | null
  tags?: string[]
  status?: KnowledgeStatus
  limit?: number
  offset?: number
}

export interface SearchResult {
  document: KnowledgeDocument
  score: number
  highlights: string[]
  matchType: 'keyword' | 'semantic' | 'hybrid'
  chunkMatches?: Array<{ chunkIndex: number; content: string; score: number }>
}

export interface SearchResponse {
  results: SearchResult[]
  total: number
  query: string
  searchType: 'keyword' | 'semantic' | 'hybrid'
  durationMs: number
}

// ─── API input types ──────────────────────────────────────────────────────────

export interface CreateDocumentInput {
  title: string
  content: string
  objectType: KnowledgeObjectType
  category: KnowledgeCategory
  collectionId?: string | null
  sourceId?: string | null
  status?: KnowledgeStatus
  metadata?: Record<string, unknown>
  tagIds?: string[]
  autoChunk?: boolean
}

export interface UpdateDocumentInput {
  title?: string
  content?: string
  objectType?: KnowledgeObjectType
  category?: KnowledgeCategory
  collectionId?: string | null
  status?: KnowledgeStatus
  metadata?: Record<string, unknown>
  changeNote?: string
  autoChunk?: boolean
}

export interface ListDocumentsOptions {
  status?: KnowledgeStatus
  objectType?: KnowledgeObjectType
  category?: KnowledgeCategory
  collectionId?: string | null
  tagId?: string
  limit?: number
  offset?: number
}

export interface CreateCollectionInput {
  name: string
  description?: string | null
  slug?: string
  isDefault?: boolean
  metadata?: Record<string, unknown>
}

export interface CreateTagInput {
  name: string
  slug?: string
  color?: string | null
}
