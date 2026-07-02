import { describe, it, expect } from 'vitest'
import { INTEGRATION_REGISTRY } from '../../config/integrations'

describe('INTEGRATION_REGISTRY', () => {
  it('contains exactly 16 integrations', () => {
    expect(INTEGRATION_REGISTRY).toHaveLength(16)
  })

  it('every entry has required fields', () => {
    for (const def of INTEGRATION_REGISTRY) {
      expect(typeof def.id).toBe('string')
      expect(def.id.length).toBeGreaterThan(0)
      expect(typeof def.name).toBe('string')
      expect(typeof def.description).toBe('string')
      expect(['google_workspace', 'microsoft_365', 'crm', 'communication', 'ai_providers']).toContain(def.category)
    }
  })

  it('Google Workspace integrations have connectHref', () => {
    const googleIntegrations = INTEGRATION_REGISTRY.filter(i => i.category === 'google_workspace')
    expect(googleIntegrations.length).toBe(4) // Gmail, Calendar, Contacts, Drive
    for (const def of googleIntegrations) {
      expect(def.connectHref).toBeDefined()
    }
  })

  it('non-Google integrations have no connectHref', () => {
    const nonGoogle = INTEGRATION_REGISTRY.filter(i => i.category !== 'google_workspace')
    for (const def of nonGoogle) {
      expect(def.connectHref).toBeUndefined()
    }
  })
})
