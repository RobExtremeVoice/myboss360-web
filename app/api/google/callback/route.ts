import { timingSafeEqual } from 'crypto'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@/lib/supabase/server'
import { createWorkspacesRepository } from '@/repositories/workspaces'
import {
  createGoogleOAuthService,
  decodeOAuthState,
  OAUTH_NONCE_COOKIE,
} from '@/services/google/google-oauth-service'

// GET /api/google/callback?code=<code>&state=<state>
// Verifies the nonce cookie against the state nonce (CSRF protection), then
// exchanges the authorization code for tokens and stores the connection.
export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const errorParam = url.searchParams.get('error')

  const cookieStore = await cookies()

  // Helper: redirect and clear the nonce cookie
  const fail = (reason: string) => {
    const res = NextResponse.redirect(
      new URL(`/dashboard/settings?google_error=${reason}`, url.origin)
    )
    res.cookies.delete(OAUTH_NONCE_COOKIE)
    return res
  }

  if (errorParam) return fail(encodeURIComponent(errorParam))
  if (!code || !state) return fail('missing_params')

  // Decode the state — contains workspaceId and the nonce we set on /connect
  const parsed = decodeOAuthState(state)
  if (!parsed) return fail('invalid_state')

  // Verify the nonce against the httpOnly cookie (CSRF protection).
  // timingSafeEqual prevents timing-based oracle attacks.
  const cookieNonce = cookieStore.get(OAUTH_NONCE_COOKIE)?.value ?? ''
  const nonceFromState = parsed.nonce

  let nonceValid = false
  try {
    const a = Buffer.from(nonceFromState)
    const b = Buffer.from(cookieNonce)
    nonceValid = a.length === b.length && timingSafeEqual(a, b)
  } catch {
    nonceValid = false
  }

  if (!nonceValid) return fail('state_mismatch')

  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      const res = NextResponse.redirect(new URL('/login', url.origin))
      res.cookies.delete(OAUTH_NONCE_COOKIE)
      return res
    }

    // Verify the user is a member of the workspace in the state.
    // Never trust workspaceId from an unauthenticated parameter — check membership.
    const workspacesRepo = createWorkspacesRepository(supabase)
    const workspaces = await workspacesRepo.listForUser(user.id)
    const workspace = workspaces.find((w) => w.id === parsed.workspaceId)
    if (!workspace) return fail('forbidden')

    const oauthService = createGoogleOAuthService(supabase)
    await oauthService.handleCallback(
      code,
      workspace.id,
      workspace.organization_id,
      user.id
    )

    // Success — clear nonce cookie
    const success = NextResponse.redirect(
      new URL('/dashboard/calendar?google_connected=1', url.origin)
    )
    success.cookies.delete(OAUTH_NONCE_COOKIE)
    return success
  } catch (err) {
    console.error('[google/callback] error:', err instanceof Error ? err.message : err)
    return fail('token_exchange_failed')
  }
}
