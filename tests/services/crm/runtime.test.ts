import { describe, it, expect } from 'vitest'
import { shouldUseDevelopmentCrmFallback } from '../../../services/crm/runtime'

describe('shouldUseDevelopmentCrmFallback', () => {
  it('enables fallback for empty workspace in development', () => {
    expect(
      shouldUseDevelopmentCrmFallback({ hasLiveRecords: false, nodeEnv: 'development' })
    ).toBe(true)
  })

  it('disables fallback in production regardless of records', () => {
    expect(
      shouldUseDevelopmentCrmFallback({ hasLiveRecords: false, nodeEnv: 'production' })
    ).toBe(false)
  })

  it('disables fallback when live records exist', () => {
    expect(
      shouldUseDevelopmentCrmFallback({ hasLiveRecords: true, nodeEnv: 'development' })
    ).toBe(false)
  })

  it('disables fallback when live records exist in production', () => {
    expect(
      shouldUseDevelopmentCrmFallback({ hasLiveRecords: true, nodeEnv: 'production' })
    ).toBe(false)
  })
})
