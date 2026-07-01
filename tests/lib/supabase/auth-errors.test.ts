import { describe, it, expect } from 'vitest'
import { getSupabaseAuthErrorMessage } from '../../../lib/supabase/auth-errors'

describe('getSupabaseAuthErrorMessage', () => {
  it('maps invalid credentials to friendly message', () => {
    expect(
      getSupabaseAuthErrorMessage({ message: 'Invalid login credentials' })
    ).toBe('The email or password you entered is incorrect.')
  })

  it('maps already-registered error to friendly message', () => {
    expect(
      getSupabaseAuthErrorMessage({ message: 'User already registered' })
    ).toBe('An account with this email already exists. Sign in instead or reset your password.')
  })

  it('falls back to default message for empty payload', () => {
    expect(getSupabaseAuthErrorMessage({})).toBe(
      "We couldn't complete that request. Please try again."
    )
  })

  it('passes through unknown error messages as-is', () => {
    expect(getSupabaseAuthErrorMessage({ message: 'Some unexpected error' })).toBe(
      'Some unexpected error'
    )
  })
})
