import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { AnalyzedThread } from '@/types/google'
import { createKnowledgeDocumentsRepository } from '@/repositories/knowledge/documents'
import { createKnowledgeSourcesRepository } from '@/repositories/knowledge/sources'
import { createKnowledgeService } from '@/services/knowledge/knowledge-service'

interface KnowledgeEntityRef {
  entityType: string
  entityId: string
  confidenceScore: number
  matchReasons: string[]
}

function buildThreadDocumentContent(analyzed: AnalyzedThread): string {
  return analyzed.messages
    .map((message, index) => {
      const header = [
        `Message ${index + 1}`,
        `From: ${message.fromName ? `${message.fromName} <${message.fromEmail}>` : message.fromEmail}`,
        `To: ${message.toEmails.join(', ') || 'Unknown'}`,
        message.ccEmails.length > 0 ? `Cc: ${message.ccEmails.join(', ')}` : null,
        `Sent: ${message.sentAt.toISOString()}`,
        `Direction: ${message.isOutbound ? 'Outbound' : 'Inbound'}`,
        message.subject ? `Subject: ${message.subject}` : null,
      ]
        .filter(Boolean)
        .join('\n')

      const body = [message.snippet, message.bodyText].filter(Boolean).join('\n\n').trim()
      return `${header}\n\n${body}`.trim()
    })
    .join('\n\n---\n\n')
}

export function createGmailKnowledgeIngestionService(db: SupabaseClient<Database>) {
  const knowledgeService = createKnowledgeService(db)
  const documentsRepo = createKnowledgeDocumentsRepository(db)
  const sourcesRepo = createKnowledgeSourcesRepository(db)

  return {
    async ingestThread(params: {
      workspaceId: string
      organizationId: string
      userId: string
      googleThreadId: string
      analyzed: AnalyzedThread
      priorityScore: number
      priorityLabel: string
      followUpRequired: boolean
      awaitingReply: boolean
      crmLinks: KnowledgeEntityRef[]
    }) {
      const {
        workspaceId,
        organizationId,
        userId,
        googleThreadId,
        analyzed,
        priorityScore,
        priorityLabel,
        followUpRequired,
        awaitingReply,
        crmLinks,
      } = params

      const collection = await knowledgeService.ensureDefaultCollection(workspaceId, organizationId)
      const existingSource = await sourcesRepo.findByName(workspaceId, 'email', 'Gmail')
      const source =
        existingSource ??
        (await sourcesRepo.create({
          workspace_id: workspaceId,
          organization_id: organizationId,
          name: 'Gmail',
          source_type: 'email',
          config: { provider: 'gmail' },
          last_sync_at: new Date().toISOString(),
        }))

      if (existingSource) {
        await sourcesRepo.update(existingSource.id, {
          last_sync_at: new Date().toISOString(),
        })
      }

      const attachmentNames = [...new Set(analyzed.messages.flatMap((message) => message.attachmentNames))]
      const attachmentCount = analyzed.messages.reduce(
        (count, message) => count + message.attachmentCount,
        0
      )

      const metadata = {
        source: 'gmail',
        thread_id: googleThreadId,
        participants: analyzed.participantEmails,
        priority_score: priorityScore,
        priority_label: priorityLabel,
        follow_up_required: followUpRequired,
        awaiting_reply: awaitingReply,
        linked_crm_entities: crmLinks.map((link) => ({
          entityType: link.entityType,
          entityId: link.entityId,
          confidenceScore: link.confidenceScore,
          matchReasons: link.matchReasons,
        })),
        attachment_count: attachmentCount,
        attachment_names: attachmentNames,
        latest_reply_at: analyzed.latestReplyAt?.toISOString() ?? null,
      }

      const content = buildThreadDocumentContent(analyzed)
      const existing = await documentsRepo.findEmailByThreadId(workspaceId, googleThreadId)

      if (existing) {
        return knowledgeService.updateDocument(existing.id, userId, {
          title: analyzed.subject ?? 'Untitled Gmail thread',
          content,
          objectType: 'email',
          category: 'executive',
          status: 'published',
          metadata,
          changeNote: 'Gmail intelligence refresh',
          autoChunk: true,
        })
      }

      return knowledgeService.createDocument(workspaceId, organizationId, userId, {
        title: analyzed.subject ?? 'Untitled Gmail thread',
        content,
        objectType: 'email',
        category: 'executive',
        collectionId: collection.id,
        sourceId: source.id,
        status: 'published',
        metadata,
        autoChunk: true,
      })
    },
  }
}

export type GmailKnowledgeIngestionService = ReturnType<typeof createGmailKnowledgeIngestionService>
