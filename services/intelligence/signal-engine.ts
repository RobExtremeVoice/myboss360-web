import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { LearningService } from '@/services/learning/learning-service'
import { intelligenceConfig, signalTitles } from '@/config/intelligence'
import { createIntelligenceRepository } from '@/repositories/intelligence'

type DealRow = Database['public']['Tables']['deals']['Row']
type TaskRow = Database['public']['Tables']['tasks']['Row']
type ProjectRow = Database['public']['Tables']['projects']['Row']

function daysSince(isoDate: string): number {
  return Math.floor((Date.now() - new Date(isoDate).getTime()) / 86_400_000)
}

function daysUntil(isoDate: string): number {
  return Math.floor((new Date(isoDate).getTime() - Date.now()) / 86_400_000)
}

// Evaluate a single deal and emit signals if warranted.
// Returns true if a signal was emitted.
export async function emitDealSignals(
  deal: DealRow,
  workspaceId: string,
  organizationId: string,
  learningService: LearningService
): Promise<boolean> {
  if (intelligenceConfig.terminalDealStages.includes(deal.stage)) return false

  let emitted = false

  // Signal: deal approaching close date with late stage
  if (deal.expected_close_date) {
    const days = daysUntil(deal.expected_close_date)
    const isApproaching = days >= 0 && days <= intelligenceConfig.dealRiskDaysToClose
    const isLateStage = intelligenceConfig.pipelineRiskStages.includes(deal.stage)
    const isLowProb =
      deal.probability !== null &&
      deal.probability < intelligenceConfig.dealLowProbabilityThreshold

    if (isApproaching || (isLateStage && isLowProb)) {
      await learningService.createLearningSignal({
        workspaceId,
        organizationId,
        signalType: 'deal_risk',
        entityType: 'deal',
        entityId: deal.id,
        severity: days <= 3 ? 'critical' : days <= 7 ? 'warning' : 'info',
        title: signalTitles.deal_risk,
        description: `Deal "${deal.title}" in ${deal.stage} stage closes in ${days} days${deal.probability !== null ? ` with ${deal.probability}% probability` : ''}.`,
        data: {
          dealTitle: deal.title,
          stage: deal.stage,
          daysToClose: days,
          probability: deal.probability,
          value: deal.value,
        },
      })
      emitted = true
    }
  }

  return emitted
}

// Evaluate a single task and emit signals if warranted.
export async function emitTaskSignals(
  task: TaskRow,
  workspaceId: string,
  organizationId: string,
  learningService: LearningService
): Promise<boolean> {
  if (!intelligenceConfig.activeTaskStatuses.includes(task.status)) return false
  if (!task.due_date) return false

  const daysOverdue = daysSince(task.due_date)
  if (daysOverdue < intelligenceConfig.taskOverdueThresholdDays) return false

  await learningService.createLearningSignal({
    workspaceId,
    organizationId,
    signalType: 'task_delay',
    entityType: 'task',
    entityId: task.id,
    severity: daysOverdue >= 7 ? 'critical' : daysOverdue >= 3 ? 'warning' : 'info',
    title: signalTitles.task_delay,
    description: `Task "${task.title}" is ${daysOverdue} day${daysOverdue === 1 ? '' : 's'} overdue.`,
    data: {
      taskTitle: task.title,
      status: task.status,
      priority: task.priority,
      daysOverdue,
      projectId: task.project_id,
    },
  })
  return true
}

// Evaluate a single project and emit signals if warranted.
export async function emitProjectSignals(
  project: ProjectRow,
  workspaceId: string,
  organizationId: string,
  learningService: LearningService
): Promise<boolean> {
  const isAtRisk = intelligenceConfig.atRiskProjectStatuses.includes(project.status)
  if (!isAtRisk) return false

  const daysUntilDue = project.due_date ? daysUntil(project.due_date) : null

  await learningService.createLearningSignal({
    workspaceId,
    organizationId,
    signalType: 'recurring_bottleneck',
    entityType: 'project',
    entityId: project.id,
    severity: daysUntilDue !== null && daysUntilDue <= 7 ? 'critical' : 'warning',
    title: signalTitles.recurring_bottleneck,
    description: `Project "${project.name}" is flagged as at-risk${daysUntilDue !== null ? ` with ${daysUntilDue} days until due date` : ''}.`,
    data: {
      projectName: project.name,
      status: project.status,
      priority: project.priority,
      daysUntilDue,
    },
  })
  return true
}

// Full workspace scan — runs all signal checks against current database state.
// Intended for scheduled background use, not per-request.
export async function scanWorkspaceSignals(
  workspaceId: string,
  organizationId: string,
  db: SupabaseClient<Database>,
  learningService: LearningService
): Promise<{ signalsEmitted: number }> {
  const repo = createIntelligenceRepository(db)
  const snapshot = await repo.getWorkspaceSnapshot(workspaceId)

  let signalsEmitted = 0

  const dealResults = await Promise.all(
    snapshot.atRiskDeals.map((d) =>
      emitDealSignals(d, workspaceId, organizationId, learningService)
    )
  )
  signalsEmitted += dealResults.filter(Boolean).length

  const taskResults = await Promise.all(
    snapshot.overdueTasks.map((t) =>
      emitTaskSignals(t, workspaceId, organizationId, learningService)
    )
  )
  signalsEmitted += taskResults.filter(Boolean).length

  const projectResults = await Promise.all(
    snapshot.atRiskProjects.map((p) =>
      emitProjectSignals(p, workspaceId, organizationId, learningService)
    )
  )
  signalsEmitted += projectResults.filter(Boolean).length

  // Emit a performance_trend signal if there are many overdue tasks
  const overdueCount = snapshot.overdueTasks.length
  if (overdueCount >= 5) {
    await learningService.createLearningSignal({
      workspaceId,
      organizationId,
      signalType: 'performance_trend',
      entityType: 'workspace',
      entityId: workspaceId,
      severity: overdueCount >= 10 ? 'critical' : 'warning',
      title: signalTitles.performance_trend,
      description: `${overdueCount} tasks are overdue across the workspace, indicating a capacity or prioritization issue.`,
      data: { overdueCount },
    })
    signalsEmitted++
  }

  return { signalsEmitted }
}
