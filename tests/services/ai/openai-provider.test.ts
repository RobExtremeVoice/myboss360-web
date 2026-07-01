import { describe, it, expect } from 'vitest'
import { OpenAIProvider } from '../../../services/ai/providers/openai-provider'

function withEnv(key: string, value: string | undefined, fn: () => void) {
  const original = process.env[key]
  if (value === undefined) {
    delete process.env[key]
  } else {
    process.env[key] = value
  }
  try {
    fn()
  } finally {
    if (original === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = original
    }
  }
}

describe('OpenAIProvider', () => {
  it('has correct static properties', () => {
    withEnv('OPENAI_API_KEY', undefined, () => {
      const provider = new OpenAIProvider()
      expect(provider.id).toBe('openai')
      expect(provider.name).toBe('OpenAI')
      expect(provider.maxContextTokens).toBeGreaterThanOrEqual(128_000)
      expect(provider.capabilities).toContain('text')
    })
  })

  it('status is unconfigured when OPENAI_API_KEY is absent', () => {
    withEnv('OPENAI_API_KEY', undefined, () => {
      const provider = new OpenAIProvider()
      expect(provider.status).toBe('unconfigured')
    })
  })

  it('status is active when OPENAI_API_KEY is present', () => {
    withEnv('OPENAI_API_KEY', 'sk-test-fake-key', () => {
      const provider = new OpenAIProvider()
      expect(provider.status).toBe('active')
    })
  })

  it('generate() rejects with a clear message when API key is missing', async () => {
    let promise!: Promise<unknown>
    withEnv('OPENAI_API_KEY', undefined, () => {
      const provider = new OpenAIProvider()
      promise = provider.generate({ systemPrompt: 'test', messages: [{ role: 'user', content: 'hello' }] })
    })
    await expect(promise).rejects.toThrow(/OPENAI_API_KEY/i)
  })

  it('modelId matches the config default (gpt-4o-mini)', () => {
    withEnv('OPENAI_API_KEY', undefined, () => {
      const provider = new OpenAIProvider()
      expect(provider.modelId).toBe('gpt-4o-mini')
    })
  })
})
