import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { intelligenceConfig } from '@/config/intelligence'
import type {
  ExecutiveMetrics,
  ImportantTask,
  TodayAgendaItem,
} from '@/types/intelligence'

type DealRow = Database['public']['Tables']['deals']['Row']
type TaskRow = Database['public']['Tables']['tasks']['Row']
type ProjectRow = Database['public']['Tables']['projects']['Row']

export interface PipelineStats {
  totalValue: number
  activeCount: number
  atRiskCount: number
  closedWonThisMonth: number
  closedWonValueThisMonth: number
  avgAgedays: number
  atRiskDeals: DealRow[]
}

export interface WorkspaceSnapshot {
  executiveMetrics: ExecutiveMetrics
  pipelineStats: PipelineStats
  importantTasks: ImportantTask[]
  todayAgenda: TodayAgendaItem[]
  atRiskDeals: DealRow[]
  atRiskProjects: ProjectRow[]
  overdueTasks: TaskRow[]
  staleContactIds: string[]
}

function daysBetween(a: string, b: Date): number {
  return Math.floor((new Date(a).getTime() - b.getTime()) / 86_400_000)
}

export function createIntelligenceRepository(db: SupabaseClient<Database>) {
  return {
    async getWorkspaceSnapshot(workspaceId: string): Promise<WorkspaceSnapshot> {
      const now = new Date()
      const nowIso = now.toISOString()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()
      const staleContactCutoff = new Date(now.getTime() - intelligenceConfig.staleContactDays * 86_400_000).toISOString()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

      const [
        { data: allDeals },
        { data: overdueTasks },
        { data: atRiskProjects },
        { data: upcomingMeetings },
        { data: todayEvents },
        { data: urgentTasks },
        { data: staleActivities },
      ] = await Promise.all([
        db.from('deals')
          .select('*')
          .eq('workspace_id', workspaceId)
          .is('deleted_at', null),
        db.from('tasks')
          .select('*')
          .eq('workspace_id', workspaceId)
          .is('deleted_at', null)
          .in('status', intelligenceConfig.activeTaskStatuses)
          .not('due_date', 'is', null)
          .lt('due_date', nowIso)
          .order('due_date', { ascending: true })
          .limit(50),
        db.from('projects')
          .select('*')
          .eq('workspace_id', workspaceId)
          .is('deleted_at', null)
          .in('status', intelligenceConfig.atRiskProjectStatuses),
        db.from('calendar_events')
          .select('id')
          .eq('workspace_id', workspaceId)
          .is('deleted_at', null)
          .gte('start_at', nowIso)
          .limit(20),
        db.from('calendar_events')
          .select('*')
          .eq('workspace_id', workspaceId)
          .is('deleted_at', null)
          .gte('start_at', todayStart)
          .lt('start_at', todayEnd)
          .order('start_at', { ascending: true })
          .limit(intelligenceConfig.maxTodayAgendaItems),
        db.from('tasks')
          .select('*')
          .eq('workspace_id', workspaceId)
          .is('deleted_at', null)
          .in('status', intelligenceConfig.activeTaskStatuses)
          .in('priority', ['urgent', 'high'])
          .order('due_date', { ascending: true, nullsFirst: false })
          .limit(intelligenceConfig.maxImportantTasks),
        db.from('activities')
          .select('company_id, contact_id, occurred_at')
          .eq('workspace_id', workspaceId)
          .gte('occurred_at', staleContactCutoff),
      ])

      const deals = allDeals ?? []
      const activeDeals = deals.filter(
        (d) => !intelligenceConfig.terminalDealStages.includes(d.stage)
      )
      const closedWon = deals.filter(
        (d) => d.stage === 'closed_won' && d.updated_at >= monthStart
      )

      const atRiskDeals = activeDeals.filter((d) => {
        if (!d.expected_close_date) return false
        const daysToClose = daysBetween(d.expected_close_date, now)
        const isApproachingClose = daysToClose >= 0 && daysToClose <= intelligenceConfig.dealRiskDaysToClose
        const isLateStage = intelligenceConfig.pipelineRiskStages.includes(d.stage)
        const isLowProbability =
          d.probability !== null && d.probability < intelligenceConfig.dealLowProbabilityThreshold
        return isApproachingClose || (isLateStage && isLowProbability)
      })

      const totalValue = activeDeals.reduce((sum, d) => sum + Number(d.value ?? 0), 0)
      const totalAge = activeDeals.reduce((sum, d) => {
        return sum + Math.abs(daysBetween(d.created_at, now))
      }, 0)

      // Contacts active recently (has activity)
      const recentlyActiveContactIds = new Set<string>()
      for (const a of staleActivities ?? []) {
        if (a.contact_id) recentlyActiveContactIds.add(a.contact_id)
      }

      // We approximate stale contacts by counting contacts with no recent activity
      // The actual contact list query is omitted to avoid a large join; we signal by count only
      const staleContactIds: string[] = [] // populated by signal engine on demand

      const pipelineStats: PipelineStats = {
        totalValue,
        activeCount: activeDeals.length,
        atRiskCount: atRiskDeals.length,
        closedWonThisMonth: closedWon.length,
        closedWonValueThisMonth: closedWon.reduce((s, d) => s + Number(d.value ?? 0), 0),
        avgAgedays: activeDeals.length > 0 ? Math.round(totalAge / activeDeals.length) : 0,
        atRiskDeals,
      }

      const importantTasks: ImportantTask[] = (urgentTasks ?? []).map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        dueDate: t.due_date,
        assignedTo: t.assigned_to,
        isOverdue: t.due_date !== null && t.due_date < nowIso,
        projectId: t.project_id,
      }))

      const todayAgenda: TodayAgendaItem[] = (todayEvents ?? []).map((e) => ({
        id: e.id,
        title: e.title,
        startAt: e.start_at,
        endAt: e.end_at,
        type: 'meeting' as const,
        location: e.location,
      }))

      const executiveMetrics: ExecutiveMetrics = {
        totalPipelineValue: totalValue,
        activeDeals: activeDeals.length,
        overdueTasksCount: (overdueTasks ?? []).length,
        atRiskDealsCount: atRiskDeals.length,
        atRiskProjectsCount: (atRiskProjects ?? []).length,
        staleContactsCount: 0,
        upcomingMeetingsCount: (upcomingMeetings ?? []).length,
        avgDealAgedays: pipelineStats.avgAgedays,
        closedWonThisMonth: closedWon.length,
        closedWonValueThisMonth: pipelineStats.closedWonValueThisMonth,
      }

      return {
        executiveMetrics,
        pipelineStats,
        importantTasks,
        todayAgenda,
        atRiskDeals,
        atRiskProjects: atRiskProjects ?? [],
        overdueTasks: overdueTasks ?? [],
        staleContactIds,
      }
    },
  }
}

export type IntelligenceRepository = ReturnType<typeof createIntelligenceRepository>
