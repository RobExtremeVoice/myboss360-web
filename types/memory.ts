export type MemoryType =
  | 'user_preference'
  | 'org_goal'
  | 'workspace_context'
  | 'decision'
  | 'meeting_summary'
  | 'observation'
  | 'executive_note'
  | 'ai_insight'
  | 'historical_recommendation'
  | 'accepted_recommendation'
  | 'rejected_recommendation'

export type MemorySource = 'manual' | 'ai_generated' | 'crm_event' | 'system' | 'integration'

export type MemoryImportance = 'low' | 'normal' | 'high' | 'critical'

export type MemoryEventType = 'created' | 'updated' | 'accessed' | 'archived' | 'expired'

export type MemoryEntityType =
  | 'company'
  | 'contact'
  | 'deal'
  | 'project'
  | 'task'
  | 'workspace'
  | 'organization'
  | 'gmail_thread'

export interface Memory {
  id: string
  workspaceId: string
  organizationId: string
  userId: string | null
  type: MemoryType
  title: string
  content: string
  source: MemorySource
  sourceId: string | null
  entityType: MemoryEntityType | null
  entityId: string | null
  confidence: number | null
  importance: MemoryImportance
  isPinned: boolean
  expiresAt: string | null
  metadata: Record<string, unknown>
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

export interface MemoryEvent {
  id: string
  memoryId: string
  eventType: MemoryEventType
  actorId: string | null
  metadata: Record<string, unknown>
  createdAt: string
}

export interface CreateMemoryInput {
  workspaceId: string
  organizationId: string
  userId?: string | null
  type: MemoryType
  title: string
  content: string
  source?: MemorySource
  sourceId?: string | null
  entityType?: MemoryEntityType | null
  entityId?: string | null
  confidence?: number | null
  importance?: MemoryImportance
  isPinned?: boolean
  expiresAt?: string | null
  metadata?: Record<string, unknown>
  createdBy?: string | null
}

export interface ListMemoriesOptions {
  type?: MemoryType | MemoryType[]
  entityType?: MemoryEntityType
  entityId?: string
  userId?: string
  limit?: number
  offset?: number
}

export interface ExecutiveContext {
  memories: Memory[]
  recentDecisions: Memory[]
  orgGoals: Memory[]
  workspaceContext: Memory[]
  aiInsights: Memory[]
}
