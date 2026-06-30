'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { getSupabaseAuthErrorMessage } from '@/lib/supabase/auth-errors'
import { createBrowserClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createBrowserClient()
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError(getSupabaseAuthErrorMessage(authError))
        setLoading(false)
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch (unexpectedError) {
      setError(getSupabaseAuthErrorMessage(unexpectedError))
      setLoading(false)
    }
  }

  const fieldClass =
    'w-full rounded-[1rem] border border-black/8 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none placeholder:text-slate-400 transition-all duration-150 focus:border-black/14 focus:bg-white focus:shadow-[0_0_0_4px_rgba(15,23,42,0.05)]'

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">
          Sign in to your workspace
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Enter your credentials to access MyBoss360.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400"
          >
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
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-slate-500 transition-colors hover:text-slate-950"
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={fieldClass}
          />
        </div>

        {error ? (
          <div className="rounded-[0.875rem] border border-rose-200 bg-rose-50 px-4 py-3">
            <p className="text-sm text-rose-700">{error}</p>
          </div>
        ) : null}

        <Button
          type="submit"
          disabled={loading}
          className="w-full rounded-full shadow-[0_8px_24px_-16px_rgba(15,23,42,0.32)] transition-all duration-150 hover:shadow-[0_12px_32px_-16px_rgba(15,23,42,0.42)] disabled:opacity-60"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <p className="text-center text-sm text-slate-500">
        Don&apos;t have an account?{' '}
        <Link
          href="/register"
          className="font-medium text-slate-950 hover:underline"
        >
          Create one
        </Link>
      </p>
    </div>
  )
}
