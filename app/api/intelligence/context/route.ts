import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createIntelligenceService } from '@/services/intelligence/intelligence-service'

export async function GET(request: Request) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const workspaceId = searchParams.get('workspaceId') ?? undefined

  const intelligenceService = createIntelligenceService(supabase)
  const context = await intelligenceService.getIntelligenceContext(user.id, workspaceId)

  if (!context) {
    return NextResponse.json({ error: 'No workspace found for this user.' }, { status: 404 })
  }

  return NextResponse.json(context)
}
