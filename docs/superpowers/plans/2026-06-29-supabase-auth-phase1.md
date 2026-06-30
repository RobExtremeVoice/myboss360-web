# Sprint 8 — SaaS Foundation (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate Supabase Auth into MyBoss360 — cookie-based sessions, middleware route protection, AuthProvider context, real login/register forms, and sign-out — without new packages or UI redesign.

**Architecture:** Sessions are persisted in browser cookies (not localStorage) via a custom `CookieStorage` adapter so that Next.js middleware and Server Components can read them server-side. Three Supabase client factories cover the three execution contexts: browser (Client Components), server (`next/headers`), and middleware (`NextRequest`/`NextResponse`). The dashboard layout performs a server-side auth check before rendering; middleware is a second, earlier defence layer.

**Tech Stack:** Next.js 16.2.9 App Router, `@supabase/supabase-js` v2.108.2, React Context, TypeScript, Tailwind CSS (existing). No additional packages.

## Global Constraints

- Do NOT install any packages. `@supabase/supabase-js` is already present.
- Do NOT redesign the UI — match the existing premium Apple/Linear/Stripe design language.
- Do NOT modify the landing page (`app/(marketing)/`, `app/page.tsx`, `components/sections/`).
- Do NOT modify `package.json`.
- Do NOT create new routes or pages beyond what the spec requires.
- Do NOT implement database tables. Supabase Auth only.
- All mock data stays in `config/` files untouched.
- `npm run lint` and `npm run build` must pass before completion.
- Environment variables live in `.env.local`. The two required keys — `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` — are already present.

---

## File Map

**Created:**
- `lib/supabase/types.ts` — Database type stub; Phase 2 will replace with `supabase gen types`
- `lib/supabase/client.ts` — `createBrowserClient()` singleton with cookie storage adapter
- `lib/supabase/server.ts` — `createServerClient()` async factory; reads `next/headers` cookies
- `lib/supabase/middleware.ts` — `createMiddlewareClient(req, res)` factory; reads/writes `NextRequest`/`NextResponse` cookies
- `middleware.ts` (project root) — Next.js Edge Middleware protecting `/dashboard/*`
- `providers/AuthProvider.tsx` — React Context: `session`, `user`, `loading`, `signOut`

**Modified:**
- `app/(auth)/login/page.tsx` — Replaces `PlaceholderPage` with a real email/password form
- `app/(auth)/register/page.tsx` — Replaces `PlaceholderPage` with a real sign-up form
- `app/(dashboard)/layout.tsx` — Server-side auth check + `AuthProvider` wrapper
- `components/dashboard/UserMenu.tsx` — Adds sign-out dropdown, converts to Client Component

---

## Task 1: Supabase Client Infrastructure

**Files:**
- Create: `lib/supabase/types.ts`
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `lib/supabase/middleware.ts`

**Interfaces:**
- Produces:
  - `createBrowserClient(): SupabaseClient<Database>` (singleton)
  - `createServerClient(): Promise<SupabaseClient<Database>>`
  - `createMiddlewareClient(request: NextRequest, response: NextResponse): SupabaseClient<Database>`
  - `Database` type (stub)

---

- [ ] **Step 1.1 — Create `lib/supabase/types.ts`**

```ts
// Database type stub.
// Phase 2: replace with output of `npx supabase gen types typescript --project-id <ref>`
export type Database = Record<string, never>
```

- [ ] **Step 1.2 — Create `lib/supabase/client.ts`**

Custom `CookieStorage` adapter persists sessions in `document.cookie` so middleware and Server Components can read them. The singleton pattern prevents multiple Supabase instances and duplicate `onAuthStateChange` subscriptions.

```ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'

type BrowserClient = SupabaseClient<Database>

let singleton: BrowserClient | null = null

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return decodeURIComponent(parts.pop()!.split(';')[0])
  return null
}

function setCookie(name: string, value: string, maxAge = 604800): void {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`
}

function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=; path=/; max-age=0; path=/`
}

const cookieStorage = {
  getItem: (key: string) => getCookie(key),
  setItem: (key: string, value: string) => setCookie(key, value),
  removeItem: (key: string) => deleteCookie(key),
}

export function createBrowserClient(): BrowserClient {
  if (singleton) return singleton

  singleton = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        storage: cookieStorage,
        persistSession: true,
        autoRefreshToken: true,
      },
    }
  )

  return singleton
}
```

- [ ] **Step 1.3 — Create `lib/supabase/server.ts`**

Server Components are read-only — they cannot set cookies. `autoRefreshToken: false` prevents the server from attempting a network refresh it can't persist. `detectSessionInUrl: false` prevents parsing URL hashes that don't exist in SSR context.

```ts
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from './types'

export async function createServerClient() {
  const cookieStore = await cookies()

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        storage: {
          getItem: (key: string) => cookieStore.get(key)?.value ?? null,
          setItem: () => { /* Server Components are read-only */ },
          removeItem: () => { /* Server Components are read-only */ },
        },
        persistSession: true,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  )
}
```

- [ ] **Step 1.4 — Create `lib/supabase/middleware.ts`**

Middleware CAN write to response cookies via `response.cookies`, so `autoRefreshToken: true` is safe here — it allows the middleware to silently refresh an expiring token and write the updated session back to the response.

```ts
import { createClient } from '@supabase/supabase-js'
import type { NextRequest, NextResponse } from 'next/server'
import type { Database } from './types'

export function createMiddlewareClient(
  request: NextRequest,
  response: NextResponse
) {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        storage: {
          getItem: (key: string) => request.cookies.get(key)?.value ?? null,
          setItem: (key: string, value: string) => {
            response.cookies.set(key, value, {
              path: '/',
              maxAge: 604800,
              sameSite: 'lax',
              httpOnly: false,
            })
          },
          removeItem: (key: string) => response.cookies.delete(key),
        },
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    }
  )
}
```

- [ ] **Step 1.5 — Verify TypeScript compiles**

```bash
cd /Users/robsonsilverio/myboss360-web
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors in `lib/supabase/*`.

---

## Task 2: Middleware Route Protection

**Files:**
- Create: `middleware.ts` (project root — next to `app/`)

**Interfaces:**
- Consumes: `createMiddlewareClient(req, res)` from `@/lib/supabase/middleware`
- Produces: Next.js middleware that redirects unauthenticated requests for `/dashboard/:path*` to `/login`

---

- [ ] **Step 2.1 — Create `middleware.ts` at the project root**

```ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createMiddlewareClient(request, response)

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
```

- [ ] **Step 2.2 — Manual smoke test**

Visit `http://localhost:3000/dashboard` without being logged in.
Expected: browser redirects to `http://localhost:3000/login`.

---

## Task 3: AuthProvider

**Files:**
- Create: `providers/AuthProvider.tsx`

**Interfaces:**
- Consumes: `createBrowserClient()` from `@/lib/supabase/client`
- Produces:
  - `AuthProvider({ children }): JSX.Element` — wraps the dashboard layout
  - `useAuth(): { session, user, loading, signOut }` — hook for child components

---

- [ ] **Step 3.1 — Create `providers/AuthProvider.tsx`**

`loading` is `true` until `getSession()` resolves on the client. The AuthProvider renders a full-screen spinner during that window, preventing a flash of unauthenticated content during React hydration. `useMemo` prevents re-creating the Supabase client on every render.

```tsx
'use client'

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { createBrowserClient } from '@/lib/supabase/client'

type AuthContextValue = {
  session: Session | null
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

type AuthProviderProps = {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = useMemo(() => createBrowserClient(), [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  async function signOut() {
    await supabase.auth.signOut()
    setSession(null)
  }

  return (
    <AuthContext.Provider
      value={{ session, user: session?.user ?? null, loading, signOut }}
    >
      {loading ? (
        <div className="flex min-h-screen items-center justify-center bg-slate-100">
          <div className="size-6 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider />')
  return ctx
}
```

---

## Task 4: Login Page

**Files:**
- Modify: `app/(auth)/login/page.tsx` (full replacement)

**Interfaces:**
- Consumes: `createBrowserClient()` from `@/lib/supabase/client`
- Produces: A Client Component with email/password form; on success redirects to `/dashboard`

---

- [ ] **Step 4.1 — Replace `app/(auth)/login/page.tsx`**

The form inherits the auth layout card. Fields use the same focus-ring pattern established in Sprint 7's `SearchBar`. The error block uses the same rose palette as the dashboard risk badges.

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
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

    const supabase = createBrowserClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

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
            className="w-full rounded-[1rem] border border-black/8 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none placeholder:text-slate-400 transition-all duration-150 focus:border-black/14 focus:bg-white focus:shadow-[0_0_0_4px_rgba(15,23,42,0.05)]"
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
              className="text-xs font-medium text-slate-500 hover:text-slate-950 transition-colors"
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
            className="w-full rounded-[1rem] border border-black/8 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none placeholder:text-slate-400 transition-all duration-150 focus:border-black/14 focus:bg-white focus:shadow-[0_0_0_4px_rgba(15,23,42,0.05)]"
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
```

---

## Task 5: Register Page

**Files:**
- Modify: `app/(auth)/register/page.tsx` (full replacement)

**Interfaces:**
- Consumes: `createBrowserClient()` from `@/lib/supabase/client`
- Produces: A Client Component sign-up form; on success redirects to `/dashboard`

---

- [ ] **Step 5.1 — Replace `app/(auth)/register/page.tsx`**

Client-side password validation before hitting Supabase (`length >= 6`, password match) avoids unnecessary round trips and matches Supabase's minimum password length requirement.

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createBrowserClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    const supabase = createBrowserClient()
    const { error: authError } = await supabase.auth.signUp({ email, password })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
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
```

---

## Task 6: Protected Dashboard Layout + Sign-Out

**Files:**
- Modify: `app/(dashboard)/layout.tsx`
- Modify: `components/dashboard/UserMenu.tsx`

**Interfaces:**
- Consumes:
  - `createServerClient()` from `@/lib/supabase/server`
  - `AuthProvider` from `@/providers/AuthProvider`
  - `useAuth()` from `@/providers/AuthProvider`
- Produces: Server-side auth guard + client-side sign-out flow

---

- [ ] **Step 6.1 — Replace `app/(dashboard)/layout.tsx`**

The server-side `getSession()` check is the primary guard; middleware is the early guard. Both check independently. `router.refresh()` after sign-out flushes the Next.js router cache so the middleware re-evaluates on the next navigation.

```tsx
import { redirect } from 'next/navigation'

import { AppShell } from '@/components/dashboard/AppShell'
import { AuthProvider } from '@/providers/AuthProvider'
import { createServerClient } from '@/lib/supabase/server'

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const supabase = await createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  return (
    <AuthProvider>
      <AppShell>{children}</AppShell>
    </AuthProvider>
  )
}
```

- [ ] **Step 6.2 — Replace `components/dashboard/UserMenu.tsx`**

Converts to a Client Component. The sign-out dropdown uses `useState` for visibility, an `onBlur` + `tabIndex` pattern for keyboard-accessible close, and `useRouter().refresh()` to clear the Next.js cache after sign-out so the middleware re-runs on the next navigation.

```tsx
'use client'

import { useState, useRef } from 'react'
import { ChevronDown, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/providers/AuthProvider'

export function UserMenu() {
  const [open, setOpen] = useState(false)
  const { user, signOut } = useAuth()
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)

  const displayName = user?.email?.split('@')[0] ?? 'MyBoss Admin'
  const displayEmail = user?.email ?? 'Administrator'

  async function handleSignOut() {
    setOpen(false)
    await signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-black/8 bg-white pl-1.5 pr-3 py-1.5 shadow-[0_10px_28px_-24px_rgba(15,23,42,0.18)] transition-all duration-150 hover:border-black/12 hover:bg-slate-50 active:scale-[0.98]"
        aria-label="User menu"
        aria-expanded={open}
      >
        <div className="flex size-8 items-center justify-center rounded-full bg-slate-950 text-[11px] font-semibold text-white ring-2 ring-white">
          {displayName.slice(0, 2).toUpperCase()}
        </div>
        <div className="hidden text-left sm:block">
          <p className="text-sm font-medium leading-tight text-slate-950 capitalize">
            {displayName}
          </p>
          <p className="text-[11px] leading-tight text-slate-400">{displayEmail}</p>
        </div>
        <ChevronDown
          className={[
            'size-3.5 text-slate-400 transition-transform duration-150',
            open ? 'rotate-180' : '',
          ].join(' ')}
        />
      </button>

      {open ? (
        <>
          {/* Click-outside overlay */}
          <button
            type="button"
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            tabIndex={-1}
          />
          {/* Dropdown panel */}
          <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-[1.25rem] border border-black/8 bg-white p-1.5 shadow-[0_20px_56px_-30px_rgba(15,23,42,0.28)]">
            <div className="border-b border-black/6 px-3 pb-3 pt-2">
              <p className="text-xs font-medium text-slate-950 capitalize">{displayName}</p>
              <p className="mt-0.5 text-[11px] text-slate-400 truncate">{displayEmail}</p>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="mt-1.5 flex w-full items-center gap-2.5 rounded-[0.875rem] px-3 py-2.5 text-left text-sm text-slate-600 transition-colors duration-100 hover:bg-slate-50 hover:text-slate-950"
            >
              <LogOut className="size-3.5 text-slate-400" />
              Sign out
            </button>
          </div>
        </>
      ) : null}
    </div>
  )
}
```

---

## Task 7: Lint + Build

**Files:** None created. Verify the full implementation compiles and lints cleanly.

---

- [ ] **Step 7.1 — Run lint**

```bash
cd /Users/robsonsilverio/myboss360-web
npm run lint
```

Expected output: no output (zero warnings, zero errors).

If lint fails: read the error message, fix the offending line, run again. Do not use `eslint-disable` comments.

- [ ] **Step 7.2 — Run build**

```bash
npm run build
```

Expected: 17 static routes compile successfully, TypeScript passes, no errors.

If build fails on a TypeScript error in `lib/supabase/server.ts` (e.g. `cookies()` return type mismatch), add `// @ts-expect-error next-headers` only as a last resort after verifying the runtime behaviour is correct.

- [ ] **Step 7.3 — Commit**

```bash
git add \
  lib/supabase/types.ts \
  lib/supabase/client.ts \
  lib/supabase/server.ts \
  lib/supabase/middleware.ts \
  middleware.ts \
  providers/AuthProvider.tsx \
  app/\(auth\)/login/page.tsx \
  app/\(auth\)/register/page.tsx \
  app/\(dashboard\)/layout.tsx \
  components/dashboard/UserMenu.tsx \
  docs/superpowers/plans/2026-06-29-supabase-auth-phase1.md

git commit -m "feat(auth): Supabase Auth Phase 1 — cookie sessions, middleware guard, login/register/logout"
```

---

## Self-Review

**Spec coverage check:**

| Requirement | Task |
|---|---|
| Reusable Supabase client under `lib/supabase/` | Task 1 |
| Browser client | Task 1.2 |
| Server client | Task 1.3 |
| Shared types | Task 1.1 |
| Middleware protecting `/dashboard/*` → redirect to `/login` | Task 2 |
| Login page with Supabase Auth | Task 4 |
| Register with Supabase Auth | Task 5 |
| Logout | Task 6.2 |
| AuthProvider with React Context | Task 3 |
| Loading state while restoring session | Task 3 (spinner in AuthProvider) |
| Protected dashboard layout | Task 6.1 |
| No new packages installed | ✅ Global constraint |
| No UI redesign | ✅ Forms match existing design language |
| `npm run lint` + `npm run build` | Task 7 |

**Placeholder scan:** No TBD, TODO, or incomplete sections found.

**Type consistency:**
- `createBrowserClient()` returns `SupabaseClient<Database>` — used in login page, register page, AuthProvider ✅
- `createServerClient()` returns `Promise<SupabaseClient<Database>>` — awaited in dashboard layout ✅
- `createMiddlewareClient(request, response)` returns `SupabaseClient<Database>` — used in middleware ✅
- `AuthProvider` exports `useAuth()` returning `{ session, user, loading, signOut }` — consumed by UserMenu ✅
- `signOut()` in AuthProvider calls `supabase.auth.signOut()` then sets session to `null` — UserMenu calls it then `router.push('/login')` ✅

---

## Known Limitations / Technical Debt for Phase 2

1. **No cookie chunking** — The Supabase session JSON can exceed 4096 bytes (cookie limit) for users with large `user_metadata` payloads. Phase 2 should install `@supabase/ssr` and replace the manual `CookieStorage` adapters. This migration is non-breaking since `@supabase/ssr` uses the same cookie key format.
2. **`createServerClient` is read-only** — Server Components cannot refresh expiring tokens because they can't write cookies. The middleware handles refresh for page navigations; Server Actions (Phase 2) should use a writable server client.
3. **No email confirmation flow** — Supabase by default requires email confirmation. In the Supabase dashboard, go to **Authentication → Settings → Email → Confirm email** and toggle it OFF for development, or implement the confirmation flow in Phase 2.
4. **No password reset** — The `forgot-password` page remains a placeholder. Phase 2 should implement `supabase.auth.resetPasswordForEmail()` + an `/auth/callback` route handler.
5. **No `/auth/callback` route** — OAuth providers and magic links require a callback handler at `app/auth/callback/route.ts`. Phase 2 must add this before enabling any provider beyond email/password.
6. **Singleton browser client** — The module-level singleton pattern works correctly in the browser but is reset on hot-reload in development. This is expected and does not affect production.
