import test from 'node:test'
import assert from 'node:assert/strict'
import { ONBOARDING_STEPS } from '../../../types/onboarding.ts'

test('ONBOARDING_STEPS has 8 items in the correct order', () => {
  assert.equal(ONBOARDING_STEPS.length, 8)
  assert.equal(ONBOARDING_STEPS[0], 'welcome')
  assert.equal(ONBOARDING_STEPS[7], 'finish')
})

test('ONBOARDING_STEPS contains all required steps', () => {
  const required = ['welcome', 'company_name', 'industry', 'company_size', 'country', 'currency', 'business_goals', 'finish']
  for (const step of required) {
    assert.ok(ONBOARDING_STEPS.includes(step as never), `Missing step: ${step}`)
  }
})

test('stepIndex returns correct position for each step', () => {
  assert.equal(ONBOARDING_STEPS.indexOf('welcome'), 0)
  assert.equal(ONBOARDING_STEPS.indexOf('finish'), 7)
  assert.equal(ONBOARDING_STEPS.indexOf('company_name'), 1)
})
