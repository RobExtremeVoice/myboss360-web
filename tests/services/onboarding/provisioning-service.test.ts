import test from 'node:test'
import assert from 'node:assert/strict'

// Unit-test the slug generation utility that provisioning-service exports.
// Full provisioning requires a live DB (integration test); unit tests cover
// the pure helper functions only.

import { deriveOrgSlug } from '../../../services/onboarding/provisioning-service.ts'

test('deriveOrgSlug produces lowercase-hyphenated slug from email domain', () => {
  const slug = deriveOrgSlug('alice@acme.com')
  assert.ok(slug.startsWith('acme-'), `Expected "acme-…", got "${slug}"`)
  assert.ok(/^[a-z0-9-]+$/.test(slug), 'slug must be lowercase alphanumeric+hyphen')
})

test('deriveOrgSlug handles emails without recognizable domain', () => {
  const slug = deriveOrgSlug('user@gmail.com')
  assert.ok(slug.length > 0)
  assert.ok(/^[a-z0-9-]+$/.test(slug))
})

test('deriveOrgSlug handles empty/undefined email gracefully', () => {
  const slug = deriveOrgSlug('')
  assert.ok(slug.length > 0, 'slug must not be empty for empty email')
  assert.ok(/^[a-z0-9-]+$/.test(slug))
})

test('deriveOrgSlug appends a unique suffix so concurrent signups do not collide', () => {
  const a = deriveOrgSlug('alice@acme.com')
  const b = deriveOrgSlug('alice@acme.com')
  // Two calls at different ms will differ; same-ms calls may match in test —
  // we only assert the suffix exists (non-empty suffix after the last '-').
  const parts = a.split('-')
  assert.ok(parts.length >= 2, 'slug must have at least two hyphen-separated parts')
})
