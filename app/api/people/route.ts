import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createWorkspacesRepository } from '@/repositories/workspaces'
import { createPeopleService } from '@/services/people/people-service'

// GET /api/people
// Returns scored person profiles for the current workspace.
export async function GET(request: Request) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const workspaceIdHint = url.searchParams.get('workspaceId') ?? undefined

    const workspaces = await createWorkspacesRepository(supabase).listForUser(user.id)
    if (workspaces.length === 0) {
      return NextResponse.json({ error: 'No workspace found.' }, { status: 404 })
    }

    const workspace = workspaceIdHint
      ? (workspaces.find((w) => w.id === workspaceIdHint) ?? workspaces[0])
      : workspaces[0]

    const profiles = await createPeopleService(supabase).getProfiles(
      workspace.id,
      workspace.organization_id,
      user.email ?? null
    )

    return NextResponse.json({ profiles, total: profiles.length })
  } catch (err) {
    console.error('[api/people] error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
