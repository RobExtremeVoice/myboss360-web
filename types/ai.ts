import type { IntelligenceContext } from '@/types/intelligence'

export type AIRole = 'user' | 'assistant' | 'system'
export type AICapability = 'text' | 'tool_use' | 'vision' | 'code'
export type AIProviderStatus = 'active' | 'unavailable' | 'rate_limited' | 'unconfigured'

export interface AIMessage {
  id: string
  conversationId: string
  role: AIRole
  content: string
  tokensUsed: number | null
  metadata: Record<string, unknown>
  createdAt: string
}

export interface AIConversation {
  id: string
  workspaceId: string
  organizationId: string | null
  userId: string
  title: string | null
  model: string | null
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface AITool {
  name: string
  description: string
  parameters: {
    type: 'object'
    properties: Record<string, { type: string; description: string }>
    required?: string[]
  }
}

export interface AIToolCall {
  id: string
  name: string
  arguments: Record<string, unknown>
}

export interface AIToolResult {
  toolCallId: string
  content: string
}

export interface GenerateRequest {
  systemPrompt: string
  messages: Array<{ role: AIRole; content: string }>
  context?: IntelligenceContext
  tools?: AITool[]
  maxTokens?: number
  temperature?: number
}

export interface GenerateResponse {
  content: string
  model: string
  tokensUsed: number
  finishReason: 'stop' | 'length' | 'tool_call' | 'error'
  toolCalls?: AIToolCall[]
}

export interface StreamChunk {
  delta: string
  isDone: boolean
  finishReason?: 'stop' | 'length' | 'tool_call' | 'error'
}

export interface AIProvider {
  readonly id: string
  readonly name: string
  readonly modelId: string
  readonly capabilities: AICapability[]
  readonly maxContextTokens: number
  readonly supportsStreaming: boolean
  readonly status: AIProviderStatus
  generate(request: GenerateRequest): Promise<GenerateResponse>
  stream(request: GenerateRequest): AsyncIterable<StreamChunk>
}

export interface SendMessageInput {
  conversationId?: string
  workspaceId: string
  organizationId: string
  userId: string
  content: string
  providerId?: string
}

export interface SendMessageResult {
  conversationId: string
  userMessage: AIMessage
  assistantMessage: AIMessage
  isNewConversation: boolean
}

export interface ConversationListItem {
  id: string
  title: string | null
  updatedAt: string
  model: string | null
}
