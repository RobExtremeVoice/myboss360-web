import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { AIToolCall, AIToolResult } from '@/types/ai'
import { createIntelligenceService } from '@/services/intelligence/intelligence-service'
import { createLearningService } from '@/services/learning/learning-service'

interface ToolContext {
  db: SupabaseClient<Database>
  userId: string
  workspaceId: string
  organizationId: string
}

type ToolHandler = (args: Record<string, unknown>, ctx: ToolContext) => Promise<string>

const handlers = new Map<string, ToolHandler>()

function registerTool(name: string, handler: ToolHandler): void {
  handlers.set(name, handler)
}

function notImplemented(name: string): ToolHandler {
  return async () => `Tool "${name}" is registered but not yet implemented. Available in Sprint 17B.`
}

// --- Read-only tools ---

registerTool('getExecutiveContext', async (_args, ctx) => {
  const service = createIntelligenceService(ctx.db)
  const context = await service.getIntelligenceContext(ctx.userId, ctx.workspaceId)
  if (!context) return 'No executive context available for this workspace.'
  const m = context.executiveMetrics
  return JSON.stringify({
    totalPipelineValue: m.totalPipelineValue,
    activeDeals: m.activeDeals,
    atRiskDeals: m.atRiskDealsCount,
    overdueTasksCount: m.overdueTasksCount,
    upcomingMeetings: m.upcomingMeetingsCount,
    topRisks: context.topRisks.length,
    activeRecommendations: context.activeRecommendations.length,
  })
})

registerTool('listDeals', async (args, ctx) => {
  const stage = typeof args.stage === 'string' ? args.stage : undefined
  const query = ctx.db.from('deals').select('id, title, stage, value, probability, expected_close_date').eq('workspace_id', ctx.workspaceId).is('deleted_at', null)
  const { data, error } = stage ? await query.eq('stage', stage).limit(20) : await query.limit(20)
  if (error) return `Error fetching deals: ${error.message}`
  return JSON.stringify(data ?? [])
})

registerTool('listTasks', async (args, ctx) => {
  const status = typeof args.status === 'string' ? args.status : undefined
  const priority = typeof args.priority === 'string' ? args.priority : undefined
  let query = ctx.db.from('tasks').select('id, title, status, priority, due_date, assigned_to').eq('workspace_id', ctx.workspaceId).is('deleted_at', null)
  if (status) query = query.eq('status', status)
  if (priority) query = query.eq('priority', priority)
  const { data, error } = await query.order('due_date', { ascending: true, nullsFirst: false }).limit(20)
  if (error) return `Error fetching tasks: ${error.message}`
  return JSON.stringify(data ?? [])
})

registerTool('summarizePipeline', async (_args, ctx) => {
  const { data: deals } = await ctx.db.from('deals').select('stage, value, probability, expected_close_date').eq('workspace_id', ctx.workspaceId).is('deleted_at', null)
  const stages: Record<string, { count: number; value: number }> = {}
  for (const d of deals ?? []) {
    if (!stages[d.stage]) stages[d.stage] = { count: 0, value: 0 }
    stages[d.stage].count += 1
    stages[d.stage].value += Number(d.value ?? 0)
  }
  return JSON.stringify(stages)
})

registerTool('createRecommendationFeedback', async (args, ctx) => {
  const id = typeof args.recommendationId === 'string' ? args.recommendationId : null
  const action = typeof args.action === 'string' ? args.action : null
  if (!id || !action) return 'Missing recommendationId or action.'
  if (!['accepted', 'rejected', 'dismissed'].includes(action)) return 'Action must be accepted, rejected, or dismissed.'
  const service = createLearningService(ctx.db)
  await service.recordRecommendationFeedback(id, ctx.userId, action as 'accepted' | 'rejected' | 'dismissed')
  return `Recommendation ${action}.`
})

// --- Write tools (not implemented yet) ---

registerTool('createTask', notImplemented('createTask'))
registerTool('updateDealStage', notImplemented('updateDealStage'))
registerTool('createFollowUp', notImplemented('createFollowUp'))
registerTool('listCompanies', notImplemented('listCompanies'))

// --- Router ---

export async function routeToolCall(
  toolCall: AIToolCall,
  ctx: ToolContext
): Promise<AIToolResult> {
  const handler = handlers.get(toolCall.name)
  if (!handler) {
    return {
      toolCallId: toolCall.id,
      content: `Unknown tool: "${toolCall.name}"`,
    }
  }

  const content = await handler(toolCall.arguments, ctx).catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err)
    return `Tool error: ${msg}`
  })

  return { toolCallId: toolCall.id, content }
}

export function listRegisteredTools(): string[] {
  return Array.from(handlers.keys())
}
