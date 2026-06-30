import type { AIProvider } from '@/types/ai'

const registry = new Map<string, AIProvider>()

export function registerProvider(provider: AIProvider): void {
  registry.set(provider.id, provider)
}

export function getProvider(id: string): AIProvider {
  const provider = registry.get(id)
  if (!provider) throw new Error(`AI provider "${id}" is not registered.`)
  return provider
}

export function getDefaultProvider(preferredId?: string): AIProvider {
  if (preferredId) {
    const preferred = registry.get(preferredId)
    if (preferred && preferred.status === 'active') return preferred
  }

  // Prefer first active provider; fall back to mock
  for (const provider of registry.values()) {
    if (provider.status === 'active') return provider
  }

  throw new Error('No active AI provider is registered.')
}

export function listProviders(): AIProvider[] {
  return Array.from(registry.values())
}

export function isProviderRegistered(id: string): boolean {
  return registry.has(id)
}
