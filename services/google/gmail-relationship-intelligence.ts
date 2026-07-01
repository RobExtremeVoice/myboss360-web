import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, InsertTables } from '@/types/database'
import type { SignalSeverity, SignalType } from '@/types/learning'
import type {
  AnalyzedThread,
  CrmEmailLinkEntityType,
  ExtractedParticipant,
  FollowUpPriority,
  PriorityLabel,
  ResponseStatus,
  ThreadHealth,
} from '@/types/google'
import type { PatternDetectionResult } from '@/services/intelligence/pattern-detector'
import { intelligenceConfig } from '@/config/intelligence'
import { clamp, daysSinceDate } from '@/lib/dates'
import { createCompaniesRepository } from '@/repositories/crm/companies'
import { createContactsRepository } from '@/repositories/crm/contacts'
import { createDealsRepository } from '@/repositories/crm/deals'
import { createCrmEmailLinksRepository } from '@/repositories/google/crm-email-links'
import { createGmailContactsRepository } from '@/repositories/google/gmail-contacts'
import { createGmailThreadsRepository } from '@/repositories/google/gmail-threads'
import { createGmailKnowledgeIngestionService } from './gmail-knowledge-ingestion'
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
type ContactRow = Database['public']['Tables']['contacts']['Row']
type DealRow = Database['public']['Tables']['deals']['Row']

const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'the',
  'for',
  'with',
  'from',
  'your',
  'our',
  'this',
  'that',
  'about',
  'into',
  'onto',
  'regarding',
  'update',
  'follow',
  'email',
  'thread',
])

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

interface CrmLinkCandidate {
  entityType: CrmEmailLinkEntityType
  entityId: string
  confidenceScore: number
  matchReasons: string[]
}

interface PriorityScoreResult {
  priorityScore: number
  priorityLabel: PriorityLabel
}

interface ThreadSignalDefinition {
  enabled: boolean
  signalType: SignalType
  severity: SignalSeverity
  confidence: number
  title: string
  description: string
}

interface ThreadRelationshipResult extends RelationshipAnalysisResult, PriorityScoreResult {
  crmLinks: CrmLinkCandidate[]
}

interface NewRelationshipEvent {
  entityType: 'company' | 'contact'
  entityId: string
  title: string
  content: string
  confidence: number
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
  return Math.max(0, Math.floor(daysSinceDate(date)))
}

function hoursSince(date: Date): number {
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 3_600_000))
}

function normalizeText(value: string | null | undefined): string {
  return (value ?? '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
}

function tokenize(value: string): string[] {
  return normalizeText(value)
    .split(' ')
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token))
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
  if (isClosedByLabel || waitingDays >= intelligenceConfig.conversationClosedAfterDays) {
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

function buildThreadCorpus(analyzed: AnalyzedThread): string {
  const parts = [
    analyzed.subject,
    analyzed.snippet,
    ...analyzed.messages.flatMap((message) => [
      message.subject,
      message.snippet,
      message.bodyText,
      ...message.attachmentNames,
    ]),
  ]
  return normalizeText(parts.filter(Boolean).join(' '))
}

function countKeywordMatches(text: string, keywords: string[]): number {
  return keywords.filter((keyword) => text.includes(keyword)).length
}

function mergeLinkCandidate(map: Map<string, CrmLinkCandidate>, candidate: CrmLinkCandidate) {
  const key = `${candidate.entityType}:${candidate.entityId}`
  const existing = map.get(key)

  if (!existing) {
    map.set(key, {
      ...candidate,
      confidenceScore: Number(clamp(candidate.confidenceScore, 0, 0.98).toFixed(2)),
      matchReasons: [...new Set(candidate.matchReasons)],
    })
    return
  }

  map.set(key, {
    ...existing,
    confidenceScore: Number(clamp(Math.max(existing.confidenceScore, candidate.confidenceScore), 0, 0.98).toFixed(2)),
    matchReasons: [...new Set([...existing.matchReasons, ...candidate.matchReasons])],
  })
}

function hasDirectQuestion(analyzed: AnalyzedThread, corpus: string): boolean {
  const lastMessage = analyzed.messages[analyzed.messages.length - 1]
  if (!lastMessage) return false

  if ((lastMessage.bodyText ?? '').includes('?') || (lastMessage.snippet ?? '').includes('?')) {
    return true
  }

  return intelligenceConfig.priorityDirectQuestionKeywords.some((keyword) => corpus.includes(keyword))
}

function matchDealByText(corpus: string, deal: DealRow): {
  score: number
  reasons: string[]
  exactTitleMatch: boolean
} {
  const titleText = normalizeText(deal.title)
  const titleTokens = tokenize(deal.title)
  const corpusTokens = new Set(tokenize(corpus))

  let score = 0
  const reasons: string[] = []
  const exactTitleMatch = titleText.length >= 6 && corpus.includes(titleText)

  if (exactTitleMatch) {
    score += 0.38
    reasons.push('subject_body_exact_deal_title_match')
  } else if (titleTokens.length > 0) {
    const overlap = titleTokens.filter((token) => corpusTokens.has(token)).length / titleTokens.length

    if (overlap >= 0.75) {
      score += 0.28
      reasons.push('subject_body_strong_deal_keyword_match')
    } else if (overlap >= 0.5) {
      score += 0.18
      reasons.push('subject_body_partial_deal_keyword_match')
    }
  }

  return { score, reasons, exactTitleMatch }
}

function calculatePriorityScore(params: {
  analyzed: AnalyzedThread
  relationship: RelationshipAnalysisResult
  participants: RelationshipParticipant[]
  crmLinks: CrmLinkCandidate[]
  linkedDeals: DealRow[]
}): PriorityScoreResult {
  const { analyzed, relationship, participants, crmLinks, linkedDeals } = params

  const corpus = buildThreadCorpus(analyzed)
  const latestMessage = analyzed.messages[analyzed.messages.length - 1] ?? null
  const latestAgeHours = latestMessage ? hoursSince(latestMessage.sentAt) : 9999
  const urgencyMatches = countKeywordMatches(corpus, intelligenceConfig.priorityUrgencyKeywords)
  const deadlineMatches = countKeywordMatches(corpus, intelligenceConfig.priorityDeadlineKeywords)
  const attachmentKeywordMatches = analyzed.messages.reduce((total, message) => {
    const fileText = message.attachmentNames.join(' ')
    return total + countKeywordMatches(fileText, intelligenceConfig.priorityAttachmentKeywords)
  }, 0)

  const maxSenderStrength = participants
    .filter((participant) => participant.participant.role === 'sender')
    .reduce((max, participant) => {
      const strength = participant.gmailContact.message_count + participant.participant.messageCount
      return Math.max(max, strength)
    }, 0)

  let score = 0

  if (maxSenderStrength >= 25) score += 14
  else if (maxSenderStrength >= 10) score += 10
  else if (maxSenderStrength >= 4) score += 6
  else if (maxSenderStrength >= 2) score += 3

  if (crmLinks.some((link) => link.entityType === 'contact')) score += 12
  if (crmLinks.some((link) => link.entityType === 'company')) score += 8

  const maxDealValue = linkedDeals.reduce((max, deal) => Math.max(max, Number(deal.value ?? 0)), 0)
  if (maxDealValue >= 100_000) score += 20
  else if (maxDealValue >= 50_000) score += 16
  else if (maxDealValue >= 10_000) score += 12
  else if (maxDealValue >= 1_000) score += 8
  else if (maxDealValue > 0) score += 4

  score += Math.min(18, urgencyMatches * 6)
  score += Math.min(12, deadlineMatches * 4)

  if (relationship.responseStatus === 'waiting_for_me') score += 10
  else if (relationship.responseStatus === 'waiting_for_customer') score += 4
  else if (relationship.responseStatus === 'conversation_active') score += 2

  if (relationship.followUpPriority === 'critical') score += 16
  else if (relationship.followUpPriority === 'high') score += 12
  else if (relationship.followUpPriority === 'medium') score += 8
  else if (relationship.followUpPriority === 'low') score += 3

  if (hasDirectQuestion(analyzed, corpus)) {
    score += relationship.responseStatus === 'waiting_for_me' ? 8 : 4
  }

  const totalAttachments = analyzed.messages.reduce((total, message) => total + message.attachmentCount, 0)
  if (totalAttachments > 0) score += 3
  if (attachmentKeywordMatches > 0) score += Math.min(6, attachmentKeywordMatches * 2)

  if (latestAgeHours <= 24) score += 10
  else if (latestAgeHours <= 72) score += 7
  else if (latestAgeHours <= 168) score += 4
  else if (latestAgeHours <= 336) score += 1

  const priorityScore = Math.round(clamp(score, 0, 100))

  let priorityLabel: PriorityLabel = 'fyi'
  if (priorityScore >= intelligenceConfig.priorityLabels.critical) {
    priorityLabel = 'critical'
  } else if (priorityScore >= intelligenceConfig.priorityLabels.high) {
    priorityLabel = 'high'
  } else if (priorityScore >= intelligenceConfig.priorityLabels.normal) {
    priorityLabel = 'normal'
  } else if (priorityScore >= intelligenceConfig.priorityLabels.low) {
    priorityLabel = 'low'
  }

  return { priorityScore, priorityLabel }
}

function toCrmLinkInsert(
  workspaceId: string,
  gmailThreadId: string,
  link: CrmLinkCandidate
): InsertTables<'crm_email_links'> {
  return {
    workspace_id: workspaceId,
    gmail_thread_id: gmailThreadId,
    entity_type: link.entityType,
    entity_id: link.entityId,
    confidence_score: Number(clamp(link.confidenceScore, 0, 0.98).toFixed(2)),
    match_reason: link.matchReasons.join('|'),
  }
}

async function createMemoryIfMissing(
  memoryService: ReturnType<typeof createMemoryService>,
  params: {
    workspaceId: string
    organizationId: string
    userId: string
    sourceId: string
    title: string
    content: string
    importance: 'low' | 'normal' | 'high' | 'critical'
    entityType?: 'company' | 'contact' | 'deal' | 'workspace' | 'organization' | 'gmail_thread' | null
    entityId?: string | null
    confidence?: number | null
    metadata?: Record<string, unknown>
    isPinned?: boolean
  }
) {
  const existing = await memoryService.findMemoryBySourceId(
    params.workspaceId,
    params.sourceId,
    'observation'
  )
  if (existing) return existing

  return memoryService.createMemory({
    workspaceId: params.workspaceId,
    organizationId: params.organizationId,
    userId: params.userId,
    type: 'observation',
    source: 'integration',
    sourceId: params.sourceId,
    title: params.title,
    content: params.content,
    importance: params.importance,
    entityType: params.entityType ?? null,
    entityId: params.entityId ?? null,
    confidence: params.confidence ?? null,
    isPinned: params.isPinned ?? false,
    metadata: params.metadata ?? {},
  })
}

export function createGmailRelationshipIntelligenceService(db: SupabaseClient<Database>) {
  const companiesRepo = createCompaniesRepository(db)
  const contactsRepo = createContactsRepository(db)
  const dealsRepo = createDealsRepository(db)
  const gmailContactsRepo = createGmailContactsRepository(db)
  const threadsRepo = createGmailThreadsRepository(db)
  const crmEmailLinksRepo = createCrmEmailLinksRepository(db)
  const learningService = createLearningService(db)
  const memoryService = createMemoryService(db)
  const knowledgeIngestionService = createGmailKnowledgeIngestionService(db)

  return {
    async processThreadRelationship(params: {
      workspaceId: string
      organizationId: string
      userId: string
      threadRow: GmailThreadRow
      previousThread: GmailThreadRow | null
      analyzed: AnalyzedThread
      participants: RelationshipParticipant[]
    }): Promise<ThreadRelationshipResult> {
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
      const contactCache = new Map<string, ContactRow | null>()
      const linkedContactIds = new Set<string>()
      const linkedCompanyIds = new Set<string>()
      const crmLinkMap = new Map<string, CrmLinkCandidate>()
      const newRelationships: NewRelationshipEvent[] = []

      for (const entry of participants) {
        if (entry.crmContactId) {
          linkedContactIds.add(entry.crmContactId)

          mergeLinkCandidate(crmLinkMap, {
            entityType: 'contact',
            entityId: entry.crmContactId,
            confidenceScore: 0.98,
            matchReasons: ['participant_email_exact_match'],
          })
        }

        const normalizedDomain = normalizeBusinessDomain(entry.participant.contact.domain)
        const companyConfidenceScore = computeCompanyConfidence(entry.participant, normalizedDomain)

        if (entry.crmContactId && !contactCache.has(entry.crmContactId)) {
          contactCache.set(entry.crmContactId, await contactsRepo.findById(entry.crmContactId))
        }

        const crmContact = entry.crmContactId ? contactCache.get(entry.crmContactId) ?? null : null

        if (crmContact?.company_id) {
          linkedCompanyIds.add(crmContact.company_id)
          mergeLinkCandidate(crmLinkMap, {
            entityType: 'company',
            entityId: crmContact.company_id,
            confidenceScore: 0.76,
            matchReasons: ['crm_contact_company_match'],
          })
        }

        if (!normalizedDomain || isPublicEmailProvider(normalizedDomain)) {
          await gmailContactsRepo.update(entry.gmailContact.id, {
            normalized_domain: normalizedDomain || entry.participant.contact.domain,
            organization: crmContact?.company_id ? entry.gmailContact.organization : null,
            crm_company_id: crmContact?.company_id ?? null,
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
              source: 'integration',
              sourceId: `gmail:relationship:${company.id}`,
              title: `Company inferred from email: ${company.name}`,
              content: `${entry.participant.contact.email} was linked to ${company.name} using the ${normalizedDomain} domain.`,
              importance: 'high',
              entityType: 'company',
              entityId: company.id,
              confidence: companyConfidenceScore,
              metadata: {
                domain: normalizedDomain,
                source: 'gmail',
                gmailContactId: entry.gmailContact.id,
              },
            }).catch(() => null)

            newRelationships.push({
              entityType: 'company',
              entityId: company.id,
              title: `New important relationship: ${company.name}`,
              content: `${company.name} was identified as a new relationship from Gmail activity.`,
              confidence: companyConfidenceScore,
            })
          } else if (!company.domain || company.domain !== normalizedDomain) {
            company = await companiesRepo.update(company.id, {
              domain: company.domain ?? normalizedDomain,
              metadata: {
                ...getObject(company.metadata),
                source: 'gmail_relationship_intelligence',
                companyConfidenceScore,
              },
            })
          }

          companyCache.set(normalizedDomain, company)
        }

        if (!company) continue

        linkedCompanyIds.add(company.id)
        mergeLinkCandidate(crmLinkMap, {
          entityType: 'company',
          entityId: company.id,
          confidenceScore: companyConfidenceScore,
          matchReasons: ['participant_domain_exact_match'],
        })

        await gmailContactsRepo.update(entry.gmailContact.id, {
          normalized_domain: normalizedDomain,
          organization: organizationName,
          crm_company_id: company.id,
          company_confidence_score: companyConfidenceScore,
        })

        if (crmContact && !crmContact.company_id) {
          await contactsRepo.update(crmContact.id, { company_id: company.id })
        }
      }

      const relationship = analyzeThreadRelationship(analyzed)
      const corpus = buildThreadCorpus(analyzed)

      const companyDeals = await dealsRepo.listByCompanyIds(workspaceId, [...linkedCompanyIds])
      const contactDeals = await dealsRepo.listByContactIds(workspaceId, [...linkedContactIds])
      const dealCandidates = new Map<string, DealRow>()

      for (const deal of [...companyDeals, ...contactDeals]) {
        dealCandidates.set(deal.id, deal)
      }

      const searchPool = dealCandidates.size > 0 ? [...dealCandidates.values()] : await dealsRepo.list(workspaceId)

      for (const deal of searchPool) {
        let score = 0
        const reasons: string[] = []

        if (deal.contact_id && linkedContactIds.has(deal.contact_id)) {
          score += 0.45
          reasons.push('participant_email_contact_match')
        }

        if (deal.company_id && linkedCompanyIds.has(deal.company_id)) {
          score += 0.35
          reasons.push('participant_domain_company_match')
        }

        const textMatch = matchDealByText(corpus, deal)
        score += textMatch.score
        reasons.push(...textMatch.reasons)

        const qualifies =
          score >= 0.55 ||
          (textMatch.exactTitleMatch && score >= 0.35) ||
          (Boolean(deal.contact_id && linkedContactIds.has(deal.contact_id)) &&
            Boolean(deal.company_id && linkedCompanyIds.has(deal.company_id)))

        if (!qualifies) continue

        mergeLinkCandidate(crmLinkMap, {
          entityType: 'deal',
          entityId: deal.id,
          confidenceScore: score,
          matchReasons: reasons,
        })
        dealCandidates.set(deal.id, deal)
      }

      const crmLinks = [...crmLinkMap.values()].sort((a, b) => b.confidenceScore - a.confidenceScore)
      const linkedDeals = crmLinks
        .filter((link) => link.entityType === 'deal')
        .map((link) => dealCandidates.get(link.entityId))
        .filter((deal): deal is DealRow => Boolean(deal))

      const priority = calculatePriorityScore({
        analyzed,
        relationship,
        participants,
        crmLinks,
        linkedDeals,
      })

      await threadsRepo.update(threadRow.id, {
        response_status: relationship.responseStatus,
        conversation_age_days: relationship.conversationAgeDays,
        thread_health: relationship.threadHealth,
        follow_up_required: relationship.followUpRequired,
        follow_up_due: relationship.followUpDue,
        days_waiting: relationship.daysWaiting,
        follow_up_priority: relationship.followUpPriority,
        priority_score: priority.priorityScore,
        priority_label: priority.priorityLabel,
      })

      await crmEmailLinksRepo.syncForThread(
        threadRow.id,
        crmLinks.map((link) => toCrmLinkInsert(workspaceId, threadRow.id, link))
      )

      const baseMetadata = {
        source: 'gmail',
        threadId: threadRow.id,
        googleThreadId: analyzed.threadId,
        priorityScore: priority.priorityScore,
        priorityLabel: priority.priorityLabel,
        responseStatus: relationship.responseStatus,
        followUpRequired: relationship.followUpRequired,
        followUpDue: relationship.followUpDue,
        daysWaiting: relationship.daysWaiting,
        threadHealth: relationship.threadHealth,
        linkedEntities: crmLinks.map((link) => ({
          entityType: link.entityType,
          entityId: link.entityId,
          confidenceScore: link.confidenceScore,
        })),
      }
      const awaitingReply = relationship.responseStatus === 'waiting_for_me'
      const hasDealLink = crmLinks.some((link) => link.entityType === 'deal')
      const companyLabel = pickCompanyLabel(participants, analyzed)

      if (priority.priorityLabel === 'critical') {
        await createMemoryIfMissing(memoryService, {
          workspaceId,
          organizationId,
          userId,
          sourceId: `gmail:thread:${threadRow.id}:critical-priority`,
          title: `Critical priority email: ${analyzed.subject ?? companyLabel}`,
          content: `${companyLabel} has a critical priority email thread requiring immediate attention.`,
          importance: 'critical',
          entityType: 'gmail_thread',
          entityId: threadRow.id,
          confidence: 0.94,
          isPinned: true,
          metadata: baseMetadata,
        }).catch(() => null)
      } else if (priority.priorityLabel === 'high') {
        await createMemoryIfMissing(memoryService, {
          workspaceId,
          organizationId,
          userId,
          sourceId: `gmail:thread:${threadRow.id}:high-priority`,
          title: `High priority email: ${analyzed.subject ?? companyLabel}`,
          content: `${companyLabel} has a high priority email thread that should be reviewed soon.`,
          importance: 'high',
          entityType: 'gmail_thread',
          entityId: threadRow.id,
          confidence: 0.82,
          metadata: baseMetadata,
        }).catch(() => null)
      }

      if (relationship.followUpRequired) {
        await createMemoryIfMissing(memoryService, {
          workspaceId,
          organizationId,
          userId,
          sourceId: `gmail:thread:${threadRow.id}:follow-up-required`,
          title: `Follow-up required: ${companyLabel}`,
          content: `${companyLabel} has an email thread that requires follow-up.`,
          importance: relationship.followUpPriority === 'critical' ? 'critical' : 'high',
          entityType: 'gmail_thread',
          entityId: threadRow.id,
          confidence: 0.8,
          metadata: baseMetadata,
        }).catch(() => null)
      }

      if (awaitingReply) {
        await createMemoryIfMissing(memoryService, {
          workspaceId,
          organizationId,
          userId,
          sourceId: `gmail:thread:${threadRow.id}:awaiting-reply`,
          title: `Awaiting executive reply: ${companyLabel}`,
          content: `${companyLabel} is waiting for your reply on this email thread.`,
          importance: priority.priorityLabel === 'critical' ? 'critical' : 'high',
          entityType: 'gmail_thread',
          entityId: threadRow.id,
          confidence: 0.86,
          metadata: baseMetadata,
        }).catch(() => null)
      }

      for (const relationshipEvent of newRelationships) {
        await createMemoryIfMissing(memoryService, {
          workspaceId,
          organizationId,
          userId,
          sourceId: `gmail:new-relationship:${relationshipEvent.entityType}:${relationshipEvent.entityId}`,
          title: relationshipEvent.title,
          content: relationshipEvent.content,
          importance: 'high',
          entityType: relationshipEvent.entityType,
          entityId: relationshipEvent.entityId,
          confidence: relationshipEvent.confidence,
          metadata: baseMetadata,
        }).catch(() => null)
      }

      if (hasDealLink) {
        const topDeal = linkedDeals[0] ?? null
        await createMemoryIfMissing(memoryService, {
          workspaceId,
          organizationId,
          userId,
          sourceId: `gmail:thread:${threadRow.id}:deal-related`,
          title: `Deal-related email: ${analyzed.subject ?? companyLabel}`,
          content: topDeal
            ? `This email thread is linked to the deal "${topDeal.title}".`
            : `This email thread is linked to an active deal.`,
          importance: priority.priorityLabel === 'critical' ? 'critical' : 'high',
          entityType: topDeal ? 'deal' : 'gmail_thread',
          entityId: topDeal?.id ?? threadRow.id,
          confidence: 0.84,
          metadata: baseMetadata,
        }).catch(() => null)
      }

      const existingSignals = await learningService.listSignals(workspaceId, {
        signalType: 'follow_up_delay',
        entityType: 'gmail_thread',
        entityId: threadRow.id,
        resolved: false,
        limit: 5,
      })
      const existingFollowUpOverdueSignals = await learningService.listSignals(workspaceId, {
        signalType: 'follow_up_overdue',
        entityType: 'gmail_thread',
        entityId: threadRow.id,
        resolved: false,
        limit: 1,
      })

      const shouldCreateSignal =
        relationship.followUpRequired &&
        relationship.overdueDays !== null &&
        relationship.overdueDays > 0

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
          priorityScore: priority.priorityScore,
          priorityLabel: priority.priorityLabel,
        }

        if (existingSignals[0]) {
          await learningService.updateSignal(existingSignals[0].id, {
            severity,
            confidence: relationship.followUpPriority === 'critical' ? 0.95 : 0.82,
            title: `Follow-up overdue: ${companyLabel}`,
            description,
            data: signalData,
            metadata: baseMetadata,
          })

          if (existingFollowUpOverdueSignals[0]) {
            await learningService.updateSignal(existingFollowUpOverdueSignals[0].id, {
              severity,
              confidence: relationship.followUpPriority === 'critical' ? 0.95 : 0.82,
              title: `Follow-up overdue: ${companyLabel}`,
              description,
              data: signalData,
              metadata: baseMetadata,
            }).catch(() => null)
          }
        } else {
          await learningService.createLearningSignal({
            workspaceId,
            organizationId,
            signalType: 'follow_up_delay',
            entityType: 'gmail_thread',
            entityId: threadRow.id,
            severity,
            confidence: relationship.followUpPriority === 'critical' ? 0.95 : 0.82,
            title: `Follow-up overdue: ${companyLabel}`,
            description,
            data: signalData,
            metadata: baseMetadata,
          })

          await learningService.createLearningSignal({
            workspaceId,
            organizationId,
            signalType: 'follow_up_overdue',
            entityType: 'gmail_thread',
            entityId: threadRow.id,
            severity,
            confidence: relationship.followUpPriority === 'critical' ? 0.95 : 0.82,
            title: `Follow-up overdue: ${companyLabel}`,
            description,
            data: signalData,
            metadata: baseMetadata,
          }).catch(() => null)
        }

        if (
          previousThread?.follow_up_priority !== 'critical' &&
          relationship.followUpPriority === 'critical'
        ) {
          await createMemoryIfMissing(memoryService, {
            workspaceId,
            organizationId,
            userId,
            sourceId: `gmail:thread:${threadRow.id}:customer-risk`,
            title: `Customer risk signal: ${companyLabel}`,
            content: description,
            importance: 'critical',
            entityType: 'workspace',
            entityId: workspaceId,
            confidence: 0.88,
            metadata: {
              ...baseMetadata,
              ...signalData,
            },
            isPinned: true,
          }).catch(() => null)
        }
      } else {
        await Promise.all(
          existingSignals.map((signal) => learningService.resolveSignal(signal.id).catch(() => null))
        )
        await Promise.all(
          existingFollowUpOverdueSignals.map((signal) =>
            learningService.resolveSignal(signal.id).catch(() => null)
          )
        )
      }

      const threadSignals: ThreadSignalDefinition[] = [
        {
          enabled: priority.priorityLabel === 'critical' || priority.priorityLabel === 'high',
          signalType: 'attention_required' as const,
          severity: priority.priorityLabel === 'critical' ? ('critical' as const) : ('warning' as const),
          confidence: priority.priorityLabel === 'critical' ? 0.96 : 0.81,
          title: `Attention required: ${companyLabel}`,
          description: `${companyLabel} has a ${priority.priorityLabel} priority email thread.`,
        },
        {
          enabled: awaitingReply && relationship.daysWaiting !== null && relationship.daysWaiting > 0,
          signalType: 'response_delay' as const,
          severity:
            relationship.daysWaiting !== null && relationship.daysWaiting >= 3
              ? ('critical' as const)
              : ('warning' as const),
          confidence: awaitingReply ? 0.89 : 0.5,
          title: `Response delay: ${companyLabel}`,
          description: `${companyLabel} has been waiting ${relationship.daysWaiting ?? 0} day(s) for a reply.`,
        },
        {
          enabled:
            relationship.responseStatus === 'waiting_for_customer' &&
            (relationship.daysWaiting ?? 0) >= intelligenceConfig.highPriorityFollowUpDays,
          signalType: 'customer_inactivity' as const,
          severity:
            (relationship.daysWaiting ?? 0) >= intelligenceConfig.criticalPriorityFollowUpDays
              ? ('critical' as const)
              : ('warning' as const),
          confidence: 0.78,
          title: `Customer inactivity: ${companyLabel}`,
          description: `${companyLabel} has not responded for ${relationship.daysWaiting ?? 0} day(s).`,
        },
        {
          enabled: analyzed.messageCount >= 6,
          signalType: 'communication_pattern' as const,
          severity: 'info' as const,
          confidence: 0.72,
          title: `Communication pattern: ${companyLabel}`,
          description: `${companyLabel} has an active recurring communication pattern in Gmail.`,
        },
        {
          enabled: hasDealLink && (priority.priorityLabel === 'critical' || shouldCreateSignal),
          signalType: 'deal_risk' as const,
          severity: priority.priorityLabel === 'critical' ? ('critical' as const) : ('warning' as const),
          confidence: 0.84,
          title: `Deal risk in email: ${companyLabel}`,
          description: `A deal-related email thread indicates execution risk or a stalled response.`,
        },
      ]

      for (const signal of threadSignals) {
        const existing = await learningService.listSignals(workspaceId, {
          signalType: signal.signalType,
          entityType: 'gmail_thread',
          entityId: threadRow.id,
          resolved: false,
          limit: 1,
        })

        if (!signal.enabled) {
          if (existing[0]) {
            await learningService.resolveSignal(existing[0].id).catch(() => null)
          }
          continue
        }

        if (existing[0]) {
          await learningService.updateSignal(existing[0].id, {
            severity: signal.severity,
            confidence: signal.confidence,
            title: signal.title,
            description: signal.description,
            data: baseMetadata,
            metadata: baseMetadata,
          }).catch(() => null)
          continue
        }

        await learningService.createLearningSignal({
          workspaceId,
          organizationId,
          signalType: signal.signalType,
          entityType: 'gmail_thread',
          entityId: threadRow.id,
          severity: signal.severity,
          confidence: signal.confidence,
          title: signal.title,
          description: signal.description,
          data: baseMetadata,
          metadata: baseMetadata,
        }).catch(() => null)
      }

      for (const relationshipEvent of newRelationships) {
        const existing = await learningService.listSignals(workspaceId, {
          signalType: 'new_relationship',
          entityType: relationshipEvent.entityType,
          entityId: relationshipEvent.entityId,
          resolved: false,
          limit: 1,
        })

        if (!existing[0]) {
          await learningService.createLearningSignal({
            workspaceId,
            organizationId,
            signalType: 'new_relationship',
            entityType: relationshipEvent.entityType,
            entityId: relationshipEvent.entityId,
            severity: 'info',
            confidence: relationshipEvent.confidence,
            title: relationshipEvent.title,
            description: relationshipEvent.content,
            data: baseMetadata,
            metadata: baseMetadata,
          }).catch(() => null)
        }
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

      await knowledgeIngestionService.ingestThread({
        workspaceId,
        organizationId,
        userId,
        googleThreadId: analyzed.threadId,
        analyzed,
        priorityScore: priority.priorityScore,
        priorityLabel: priority.priorityLabel,
        followUpRequired: relationship.followUpRequired,
        awaitingReply,
        crmLinks,
      }).catch(() => null)

      return {
        ...relationship,
        priorityScore: priority.priorityScore,
        priorityLabel: priority.priorityLabel,
        crmLinks,
      }
    },
  }
}

export type GmailRelationshipIntelligenceService = ReturnType<
  typeof createGmailRelationshipIntelligenceService
>
