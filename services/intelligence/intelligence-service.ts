import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { IntelligenceContext } from '@/types/intelligence'
import { createIntelligenceRepository } from '@/repositories/intelligence'
import { createLearningService } from '@/services/learning/learning-service'
import { createMemoryService } from '@/services/memory/memory-service'
import { createWorkspacesRepository } from '@/repositories/workspaces'
import { createPeopleService } from '@/services/people/people-service'
import { intelligenceConfig } from '@/config/intelligence'
import { extractTopOpportunities, extractTopRisks } from './recommendation-engine'
import { peopleConfig } from '@/config/people'

type GmailThreadRow = Database['public']['Tables']['gmail_threads']['Row']
type GmailContactRow = Database['public']['Tables']['gmail_contacts']['Row']
type CrmEmailLinkRow = Database['public']['Tables']['crm_email_links']['Row']

function toEmailThread(row: GmailThreadRow) {
  return {
    id: row.id,
    threadId: row.thread_id,
    subject: row.subject,
    priorityScore: row.priority_score,
    priorityLabel: row.priority_label,
    responseStatus: row.response_status,
    followUpRequired: row.follow_up_required,
    followUpDue: row.follow_up_due,
    daysWaiting: row.days_waiting,
    latestReplyAt: row.latest_reply_at,
    participantEmails: row.participant_emails,
  }
}

function sortThreads(rows: GmailThreadRow[]) {
  return rows.sort((a, b) => {
    if (b.priority_score !== a.priority_score) return b.priority_score - a.priority_score
    return new Date(b.latest_reply_at ?? b.updated_at).getTime() - new Date(a.latest_reply_at ?? a.updated_at).getTime()
  })
}

export function createIntelligenceService(db: SupabaseClient<Database>) {
  const intelligenceRepo = createIntelligenceRepository(db)
  const learningService = createLearningService(db)
  const memoryService = createMemoryService(db)
  const workspacesRepo = createWorkspacesRepository(db)
  const peopleService = createPeopleService(db)

  return {
    // Assembles the full executive intelligence context for a workspace.
    // Called by the /api/intelligence/context route.
    async getIntelligenceContext(
      userId: string,
      workspaceId?: string
    ): Promise<IntelligenceContext | null> {
      // Resolve workspace
      const workspaces = await workspacesRepo.listForUser(userId)
      if (workspaces.length === 0) return null

      const workspace =
        (workspaceId ? workspaces.find((w) => w.id === workspaceId) : null) ?? workspaces[0]

      const organizationId = workspace.organization_id

      // Fetch all intelligence data in parallel
      const [
        snapshot,
        executiveContext,
        activeRecommendations,
        recentSignals,
        criticalThreadRows,
        highThreadRows,
        awaitingReplyRows,
        overdueFollowUpRows,
        topSenderRows,
        dealLinkRows,
        allPeopleProfiles,
      ] =
        await Promise.all([
          intelligenceRepo.getWorkspaceSnapshot(workspace.id),
          memoryService.getExecutiveContext(workspace.id, organizationId),
          learningService.listRecommendations(workspace.id, {
            status: 'pending',
            limit: intelligenceConfig.maxTopOpportunities * 2,
          }),
          learningService
            .listPatterns(workspace.id)
            .then(() =>
              // listPatterns returns patterns; signals come via learning service too
              db
                .from('learning_signals')
                .select('*')
                .eq('workspace_id', workspace.id)
                .is('resolved_at', null)
                .order('detected_at', { ascending: false })
                .limit(intelligenceConfig.maxRecentSignals)
                .then(({ data }) => data ?? [])
            ),
          db
            .from('gmail_threads')
            .select('*')
            .eq('workspace_id', workspace.id)
            .eq('priority_label', 'critical')
            .order('priority_score', { ascending: false })
            .limit(5)
            .then(({ data }) => data ?? []),
          db
            .from('gmail_threads')
            .select('*')
            .eq('workspace_id', workspace.id)
            .eq('priority_label', 'high')
            .order('priority_score', { ascending: false })
            .limit(8)
            .then(({ data }) => data ?? []),
          db
            .from('gmail_threads')
            .select('*')
            .eq('workspace_id', workspace.id)
            .eq('response_status', 'waiting_for_me')
            .order('priority_score', { ascending: false })
            .limit(8)
            .then(({ data }) => data ?? []),
          db
            .from('gmail_threads')
            .select('*')
            .eq('workspace_id', workspace.id)
            .eq('follow_up_required', true)
            .not('follow_up_due', 'is', null)
            .lt('follow_up_due', new Date().toISOString())
            .order('priority_score', { ascending: false })
            .limit(8)
            .then(({ data }) => data ?? []),
          db
            .from('gmail_contacts')
            .select('*')
            .eq('workspace_id', workspace.id)
            .order('message_count', { ascending: false })
            .limit(5)
            .then(({ data }) => data ?? []),
          db
            .from('crm_email_links')
            .select('*')
            .eq('workspace_id', workspace.id)
            .eq('entity_type', 'deal')
            .order('confidence_score', { ascending: false })
            .limit(10)
            .then(({ data }) => data ?? []),
          peopleService
            .getProfiles(workspace.id, organizationId, null)
            .catch(() => []),
        ])

      const topRisks = extractTopRisks(activeRecommendations)
      const topOpportunities = extractTopOpportunities(activeRecommendations)

      // Map signal rows to LearningSignal application type
      const learningSignals = recentSignals.map((row) => ({
        id: row.id,
        workspaceId: row.workspace_id,
        organizationId: row.organization_id,
        signalType: row.signal_type as never,
        entityType: row.entity_type,
        entityId: row.entity_id,
        severity: row.severity as never,
        confidence: Number(row.confidence ?? 0.5),
        title: row.title,
        description: row.description,
        data: (row.data as Record<string, unknown>) ?? {},
        metadata: (row.metadata as Record<string, unknown>) ?? {},
        detectedAt: row.detected_at,
        resolvedAt: row.resolved_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }))

      const dealThreadIds = [...new Set((dealLinkRows as CrmEmailLinkRow[]).map((row) => row.gmail_thread_id))]
      const dealThreadRows = dealThreadIds.length > 0
        ? await db
            .from('gmail_threads')
            .select('*')
            .eq('workspace_id', workspace.id)
            .in('id', dealThreadIds)
            .then(({ data }) => data ?? [])
        : []

      const emailIntelligence = {
        criticalThreads: sortThreads(criticalThreadRows as GmailThreadRow[]).map(toEmailThread),
        highPriorityThreads: sortThreads(highThreadRows as GmailThreadRow[]).map(toEmailThread),
        awaitingReplies: sortThreads(awaitingReplyRows as GmailThreadRow[]).map(toEmailThread),
        overdueFollowUps: sortThreads(overdueFollowUpRows as GmailThreadRow[]).map(toEmailThread),
        dealRelatedThreads: sortThreads(dealThreadRows as GmailThreadRow[]).map(toEmailThread),
        topSenders: (topSenderRows as GmailContactRow[]).map((row) => ({
          email: row.email,
          displayName: row.display_name,
          organization: row.organization,
          messageCount: row.message_count,
        })),
        newRelationships: learningSignals
          .filter((signal) => signal.signalType === 'new_relationship')
          .slice(0, 8),
      }

      const N = peopleConfig.maxPeoplePerCategory
      const byStrengthDesc = [...allPeopleProfiles].sort(
        (a, b) => b.relationshipStrength - a.relationshipStrength
      )
      const peopleIntelligence = {
        topRelationships: byStrengthDesc
          .filter((p) => p.emailCount >= peopleConfig.minEmailsForTopRelationship)
          .slice(0, N),
        staleRelationships: allPeopleProfiles.filter((p) => p.isStale).slice(0, N),
        newRelationships: allPeopleProfiles.filter((p) => p.isNewRelationship).slice(0, N),
        champions: allPeopleProfiles.filter((p) => p.isChampion).slice(0, N),
        decisionMakers: allPeopleProfiles.filter((p) => p.isDecisionMaker).slice(0, N),
        awaitingReply: allPeopleProfiles.filter((p) => p.awaitingReply).slice(0, N),
        needingFollowUp: allPeopleProfiles.filter((p) => p.followUpRequired).slice(0, N),
      }

      return {
        workspaceId: workspace.id,
        organizationId,
        executiveMetrics: snapshot.executiveMetrics,
        recentMemories: executiveContext.memories,
        activeRecommendations,
        learningSignals,
        topRisks,
        topOpportunities,
        todayAgenda: snapshot.todayAgenda,
        importantTasks: snapshot.importantTasks,
        emailIntelligence,
        peopleIntelligence,
        generatedAt: new Date().toISOString(),
      }
    },
  }
}

export type IntelligenceService = ReturnType<typeof createIntelligenceService>
