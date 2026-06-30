import type { SignalSeverity, SignalType, PatternType, RecommendationPriority } from '@/types/learning'

export const signalTypeLabels: Record<SignalType, string> = {
  deal_risk: 'Deal Risk',
  follow_up_delay: 'Follow-up Delay',
  task_delay: 'Task Delay',
  customer_health: 'Customer Health',
  sales_pattern: 'Sales Pattern',
  recurring_bottleneck: 'Recurring Bottleneck',
  performance_trend: 'Performance Trend',
  recommended_action: 'Recommended Action',
}

export const patternTypeLabels: Record<PatternType, string> = {
  sales: 'Sales Pattern',
  deal_risk: 'Deal Risk Pattern',
  follow_up: 'Follow-up Pattern',
  task_completion: 'Task Completion Pattern',
  customer_health: 'Customer Health Pattern',
  bottleneck: 'Bottleneck Pattern',
  performance: 'Performance Pattern',
}

export const severityWeights: Record<SignalSeverity, number> = {
  info: 1,
  warning: 2,
  critical: 3,
}

export const priorityWeights: Record<RecommendationPriority, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
}

export const learningConfig = {
  // Minimum signal occurrences before a pattern is recognized
  minPatternOccurrences: 3,
  // Minimum confidence score (0–1) to surface a pattern
  minPatternConfidence: 0.6,
  // How many days of signals to retain in the active window
  signalRetentionDays: 90,
  // Days without new occurrences before a pattern decays
  patternDecayDays: 30,
  // Max active recommendations surfaced per workspace at once
  maxRecommendationsPerWorkspace: 20,
  // Days without follow-up before a follow_up_delay signal fires
  followUpDelayThresholdDays: 7,
  // Days to close date that triggers a deal_risk signal
  dealRiskDaysToClose: 14,
  // Days past due date before a task_delay signal fires
  taskDelayThresholdDays: 3,
}
