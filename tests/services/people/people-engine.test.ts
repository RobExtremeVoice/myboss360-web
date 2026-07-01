import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  computeRelationshipStrength,
  computeEngagementScore,
  computeInfluenceScore,
  isDecisionMaker,
  isChampion,
} from '../../../services/people/people-engine'
import type { PersonMergeInput } from '../../../types/people'

const NOW = new Date('2024-07-01T12:00:00.000Z').getTime()

function makeInput(overrides: Partial<PersonMergeInput> = {}): PersonMergeInput {
  return {
    email: 'test@example.com',
    fullName: 'Test User',
    jobTitle: null,
    companyName: null,
    companyId: null,
    crmContactId: null,
    gmailContactId: null,
    sources: ['crm'],
    emailCount: 0,
    meetingCount: 0,
    inboundEmailCount: 0,
    outboundEmailCount: 0,
    lastInteractionAt: null,
    firstInteractionAt: null,
    awaitingReply: false,
    hasActiveDeal: false,
    ...overrides,
  }
}

describe('computeRelationshipStrength', () => {
  beforeEach(() => vi.setSystemTime(NOW))
  afterEach(() => vi.useRealTimers())

  it('returns 0 for a contact with no interactions', () => {
    expect(computeRelationshipStrength(makeInput())).toBe(0)
  })

  it('adds recency bonus for interaction within 7 days', () => {
    const input = makeInput({ lastInteractionAt: new Date(NOW - 3 * 86_400_000).toISOString() })
    const score = computeRelationshipStrength(input)
    expect(score).toBeGreaterThanOrEqual(25)
  })

  it('adds reciprocity bonus when both inbound and outbound emails exist', () => {
    const base = computeRelationshipStrength(makeInput())
    const withReciprocity = computeRelationshipStrength(
      makeInput({ inboundEmailCount: 3, outboundEmailCount: 2 })
    )
    expect(withReciprocity - base).toBe(20)
  })

  it('caps email frequency contribution at 25', () => {
    // 10 emails × 2.5 = 25 — already at cap; 20 emails × 2.5 = 50 → should cap at 25
    const ten = computeRelationshipStrength(makeInput({ emailCount: 10 }))
    const twenty = computeRelationshipStrength(makeInput({ emailCount: 20 }))
    expect(ten).toBe(twenty)
  })

  it('caps meeting frequency contribution at 20', () => {
    const two = computeRelationshipStrength(makeInput({ meetingCount: 2 }))
    const ten = computeRelationshipStrength(makeInput({ meetingCount: 10 }))
    expect(ten).toBe(two) // both capped at 20
  })

  it('adds deal bonus for active deal', () => {
    const without = computeRelationshipStrength(makeInput())
    const with_ = computeRelationshipStrength(makeInput({ hasActiveDeal: true }))
    expect(with_ - without).toBe(10)
  })

  it('clamps result between 0 and 100', () => {
    const maxInput = makeInput({
      lastInteractionAt: new Date(NOW - 2 * 86_400_000).toISOString(),
      emailCount: 20,
      meetingCount: 10,
      inboundEmailCount: 5,
      outboundEmailCount: 5,
      hasActiveDeal: true,
    })
    const score = computeRelationshipStrength(maxInput)
    expect(score).toBeLessThanOrEqual(100)
    expect(score).toBeGreaterThanOrEqual(0)
  })
})

describe('computeEngagementScore', () => {
  beforeEach(() => vi.setSystemTime(NOW))
  afterEach(() => vi.useRealTimers())

  it('returns 0 for no interactions', () => {
    expect(computeEngagementScore(makeInput())).toBe(0)
  })

  it('adds email frequency contribution', () => {
    const score = computeEngagementScore(makeInput({ emailCount: 5 }))
    expect(score).toBe(25) // 5 × 5 = 25
  })

  it('caps email at 50', () => {
    const ten = computeEngagementScore(makeInput({ emailCount: 10 }))
    const twenty = computeEngagementScore(makeInput({ emailCount: 20 }))
    expect(ten).toBe(fifty()) // 10 × 5 = 50
    expect(twenty).toBe(fifty())
    function fifty() { return 50 }
  })

  it('adds recency bonus for interaction within 7 days', () => {
    const recent = new Date(NOW - 2 * 86_400_000).toISOString()
    const noBonus = computeEngagementScore(makeInput({ emailCount: 3 }))
    const withBonus = computeEngagementScore(makeInput({ emailCount: 3, lastInteractionAt: recent }))
    expect(withBonus - noBonus).toBe(20)
  })

  it('clamps between 0 and 100', () => {
    const max = makeInput({
      emailCount: 30,
      meetingCount: 10,
      lastInteractionAt: new Date(NOW - 86_400_000).toISOString(),
    })
    expect(computeEngagementScore(max)).toBeLessThanOrEqual(100)
  })
})

describe('computeInfluenceScore', () => {
  it('starts at base 20 for unknown title', () => {
    const score = computeInfluenceScore(makeInput({ jobTitle: 'Staff Engineer' }))
    expect(score).toBe(20) // base only, no email volume
  })

  it('adds 40 for C-suite titles', () => {
    const ceo = computeInfluenceScore(makeInput({ jobTitle: 'CEO' }))
    expect(ceo).toBe(60) // 20 + 40
  })

  it('adds 40 for founder', () => {
    const founder = computeInfluenceScore(makeInput({ jobTitle: 'Co-Founder & CTO' }))
    expect(founder).toBe(60)
  })

  it('adds 25 for senior titles', () => {
    const vp = computeInfluenceScore(makeInput({ jobTitle: 'VP of Engineering' }))
    expect(vp).toBe(45) // 20 + 25
  })

  it('adds 10 for manager titles', () => {
    const mgr = computeInfluenceScore(makeInput({ jobTitle: 'Engineering Manager' }))
    expect(mgr).toBe(30) // 20 + 10
  })

  it('is case-insensitive', () => {
    const upper = computeInfluenceScore(makeInput({ jobTitle: 'CEO' }))
    const lower = computeInfluenceScore(makeInput({ jobTitle: 'ceo' }))
    expect(upper).toBe(lower)
  })

  it('adds 20 for active deal', () => {
    const without = computeInfluenceScore(makeInput({ jobTitle: null }))
    const with_ = computeInfluenceScore(makeInput({ jobTitle: null, hasActiveDeal: true }))
    expect(with_ - without).toBe(20)
  })

  it('clamps between 0 and 100', () => {
    const max = makeInput({
      jobTitle: 'CEO',
      emailCount: 100,
      hasActiveDeal: true,
    })
    expect(computeInfluenceScore(max)).toBeLessThanOrEqual(100)
  })
})

describe('isDecisionMaker', () => {
  it('returns false for null title', () => {
    expect(isDecisionMaker(null)).toBe(false)
  })

  it('returns true for CEO', () => {
    expect(isDecisionMaker('CEO')).toBe(true)
  })

  it('returns true for Director of Sales', () => {
    expect(isDecisionMaker('Director of Sales')).toBe(true)
  })

  it('returns true for VP Engineering', () => {
    expect(isDecisionMaker('VP Engineering')).toBe(true)
  })

  it('returns false for non-decision-maker titles', () => {
    expect(isDecisionMaker('Junior Developer')).toBe(false)
    expect(isDecisionMaker('Account Executive')).toBe(false)
  })

  it('is case-insensitive', () => {
    expect(isDecisionMaker('ceo')).toBe(true)
    expect(isDecisionMaker('CTO')).toBe(true)
  })
})

describe('isChampion', () => {
  beforeEach(() => vi.setSystemTime(NOW))
  afterEach(() => vi.useRealTimers())

  it('returns false when relationship strength is below threshold', () => {
    const recentDate = new Date(NOW - 5 * 86_400_000).toISOString()
    expect(isChampion(60, 80, recentDate)).toBe(false)
  })

  it('returns false when engagement score is below threshold', () => {
    const recentDate = new Date(NOW - 5 * 86_400_000).toISOString()
    expect(isChampion(80, 50, recentDate)).toBe(false)
  })

  it('returns false when last interaction is more than 30 days ago', () => {
    const staleDate = new Date(NOW - 45 * 86_400_000).toISOString()
    expect(isChampion(80, 70, staleDate)).toBe(false)
  })

  it('returns false for null last interaction', () => {
    expect(isChampion(80, 70, null)).toBe(false)
  })

  it('returns true when all thresholds met and interaction within 30 days', () => {
    const recentDate = new Date(NOW - 10 * 86_400_000).toISOString()
    expect(isChampion(80, 70, recentDate)).toBe(true)
  })

  it('returns true for interaction exactly at 30-day boundary', () => {
    const boundaryDate = new Date(NOW - 30 * 86_400_000).toISOString()
    expect(isChampion(80, 70, boundaryDate)).toBe(true)
  })
})
