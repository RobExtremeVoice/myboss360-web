import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { daysSince, daysUntil, daysSinceDate, clamp } from '../../lib/dates'

const NOW = new Date('2024-07-01T12:00:00.000Z').getTime()

describe('daysSince', () => {
  beforeEach(() => vi.setSystemTime(NOW))
  afterEach(() => vi.useRealTimers())

  it('returns null for null input', () => {
    expect(daysSince(null)).toBeNull()
  })

  it('returns null for undefined input', () => {
    expect(daysSince(undefined)).toBeNull()
  })

  it('returns 0 for today', () => {
    const today = new Date(NOW).toISOString()
    expect(daysSince(today)).toBeCloseTo(0, 5)
  })

  it('returns ~7 for a week ago', () => {
    const weekAgo = new Date(NOW - 7 * 86_400_000).toISOString()
    expect(daysSince(weekAgo)).toBeCloseTo(7, 3)
  })

  it('returns ~30 for 30 days ago', () => {
    const thirtyDaysAgo = new Date(NOW - 30 * 86_400_000).toISOString()
    expect(daysSince(thirtyDaysAgo)).toBeCloseTo(30, 3)
  })
})

describe('daysUntil', () => {
  beforeEach(() => vi.setSystemTime(NOW))
  afterEach(() => vi.useRealTimers())

  it('returns positive value for future date', () => {
    const future = new Date(NOW + 10 * 86_400_000).toISOString()
    expect(daysUntil(future)).toBe(10)
  })

  it('returns 0 for exactly today', () => {
    const today = new Date(NOW).toISOString()
    expect(daysUntil(today)).toBe(0)
  })

  it('returns negative value for past date', () => {
    const past = new Date(NOW - 5 * 86_400_000).toISOString()
    expect(daysUntil(past)).toBeLessThanOrEqual(-4)
  })
})

describe('daysSinceDate', () => {
  beforeEach(() => vi.setSystemTime(NOW))
  afterEach(() => vi.useRealTimers())

  it('returns ~0 for now', () => {
    expect(daysSinceDate(new Date(NOW))).toBeCloseTo(0, 5)
  })

  it('returns ~3 for 3 days ago', () => {
    expect(daysSinceDate(new Date(NOW - 3 * 86_400_000))).toBeCloseTo(3, 3)
  })
})

describe('clamp', () => {
  it('returns value unchanged when within bounds', () => {
    expect(clamp(50)).toBe(50)
    expect(clamp(0)).toBe(0)
    expect(clamp(100)).toBe(100)
  })

  it('clamps below min', () => {
    expect(clamp(-10)).toBe(0)
    expect(clamp(-1, 5, 10)).toBe(5)
  })

  it('clamps above max', () => {
    expect(clamp(200)).toBe(100)
    expect(clamp(99, 0, 50)).toBe(50)
  })

  it('rounds to integer', () => {
    expect(clamp(3.7)).toBe(4)
    expect(clamp(3.2)).toBe(3)
  })

  it('respects custom min/max', () => {
    expect(clamp(5, 10, 20)).toBe(10)
    expect(clamp(25, 10, 20)).toBe(20)
    expect(clamp(15, 10, 20)).toBe(15)
  })
})
