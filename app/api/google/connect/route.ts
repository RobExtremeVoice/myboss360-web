import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createWorkspacesRepository } from '@/repositories/workspaces'
import { buildAuthorizationUrl, encodeOAuthState } from '@/services/google/google-oauth-service'
import { isGoogleConfigured } from '@/config/google'

// GET /api/google/connect?workspaceId=<uuid>
// Redirects to Google OAuth consent screen.
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

    const state = encodeOAuthState(workspace.id, user.id)
    const authUrl = buildAuthorizationUrl(state)

    return NextResponse.redirect(authUrl)
  } catch (err) {
    console.error('[google/connect] error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
