import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { AIConversation, ConversationListItem, SendMessageInput, SendMessageResult } from '@/types/ai'
import { createConversationManager } from './conversation-manager'
import { loadExecutiveContext } from './context-loader'
import { buildSystemPrompt, buildToolSchemas } from './prompt-builder'
import { getDefaultProvider, registerProvider } from './provider-registry'
import { MockProvider } from './providers/mock-provider'
import { OpenAIProvider } from './providers/openai-provider'
import {
  FutureAnthropicProvider,
  FutureGeminiProvider,
  FutureOllamaProvider,
} from './providers/future-providers'
import { createProfilesRepository } from '@/repositories/users'
import { aiConfig } from '@/config/ai'

// Module-level flag so providers are registered exactly once per process.
let _providersRegistered = false

function ensureProvidersRegistered(): void {
  if (_providersRegistered) return
  _providersRegistered = true
  // Registration order = priority order: first active provider wins.
  // OpenAI is registered first so it takes precedence when OPENAI_API_KEY is set.
  registerProvider(new OpenAIProvider())
  registerProvider(new MockProvider())
  registerProvider(new FutureAnthropicProvider())
  registerProvider(new FutureGeminiProvider())
  registerProvider(new FutureOllamaProvider())
}

export function createAIService(db: SupabaseClient<Database>) {
  ensureProvidersRegistered()

  const manager = createConversationManager(db)
  const profilesRepo = createProfilesRepository(db)

  return {
    async sendMessage(input: SendMessageInput): Promise<SendMessageResult> {
      let conversationId = input.conversationId
      let isNewConversation = false

      // Create conversation if no ID provided
      if (!conversationId) {
        const conv = await manager.createConversation({
          workspaceId: input.workspaceId,
          organizationId: input.organizationId,
          userId: input.userId,
          model: input.providerId,
        })
        conversationId = conv.id
        isNewConversation = true
      }

      // Store user message
      const userMessage = await manager.addUserMessage(conversationId, input.content)

      // Load context + user profile in parallel
      const [context, profile] = await Promise.all([
        loadExecutiveContext(db, input.userId, input.workspaceId),
        profilesRepo.findById(input.userId).catch(() => null),
      ])

      // Retrieve conversation history for multi-turn context
      const history = await manager.getRecentHistory(conversationId)

      // Build system prompt
      const systemPrompt = context
        ? buildSystemPrompt({
            context,
            userFullName: profile?.full_name,
            tools: buildToolSchemas(),
          })
        : 'You are MyBoss360 Executive AI. Business context is loading — answer what you can.'

      // Select provider — per-request override, then config default, then first active.
      const provider = getDefaultProvider(input.providerId ?? aiConfig.defaultProviderId)

      // Generate response
      const response = await provider.generate({
        systemPrompt,
        messages: history,
        context: context ?? undefined,
        tools: buildToolSchemas(),
      })

      // Store assistant message
      const assistantMessage = await manager.addAssistantMessage(
        conversationId,
        response.content,
        response.tokensUsed,
        response.model
      )

      // Auto-title conversation from first user message
      if (isNewConversation) {
        void manager.updateTitle(conversationId, manager.deriveTitle(input.content)).catch(() => null)
      }

      return { conversationId, userMessage, assistantMessage, isNewConversation }
    },

    async listConversations(
      userId: string,
      workspaceId: string
    ): Promise<ConversationListItem[]> {
      return manager.listConversations(userId, workspaceId)
    },

    async getConversationWithMessages(id: string): Promise<{
      conversation: AIConversation
      messages: Awaited<ReturnType<typeof manager.getMessages>>
    } | null> {
      const conversation = await manager.getConversation(id)
      if (!conversation) return null
      const messages = await manager.getMessages(id)
      return { conversation, messages }
    },

    async updateConversationTitle(id: string, title: string): Promise<AIConversation> {
      return manager.updateTitle(id, title)
    },

    async archiveConversation(id: string): Promise<void> {
      return manager.archiveConversation(id)
    },
  }
}

export type AIService = ReturnType<typeof createAIService>
