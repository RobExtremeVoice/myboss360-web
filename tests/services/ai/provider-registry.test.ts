import { describe, it, expect } from 'vitest'
import {
  registerProvider,
  getProvider,
  getDefaultProvider,
  isProviderRegistered,
  listProviders,
} from '../../../services/ai/provider-registry'
import type { AIProvider, AICapability, AIProviderStatus, GenerateResponse, StreamChunk } from '../../../types/ai'

function makeStub(id: string, status: AIProviderStatus = 'active'): AIProvider {
  return {
    id,
    name: `Stub-${id}`,
    modelId: 'test-model',
    capabilities: ['text'] as AICapability[],
    maxContextTokens: 4096,
    supportsStreaming: false,
    status,
    async generate(): Promise<GenerateResponse> {
      return { content: 'stub', model: 'test-model', tokensUsed: 1, finishReason: 'stop' }
    },
    async *stream(): AsyncIterable<StreamChunk> {
      yield { delta: 'stub', isDone: true }
    },
  }
}

describe('provider-registry', () => {
  it('registers a provider and retrieves it by id', () => {
    const stub = makeStub('test-reg-a')
    registerProvider(stub)
    expect(isProviderRegistered('test-reg-a')).toBe(true)
    expect(getProvider('test-reg-a').name).toBe('Stub-test-reg-a')
  })

  it('throws when requesting an unregistered provider id', () => {
    expect(() => getProvider('does-not-exist')).toThrow(/not registered/i)
  })

  it('getDefaultProvider returns the first active provider', () => {
    registerProvider(makeStub('test-active-1'))
    const provider = getDefaultProvider()
    expect(provider.status).toBe('active')
  })

  it('getDefaultProvider skips unconfigured providers', () => {
    registerProvider(makeStub('test-uncfg', 'unconfigured'))
    registerProvider(makeStub('test-active-2'))
    const provider = getDefaultProvider('test-uncfg')
    expect(provider.id).not.toBe('test-uncfg')
    expect(provider.status).toBe('active')
  })

  it('listProviders returns all registered providers', () => {
    const before = listProviders().length
    registerProvider(makeStub('test-list-x'))
    registerProvider(makeStub('test-list-y'))
    expect(listProviders().length).toBe(before + 2)
  })
})
