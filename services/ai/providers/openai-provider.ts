// Server-only: never import this from client components.
// OPENAI_API_KEY is read at construction time from process.env (server runtime).

import type {
  AICapability,
  AIProvider,
  AIProviderStatus,
  GenerateRequest,
  GenerateResponse,
  StreamChunk,
} from '@/types/ai'
import { aiConfig } from '@/config/ai'

// ── OpenAI wire types (subset) ──────────────────────────────────────
interface OAIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface OAIChoice {
  message: { role: string; content: string | null }
  finish_reason: string
}

interface OAIUsage {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
}

interface OAIResponseBody {
  id: string
  model: string
  choices: OAIChoice[]
  usage: OAIUsage
}

interface OAIErrorBody {
  error: { message: string; type: string; code: string | null }
}

const CHAT_ENDPOINT = 'https://api.openai.com/v1/chat/completions'

// ── Provider ────────────────────────────────────────────────────────
export class OpenAIProvider implements AIProvider {
  readonly id = 'openai'
  readonly name = 'OpenAI'
  readonly modelId: string
  readonly capabilities: AICapability[] = ['text', 'tool_use', 'vision', 'code']
  readonly maxContextTokens = 128_000
  readonly supportsStreaming = true
  readonly status: AIProviderStatus

  constructor() {
    this.modelId = aiConfig.openai.model
    // Status is evaluated once at construction (server env is stable).
    this.status = process.env.OPENAI_API_KEY ? 'active' : 'unconfigured'
  }

  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error(
        'OPENAI_API_KEY is not set. Add it to .env.local and restart the dev server.'
      )
    }

    const messages: OAIMessage[] = [
      { role: 'system', content: request.systemPrompt },
      ...request.messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ]

    const body: Record<string, unknown> = {
      model: this.modelId,
      messages,
      max_tokens: request.maxTokens ?? aiConfig.openai.maxTokens,
      temperature: request.temperature ?? aiConfig.openai.temperature,
    }

    const res = await fetch(CHAT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      // Prevent Next.js from caching API calls
      cache: 'no-store',
    })

    if (!res.ok) {
      let errMsg = `OpenAI API error (HTTP ${res.status})`
      try {
        const errBody = (await res.json()) as OAIErrorBody
        if (errBody?.error?.message) errMsg = errBody.error.message
      } catch {
        // ignore JSON parse failure — use the generic message
      }
      throw new Error(errMsg)
    }

    const data = (await res.json()) as OAIResponseBody
    const choice = data.choices?.[0]
    if (!choice) throw new Error('OpenAI returned no choices in its response.')

    const content = choice.message.content ?? ''

    return {
      content,
      model: data.model ?? this.modelId,
      tokensUsed: data.usage?.total_tokens ?? 0,
      finishReason: normaliseFinishReason(choice.finish_reason),
    }
  }

  // Streaming is wired in Sprint 17C.
  // For now, collect the full response and yield it as a single chunk.
  async *stream(request: GenerateRequest): AsyncIterable<StreamChunk> {
    const response = await this.generate(request)
    yield { delta: response.content, isDone: true, finishReason: response.finishReason }
  }
}

function normaliseFinishReason(
  raw: string | null | undefined
): GenerateResponse['finishReason'] {
  if (raw === 'length') return 'length'
  if (raw === 'tool_calls' || raw === 'function_call') return 'tool_call'
  if (raw === 'content_filter') return 'error'
  return 'stop'
}
