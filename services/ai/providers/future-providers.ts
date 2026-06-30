import type { AICapability, AIProvider, AIProviderStatus, GenerateResponse, StreamChunk } from '@/types/ai'

// Placeholder providers — not connected. Implement generate() when integrating real providers.

abstract class UnimplementedProvider implements AIProvider {
  abstract readonly id: string
  abstract readonly name: string
  abstract readonly modelId: string
  abstract readonly capabilities: AICapability[]
  abstract readonly maxContextTokens: number
  abstract readonly supportsStreaming: boolean
  readonly status: AIProviderStatus = 'unconfigured'

  generate(): Promise<GenerateResponse> {
    return Promise.reject(
      new Error(`${this.name} is not yet configured. Set the API key in environment variables.`)
    )
  }

  async *stream(): AsyncIterable<StreamChunk> {
    throw new Error(`${this.name} streaming is not yet configured.`)
  }
}

export class FutureOpenAIProvider extends UnimplementedProvider {
  readonly id = 'openai'
  readonly name = 'OpenAI'
  readonly modelId = 'gpt-4o'
  readonly capabilities: AICapability[] = ['text', 'tool_use', 'vision', 'code']
  readonly maxContextTokens = 128_000
  readonly supportsStreaming = true
  // Wire: OPENAI_API_KEY env var + openai npm package (not installed yet)
}

export class FutureAnthropicProvider extends UnimplementedProvider {
  readonly id = 'anthropic'
  readonly name = 'Anthropic'
  readonly modelId = 'claude-sonnet-4-6'
  readonly capabilities: AICapability[] = ['text', 'tool_use', 'vision', 'code']
  readonly maxContextTokens = 200_000
  readonly supportsStreaming = true
  // Wire: ANTHROPIC_API_KEY env var + @anthropic-ai/sdk npm package
}

export class FutureGeminiProvider extends UnimplementedProvider {
  readonly id = 'gemini'
  readonly name = 'Google Gemini'
  readonly modelId = 'gemini-2.0-flash'
  readonly capabilities: AICapability[] = ['text', 'tool_use', 'vision', 'code']
  readonly maxContextTokens = 1_000_000
  readonly supportsStreaming = true
  // Wire: GEMINI_API_KEY env var + @google/generative-ai npm package
}

export class FutureOllamaProvider extends UnimplementedProvider {
  readonly id = 'ollama'
  readonly name = 'Ollama (local)'
  readonly modelId = 'llama3.2'
  readonly capabilities: AICapability[] = ['text', 'code']
  readonly maxContextTokens = 32_000
  readonly supportsStreaming = true
  // Wire: OLLAMA_BASE_URL env var; no npm package needed (REST API)
}
