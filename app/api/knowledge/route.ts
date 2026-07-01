import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createWorkspacesRepository } from '@/repositories/workspaces'
import { createKnowledgeService } from '@/services/knowledge/knowledge-service'
import { createKnowledgeSearchService } from '@/services/knowledge/search-service'
import { KNOWLEDGE_CATEGORIES, KNOWLEDGE_OBJECT_TYPES } from '@/config/knowledge'
import type { KnowledgeObjectType, KnowledgeCategory, KnowledgeStatus } from '@/types/knowledge'

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function resolveWorkspace(supabase: Awaited<ReturnType<typeof createServerClient>>, userId: string, workspaceIdHint?: string) {
  const workspacesRepo = createWorkspacesRepository(supabase)
  const workspaces = await workspacesRepo.listForUser(userId)
  if (workspaces.length === 0) return null
  return workspaceIdHint
    ? (workspaces.find((w) => w.id === workspaceIdHint) ?? workspaces[0])
    : workspaces[0]
}

// ─── GET /api/knowledge ───────────────────────────────────────────────────────
// Query params:
//   action=search&q=<query>   → keyword search (default)
//   action=list               → list documents (default if no action)
//   action=collections        → list collections
//   action=tags               → list tags
//   status, objectType, category, collectionId, limit, offset
export async function GET(request: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const action = url.searchParams.get('action') ?? 'list'
    const workspaceIdHint = url.searchParams.get('workspaceId') ?? undefined

    const ws = await resolveWorkspace(supabase, user.id, workspaceIdHint)
    if (!ws) return NextResponse.json({ error: 'No workspace found. Complete onboarding first.', code: 'no_workspace' }, { status: 503 })

    const svc = createKnowledgeService(supabase)

    if (action === 'search') {
      const q = url.searchParams.get('q') ?? ''
      if (!q.trim()) return NextResponse.json({ error: 'Query parameter q is required for search.' }, { status: 400 })

      const searchSvc = createKnowledgeSearchService(supabase)
      const mode = (url.searchParams.get('mode') ?? 'keyword') as 'keyword' | 'semantic' | 'hybrid'
      const response = await searchSvc.search({
        query: q,
        workspaceId: ws.id,
        organizationId: ws.organization_id,
        limit: Number(url.searchParams.get('limit') ?? 10),
      }, mode)
      return NextResponse.json(response)
    }

    if (action === 'collections') {
      const collections = await svc.listCollections(ws.id)
      return NextResponse.json({ collections })
    }

    if (action === 'tags') {
      const tags = await svc.listTags(ws.id)
      return NextResponse.json({ tags })
    }

    // Default: list documents
    const documents = await svc.listDocuments(ws.id, {
      status: (url.searchParams.get('status') as KnowledgeStatus | null) ?? undefined,
      objectType: (url.searchParams.get('objectType') as KnowledgeObjectType | null) ?? undefined,
      category: (url.searchParams.get('category') as KnowledgeCategory | null) ?? undefined,
      collectionId: url.searchParams.get('collectionId') ?? undefined,
      limit: url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : undefined,
      offset: url.searchParams.get('offset') ? Number(url.searchParams.get('offset')) : undefined,
    })
    const total = await svc.countDocuments(ws.id)
    return NextResponse.json({ documents, total })
  } catch (err) {
    console.error('[knowledge] GET error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}

// ─── POST /api/knowledge ─────────────────────────────────────────────────────
// Body: CreateDocumentInput | { action: 'createCollection', ... } | { action: 'createTag', ... }
export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const workspaceIdHint = typeof body.workspaceId === 'string' ? body.workspaceId : undefined

    const ws = await resolveWorkspace(supabase, user.id, workspaceIdHint)
    if (!ws) return NextResponse.json({ error: 'No workspace found. Complete onboarding first.', code: 'no_workspace' }, { status: 503 })

    const svc = createKnowledgeService(supabase)

    // Create collection
    if (body.action === 'createCollection') {
      const name = typeof body.name === 'string' ? body.name.trim() : ''
      if (!name) return NextResponse.json({ error: 'name is required.' }, { status: 400 })
      const collection = await svc.createCollection(ws.id, ws.organization_id, { name, description: body.description ?? null })
      return NextResponse.json({ collection }, { status: 201 })
    }

    // Create tag
    if (body.action === 'createTag') {
      const name = typeof body.name === 'string' ? body.name.trim() : ''
      if (!name) return NextResponse.json({ error: 'name is required.' }, { status: 400 })
      const tag = await svc.createTag(ws.id, { name, color: body.color ?? null })
      return NextResponse.json({ tag }, { status: 201 })
    }

    // Create document (default)
    const title = typeof body.title === 'string' ? body.title.trim() : ''
    const content = typeof body.content === 'string' ? body.content : ''
    const objectType = body.objectType as KnowledgeObjectType | undefined
    const category = body.category as KnowledgeCategory | undefined

    if (!title) return NextResponse.json({ error: 'title is required.' }, { status: 400 })
    if (!objectType || !KNOWLEDGE_OBJECT_TYPES.includes(objectType)) {
      return NextResponse.json({ error: `objectType must be one of: ${KNOWLEDGE_OBJECT_TYPES.join(', ')}` }, { status: 400 })
    }
    if (!category || !KNOWLEDGE_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: `category must be one of: ${KNOWLEDGE_CATEGORIES.join(', ')}` }, { status: 400 })
    }

    const document = await svc.createDocument(ws.id, ws.organization_id, user.id, {
      title,
      content,
      objectType,
      category,
      collectionId: typeof body.collectionId === 'string' ? body.collectionId : null,
      status: body.status ?? 'draft',
      metadata: typeof body.metadata === 'object' ? body.metadata : {},
      tagIds: Array.isArray(body.tagIds) ? body.tagIds : [],
      autoChunk: body.autoChunk !== false,
    })

    return NextResponse.json({ document }, { status: 201 })
  } catch (err) {
    console.error('[knowledge] POST error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}

// ─── PATCH /api/knowledge ─────────────────────────────────────────────────────
// Body: { id: string } + UpdateDocumentInput fields
export async function PATCH(request: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const id = typeof body.id === 'string' ? body.id : ''
    if (!id) return NextResponse.json({ error: 'id is required.' }, { status: 400 })

    const svc = createKnowledgeService(supabase)
    const existing = await svc.getDocument(id)
    if (!existing) return NextResponse.json({ error: 'Document not found.' }, { status: 404 })

    // Verify workspace membership via workspace resolution
    const ws = await resolveWorkspace(supabase, user.id, existing.workspaceId)
    if (!ws || ws.id !== existing.workspaceId) {
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 })
    }

    const document = await svc.updateDocument(id, user.id, {
      title: typeof body.title === 'string' ? body.title.trim() : undefined,
      content: typeof body.content === 'string' ? body.content : undefined,
      objectType: body.objectType as KnowledgeObjectType | undefined,
      category: body.category as KnowledgeCategory | undefined,
      status: body.status as KnowledgeStatus | undefined,
      collectionId: body.collectionId !== undefined ? body.collectionId : undefined,
      metadata: typeof body.metadata === 'object' ? body.metadata : undefined,
      changeNote: typeof body.changeNote === 'string' ? body.changeNote : undefined,
      autoChunk: body.autoChunk !== false,
    })

    return NextResponse.json({ document })
  } catch (err) {
    console.error('[knowledge] PATCH error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}

// ─── DELETE /api/knowledge ────────────────────────────────────────────────────
// Query params: id=<documentId>
export async function DELETE(request: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const id = url.searchParams.get('id') ?? ''
    if (!id) return NextResponse.json({ error: 'id query parameter is required.' }, { status: 400 })

    const svc = createKnowledgeService(supabase)
    const existing = await svc.getDocument(id)
    if (!existing) return NextResponse.json({ error: 'Document not found.' }, { status: 404 })

    // Verify workspace membership
    const ws = await resolveWorkspace(supabase, user.id, existing.workspaceId)
    if (!ws || ws.id !== existing.workspaceId) {
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 })
    }

    await svc.deleteDocument(id)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[knowledge] DELETE error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
