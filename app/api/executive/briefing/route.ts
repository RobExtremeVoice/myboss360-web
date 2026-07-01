import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { createIntelligenceService } from "@/services/intelligence/intelligence-service"
import { createLearningService } from "@/services/learning/learning-service"
import { createMemoryService } from "@/services/memory/memory-service"
import { createWorkspacesRepository } from "@/repositories/workspaces"
import { createProfilesRepository } from "@/repositories/users"
import type { ExecutiveBriefing } from "@/types/executive"

// GET /api/executive/briefing
// Returns a unified executive briefing aggregating all connected sources.
export async function GET(request: Request) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const url = new URL(request.url)
    const workspaceIdHint = url.searchParams.get("workspaceId") ?? undefined

    const [workspaces, profile] = await Promise.all([
      createWorkspacesRepository(supabase).listForUser(user.id),
      createProfilesRepository(supabase).findById(user.id).catch(() => null),
    ])

    if (workspaces.length === 0) {
      return NextResponse.json({ error: "No workspace found." }, { status: 404 })
    }

    const workspace = workspaceIdHint
      ? (workspaces.find((w) => w.id === workspaceIdHint) ?? workspaces[0])
      : workspaces[0]

    const intelligenceService = createIntelligenceService(supabase)
    const learningService = createLearningService(supabase)
    const memoryService = createMemoryService(supabase)

    const [context, patterns, memories, knowledgeDocs, knowledgeChunksCount] =
      await Promise.all([
        intelligenceService.getIntelligenceContext(user.id, workspace.id),
        learningService.listPatterns(workspace.id, { limit: 100 }),
        memoryService.listMemories(workspace.id, { limit: 100 }),
        supabase
          .from("knowledge_documents")
          .select("id, title, category, updated_at")
          .eq("workspace_id", workspace.id)
          .is("deleted_at", null)
          .order("updated_at", { ascending: false })
          .limit(5)
          .then(({ data }) => data ?? []),
        supabase
          .from("knowledge_chunks")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspace.id)
          .then(({ count }) => count ?? 0),
      ])

    if (!context) {
      return NextResponse.json({ error: "Intelligence context unavailable." }, { status: 503 })
    }

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    const todayMeetings = context.todayAgenda.filter(
      (item) =>
        item.type === "meeting" &&
        new Date(item.startAt) >= todayStart &&
        new Date(item.startAt) <= todayEnd
    )

    const fullName = profile?.full_name ?? null

    const briefing: ExecutiveBriefing = {
      generatedAt: new Date().toISOString(),
      executive: {
        name: fullName,
        email: user.email ?? null,
        workspaceId: workspace.id,
      },
      calendar: {
        todayMeetings,
        upcomingMeetingCount: context.todayAgenda.length,
      },
      gmail: {
        awaitingReplies: context.emailIntelligence.awaitingReplies,
        criticalThreads: context.emailIntelligence.criticalThreads,
        highPriorityThreads: context.emailIntelligence.highPriorityThreads,
        overdueFollowUps: context.emailIntelligence.overdueFollowUps,
        totalThreadsInContext:
          context.emailIntelligence.awaitingReplies.length +
          context.emailIntelligence.criticalThreads.length +
          context.emailIntelligence.highPriorityThreads.length,
      },
      crm: {
        pipelineValue: context.executiveMetrics.totalPipelineValue,
        activeDeals: context.executiveMetrics.activeDeals,
        atRiskDeals: context.executiveMetrics.atRiskDealsCount,
        overdueTasks: context.executiveMetrics.overdueTasksCount,
      },
      memory: {
        recent: context.recentMemories.slice(0, 10),
        count: memories.length,
      },
      learning: {
        signals: context.learningSignals,
        signalCount: context.learningSignals.length,
        patternCount: patterns.length,
      },
      knowledge: {
        documentCount: knowledgeDocs.length,
        recentDocuments: knowledgeDocs.map((d) => ({
          id: d.id,
          title: d.title,
          category: d.category,
          updatedAt: d.updated_at,
        })),
      },
      recommendations: context.activeRecommendations,
      topRisks: context.topRisks,
      topOpportunities: context.topOpportunities,
      executiveMetrics: context.executiveMetrics,
    }

    void knowledgeChunksCount // used only for health endpoint

    return NextResponse.json(briefing)
  } catch (err) {
    console.error("[executive/briefing] error:", err instanceof Error ? err.message : err)
    return NextResponse.json({ error: "Internal server error." }, { status: 500 })
  }
}
