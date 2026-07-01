import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createWorkspacesRepository } from '@/repositories/workspaces'
import { createGoogleOAuthService, decodeOAuthState } from '@/services/google/google-oauth-service'

// GET /api/google/callback?code=<code>&state=<state>
// Exchanges authorization code for tokens and stores connection.
export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const errorParam = url.searchParams.get('error')

  if (errorParam) {
    return NextResponse.redirect(
      new URL(`/dashboard/settings?google_error=${encodeURIComponent(errorParam)}`, url.origin)
    )
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/dashboard/settings?google_error=missing_params', url.origin)
    )
  }

  const parsed = decodeOAuthState(state)
  if (!parsed) {
    return NextResponse.redirect(
      new URL('/dashboard/settings?google_error=invalid_state', url.origin)
    )
  }

  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== parsed.userId) {
      return NextResponse.redirect(
        new URL('/login?error=session_mismatch', url.origin)
      )
    }

    const workspacesRepo = createWorkspacesRepository(supabase)
    const workspace = await workspacesRepo.findById(parsed.workspaceId)
    if (!workspace) {
      return NextResponse.redirect(
        new URL('/dashboard/settings?google_error=workspace_not_found', url.origin)
      )
    }

    const oauthService = createGoogleOAuthService(supabase)
    await oauthService.handleCallback(
      code,
      workspace.id,
      workspace.organization_id,
      user.id
    )

    return NextResponse.redirect(
      new URL('/dashboard/calendar?google_connected=1', url.origin)
    )
  } catch (err) {
    console.error('[google/callback] error:', err instanceof Error ? err.message : err)
    return NextResponse.redirect(
      new URL('/dashboard/settings?google_error=token_exchange_failed', url.origin)
    )
  }
}
