import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createAIService } from '@/services/ai/ai-service'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const aiService = createAIService(supabase)
  const result = await aiService.getConversationWithMessages(id)

  if (!result) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })

  // Enforce ownership
  if (result.conversation.userId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json(result)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const aiService = createAIService(supabase)

  // Verify ownership
  const existing = await aiService.getConversationWithMessages(id)
  if (!existing) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
  if (existing.conversation.userId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (body.archived === true) {
    await aiService.archiveConversation(id)
    return NextResponse.json({ archived: true })
  }

  if (typeof body.title === 'string') {
    const updated = await aiService.updateConversationTitle(id, body.title)
    return NextResponse.json({ conversation: updated })
  }

  return NextResponse.json({ error: 'No valid update field provided.' }, { status: 400 })
}
