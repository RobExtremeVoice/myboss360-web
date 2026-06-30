import type { LearningSignal, Recommendation } from '@/types/learning'
import type { Memory } from '@/types/memory'

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

export type OpportunityType =
  | 'deal_growth'
  | 'follow_up'
  | 'cross_sell'
  | 'renewal'
  | 'referral'
  | 'pipeline_acceleration'

export interface ExecutiveRisk {
  id: string
  title: string
  description: string
  level: RiskLevel
  entityType?: string
  entityId?: string
  detectedAt: string
}

export interface ExecutiveOpportunity {
  id: string
  title: string
  description: string
  type: OpportunityType
  entityType?: string
  entityId?: string
  estimatedValue?: number
  detectedAt: string
}

export interface ExecutiveMetrics {
  totalPipelineValue: number
  activeDeals: number
  overdueTasksCount: number
  atRiskDealsCount: number
  atRiskProjectsCount: number
  staleContactsCount: number
  upcomingMeetingsCount: number
  avgDealAgedays: number
  closedWonThisMonth: number
  closedWonValueThisMonth: number
}

export interface TodayAgendaItem {
  id: string
  title: string
  startAt: string
  endAt: string
  type: 'meeting' | 'task_due' | 'project_deadline'
  location?: string | null
}

export interface ImportantTask {
  id: string
  title: string
  status: string
  priority: string
  dueDate: string | null
  assignedTo: string | null
  isOverdue: boolean
  projectId: string | null
}

export interface IntelligenceContext {
  workspaceId: string
  organizationId: string
  executiveMetrics: ExecutiveMetrics
  recentMemories: Memory[]
  activeRecommendations: Recommendation[]
  learningSignals: LearningSignal[]
  topRisks: ExecutiveRisk[]
  topOpportunities: ExecutiveOpportunity[]
  todayAgenda: TodayAgendaItem[]
  importantTasks: ImportantTask[]
  generatedAt: string
}

export interface SignalEmitInput {
  workspaceId: string
  organizationId: string
  entityType: string
  entityId: string
  entityTitle: string
  data?: Record<string, unknown>
}
