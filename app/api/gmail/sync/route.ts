import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createWorkspacesRepository } from '@/repositories/workspaces'
import { createGoogleConnectionsRepository } from '@/repositories/google/connections'
import { createGmailSyncService } from '@/services/google/gmail-sync-service'
import { isGoogleConfigured } from '@/config/google'

// GET /api/gmail/sync
// Returns the current sync state for the authenticated user's Gmail connection.
export async function GET(request: Request) {
  try {
    if (!isGoogleConfigured()) {
      return NextResponse.json(
        { error: 'Google integration is not configured.' },
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
      return NextResponse.json({ error: 'No workspace found.' }, { status: 503 })
    }
    const workspace = workspaceIdHint
      ? (workspaces.find((w) => w.id === workspaceIdHint) ?? workspaces[0])
      : workspaces[0]

    const connectionsRepo = createGoogleConnectionsRepository(supabase)
    const connection = await connectionsRepo.findByWorkspaceAndUser(workspace.id, user.id)
    if (!connection || connection.status !== 'active') {
      return NextResponse.json({ isConnected: false, syncState: null })
    }

    const gmailSync = createGmailSyncService(supabase)
    const syncState = await gmailSync.getSyncState(connection.id)

    return NextResponse.json({
      isConnected: true,
      googleAccountEmail: connection.google_account_email,
      hasGmailScope: connection.scopes.includes('https://www.googleapis.com/auth/gmail.readonly'),
      syncState: syncState
        ? {
            historyId: syncState.history_id,
            lastSyncAt: syncState.last_sync_at,
            totalThreadsSynced: syncState.total_threads_synced,
          }
        : null,
    })
  } catch (err) {
    console.error('[gmail/sync] GET error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}

// POST /api/gmail/sync
// Triggers a Gmail sync (initial or delta) for the authenticated user.
export async function POST(request: Request) {
  try {
    if (!isGoogleConfigured()) {
      return NextResponse.json(
        { error: 'Google integration is not configured.' },
        { status: 503 }
      )
    }

    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const workspaceIdHint = typeof body.workspaceId === 'string' ? body.workspaceId : undefined

    const workspacesRepo = createWorkspacesRepository(supabase)
    const workspaces = await workspacesRepo.listForUser(user.id)
    if (workspaces.length === 0) {
      return NextResponse.json({ error: 'No workspace found.' }, { status: 503 })
    }
    const workspace = workspaceIdHint
      ? (workspaces.find((w) => w.id === workspaceIdHint) ?? workspaces[0])
      : workspaces[0]

    const connectionsRepo = createGoogleConnectionsRepository(supabase)
    const connection = await connectionsRepo.findByWorkspaceAndUser(workspace.id, user.id)
    if (!connection || connection.status !== 'active') {
      return NextResponse.json(
        { error: 'Google is not connected. Complete OAuth flow first.' },
        { status: 400 }
      )
    }

    const gmailSync = createGmailSyncService(supabase)
    const result = await gmailSync.runSync(connection.id)

    return NextResponse.json({
      synced: result.synced,
      historyId: result.historyId,
      isInitial: result.isInitial,
      threadIds: result.threadIds,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error.'

    // Surface scope errors as 403 so the client can prompt re-authorization
    if (message.includes('gmail.readonly')) {
      return NextResponse.json({ error: message, code: 'gmail_scope_missing' }, { status: 403 })
    }

    console.error('[gmail/sync] POST error:', message)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
