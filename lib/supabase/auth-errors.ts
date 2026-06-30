const DEFAULT_AUTH_ERROR_MESSAGE =
  "We couldn't complete that request. Please try again."

const AUTH_ERROR_MESSAGE_MAP: Array<{
  pattern: RegExp
  message: string
}> = [
  {
    pattern: /invalid login credentials/i,
    message: 'The email or password you entered is incorrect.',
  },
  {
    pattern: /email not confirmed|email address not authorized/i,
    message: 'Check your email and confirm your account before signing in.',
  },
  {
    pattern: /user already registered|already been registered/i,
    message:
      'An account with this email already exists. Sign in instead or reset your password.',
  },
  {
    pattern: /password should be at least|password must be at least/i,
    message: 'Password must be at least 6 characters.',
  },
  {
    pattern: /network request failed|failed to fetch/i,
    message: 'Unable to reach Supabase right now. Check your connection and try again.',
  },
]

function extractMessage(error: unknown): string | null {
  if (typeof error === 'string') {
    return error.trim() || null
  }

  if (error && typeof error === 'object') {
    const maybeMessage = Reflect.get(error, 'message')
    if (typeof maybeMessage === 'string' && maybeMessage.trim()) {
      return maybeMessage.trim()
    }

    const maybeDescription = Reflect.get(error, 'error_description')
    if (typeof maybeDescription === 'string' && maybeDescription.trim()) {
      return maybeDescription.trim()
    }

    const maybeCode = Reflect.get(error, 'code')
    if (typeof maybeCode === 'string' && maybeCode.trim()) {
      return maybeCode.trim()
    }
  }

  return null
}

export function getSupabaseAuthErrorMessage(error: unknown): string {
  const message = extractMessage(error)

  if (!message || message === '{}') {
    return DEFAULT_AUTH_ERROR_MESSAGE
  }

  const mapped = AUTH_ERROR_MESSAGE_MAP.find(({ pattern }) => pattern.test(message))
  return mapped?.message ?? message
}
