import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type {
  CreateMemoryInput,
  ExecutiveContext,
  ListMemoriesOptions,
  Memory,
  MemoryEvent,
  MemoryEventType,
} from '@/types/memory'
import { createMemoriesRepository } from '@/repositories/memory'

type MemoryRow = Database['public']['Tables']['memories']['Row']
type MemoryEventRow = Database['public']['Tables']['memory_events']['Row']

function toMemory(row: MemoryRow): Memory {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    organizationId: row.organization_id,
    userId: row.user_id,
    type: row.type as Memory['type'],
    title: row.title,
    content: row.content,
    source: (row.source ?? 'manual') as Memory['source'],
    entityType: row.entity_type as Memory['entityType'],
    entityId: row.entity_id,
    confidence: row.confidence !== null ? Number(row.confidence) : null,
    isPinned: row.is_pinned,
    expiresAt: row.expires_at,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toMemoryEvent(row: MemoryEventRow): MemoryEvent {
  return {
    id: row.id,
    memoryId: row.memory_id,
    eventType: row.event_type as MemoryEventType,
    actorId: row.actor_id,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at,
  }
}

export function createMemoryService(db: SupabaseClient<Database>) {
  const memoriesRepo = createMemoriesRepository(db)

  return {
    async createMemory(input: CreateMemoryInput): Promise<Memory> {
      const row = await memoriesRepo.create({
        workspace_id: input.workspaceId,
        organization_id: input.organizationId,
        user_id: input.userId ?? null,
        type: input.type,
        title: input.title,
        content: input.content,
        source: input.source ?? 'manual',
        entity_type: input.entityType ?? null,
        entity_id: input.entityId ?? null,
        confidence: input.confidence ?? null,
        is_pinned: input.isPinned ?? false,
        expires_at: input.expiresAt ?? null,
        metadata: (input.metadata ?? {}) as Database['public']['Tables']['memories']['Insert']['metadata'],
        created_by: input.createdBy ?? null,
      })

      await memoriesRepo.recordEvent({
        memory_id: row.id,
        event_type: 'created',
        actor_id: input.createdBy ?? null,
        metadata: {},
      })

      return toMemory(row)
    },

    async listMemories(
      workspaceId: string,
      options: ListMemoriesOptions = {}
    ): Promise<Memory[]> {
      const rows = await memoriesRepo.list(workspaceId, {
        type: options.type,
        entityType: options.entityType ?? undefined,
        entityId: options.entityId ?? undefined,
        userId: options.userId ?? undefined,
        limit: options.limit,
        offset: options.offset,
      })
      return rows.map(toMemory)
    },

    async recordMemoryEvent(
      memoryId: string,
      eventType: MemoryEventType,
      actorId?: string | null,
      metadata?: Record<string, unknown>
    ): Promise<MemoryEvent> {
      const row = await memoriesRepo.recordEvent({
        memory_id: memoryId,
        event_type: eventType,
        actor_id: actorId ?? null,
        metadata: (metadata ?? {}) as Database['public']['Tables']['memory_events']['Insert']['metadata'],
      })
      return toMemoryEvent(row)
    },

    async getExecutiveContext(
      workspaceId: string,
      organizationId: string
    ): Promise<ExecutiveContext> {
      const [orgGoals, workspaceContext, aiInsights, allRecent] = await Promise.all([
        memoriesRepo.listByOrg(organizationId, { type: 'org_goal', limit: 10 }),
        memoriesRepo.list(workspaceId, { type: 'workspace_context', limit: 10 }),
        memoriesRepo.list(workspaceId, { type: 'ai_insight', limit: 20 }),
        memoriesRepo.list(workspaceId, { limit: 50 }),
      ])

      const recentDecisions = allRecent
        .filter((m) => m.type === 'decision')
        .slice(0, 10)

      return {
        memories: allRecent.map(toMemory),
        recentDecisions: recentDecisions.map(toMemory),
        orgGoals: orgGoals.map(toMemory),
        workspaceContext: workspaceContext.map(toMemory),
        aiInsights: aiInsights.map(toMemory),
      }
    },
  }
}

export type MemoryService = ReturnType<typeof createMemoryService>
