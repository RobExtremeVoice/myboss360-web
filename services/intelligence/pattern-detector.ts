import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { LearningService } from '@/services/learning/learning-service'
import type { DetectedPattern } from '@/types/learning'
import { daysSince } from '@/lib/dates'

// Sophisticated pattern detection — detects patterns from raw database queries
// rather than just grouping existing signals. Complements the basic
// learning-service detectPatterns() which operates on signal aggregation.

export interface PatternDetectionResult {
  patterns: DetectedPattern[]
  recommendations: Array<{
    title: string
    description: string
    type: 'action' | 'insight' | 'warning' | 'opportunity'
    priority: 'low' | 'medium' | 'high' | 'critical'
    entityType?: string
    entityId?: string
    actionLabel?: string
  }>
}

export async function detectAdvancedPatterns(
  workspaceId: string,
  organizationId: string,
  db: SupabaseClient<Database>,
  learningService: LearningService
): Promise<PatternDetectionResult> {
  const nowIso = new Date().toISOString()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString()
  const sixtyDaysAgo = new Date(Date.now() - 60 * 86_400_000).toISOString()

  const [
    { data: recentDeals },
    { data: overdueTasks },
    { data: recentActivities },
    { data: allContacts },
  ] = await Promise.all([
    db.from('deals')
      .select('id, stage, value, probability, created_at, updated_at, expected_close_date')
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null)
      .gte('created_at', sixtyDaysAgo),
    db.from('tasks')
      .select('id, status, priority, due_date, project_id')
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null)
      .in('status', ['todo', 'in-progress', 'blocked'])
      .not('due_date', 'is', null)
      .lt('due_date', nowIso),
    db.from('activities')
      .select('id, type, contact_id, deal_id, occurred_at')
      .eq('workspace_id', workspaceId)
      .gte('occurred_at', thirtyDaysAgo)
      .order('occurred_at', { ascending: false }),
    db.from('contacts')
      .select('id, created_at')
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null),
  ])

  const patterns: DetectedPattern[] = []
  const recommendations: PatternDetectionResult['recommendations'] = []

  // Pattern 1: Pipeline stalling — deals not updated in 14+ days in mid-stage
  const stalledDeals = (recentDeals ?? []).filter((d) => {
    if (['closed_won', 'closed_lost'].includes(d.stage)) return false
    return (daysSince(d.updated_at) ?? 0) >= 14
  })
  if (stalledDeals.length >= 2) {
    const confidence = Math.min(0.95, 0.6 + (stalledDeals.length - 2) * 0.05)
    patterns.push({
      patternType: 'sales',
      name: 'pipeline stalling — deal',
      description: `${stalledDeals.length} deals have not been updated in 14+ days, indicating pipeline stagnation.`,
      confidence,
      data: { count: stalledDeals.length, dealIds: stalledDeals.map((d) => d.id) },
      relatedSignalIds: [],
    })
    if (stalledDeals.length >= 3) {
      recommendations.push({
        title: 'Review stalled pipeline deals',
        description: `${stalledDeals.length} deals have gone stale. Review and either advance or disqualify each one to keep the pipeline healthy.`,
        type: 'action',
        priority: 'high',
        entityType: 'workspace',
        entityId: workspaceId,
        actionLabel: 'View CRM pipeline',
      })
    }
  }

  // Pattern 2: Task overload — more than 5 overdue tasks in a workspace
  const overdueCount = (overdueTasks ?? []).length
  if (overdueCount >= 3) {
    const confidence = Math.min(0.95, 0.6 + (overdueCount - 3) * 0.04)
    patterns.push({
      patternType: 'task_completion',
      name: 'task_delay — task',
      description: `${overdueCount} tasks are past their due date, indicating capacity or prioritization pressure.`,
      confidence,
      data: { overdueCount },
      relatedSignalIds: [],
    })
    recommendations.push({
      title: `Address ${overdueCount} overdue tasks`,
      description: 'Overdue tasks are piling up. Reassign, reschedule, or close tasks that are no longer relevant.',
      type: 'warning',
      priority: overdueCount >= 8 ? 'critical' : 'high',
      entityType: 'workspace',
      entityId: workspaceId,
      actionLabel: 'View tasks',
    })
  }

  // Pattern 3: Follow-up gap — contacts added recently with no activity
  const recentContactIds = new Set((allContacts ?? []).filter((c) => (daysSince(c.created_at) ?? Infinity) <= 30).map((c) => c.id))
  const contactsWithActivity = new Set(
    (recentActivities ?? []).filter((a) => a.contact_id).map((a) => a.contact_id as string)
  )
  const contactsWithNoFollowUp = [...recentContactIds].filter((id) => !contactsWithActivity.has(id))
  if (contactsWithNoFollowUp.length >= 3) {
    const confidence = Math.min(0.9, 0.6 + contactsWithNoFollowUp.length * 0.03)
    patterns.push({
      patternType: 'follow_up',
      name: 'follow_up_delay — contact',
      description: `${contactsWithNoFollowUp.length} contacts added in the last 30 days have received no follow-up activity.`,
      confidence,
      data: { count: contactsWithNoFollowUp.length },
      relatedSignalIds: [],
    })
    recommendations.push({
      title: 'Follow up with new contacts',
      description: `${contactsWithNoFollowUp.length} recently added contacts have not been engaged. Schedule follow-up activities before they go cold.`,
      type: 'opportunity',
      priority: 'medium',
      entityType: 'workspace',
      entityId: workspaceId,
      actionLabel: 'View contacts',
    })
  }

  // Pattern 4: Revenue trend — closed won deals this month vs last month
  const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
  const lastMonthStart = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString()
  const dealsThisMonth = (recentDeals ?? []).filter(
    (d) => d.stage === 'closed_won' && d.updated_at >= thisMonthStart
  )
  const dealsLastMonth = (recentDeals ?? []).filter(
    (d) => d.stage === 'closed_won' && d.updated_at >= lastMonthStart && d.updated_at < thisMonthStart
  )
  const thisMonthValue = dealsThisMonth.reduce((s, d) => s + Number(d.value ?? 0), 0)
  const lastMonthValue = dealsLastMonth.reduce((s, d) => s + Number(d.value ?? 0), 0)

  if (lastMonthValue > 0 && thisMonthValue < lastMonthValue * 0.7) {
    patterns.push({
      patternType: 'performance',
      name: 'performance_trend — workspace',
      description: `Revenue closed this month ($${Math.round(thisMonthValue).toLocaleString()}) is down from last month ($${Math.round(lastMonthValue).toLocaleString()}).`,
      confidence: 0.75,
      data: { thisMonthValue, lastMonthValue, dropPercent: Math.round((1 - thisMonthValue / lastMonthValue) * 100) },
      relatedSignalIds: [],
    })
    recommendations.push({
      title: 'Revenue trending down — action required',
      description: `Closed revenue is down compared to last month. Review the pipeline and accelerate high-probability deals.`,
      type: 'warning',
      priority: 'critical',
      entityType: 'workspace',
      entityId: workspaceId,
      actionLabel: 'View pipeline',
    })
  }

  // Persist detected patterns into learning engine via signal-based aggregation
  if (patterns.length > 0) {
    await learningService.detectPatterns(workspaceId, organizationId).catch(() => null)
  }

  return { patterns, recommendations }
}
