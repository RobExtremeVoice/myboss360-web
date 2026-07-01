import type { KnowledgeCategory, KnowledgeObjectType, KnowledgeStatus, ChunkStrategy } from '@/types/knowledge'

export const KNOWLEDGE_OBJECT_TYPES: KnowledgeObjectType[] = [
  'company_profile',
  'policy',
  'procedure',
  'sop',
  'product',
  'service',
  'playbook',
  'contract',
  'meeting_notes',
  'document',
  'email',
  'calendar_event',
  'executive_decision',
  'customer_notes',
  'project_documentation',
]

export const KNOWLEDGE_CATEGORIES: KnowledgeCategory[] = [
  'executive',
  'meeting',
  'policy',
  'playbook',
  'hr',
  'finance',
  'legal',
  'marketing',
  'operations',
]

export const KNOWLEDGE_STATUSES: KnowledgeStatus[] = ['draft', 'published', 'archived']

export const CHUNK_STRATEGIES: ChunkStrategy[] = ['paragraph', 'sentence', 'fixed_size', 'semantic']

export const objectTypeLabels: Record<KnowledgeObjectType, string> = {
  company_profile: 'Company Profile',
  policy: 'Policy',
  procedure: 'Procedure',
  sop: 'Standard Operating Procedure',
  product: 'Product',
  service: 'Service',
  playbook: 'Playbook',
  contract: 'Contract',
  meeting_notes: 'Meeting Notes',
  document: 'Document',
  email: 'Email',
  calendar_event: 'Calendar Event',
  executive_decision: 'Executive Decision',
  customer_notes: 'Customer Notes',
  project_documentation: 'Project Documentation',
}

export const categoryLabels: Record<KnowledgeCategory, string> = {
  executive: 'Executive',
  meeting: 'Meeting',
  policy: 'Policy',
  playbook: 'Playbook',
  hr: 'Human Resources',
  finance: 'Finance',
  legal: 'Legal',
  marketing: 'Marketing',
  operations: 'Operations',
}

export const knowledgeConfig = {
  // Chunking defaults
  defaultChunkStrategy: 'paragraph' as ChunkStrategy,
  defaultMaxChunkSize: 512,   // approximate tokens
  defaultChunkOverlap: 50,    // approximate tokens
  maxChunksPerDocument: 1000,

  // Pagination defaults
  defaultPageSize: 20,
  maxPageSize: 100,

  // Content limits
  maxDocumentSizeBytes: 5 * 1024 * 1024, // 5 MB
  maxTitleLength: 500,

  // Search (future RAG config)
  defaultSearchLimit: 10,
  maxSearchLimit: 50,
  semanticScoreThreshold: 0.75,
} as const
