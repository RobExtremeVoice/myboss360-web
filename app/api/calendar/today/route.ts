import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createWorkspacesRepository } from '@/repositories/workspaces'
import { createGoogleCalendarApiService } from '@/services/google/google-calendar-api'

// GET /api/calendar/today?workspaceId=<uuid>
// Returns today's agenda: events, meeting count, free blocks, connection status.
export async function GET(request: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const workspaceIdHint = url.searchParams.get('workspaceId') ?? undefined

    const workspacesRepo = createWorkspacesRepository(supabase)
    const workspaces = await workspacesRepo.listForUser(user.id)
    if (workspaces.length === 0) {
      return NextResponse.json({ error: 'No workspace found. Complete onboarding first.', code: 'no_workspace' }, { status: 503 })
    }
    const workspace = workspaceIdHint
      ? (workspaces.find((w) => w.id === workspaceIdHint) ?? workspaces[0])
      : workspaces[0]

    const calendarApiService = createGoogleCalendarApiService(supabase)
    const agenda = await calendarApiService.getTodayAgenda(workspace.id, user.id)

    return NextResponse.json(agenda)
  } catch (err) {
    console.error('[calendar/today] GET error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
