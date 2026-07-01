import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createWorkspacesRepository } from '@/repositories/workspaces'
import { createGoogleConnectionsRepository } from '@/repositories/google/connections'
import { createGoogleCalendarApiService } from '@/services/google/google-calendar-api'

// GET /api/calendar/events
// Query params:
//   workspaceId (optional)
//   days (default 30) — look-ahead window
//   sync=1 — trigger a live sync from Google before responding
//   calendarId (default "primary")
export async function GET(request: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const workspaceIdHint = url.searchParams.get('workspaceId') ?? undefined
    const days = Math.min(Number(url.searchParams.get('days') ?? '30'), 90)
    const triggerSync = url.searchParams.get('sync') === '1'
    const calendarId = url.searchParams.get('calendarId') ?? 'primary'

    const workspacesRepo = createWorkspacesRepository(supabase)
    const workspaces = await workspacesRepo.listForUser(user.id)
    if (workspaces.length === 0) {
      return NextResponse.json({ error: 'No workspace found. Complete onboarding first.', code: 'no_workspace' }, { status: 503 })
    }
    const workspace = workspaceIdHint
      ? (workspaces.find((w) => w.id === workspaceIdHint) ?? workspaces[0])
      : workspaces[0]

    const connectionsRepo = createGoogleConnectionsRepository(supabase)
    const connection = await connectionsRepo.findByWorkspaceAndUser(workspace.id, user.id)

    let syncResult: { synced: number; syncToken: string | null } | null = null

    if (connection && connection.status === 'active' && triggerSync) {
      const calendarApiService = createGoogleCalendarApiService(supabase)
      try {
        syncResult = await calendarApiService.syncCalendar(
          connection.id,
          workspace.id,
          workspace.organization_id,
          user.id,
          calendarId
        )
      } catch (syncErr) {
        // Sync errors are non-fatal — return cached events
        console.error('[calendar/events] sync error:', syncErr instanceof Error ? syncErr.message : syncErr)
      }
    }

    // Return events from local table (populated via sync)
    const timeMin = new Date().toISOString()
    const timeMax = new Date(Date.now() + days * 86_400_000).toISOString()

    const { data: events, error: eventsError } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('workspace_id', workspace.id)
      .is('deleted_at', null)
      .gte('start_at', timeMin)
      .lte('start_at', timeMax)
      .order('start_at', { ascending: true })

    if (eventsError) throw eventsError

    return NextResponse.json({
      events: events ?? [],
      total: events?.length ?? 0,
      isConnected: Boolean(connection && connection.status === 'active'),
      googleAccountEmail: connection?.google_account_email ?? null,
      syncResult,
    })
  } catch (err) {
    console.error('[calendar/events] GET error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}

// POST /api/calendar/events — manual sync trigger
export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const workspaceIdHint = typeof body.workspaceId === 'string' ? body.workspaceId : undefined
    const calendarId = typeof body.calendarId === 'string' ? body.calendarId : 'primary'

    const workspacesRepo = createWorkspacesRepository(supabase)
    const workspaces = await workspacesRepo.listForUser(user.id)
    if (workspaces.length === 0) {
      return NextResponse.json({ error: 'No workspace found.', code: 'no_workspace' }, { status: 503 })
    }
    const workspace = workspaceIdHint
      ? (workspaces.find((w) => w.id === workspaceIdHint) ?? workspaces[0])
      : workspaces[0]

    const connectionsRepo = createGoogleConnectionsRepository(supabase)
    const connection = await connectionsRepo.findByWorkspaceAndUser(workspace.id, user.id)
    if (!connection || connection.status !== 'active') {
      return NextResponse.json({ error: 'Google Calendar is not connected.' }, { status: 400 })
    }

    const calendarApiService = createGoogleCalendarApiService(supabase)
    const result = await calendarApiService.syncCalendar(
      connection.id,
      workspace.id,
      workspace.organization_id,
      user.id,
      calendarId
    )

    return NextResponse.json({ synced: result.synced, syncToken: result.syncToken })
  } catch (err) {
    console.error('[calendar/events] POST error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
