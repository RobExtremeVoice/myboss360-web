import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createAIService } from '@/services/ai/ai-service'
import { createWorkspacesRepository } from '@/repositories/workspaces'

export async function GET(request: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const workspaceId = searchParams.get('workspaceId')

  const workspacesRepo = createWorkspacesRepository(supabase)
  const workspaces = await workspacesRepo.listForUser(user.id)
  if (workspaces.length === 0) return NextResponse.json({ conversations: [] })

  const ws = (workspaceId ? workspaces.find((w) => w.id === workspaceId) : null) ?? workspaces[0]
  const aiService = createAIService(supabase)
  const conversations = await aiService.listConversations(user.id, ws.id)

  return NextResponse.json({ conversations })
}

export async function POST(request: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const workspaceId = typeof body.workspaceId === 'string' ? body.workspaceId : undefined

  const workspacesRepo = createWorkspacesRepository(supabase)
  const workspaces = await workspacesRepo.listForUser(user.id)
  if (workspaces.length === 0) {
    return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
  }
  const ws = (workspaceId ? workspaces.find((w) => w.id === workspaceId) : null) ?? workspaces[0]

  const aiService = createAIService(supabase)
  const conversation = await aiService.getConversationWithMessages('__new__').catch(() => null)
  void conversation // unused — just triggering ensure-providers via aiService import

  const { createConversationManager } = await import('@/services/ai/conversation-manager')
  const manager = createConversationManager(supabase)
  const newConv = await manager.createConversation({
    workspaceId: ws.id,
    organizationId: ws.organization_id,
    userId: user.id,
  })

  return NextResponse.json({ conversation: newConv }, { status: 201 })
}
