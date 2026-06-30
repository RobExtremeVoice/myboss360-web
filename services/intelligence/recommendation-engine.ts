import type { LearningService } from '@/services/learning/learning-service'
import type { Recommendation } from '@/types/learning'
import type { PatternDetectionResult } from './pattern-detector'
import { intelligenceConfig } from '@/config/intelligence'

export interface RecommendationEngineResult {
  created: Recommendation[]
  skipped: number
}

// Generates typed recommendations from pattern detection results.
// Deduplicates by title to avoid flooding the workspace with identical recommendations.
export async function generateRecommendations(
  workspaceId: string,
  organizationId: string,
  patternResult: PatternDetectionResult,
  learningService: LearningService,
  options: { userId?: string } = {}
): Promise<RecommendationEngineResult> {
  // Load existing pending recommendations to skip duplicates
  const existing = await learningService.listRecommendations(workspaceId, {
    status: 'pending',
    limit: intelligenceConfig.maxTopOpportunities * 4,
  })
  const existingTitles = new Set(existing.map((r) => r.title))

  const created: Recommendation[] = []
  let skipped = 0

  // Expiry: recommendations expire in 7 days
  const expiresAt = new Date(Date.now() + 7 * 86_400_000).toISOString()

  for (const rec of patternResult.recommendations) {
    if (existingTitles.has(rec.title)) {
      skipped++
      continue
    }

    // Cap total pending recommendations per workspace
    if (existing.length + created.length >= intelligenceConfig.maxTopOpportunities * 2) {
      skipped++
      continue
    }

    const created_rec = await learningService.createRecommendation({
      workspaceId,
      organizationId,
      userId: options.userId,
      type: rec.type,
      priority: rec.priority,
      title: rec.title,
      description: rec.description,
      actionLabel: rec.actionLabel,
      entityType: rec.entityType,
      entityId: rec.entityId,
      expiresAt,
    })
    created.push(created_rec)
    existingTitles.add(rec.title)
  }

  return { created, skipped }
}

// Builds the top risks list from recommendations for the executive context.
export function extractTopRisks(recommendations: Recommendation[]) {
  return recommendations
    .filter((r) => r.type === 'warning' && r.status === 'pending')
    .sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 }
      return (order[a.priority] ?? 4) - (order[b.priority] ?? 4)
    })
    .slice(0, intelligenceConfig.maxTopRisks)
    .map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      level: (r.priority === 'critical' ? 'critical'
        : r.priority === 'high' ? 'high'
        : r.priority === 'medium' ? 'medium'
        : 'low') as 'low' | 'medium' | 'high' | 'critical',
      entityType: r.entityType ?? undefined,
      entityId: r.entityId ?? undefined,
      detectedAt: r.createdAt,
    }))
}

// Builds the top opportunities list from recommendations.
export function extractTopOpportunities(recommendations: Recommendation[]) {
  return recommendations
    .filter((r) => r.type === 'opportunity' && r.status === 'pending')
    .sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 }
      return (order[a.priority] ?? 4) - (order[b.priority] ?? 4)
    })
    .slice(0, intelligenceConfig.maxTopOpportunities)
    .map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      type: 'pipeline_acceleration' as const,
      entityType: r.entityType ?? undefined,
      entityId: r.entityId ?? undefined,
      detectedAt: r.createdAt,
    }))
}
