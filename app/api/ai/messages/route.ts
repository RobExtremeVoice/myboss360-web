import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createAIService } from '@/services/ai/ai-service'
import { createWorkspacesRepository } from '@/repositories/workspaces'

export async function POST(request: Request) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const content = typeof body.content === 'string' ? body.content.trim() : ''
  const conversationId =
    typeof body.conversationId === 'string' ? body.conversationId : undefined
  const providerId =
    typeof body.providerId === 'string' ? body.providerId : undefined
  const workspaceIdInput =
    typeof body.workspaceId === 'string' ? body.workspaceId : undefined

  if (!content) {
    return NextResponse.json({ error: 'Message content is required.' }, { status: 400 })
  }

  const workspacesRepo = createWorkspacesRepository(supabase)
  const workspaces = await workspacesRepo.listForUser(user.id)
  if (workspaces.length === 0) {
    return NextResponse.json(
      { error: 'No workspace found for this user.' },
      { status: 404 }
    )
  }
  const ws =
    (workspaceIdInput ? workspaces.find((w) => w.id === workspaceIdInput) : null) ??
    workspaces[0]

  try {
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
  } catch (err) {
    // Log the raw error server-side for debugging; return a sanitized message.
    console.error('[ai/messages] provider error:', err instanceof Error ? err.message : err)

    const userMessage = classifyProviderError(err)
    return NextResponse.json({ error: userMessage }, { status: 502 })
  }
}

/** Map internal provider errors to user-friendly, non-revealing messages. */
function classifyProviderError(err: unknown): string {
  if (!(err instanceof Error)) return 'An unexpected error occurred. Please try again.'

  const msg = err.message

  if (msg.includes('OPENAI_API_KEY')) {
    return 'The AI provider is not configured yet. Please check back soon.'
  }
  if (msg.includes('429') || msg.toLowerCase().includes('rate limit')) {
    return 'The AI provider is busy. Please wait a moment and try again.'
  }
  if (msg.includes('401') || msg.toLowerCase().includes('invalid api key')) {
    return 'The AI provider credentials are invalid. Please contact support.'
  }
  if (msg.toLowerCase().includes('no active ai provider')) {
    return 'No AI provider is available right now. Please try again later.'
  }
  if (msg.includes('502') || msg.includes('503') || msg.includes('timeout')) {
    return 'The AI provider is temporarily unavailable. Please try again.'
  }

  return 'Failed to generate a response. Please try again.'
}
