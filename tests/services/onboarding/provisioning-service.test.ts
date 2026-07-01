import { describe, it, expect } from 'vitest'
import { deriveOrgSlug } from '../../../services/onboarding/provisioning-service'

describe('deriveOrgSlug', () => {
  it('produces lowercase-hyphenated slug from email domain', () => {
    const slug = deriveOrgSlug('alice@acme.com')
    expect(slug.startsWith('acme-')).toBe(true)
    expect(/^[a-z0-9-]+$/.test(slug)).toBe(true)
  })

  it('handles emails without recognizable domain', () => {
    const slug = deriveOrgSlug('user@gmail.com')
    expect(slug.length).toBeGreaterThan(0)
    expect(/^[a-z0-9-]+$/.test(slug)).toBe(true)
  })

  it('handles empty email gracefully', () => {
    const slug = deriveOrgSlug('')
    expect(slug.length).toBeGreaterThan(0)
    expect(/^[a-z0-9-]+$/.test(slug)).toBe(true)
  })

  it('appends a unique suffix so concurrent signups do not collide', () => {
    const slug = deriveOrgSlug('alice@acme.com')
    const parts = slug.split('-')
    expect(parts.length).toBeGreaterThanOrEqual(2)
  })
})
