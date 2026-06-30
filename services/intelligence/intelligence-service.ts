import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { IntelligenceContext } from '@/types/intelligence'
import { createIntelligenceRepository } from '@/repositories/intelligence'
import { createLearningService } from '@/services/learning/learning-service'
import { createMemoryService } from '@/services/memory/memory-service'
import { createWorkspacesRepository } from '@/repositories/workspaces'
import { intelligenceConfig } from '@/config/intelligence'
import { extractTopOpportunities, extractTopRisks } from './recommendation-engine'

export function createIntelligenceService(db: SupabaseClient<Database>) {
  const intelligenceRepo = createIntelligenceRepository(db)
  const learningService = createLearningService(db)
  const memoryService = createMemoryService(db)
  const workspacesRepo = createWorkspacesRepository(db)

  return {
    // Assembles the full executive intelligence context for a workspace.
    // Called by the /api/intelligence/context route.
    async getIntelligenceContext(
      userId: string,
      workspaceId?: string
    ): Promise<IntelligenceContext | null> {
      // Resolve workspace
      const workspaces = await workspacesRepo.listForUser(userId)
      if (workspaces.length === 0) return null

      const workspace =
        (workspaceId ? workspaces.find((w) => w.id === workspaceId) : null) ?? workspaces[0]

      const organizationId = workspace.organization_id

      // Fetch all intelligence data in parallel
      const [snapshot, executiveContext, activeRecommendations, recentSignals] =
        await Promise.all([
          intelligenceRepo.getWorkspaceSnapshot(workspace.id),
          memoryService.getExecutiveContext(workspace.id, organizationId),
          learningService.listRecommendations(workspace.id, {
            status: 'pending',
            limit: intelligenceConfig.maxTopOpportunities * 2,
          }),
          learningService
            .listPatterns(workspace.id)
            .then(() =>
              // listPatterns returns patterns; signals come via learning service too
              db
                .from('learning_signals')
                .select('*')
                .eq('workspace_id', workspace.id)
                .is('resolved_at', null)
                .order('detected_at', { ascending: false })
                .limit(intelligenceConfig.maxRecentSignals)
                .then(({ data }) => data ?? [])
            ),
        ])

      const topRisks = extractTopRisks(activeRecommendations)
      const topOpportunities = extractTopOpportunities(activeRecommendations)

      // Map signal rows to LearningSignal application type
      const learningSignals = recentSignals.map((row) => ({
        id: row.id,
        workspaceId: row.workspace_id,
        organizationId: row.organization_id,
        signalType: row.signal_type as never,
        entityType: row.entity_type,
        entityId: row.entity_id,
        severity: row.severity as never,
        title: row.title,
        description: row.description,
        data: (row.data as Record<string, unknown>) ?? {},
        detectedAt: row.detected_at,
        resolvedAt: row.resolved_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }))

      return {
        workspaceId: workspace.id,
        organizationId,
        executiveMetrics: snapshot.executiveMetrics,
        recentMemories: executiveContext.memories,
        activeRecommendations,
        learningSignals,
        topRisks,
        topOpportunities,
        todayAgenda: snapshot.todayAgenda,
        importantTasks: snapshot.importantTasks,
        generatedAt: new Date().toISOString(),
      }
    },
  }
}

export type IntelligenceService = ReturnType<typeof createIntelligenceService>
