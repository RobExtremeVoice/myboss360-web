import { describe, it, expect } from 'vitest'
import { ONBOARDING_STEPS } from '../../../types/onboarding'

describe('ONBOARDING_STEPS', () => {
  it('has 8 items in the correct order', () => {
    expect(ONBOARDING_STEPS.length).toBe(8)
    expect(ONBOARDING_STEPS[0]).toBe('welcome')
    expect(ONBOARDING_STEPS[7]).toBe('finish')
  })

  it('contains all required steps', () => {
    const required = ['welcome', 'company_name', 'industry', 'company_size', 'country', 'currency', 'business_goals', 'finish']
    for (const step of required) {
      expect(ONBOARDING_STEPS).toContain(step)
    }
  })

  it('stepIndex returns correct position for each step', () => {
    expect(ONBOARDING_STEPS.indexOf('welcome')).toBe(0)
    expect(ONBOARDING_STEPS.indexOf('finish')).toBe(7)
    expect(ONBOARDING_STEPS.indexOf('company_name')).toBe(1)
  })
})
