export type SignalType =
  | 'deal_risk'
  | 'follow_up_delay'
  | 'task_delay'
  | 'customer_health'
  | 'sales_pattern'
  | 'recurring_bottleneck'
  | 'performance_trend'
  | 'recommended_action'
  | 'workspace_created'
  | 'new_relationship'
  | 'attention_required'
  | 'follow_up_overdue'
  | 'customer_inactivity'
  | 'communication_pattern'
  | 'response_delay'

export type SignalSeverity = 'info' | 'warning' | 'critical'

export type PatternType =
  | 'sales'
  | 'deal_risk'
  | 'follow_up'
  | 'task_completion'
  | 'customer_health'
  | 'bottleneck'
  | 'performance'

export type RecommendationType = 'action' | 'insight' | 'warning' | 'opportunity'

export type RecommendationPriority = 'low' | 'medium' | 'high' | 'critical'

export type RecommendationStatus = 'pending' | 'accepted' | 'rejected' | 'dismissed' | 'expired'

export type FeedbackAction = 'accepted' | 'rejected' | 'dismissed'

export interface LearningSignal {
  id: string
  workspaceId: string
  organizationId: string
  signalType: SignalType
  entityType: string | null
  entityId: string | null
  severity: SignalSeverity
  confidence: number
  title: string
  description: string | null
  data: Record<string, unknown>
  metadata: Record<string, unknown>
  detectedAt: string
  resolvedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface LearningPattern {
  id: string
  workspaceId: string
  organizationId: string
  patternType: PatternType
  name: string
  description: string | null
  confidence: number
  occurrences: number
  lastSeenAt: string
  data: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface Recommendation {
  id: string
  workspaceId: string
  organizationId: string
  userId: string | null
  patternId: string | null
  signalId: string | null
  type: RecommendationType
  priority: RecommendationPriority
  title: string
  description: string
  actionLabel: string | null
  actionUrl: string | null
  entityType: string | null
  entityId: string | null
  status: RecommendationStatus
  expiresAt: string | null
  createdAt: string
  updatedAt: string
}

export interface RecommendationFeedback {
  id: string
  recommendationId: string
  userId: string
  action: FeedbackAction
  rating: number | null
  comment: string | null
  createdAt: string
}

export interface CreateSignalInput {
  workspaceId: string
  organizationId: string
  signalType: SignalType
  entityType?: string | null
  entityId?: string | null
  severity?: SignalSeverity
  confidence?: number
  title: string
  description?: string | null
  data?: Record<string, unknown>
  metadata?: Record<string, unknown>
}

export interface CreateRecommendationInput {
  workspaceId: string
  organizationId: string
  userId?: string | null
  patternId?: string | null
  signalId?: string | null
  type: RecommendationType
  priority?: RecommendationPriority
  title: string
  description: string
  actionLabel?: string | null
  actionUrl?: string | null
  entityType?: string | null
  entityId?: string | null
  expiresAt?: string | null
}

export interface DetectedPattern {
  patternType: PatternType
  name: string
  description: string
  confidence: number
  data: Record<string, unknown>
  relatedSignalIds: string[]
}
