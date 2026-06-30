'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { getSupabaseAuthErrorMessage } from '@/lib/supabase/auth-errors'
import { createBrowserClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setNotice(null)

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      const supabase = createBrowserClient()
      const { data, error: authError } = await supabase.auth.signUp({ email, password })

      if (authError) {
        setError(getSupabaseAuthErrorMessage(authError))
        setLoading(false)
        return
      }

      if (data.session) {
        router.push('/dashboard')
        router.refresh()
        return
      }

      setNotice(
        'Your account was created. Check your email to confirm your address, then sign in to continue.'
      )
      setPassword('')
      setConfirmPassword('')
      setLoading(false)
    } catch (unexpectedError) {
      setError(getSupabaseAuthErrorMessage(unexpectedError))
      setLoading(false)
    }
  }

  const fieldClass =
    'w-full rounded-[1rem] border border-black/8 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none placeholder:text-slate-400 transition-all duration-150 focus:border-black/14 focus:bg-white focus:shadow-[0_0_0_4px_rgba(15,23,42,0.05)]'

  const labelClass =
    'text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400'

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">
          Create your workspace
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Set up your MyBoss360 executive account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className={labelClass}>
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            className={fieldClass}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className={labelClass}>
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            className={fieldClass}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="confirmPassword" className={labelClass}>
            Confirm password
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className={fieldClass}
          />
        </div>

        {error ? (
          <div className="rounded-[0.875rem] border border-rose-200 bg-rose-50 px-4 py-3">
            <p className="text-sm text-rose-700">{error}</p>
          </div>
        ) : null}

        {notice ? (
          <div className="rounded-[0.875rem] border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-sm text-emerald-700">{notice}</p>
          </div>
        ) : null}

        <Button
          type="submit"
          disabled={loading}
          className="w-full rounded-full shadow-[0_8px_24px_-16px_rgba(15,23,42,0.32)] transition-all duration-150 hover:shadow-[0_12px_32px_-16px_rgba(15,23,42,0.42)] disabled:opacity-60"
        >
          {loading ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-medium text-slate-950 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
