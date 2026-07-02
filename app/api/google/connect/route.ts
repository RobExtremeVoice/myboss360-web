import { randomBytes } from 'crypto'
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createWorkspacesRepository } from '@/repositories/workspaces'
import {
  buildAuthorizationUrl,
  encodeOAuthState,
  OAUTH_NONCE_COOKIE,
} from '@/services/google/google-oauth-service'
import { isGoogleConfigured } from '@/config/google'

// GET /api/google/connect?workspaceId=<uuid>
// Generates a nonce, stores it in an httpOnly SameSite=Lax cookie, then
// redirects to the Google OAuth consent screen with the nonce embedded in state.
export async function GET(request: Request) {
  try {
    if (!isGoogleConfigured()) {
      return NextResponse.json(
        { error: 'Google integration is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.' },
        { status: 503 }
      )
    }

    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const workspaceIdHint = url.searchParams.get('workspaceId') ?? undefined

    const workspacesRepo = createWorkspacesRepository(supabase)
    const workspaces = await workspacesRepo.listForUser(user.id)
    if (workspaces.length === 0) {
      return NextResponse.json({ error: 'No workspace found. Complete onboarding first.' }, { status: 503 })
    }
    const workspace = workspaceIdHint
      ? (workspaces.find((w) => w.id === workspaceIdHint) ?? workspaces[0])
      : workspaces[0]

    // Generate a cryptographically random nonce that binds this OAuth flow
    // to this browser session. Stored in an httpOnly cookie; verified on callback.
    const nonce = randomBytes(32).toString('base64url')
    const state = encodeOAuthState(workspace.id, nonce)
    const authUrl = buildAuthorizationUrl(state)

    const response = NextResponse.redirect(authUrl)
    response.cookies.set(OAUTH_NONCE_COOKIE, nonce, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/api/google/callback',
      maxAge: 600, // 10 minutes — enough time to complete the OAuth flow
    })
    return response
  } catch (err) {
    console.error('[google/connect] error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}

// DELETE /api/google/connect?workspaceId=<uuid>
// Removes the Google connection for the authenticated user in the specified workspace.
export async function DELETE(request: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const workspaceIdHint = url.searchParams.get('workspaceId') ?? undefined

    const workspacesRepo = createWorkspacesRepository(supabase)
    const workspaces = await workspacesRepo.listForUser(user.id)
    if (workspaces.length === 0) {
      return NextResponse.json({ error: 'No workspace found.' }, { status: 404 })
    }
    const workspace = workspaceIdHint
      ? (workspaces.find((w) => w.id === workspaceIdHint) ?? workspaces[0])
      : workspaces[0]

    const { error } = await supabase
      .from('google_connections')
      .delete()
      .eq('workspace_id', workspace.id)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/google/connect]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
