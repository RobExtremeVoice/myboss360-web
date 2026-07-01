export const intelligenceConfig = {
  // Deal considered at-risk when close date is within this many days and not won/lost
  dealRiskDaysToClose: 14,
  // Probability threshold below which a deal in late stages is flagged
  dealLowProbabilityThreshold: 30,
  // Days without any activity before a contact is considered stale
  staleContactDays: 30,
  // Days a follow-up can be overdue before signal fires
  followUpThresholdDays: 7,
  // Gmail relationship intelligence thresholds
  activeConversationWindowHours: 36,
  inboundReplySlaHours: 24,
  outboundFollowUpSlaHours: 72,
  conversationClosedAfterDays: 30,
  highPriorityFollowUpDays: 3,
  criticalPriorityFollowUpDays: 7,
  // Days before a task is flagged as delayed (0 = any past due_date)
  taskOverdueThresholdDays: 0,
  // Maximum items in top risks / opportunities
  maxTopRisks: 5,
  maxTopOpportunities: 5,
  maxTodayAgendaItems: 10,
  maxImportantTasks: 10,
  maxRecentSignals: 20,
  // Pipeline stages considered "late stage" for risk evaluation
  pipelineRiskStages: ['proposal', 'negotiation'] as string[],
  // Deal stages that are terminal (no signals needed)
  terminalDealStages: ['closed_won', 'closed_lost'] as string[],
  // Project statuses that indicate risk
  atRiskProjectStatuses: ['at-risk'] as string[],
  // Task statuses eligible for overdue signals
  activeTaskStatuses: ['todo', 'in-progress', 'blocked'] as string[],
  // Number of days to look back for recent signals
  signalLookbackDays: 7,
  // Revenue trend period in days
  revenueTrendPeriodDays: 30,
}

export const signalTitles = {
  deal_risk: 'Deal at risk of expiring',
  follow_up_delay: 'Follow-up overdue',
  task_delay: 'Task past due date',
  customer_health: 'Customer engagement declining',
  sales_pattern: 'Sales pattern detected',
  recurring_bottleneck: 'Recurring bottleneck identified',
  performance_trend: 'Performance trend detected',
  recommended_action: 'Action recommended',
} as const

export const recommendationTitles = {
  follow_up_overdue: 'Schedule follow-up with stale contacts',
  deal_at_risk: 'Prioritize at-risk deals before close date',
  overdue_tasks: 'Address overdue tasks blocking progress',
  pipeline_opportunity: 'Accelerate deals in negotiation stage',
  customer_reengagement: 'Re-engage inactive customers',
} as const
