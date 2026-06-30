import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { AIConversation, AIMessage, ConversationListItem } from '@/types/ai'
import { createConversationRepository } from '@/repositories/ai/conversation-repository'
import { createMessageRepository } from '@/repositories/ai/message-repository'
import { aiConfig } from '@/config/ai'

// Derives a conversation title from the first user message (first 80 chars).
function deriveTitle(content: string): string {
  return content.slice(0, aiConfig.conversationTitleMaxLength).replace(/\s+/g, ' ').trim()
}

export function createConversationManager(db: SupabaseClient<Database>) {
  const convRepo = createConversationRepository(db)
  const msgRepo = createMessageRepository(db)

  return {
    async createConversation(input: {
      workspaceId: string
      organizationId: string
      userId: string
      title?: string
      model?: string
    }): Promise<AIConversation> {
      return convRepo.create({
        workspace_id: input.workspaceId,
        organization_id: input.organizationId,
        user_id: input.userId,
        title: input.title ?? null,
        model: input.model ?? null,
        metadata: {},
      })
    },

    async listConversations(
      userId: string,
      workspaceId: string
    ): Promise<ConversationListItem[]> {
      const conversations = await convRepo.listForUser(userId, workspaceId)
      return conversations.map((c) => ({
        id: c.id,
        title: c.title,
        updatedAt: c.updatedAt,
        model: c.model,
      }))
    },

    async getConversation(id: string): Promise<AIConversation | null> {
      return convRepo.findById(id)
    },

    async getMessages(conversationId: string): Promise<AIMessage[]> {
      return msgRepo.listByConversation(conversationId)
    },

    async addUserMessage(conversationId: string, content: string): Promise<AIMessage> {
      return msgRepo.create({
        conversation_id: conversationId,
        role: 'user',
        content,
        tokens_used: null,
        metadata: {},
      })
    },

    async addAssistantMessage(
      conversationId: string,
      content: string,
      tokensUsed?: number,
      model?: string
    ): Promise<AIMessage> {
      const message = await msgRepo.create({
        conversation_id: conversationId,
        role: 'assistant',
        content,
        tokens_used: tokensUsed ?? null,
        metadata: model ? { model } : {},
      })

      // Keep the conversation's updated_at fresh
      await convRepo.touchUpdatedAt(conversationId)
      return message
    },

    async updateTitle(conversationId: string, title: string): Promise<AIConversation> {
      return convRepo.update(conversationId, { title })
    },

    async archiveConversation(conversationId: string): Promise<void> {
      return convRepo.softDelete(conversationId)
    },

    async getRecentHistory(
      conversationId: string,
      limit: number = aiConfig.messageHistoryLimit
    ): Promise<Array<{ role: 'user' | 'assistant' | 'system'; content: string }>> {
      const messages = await msgRepo.getLastN(conversationId, limit)
      return messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))
    },

    deriveTitle,
  }
}

export type ConversationManager = ReturnType<typeof createConversationManager>
