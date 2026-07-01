import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createWorkspacesRepository } from '@/repositories/workspaces'
import { createPeopleService } from '@/services/people/people-service'

// GET /api/people/insights
// Returns categorized people intelligence: champions, stale, new, etc.
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

    const insights = await createPeopleService(supabase).getInsights(
      workspace.id,
      workspace.organization_id,
      user.email ?? null
    )

    return NextResponse.json(insights)
  } catch (err) {
    console.error('[api/people/insights] error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
