import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createWorkspacesRepository } from '@/repositories/workspaces'
import { createIntegrationRepository } from '@/repositories/integrations'
import { createIntegrationService } from '@/services/integrations/integration-service'

// GET /api/integrations?workspaceId=<uuid>
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
      return NextResponse.json({ error: 'No workspace found.' }, { status: 404 })
    }
    const workspace = workspaceIdHint
      ? (workspaces.find((w) => w.id === workspaceIdHint) ?? workspaces[0])
      : workspaces[0]

    const integrationRepo = createIntegrationRepository(supabase)
    const integrationService = createIntegrationService(integrationRepo)
    const integrations = await integrationService.listWorkspaceIntegrations(workspace.id, user.id)

    return NextResponse.json({ integrations, workspaceId: workspace.id })
  } catch (error) {
    console.error('[GET /api/integrations]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
