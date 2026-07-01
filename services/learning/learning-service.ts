import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type {
  CreateRecommendationInput,
  CreateSignalInput,
  DetectedPattern,
  FeedbackAction,
  LearningPattern,
  LearningSignal,
  PatternType,
  Recommendation,
  RecommendationFeedback,
} from '@/types/learning'
import { learningConfig } from '@/config/learning'
import {
  createPatternsRepository,
  createRecommendationsRepository,
  createSignalsRepository,
} from '@/repositories/learning'

type SignalRow = Database['public']['Tables']['learning_signals']['Row']
type PatternRow = Database['public']['Tables']['learning_patterns']['Row']
type RecommendationRow = Database['public']['Tables']['recommendations']['Row']
type FeedbackRow = Database['public']['Tables']['recommendation_feedback']['Row']

function toSignal(row: SignalRow): LearningSignal {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    organizationId: row.organization_id,
    signalType: row.signal_type as LearningSignal['signalType'],
    entityType: row.entity_type,
    entityId: row.entity_id,
    severity: row.severity as LearningSignal['severity'],
    confidence: Number(row.confidence ?? 0.5),
    title: row.title,
    description: row.description,
    data: (row.data as Record<string, unknown>) ?? {},
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    detectedAt: row.detected_at,
    resolvedAt: row.resolved_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toPattern(row: PatternRow): LearningPattern {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    organizationId: row.organization_id,
    patternType: row.pattern_type as LearningPattern['patternType'],
    name: row.name,
    description: row.description,
    confidence: Number(row.confidence),
    occurrences: row.occurrences,
    lastSeenAt: row.last_seen_at,
    data: (row.data as Record<string, unknown>) ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toRecommendation(row: RecommendationRow): Recommendation {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    organizationId: row.organization_id,
    userId: row.user_id,
    patternId: row.pattern_id,
    signalId: row.signal_id,
    type: row.type as Recommendation['type'],
    priority: row.priority as Recommendation['priority'],
    title: row.title,
    description: row.description,
    actionLabel: row.action_label,
    actionUrl: row.action_url,
    entityType: row.entity_type,
    entityId: row.entity_id,
    status: row.status as Recommendation['status'],
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function signalTypeToPatternType(signalType: string): PatternType {
  if (signalType.includes('deal')) return 'deal_risk'
  if (signalType.includes('follow_up')) return 'follow_up'
  if (signalType.includes('response')) return 'follow_up'
  if (signalType.includes('attention')) return 'bottleneck'
  if (signalType.includes('communication')) return 'sales'
  if (signalType.includes('task')) return 'task_completion'
  if (signalType.includes('customer')) return 'customer_health'
  if (signalType.includes('bottleneck')) return 'bottleneck'
  if (signalType.includes('performance')) return 'performance'
  return 'sales'
}

export function createLearningService(db: SupabaseClient<Database>) {
  const signalsRepo = createSignalsRepository(db)
  const patternsRepo = createPatternsRepository(db)
  const recommendationsRepo = createRecommendationsRepository(db)

  return {
    async createLearningSignal(input: CreateSignalInput): Promise<LearningSignal> {
      const row = await signalsRepo.create({
        workspace_id: input.workspaceId,
        organization_id: input.organizationId,
        signal_type: input.signalType,
        entity_type: input.entityType ?? null,
        entity_id: input.entityId ?? null,
        severity: input.severity ?? 'info',
        confidence: input.confidence ?? 0.5,
        title: input.title,
        description: input.description ?? null,
        data: (input.data ?? {}) as SignalRow['data'],
        metadata: (input.metadata ?? {}) as SignalRow['metadata'],
      })
      return toSignal(row)
    },

    async detectPatterns(
      workspaceId: string,
      organizationId: string
    ): Promise<DetectedPattern[]> {
      const recentSignals = await signalsRepo.list(workspaceId, {
        resolved: false,
        limit: 200,
      })

      // Group signals by type + entity_type pair
      const grouped = new Map<string, SignalRow[]>()
      for (const signal of recentSignals) {
        const key = `${signal.signal_type}:${signal.entity_type ?? 'global'}`
        const bucket = grouped.get(key) ?? []
        bucket.push(signal)
        grouped.set(key, bucket)
      }

      const detected: DetectedPattern[] = []

      for (const [key, signals] of grouped.entries()) {
        if (signals.length < learningConfig.minPatternOccurrences) continue

        const [signalType, entityType] = key.split(':') as [string, string]
        const criticalCount = signals.filter((s) => s.severity === 'critical').length
        const confidence = Math.min(
          0.95,
          learningConfig.minPatternConfidence +
            (signals.length - learningConfig.minPatternOccurrences) * 0.05 +
            criticalCount * 0.1
        )

        const patternType = signalTypeToPatternType(signalType)
        const displayEntity = entityType === 'global' ? 'workspace' : entityType
        const patternName = `${signalType.replace(/_/g, ' ')} — ${displayEntity}`

        const pattern: DetectedPattern = {
          patternType,
          name: patternName,
          description: `Detected ${signals.length} recurring ${signalType.replace(/_/g, ' ')} signals${entityType !== 'global' ? ` on ${entityType} entities` : ''}.`,
          confidence,
          data: {
            signalCount: signals.length,
            criticalCount,
            signalType,
            entityType: entityType === 'global' ? null : entityType,
          },
          relatedSignalIds: signals.map((s) => s.id),
        }

        detected.push(pattern)

        // Upsert the pattern record
        const existing = await patternsRepo.findByTypeAndName(workspaceId, patternType, patternName)
        if (existing) {
          await patternsRepo.incrementOccurrences(existing.id, confidence)
        } else {
          await patternsRepo.create({
            workspace_id: workspaceId,
            organization_id: organizationId,
            pattern_type: patternType,
            name: patternName,
            description: pattern.description,
            confidence,
            occurrences: signals.length,
            last_seen_at: new Date().toISOString(),
            data: pattern.data as PatternRow['data'],
            metadata: {},
          })
        }
      }

      return detected
    },

    async createRecommendation(input: CreateRecommendationInput): Promise<Recommendation> {
      const row = await recommendationsRepo.create({
        workspace_id: input.workspaceId,
        organization_id: input.organizationId,
        user_id: input.userId ?? null,
        pattern_id: input.patternId ?? null,
        signal_id: input.signalId ?? null,
        type: input.type,
        priority: input.priority ?? 'medium',
        title: input.title,
        description: input.description,
        action_label: input.actionLabel ?? null,
        action_url: input.actionUrl ?? null,
        entity_type: input.entityType ?? null,
        entity_id: input.entityId ?? null,
        status: 'pending',
        expires_at: input.expiresAt ?? null,
        metadata: {},
      })
      return toRecommendation(row)
    },

    async recordRecommendationFeedback(
      recommendationId: string,
      userId: string,
      action: FeedbackAction,
      options: { rating?: number; comment?: string } = {}
    ): Promise<RecommendationFeedback> {
      const [feedbackRow] = await Promise.all([
        recommendationsRepo.createFeedback({
          recommendation_id: recommendationId,
          user_id: userId,
          action,
          rating: options.rating ?? null,
          comment: options.comment ?? null,
          metadata: {},
        }),
        recommendationsRepo.updateStatus(recommendationId, action),
      ])

      const row = feedbackRow as FeedbackRow
      return {
        id: row.id,
        recommendationId: row.recommendation_id,
        userId: row.user_id,
        action: row.action as FeedbackAction,
        rating: row.rating,
        comment: row.comment,
        createdAt: row.created_at,
      }
    },

    async listRecommendations(
      workspaceId: string,
      options: { userId?: string; status?: string; limit?: number } = {}
    ): Promise<Recommendation[]> {
      const rows = await recommendationsRepo.list(workspaceId, {
        userId: options.userId,
        status: options.status ?? 'pending',
        limit: options.limit ?? learningConfig.maxRecommendationsPerWorkspace,
      })
      return rows.map(toRecommendation)
    },

    async listPatterns(
      workspaceId: string,
      options: { patternType?: string; limit?: number } = {}
    ): Promise<LearningPattern[]> {
      const rows = await patternsRepo.list(workspaceId, {
        patternType: options.patternType,
        minConfidence: learningConfig.minPatternConfidence,
        limit: options.limit ?? 50,
      })
      return rows.map(toPattern)
    },

    async listSignals(
      workspaceId: string,
      options: {
        signalType?: string
        entityType?: string
        entityId?: string
        severity?: string
        resolved?: boolean
        limit?: number
      } = {}
    ): Promise<LearningSignal[]> {
      const rows = await signalsRepo.list(workspaceId, options)
      return rows.map(toSignal)
    },

    async updateSignal(
      signalId: string,
      input: {
        severity?: LearningSignal['severity']
        confidence?: number
        title?: string
        description?: string | null
        data?: Record<string, unknown>
        metadata?: Record<string, unknown>
      }
    ): Promise<LearningSignal> {
      const row = await signalsRepo.update(signalId, {
        severity: input.severity,
        confidence: input.confidence,
        title: input.title,
        description: input.description ?? undefined,
        data: input.data as SignalRow['data'] | undefined,
        metadata: input.metadata as SignalRow['metadata'] | undefined,
      })
      return toSignal(row)
    },

    async resolveSignal(signalId: string): Promise<LearningSignal> {
      const row = await signalsRepo.resolve(signalId)
      return toSignal(row)
    },
  }
}

export type LearningService = ReturnType<typeof createLearningService>
