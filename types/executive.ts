import type { Memory } from '@/types/memory'
import type { LearningSignal, Recommendation } from '@/types/learning'
import type {
  EmailIntelligenceThread,
  ExecutiveMetrics,
  ExecutiveOpportunity,
  ExecutiveRisk,
  TodayAgendaItem,
} from '@/types/intelligence'

// ─── Executive Daily Briefing ─────────────────────────────────────────────────

export interface BriefingCalendarSection {
  todayMeetings: TodayAgendaItem[]
  upcomingMeetingCount: number
}

export interface BriefingGmailSection {
  awaitingReplies: EmailIntelligenceThread[]
  criticalThreads: EmailIntelligenceThread[]
  highPriorityThreads: EmailIntelligenceThread[]
  overdueFollowUps: EmailIntelligenceThread[]
  totalThreadsInContext: number
}

export interface BriefingCrmSection {
  pipelineValue: number
  activeDeals: number
  atRiskDeals: number
  overdueTasks: number
}

export interface BriefingMemorySection {
  recent: Memory[]
  count: number
}

export interface BriefingLearningSection {
  signals: LearningSignal[]
  signalCount: number
  patternCount: number
}

export interface BriefingKnowledgeSection {
  documentCount: number
  recentDocuments: Array<{ id: string; title: string; category: string | null; updatedAt: string }>
}

export interface ExecutiveBriefing {
  generatedAt: string
  executive: { name: string | null; email: string | null; workspaceId: string }
  calendar: BriefingCalendarSection
  gmail: BriefingGmailSection
  crm: BriefingCrmSection
  memory: BriefingMemorySection
  learning: BriefingLearningSection
  knowledge: BriefingKnowledgeSection
  recommendations: Recommendation[]
  topRisks: ExecutiveRisk[]
  topOpportunities: ExecutiveOpportunity[]
  executiveMetrics: ExecutiveMetrics
}

// ─── Executive Health ─────────────────────────────────────────────────────────

export type HealthStatus = 'ok' | 'warn' | 'error' | 'empty' | 'never'

export type OverallHealth = 'healthy' | 'degraded' | 'critical'

export interface ConnectionHealthCheck {
  status: HealthStatus
  googleConnected: boolean
  hasGmailScope: boolean
  hasCalendarScope: boolean
  accountEmail: string | null
}

export interface SyncHealthCheck {
  status: HealthStatus
  lastSyncAt: string | null
  totalSynced: number
}

export interface MemoryHealthCheck {
  status: HealthStatus
  count: number
}

export interface LearningHealthCheck {
  status: HealthStatus
  activeSignals: number
  patterns: number
  pendingRecommendations: number
}

export interface KnowledgeHealthCheck {
  status: HealthStatus
  documents: number
  chunks: number
}

export interface RecommendationsHealthCheck {
  status: HealthStatus
  pending: number
  total: number
}

export interface ExecutiveHealthReport {
  status: OverallHealth
  timestamp: string
  checks: {
    connections: ConnectionHealthCheck
    calendarSync: SyncHealthCheck
    gmailSync: SyncHealthCheck
    memory: MemoryHealthCheck
    learning: LearningHealthCheck
    knowledge: KnowledgeHealthCheck
    recommendations: RecommendationsHealthCheck
  }
}

// ─── Boss Intelligence Panel (AI Assistant) ───────────────────────────────────

export interface BossIntelligenceSummary {
  memoryCount: number
  signalCount: number
  recommendationCount: number
  awaitingReplies: number
  knowledgeDocuments: number
  isGoogleConnected: boolean
  hasGmailScope: boolean
  hasCalendarScope: boolean
  gmailLastSync: string | null
  calendarLastSync: string | null
}
