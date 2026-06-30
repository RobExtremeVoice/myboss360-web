import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createAIService } from '@/services/ai/ai-service'
import { createWorkspacesRepository } from '@/repositories/workspaces'

export async function POST(request: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const content = typeof body.content === 'string' ? body.content.trim() : ''
  const conversationId = typeof body.conversationId === 'string' ? body.conversationId : undefined
  const providerId = typeof body.providerId === 'string' ? body.providerId : undefined
  const workspaceIdInput = typeof body.workspaceId === 'string' ? body.workspaceId : undefined

  if (!content) {
    return NextResponse.json({ error: 'Message content is required.' }, { status: 400 })
  }

  const workspacesRepo = createWorkspacesRepository(supabase)
  const workspaces = await workspacesRepo.listForUser(user.id)
  if (workspaces.length === 0) {
    return NextResponse.json({ error: 'No workspace found for this user.' }, { status: 404 })
  }
  const ws = (workspaceIdInput ? workspaces.find((w) => w.id === workspaceIdInput) : null) ?? workspaces[0]

  const aiService = createAIService(supabase)
  const result = await aiService.sendMessage({
    conversationId,
    workspaceId: ws.id,
    organizationId: ws.organization_id,
    userId: user.id,
    content,
    providerId,
  })

  return NextResponse.json(result, { status: 200 })
}
