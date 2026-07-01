// Gmail Thread Intelligence Engine — Parts 3 & 4.
// Fetches a Gmail thread, normalizes messages, classifies thread status,
// computes response latencies, extracts contacts, matches CRM, fires Memory signals.
// No AI — all logic is deterministic.
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type {
  AnalyzedThread,
  GmailMessage,
  GmailThread,
  NormalizedMessage,
  ThreadStatus,
} from '@/types/google'
import { createGmailApiClient } from './gmail-api-client'
import { createGoogleOAuthService } from './google-oauth-service'
import { createGoogleConnectionsRepository } from '@/repositories/google/connections'
import { createGmailThreadsRepository, createGmailMessagesRepository } from '@/repositories/google/gmail-threads'
import { createGmailContactsRepository, createGmailParticipantsRepository } from '@/repositories/google/gmail-contacts'
import { createContactsRepository } from '@/repositories/crm/contacts'
import { createMemoryService } from '@/services/memory/memory-service'
import { createGmailRelationshipIntelligenceService } from './gmail-relationship-intelligence'
import {
  parseEmailAddress,
  parseAddressList,
  extractBodyText,
  extractParticipants,
} from './gmail-contact-extractor'

// Labels that indicate a closed / dead thread
const CLOSED_LABELS = new Set(['TRASH', 'SPAM'])

// ─── Message normalization ────────────────────────────────────────────────────

function getHeader(msg: GmailMessage, name: string): string {
  return (
    msg.payload?.headers?.find(
      (h) => h.name.toLowerCase() === name.toLowerCase()
    )?.value ?? ''
  )
}

function normalizeMessage(msg: GmailMessage, executiveEmail: string): NormalizedMessage {
  const fromRaw = getHeader(msg, 'From')
  const { email: fromEmail, name: fromName } = parseEmailAddress(fromRaw)

  const toRaw = getHeader(msg, 'To')
  const ccRaw = getHeader(msg, 'Cc')

  const toEmails = toRaw
    ? parseAddressList(toRaw).map((a) => a.email).filter(Boolean)
    : []
  const ccEmails = ccRaw
    ? parseAddressList(ccRaw).map((a) => a.email).filter(Boolean)
    : []

  const subject = getHeader(msg, 'Subject') || null
  const bodyText = extractBodyText(msg.payload) ?? null

  // internalDate is epoch milliseconds as a string
  const sentAt = msg.internalDate
    ? new Date(Number(msg.internalDate))
    : new Date(0)

  return {
    messageId: msg.id,
    fromEmail,
    fromName,
    toEmails,
    ccEmails,
    subject,
    snippet: msg.snippet ?? null,
    bodyText,
    labelIds: msg.labelIds ?? [],
    sentAt,
    isOutbound: fromEmail === executiveEmail.toLowerCase(),
  }
}

// ─── Thread analysis ──────────────────────────────────────────────────────────

function computeLatencies(messages: NormalizedMessage[]): {
  avg: number | null
  last: number | null
} {
  if (messages.length < 2) return { avg: null, last: null }

  const sorted = [...messages].sort((a, b) => a.sentAt.getTime() - b.sentAt.getTime())
  const turns: NormalizedMessage[] = [sorted[0]]

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i]
    const previous = turns[turns.length - 1]

    if (current.isOutbound === previous.isOutbound) {
      turns[turns.length - 1] = current
    } else {
      turns.push(current)
    }
  }

  if (turns.length < 2) return { avg: null, last: null }

  const gaps: number[] = []
  for (let i = 1; i < turns.length; i++) {
    gaps.push(turns[i].sentAt.getTime() - turns[i - 1].sentAt.getTime())
  }

  const avg = Math.round(gaps.reduce((s, g) => s + g, 0) / gaps.length)
  const last = gaps[gaps.length - 1]
  return { avg, last }
}

function classifyStatus(
  messages: NormalizedMessage[],
  labelIds: string[]
): ThreadStatus {
  // Closed: trashed or spammed
  if (labelIds.some((l) => CLOSED_LABELS.has(l))) return 'closed'

  if (messages.length === 0) return 'open'

  const sorted = [...messages].sort((a, b) => a.sentAt.getTime() - b.sentAt.getTime())
  const last = sorted[sorted.length - 1]

  if (last.isOutbound) {
    // Executive sent the last message → waiting for customer to reply
    return 'waiting_for_customer'
  }

  // External sender sent the last message → waiting for us to reply
  return 'waiting_for_us'
}

function analyzeThread(
  raw: GmailThread,
  executiveEmail: string
): AnalyzedThread {
  const rawMessages = raw.messages ?? []
  const normalized = rawMessages.map((m) => normalizeMessage(m, executiveEmail))
  const sorted = [...normalized].sort((a, b) => a.sentAt.getTime() - b.sentAt.getTime())

  // Collect all label IDs across the thread
  const labelSet = new Set<string>()
  for (const m of normalized) for (const l of m.labelIds) labelSet.add(l)
  const labelIds = [...labelSet]

  const status = classifyStatus(sorted, labelIds)
  const { avg, last: lastLatency } = computeLatencies(sorted)

  const participantSet = new Set<string>()
  for (const m of normalized) {
    participantSet.add(m.fromEmail)
    m.toEmails.forEach((e) => participantSet.add(e))
    m.ccEmails.forEach((e) => participantSet.add(e))
  }

  // Subject and snippet come from the first message
  const firstMsg = sorted[0] ?? null
  const lastMsg = sorted[sorted.length - 1] ?? null

  return {
    threadId: raw.id,
    subject: firstMsg?.subject ?? null,
    snippet: lastMsg?.snippet ?? raw.snippet ?? null,
    status,
    messageCount: normalized.length,
    firstMessageAt: firstMsg?.sentAt ?? null,
    latestReplyAt: lastMsg?.sentAt ?? null,
    lastSenderEmail: lastMsg?.fromEmail ?? null,
    participantEmails: [...participantSet],
    avgResponseLatencyMs: avg,
    lastResponseLatencyMs: lastLatency,
    labelIds,
    messages: sorted,
  }
}

// ─── Service factory ──────────────────────────────────────────────────────────

export function createGmailThreadIntelligenceService(db: SupabaseClient<Database>) {
  const oauthService = createGoogleOAuthService(db)
  const connectionsRepo = createGoogleConnectionsRepository(db)
  const threadsRepo = createGmailThreadsRepository(db)
  const messagesRepo = createGmailMessagesRepository(db)
  const gmailContactsRepo = createGmailContactsRepository(db)
  const participantsRepo = createGmailParticipantsRepository(db)
  const crmContactsRepo = createContactsRepository(db)
  const memoryService = createMemoryService(db)
  const relationshipService = createGmailRelationshipIntelligenceService(db)
  const apiClient = createGmailApiClient()

  return {
    /**
     * Download, analyze, and persist a single Gmail thread.
     * Runs Parts 3 (thread intelligence) and 4 (contact extraction) in one pass.
     *
     * @param connectionId  google_connections.id
     * @param workspaceId   workspace the thread belongs to
     * @param organizationId organization for memory signals
     * @param userId        auth user ID (memory signal actor)
     * @param googleThreadId Google's thread ID string
     */
    async processThread(
      connectionId: string,
      workspaceId: string,
      organizationId: string,
      userId: string,
      googleThreadId: string
    ): Promise<AnalyzedThread> {
      // ── 1. Resolve executive email ─────────────────────────────────────────
      const connection = await connectionsRepo.findById(connectionId)
      if (!connection) throw new Error(`Connection ${connectionId} not found`)
      const executiveEmail = connection.google_account_email.toLowerCase()

      // ── 2. Fetch full thread from Gmail ───────────────────────────────────
      const tokens = await oauthService.getActiveTokens(connectionId)
      const rawThread = await apiClient.getThread(tokens.accessToken, googleThreadId, 'full')

      // ── 3. Analyze thread (Part 3) ────────────────────────────────────────
      const analyzed = analyzeThread(rawThread, executiveEmail)
      const previousThread = await threadsRepo.findByGoogleThreadId(connectionId, googleThreadId)

      // ── 4. Persist gmail_threads row ──────────────────────────────────────
      const threadRow = await threadsRepo.upsert({
        connection_id: connectionId,
        workspace_id: workspaceId,
        thread_id: googleThreadId,
        subject: analyzed.subject,
        snippet: analyzed.snippet,
        label_ids: analyzed.labelIds,
        status: analyzed.status,
        message_count: analyzed.messageCount,
        first_message_at: analyzed.firstMessageAt?.toISOString() ?? null,
        latest_reply_at: analyzed.latestReplyAt?.toISOString() ?? null,
        last_sender_email: analyzed.lastSenderEmail,
        participant_emails: analyzed.participantEmails,
        avg_response_latency_ms: analyzed.avgResponseLatencyMs,
        last_response_latency_ms: analyzed.lastResponseLatencyMs,
        last_synced_at: new Date().toISOString(),
      })

      // ── 5. Persist gmail_messages rows ────────────────────────────────────
      const messageInserts = analyzed.messages.map((m) => ({
        connection_id: connectionId,
        workspace_id: workspaceId,
        gmail_thread_id: threadRow.id,
        message_id: m.messageId,
        google_thread_id: googleThreadId,
        from_email: m.fromEmail,
        from_name: m.fromName,
        to_emails: m.toEmails,
        cc_emails: m.ccEmails,
        subject: m.subject,
        snippet: m.snippet,
        body_text: m.bodyText,
        label_ids: m.labelIds,
        sent_at: m.sentAt.toISOString(),
        is_outbound: m.isOutbound,
      }))
      await messagesRepo.upsertMany(messageInserts)

      // ── 6. Extract contacts (Part 4) ──────────────────────────────────────
      const participants = extractParticipants(analyzed.messages, executiveEmail)
      const relationshipParticipants: Array<{
        participant: (typeof participants)[number]
        gmailContact: Awaited<ReturnType<typeof gmailContactsRepo.upsert>>
        crmContactId: string | null
      }> = []

      for (const p of participants) {
        const { contact, role, messageCount } = p
        const now = new Date().toISOString()

        // Upsert into gmail_contacts (onConflict = connection_id,email)
        const gmailContact = await gmailContactsRepo.upsert({
          connection_id: connectionId,
          workspace_id: workspaceId,
          email: contact.email,
          display_name: contact.displayName,
          domain: contact.domain,
          organization: contact.organization,
          signature_hint: contact.signatureHint,
          last_seen_at: now,
          // first_seen_at and message_count are updated below on conflict
        })

        // Bump message_count and last_seen_at if row already existed
        if (gmailContact.message_count < messageCount) {
          await gmailContactsRepo.update(gmailContact.id, {
            message_count: gmailContact.message_count + messageCount,
            last_seen_at: now,
            // Update name/org/sig if we have better data
            display_name: contact.displayName ?? gmailContact.display_name,
            organization: contact.organization ?? gmailContact.organization,
            signature_hint: contact.signatureHint ?? gmailContact.signature_hint,
          })
        }

        // ── 7. CRM matching ────────────────────────────────────────────────
        let crmContactId = gmailContact.crm_contact_id
        if (!crmContactId) {
          const crmMatch = await crmContactsRepo.findByEmail(workspaceId, contact.email)
          if (crmMatch) {
            crmContactId = crmMatch.id
            await gmailContactsRepo.linkToCrm(gmailContact.id, crmMatch.id)
          }
        }

        // ── 8. Memory signal for new unmatched contacts (Part 4) ──────────
        // Fire only once: when we first see this contact and they have no CRM record.
        const isNewContact = gmailContact.message_count === 0
        if (isNewContact && !crmContactId) {
          const orgLabel = contact.organization ? ` (${contact.organization})` : ''
          const name = contact.displayName ?? contact.email

          await memoryService.createMemory({
            workspaceId,
            organizationId,
            userId,
            type: 'observation',
            source: 'system',
            title: `New email contact: ${name}`,
            content: `${contact.email}${orgLabel} emailed for the first time. Not yet in CRM.`,
            entityType: 'contact',
            metadata: {
              email: contact.email,
              domain: contact.domain,
              organization: contact.organization,
              source: 'gmail',
            },
          }).catch(() => null) // non-fatal
        }

        // ── 9. Upsert thread participant ───────────────────────────────────
        await participantsRepo.upsert({
          gmail_thread_id: threadRow.id,
          gmail_contact_id: gmailContact.id,
          role,
          message_count: messageCount,
        })

        relationshipParticipants.push({
          participant: p,
          gmailContact: {
            ...gmailContact,
            display_name: contact.displayName ?? gmailContact.display_name,
            organization: contact.organization ?? gmailContact.organization,
            signature_hint: contact.signatureHint ?? gmailContact.signature_hint,
            crm_contact_id: crmContactId,
          },
          crmContactId,
        })
      }

      await relationshipService.processThreadRelationship({
        workspaceId,
        organizationId,
        userId,
        threadRow,
        previousThread,
        analyzed,
        participants: relationshipParticipants,
      })

      return analyzed
    },

    /**
     * Process a batch of thread IDs concurrently (max batchSize at a time).
     * Errors per thread are caught and logged; they do not abort the batch.
     * Returns counts of successes and failures.
     */
    async processBatch(
      connectionId: string,
      workspaceId: string,
      organizationId: string,
      userId: string,
      threadIds: string[],
      batchSize = 5
    ): Promise<{ processed: number; failed: number }> {
      let processed = 0
      let failed = 0

      for (let i = 0; i < threadIds.length; i += batchSize) {
        const slice = threadIds.slice(i, i + batchSize)
        const results = await Promise.allSettled(
          slice.map((id) =>
            this.processThread(connectionId, workspaceId, organizationId, userId, id)
          )
        )
        for (const r of results) {
          if (r.status === 'fulfilled') {
            processed++
          } else {
            failed++
            console.error('[gmail-thread-intelligence] thread failed:', r.reason)
          }
        }
      }

      return { processed, failed }
    },
  }
}

export type GmailThreadIntelligenceService = ReturnType<typeof createGmailThreadIntelligenceService>
