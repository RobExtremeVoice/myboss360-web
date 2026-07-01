import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type {
  AnalyzedThread,
  ExtractedParticipant,
  FollowUpPriority,
  ResponseStatus,
  ThreadHealth,
} from '@/types/google'
import type { PatternDetectionResult } from '@/services/intelligence/pattern-detector'
import { intelligenceConfig } from '@/config/intelligence'
import { createCompaniesRepository } from '@/repositories/crm/companies'
import { createContactsRepository } from '@/repositories/crm/contacts'
import { createGmailContactsRepository } from '@/repositories/google/gmail-contacts'
import { createGmailThreadsRepository } from '@/repositories/google/gmail-threads'
import { generateRecommendations } from '@/services/intelligence/recommendation-engine'
import { createLearningService } from '@/services/learning/learning-service'
import { createMemoryService } from '@/services/memory/memory-service'
import {
  extractOrganization,
  isPublicEmailProvider,
  normalizeBusinessDomain,
} from './gmail-contact-extractor'

type GmailContactRow = Database['public']['Tables']['gmail_contacts']['Row']
type GmailThreadRow = Database['public']['Tables']['gmail_threads']['Row']
type CompanyRow = Database['public']['Tables']['companies']['Row']

interface RelationshipParticipant {
  participant: ExtractedParticipant
  gmailContact: GmailContactRow
  crmContactId: string | null
}

interface RelationshipAnalysisResult {
  responseStatus: ResponseStatus
  conversationAgeDays: number
  threadHealth: ThreadHealth
  followUpRequired: boolean
  followUpDue: string | null
  daysWaiting: number | null
  followUpPriority: FollowUpPriority | null
  overdueDays: number | null
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function getObject(value: unknown): Record<string, unknown> {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
}

function toStartCase(value: string): string {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function daysSince(date: Date): number {
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 86_400_000))
}

function hoursSince(date: Date): number {
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 3_600_000))
}

function computeCompanyConfidence(participant: ExtractedParticipant, normalizedDomain: string): number {
  if (!normalizedDomain || isPublicEmailProvider(normalizedDomain)) {
    return 0
  }

  let score = 0.45

  if (participant.contact.organization) score += 0.2
  if (participant.contact.displayName) score += 0.1
  if (participant.contact.signatureHint) score += 0.1
  score += Math.min(0.15, participant.messageCount * 0.03)

  return Number(clamp(score, 0, 0.98).toFixed(2))
}

function pickCompanyLabel(
  participants: RelationshipParticipant[],
  analyzed: AnalyzedThread
): string {
  const companyContact = participants.find((entry) => entry.gmailContact.organization)
  if (companyContact?.gmailContact.organization) {
    return companyContact.gmailContact.organization
  }

  if (analyzed.subject) {
    return analyzed.subject
  }

  return 'email thread'
}

function analyzeThreadRelationship(analyzed: AnalyzedThread): RelationshipAnalysisResult {
  const firstMessage = analyzed.messages[0] ?? null
  const lastMessage = analyzed.messages[analyzed.messages.length - 1] ?? null

  if (!firstMessage || !lastMessage) {
    return {
      responseStatus: 'conversation_active',
      conversationAgeDays: 0,
      threadHealth: 'healthy',
      followUpRequired: false,
      followUpDue: null,
      daysWaiting: null,
      followUpPriority: null,
      overdueDays: null,
    }
  }

  const conversationAgeDays = daysSince(firstMessage.sentAt)
  const waitingHours = hoursSince(lastMessage.sentAt)
  const waitingDays = daysSince(lastMessage.sentAt)
  const isClosedByLabel = analyzed.labelIds.some((label) => label === 'TRASH' || label === 'SPAM')
  const hasInbound = analyzed.messages.some((message) => !message.isOutbound)
  const hasOutbound = analyzed.messages.some((message) => message.isOutbound)

  let responseStatus: ResponseStatus
  if (
    isClosedByLabel ||
    waitingDays >= intelligenceConfig.conversationClosedAfterDays
  ) {
    responseStatus = 'conversation_closed'
  } else if (
    hasInbound &&
    hasOutbound &&
    waitingHours <= intelligenceConfig.activeConversationWindowHours
  ) {
    responseStatus = 'conversation_active'
  } else if (lastMessage.isOutbound) {
    responseStatus = 'waiting_for_customer'
  } else {
    responseStatus = 'waiting_for_me'
  }

  const followUpRequired =
    responseStatus === 'waiting_for_me' || responseStatus === 'waiting_for_customer'

  let followUpDue: Date | null = null
  if (responseStatus === 'waiting_for_me') {
    followUpDue = new Date(
      lastMessage.sentAt.getTime() + intelligenceConfig.inboundReplySlaHours * 3_600_000
    )
  } else if (responseStatus === 'waiting_for_customer') {
    followUpDue = new Date(
      lastMessage.sentAt.getTime() + intelligenceConfig.outboundFollowUpSlaHours * 3_600_000
    )
  }

  const overdueDays =
    followUpRequired && followUpDue
      ? Math.max(0, Math.floor((Date.now() - followUpDue.getTime()) / 86_400_000))
      : null

  let followUpPriority: FollowUpPriority | null = null
  if (followUpRequired) {
    if (overdueDays !== null && overdueDays >= intelligenceConfig.criticalPriorityFollowUpDays) {
      followUpPriority = 'critical'
    } else if (overdueDays !== null && overdueDays >= intelligenceConfig.highPriorityFollowUpDays) {
      followUpPriority = 'high'
    } else if (overdueDays !== null && overdueDays > 0) {
      followUpPriority = 'medium'
    } else {
      followUpPriority = responseStatus === 'waiting_for_me' ? 'medium' : 'low'
    }
  }

  let threadHealth: ThreadHealth = 'healthy'
  if (responseStatus === 'conversation_closed') {
    threadHealth = 'closed'
  } else if (followUpPriority === 'critical') {
    threadHealth = 'critical'
  } else if (followUpPriority === 'high') {
    threadHealth = 'stale'
  } else if (followUpPriority === 'medium') {
    threadHealth = 'watch'
  }

  return {
    responseStatus,
    conversationAgeDays,
    threadHealth,
    followUpRequired,
    followUpDue: followUpDue?.toISOString() ?? null,
    daysWaiting: followUpRequired ? waitingDays : null,
    followUpPriority,
    overdueDays,
  }
}

function buildRecommendationResult(
  companyLabel: string,
  threadId: string,
  relationship: RelationshipAnalysisResult
): PatternDetectionResult {
  if (
    !relationship.followUpRequired ||
    relationship.responseStatus === 'conversation_closed' ||
    !relationship.followUpPriority ||
    !relationship.overdueDays ||
    relationship.overdueDays <= 0
  ) {
    return { patterns: [], recommendations: [] }
  }

  const waitingLabel =
    relationship.responseStatus === 'waiting_for_me'
      ? 'Reply to customer thread'
      : 'Follow up with customer thread'

  return {
    patterns: [],
    recommendations: [
      {
        title: `${waitingLabel}: ${companyLabel}`,
        description:
          relationship.responseStatus === 'waiting_for_me'
            ? `${companyLabel} has been waiting ${relationship.daysWaiting ?? 0} day(s) for a response. Review the thread and send the next reply.`
            : `${companyLabel} has not replied for ${relationship.daysWaiting ?? 0} day(s). Send a follow-up to keep the conversation moving.`,
        type: relationship.followUpPriority === 'critical' ? 'warning' : 'action',
        priority: relationship.followUpPriority,
        entityType: 'gmail_thread',
        entityId: threadId,
        actionLabel: 'Open thread',
      },
    ],
  }
}

export function createGmailRelationshipIntelligenceService(db: SupabaseClient<Database>) {
  const companiesRepo = createCompaniesRepository(db)
  const contactsRepo = createContactsRepository(db)
  const gmailContactsRepo = createGmailContactsRepository(db)
  const threadsRepo = createGmailThreadsRepository(db)
  const learningService = createLearningService(db)
  const memoryService = createMemoryService(db)

  return {
    async processThreadRelationship(params: {
      workspaceId: string
      organizationId: string
      userId: string
      threadRow: GmailThreadRow
      previousThread: GmailThreadRow | null
      analyzed: AnalyzedThread
      participants: RelationshipParticipant[]
    }): Promise<RelationshipAnalysisResult> {
      const {
        workspaceId,
        organizationId,
        userId,
        threadRow,
        previousThread,
        analyzed,
        participants,
      } = params

      const companyCache = new Map<string, CompanyRow | null>()

      for (const entry of participants) {
        const normalizedDomain = normalizeBusinessDomain(entry.participant.contact.domain)
        const companyConfidenceScore = computeCompanyConfidence(entry.participant, normalizedDomain)

        if (!normalizedDomain || isPublicEmailProvider(normalizedDomain)) {
          await gmailContactsRepo.update(entry.gmailContact.id, {
            normalized_domain: normalizedDomain || entry.participant.contact.domain,
            organization: null,
            crm_company_id: null,
            company_confidence_score: companyConfidenceScore,
          })
          continue
        }

        const organizationName =
          entry.participant.contact.organization ??
          extractOrganization(normalizedDomain) ??
          toStartCase(normalizedDomain.split('.')[0] ?? normalizedDomain)

        let company = companyCache.get(normalizedDomain)
        if (company === undefined) {
          company =
            (await companiesRepo.findByDomain(workspaceId, normalizedDomain)) ??
            (organizationName ? await companiesRepo.findByName(workspaceId, organizationName) : null)

          if (!company) {
            company = await companiesRepo.create({
              workspace_id: workspaceId,
              name: organizationName,
              domain: normalizedDomain,
              metadata: {
                source: 'gmail_relationship_intelligence',
                companyConfidenceScore,
              },
            })

            await memoryService.createMemory({
              workspaceId,
              organizationId,
              userId,
              type: 'observation',
              source: 'system',
              title: `Company inferred from email: ${company.name}`,
              content: `${entry.participant.contact.email} was linked to ${company.name} using the ${normalizedDomain} domain.`,
              entityType: 'company',
              entityId: company.id,
              confidence: companyConfidenceScore,
              metadata: {
                domain: normalizedDomain,
                source: 'gmail',
                gmailContactId: entry.gmailContact.id,
              },
            }).catch(() => null)
          } else if (!company.domain || company.domain !== normalizedDomain) {
            const updatedMetadata = {
              ...getObject(company.metadata),
              source: 'gmail_relationship_intelligence',
              companyConfidenceScore,
            }
            company = await companiesRepo.update(company.id, {
              domain: company.domain ?? normalizedDomain,
              metadata: updatedMetadata,
            })
          }

          companyCache.set(normalizedDomain, company)
        }

        if (!company) continue

        await gmailContactsRepo.update(entry.gmailContact.id, {
          normalized_domain: normalizedDomain,
          organization: organizationName,
          crm_company_id: company.id,
          company_confidence_score: companyConfidenceScore,
        })

        if (entry.crmContactId) {
          const crmContact = await contactsRepo.findById(entry.crmContactId)
          if (crmContact && !crmContact.company_id) {
            await contactsRepo.update(crmContact.id, { company_id: company.id })
          }
        }
      }

      const relationship = analyzeThreadRelationship(analyzed)

      await threadsRepo.update(threadRow.id, {
        response_status: relationship.responseStatus,
        conversation_age_days: relationship.conversationAgeDays,
        thread_health: relationship.threadHealth,
        follow_up_required: relationship.followUpRequired,
        follow_up_due: relationship.followUpDue,
        days_waiting: relationship.daysWaiting,
        follow_up_priority: relationship.followUpPriority,
      })

      const existingSignals = await learningService.listSignals(workspaceId, {
        signalType: 'follow_up_delay',
        entityType: 'gmail_thread',
        entityId: threadRow.id,
        resolved: false,
        limit: 5,
      })

      const shouldCreateSignal =
        relationship.followUpRequired &&
        relationship.overdueDays !== null &&
        relationship.overdueDays > 0

      const companyLabel = pickCompanyLabel(participants, analyzed)

      if (shouldCreateSignal) {
        const severity =
          relationship.followUpPriority === 'critical' ? 'critical' : 'warning'
        const description =
          relationship.responseStatus === 'waiting_for_me'
            ? `${companyLabel} has been waiting ${relationship.daysWaiting ?? 0} day(s) for a reply.`
            : `${companyLabel} has not replied for ${relationship.daysWaiting ?? 0} day(s) after the last outbound message.`

        const signalData = {
          threadId: threadRow.id,
          subject: analyzed.subject,
          responseStatus: relationship.responseStatus,
          followUpDue: relationship.followUpDue,
          daysWaiting: relationship.daysWaiting,
          followUpPriority: relationship.followUpPriority,
          threadHealth: relationship.threadHealth,
        }

        if (existingSignals[0]) {
          await learningService.updateSignal(existingSignals[0].id, {
            severity,
            title: `Follow-up overdue: ${companyLabel}`,
            description,
            data: signalData,
          })
        } else {
          await learningService.createLearningSignal({
            workspaceId,
            organizationId,
            signalType: 'follow_up_delay',
            entityType: 'gmail_thread',
            entityId: threadRow.id,
            severity,
            title: `Follow-up overdue: ${companyLabel}`,
            description,
            data: signalData,
          })
        }

        if (previousThread?.follow_up_priority !== 'critical' && relationship.followUpPriority === 'critical') {
          await memoryService.createMemory({
            workspaceId,
            organizationId,
            userId,
            type: 'observation',
            source: 'system',
            title: `Critical follow-up risk: ${companyLabel}`,
            content: description,
            entityType: 'workspace',
            entityId: workspaceId,
            confidence: 0.88,
            metadata: signalData,
          }).catch(() => null)
        }
      } else {
        await Promise.all(
          existingSignals.map((signal) => learningService.resolveSignal(signal.id).catch(() => null))
        )
      }

      await learningService.detectPatterns(workspaceId, organizationId).catch(() => null)

      const recommendationResult = buildRecommendationResult(
        companyLabel,
        threadRow.id,
        relationship
      )

      if (recommendationResult.recommendations.length > 0) {
        await generateRecommendations(
          workspaceId,
          organizationId,
          recommendationResult,
          learningService,
          { userId }
        ).catch(() => null)
      }

      return relationship
    },
  }
}

export type GmailRelationshipIntelligenceService = ReturnType<
  typeof createGmailRelationshipIntelligenceService
>
