import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createWorkspacesRepository } from '@/repositories/workspaces'
import { createPeopleService } from '@/services/people/people-service'

// GET /api/people/[id]
// Returns a single person profile by email (URL-encoded) or virtual ID.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const email = decodeURIComponent(id)

    const workspaces = await createWorkspacesRepository(supabase).listForUser(user.id)
    if (workspaces.length === 0) {
      return NextResponse.json({ error: 'No workspace found.' }, { status: 404 })
    }
    const workspace = workspaces[0]

    const profiles = await createPeopleService(supabase).getProfiles(
      workspace.id,
      workspace.organization_id,
      user.email ?? null
    )

    // Match by email (virtual ID format is "virtual:<email>") or by the raw email
    const profile = profiles.find(
      (p) => p.email === email.toLowerCase() || p.id === email
    )

    if (!profile) {
      return NextResponse.json({ error: 'Person not found.' }, { status: 404 })
    }

    return NextResponse.json(profile)
  } catch (err) {
    console.error('[api/people/[id]] error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
