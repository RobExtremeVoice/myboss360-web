import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { createAIService } from "@/services/ai/ai-service"
import { createIntelligenceService } from "@/services/intelligence/intelligence-service"
import { createWorkspacesRepository } from "@/repositories/workspaces"
import { createGoogleConnectionsRepository } from "@/repositories/google/connections"
import { createGmailSyncRepository } from "@/repositories/google/gmail-sync"
import { createCalendarSyncRepository } from "@/repositories/google/calendar-sync"
import { createProfilesRepository } from "@/repositories/users"
import { GMAIL_SCOPE } from "@/config/google"
import { AIAssistantLayout } from "./AIAssistantLayout"
import type { BossIntelligenceSummary } from "@/types/executive"

const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.readonly"

export default async function AiAssistantPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const workspacesRepo = createWorkspacesRepository(supabase)
  const workspaces = await workspacesRepo.listForUser(user.id)
  const workspace = workspaces[0] ?? null

  const [conversations, context, connection, profile, knowledgeDocCount] =
    await Promise.all([
      workspace
        ? createAIService(supabase).listConversations(user.id, workspace.id)
        : Promise.resolve([]),
      workspace
        ? createIntelligenceService(supabase)
            .getIntelligenceContext(user.id, workspace.id)
            .catch(() => null)
        : Promise.resolve(null),
      workspace
        ? createGoogleConnectionsRepository(supabase)
            .findByWorkspaceAndUser(workspace.id, user.id)
            .catch(() => null)
        : Promise.resolve(null),
      createProfilesRepository(supabase).findById(user.id).catch(() => null),
      workspace
        ? supabase
            .from("knowledge_documents")
            .select("id", { count: "exact", head: true })
            .eq("workspace_id", workspace.id)
            .is("deleted_at", null)
            .then(({ count }) => count ?? 0)
        : Promise.resolve(0),
    ])

  // Fetch sync states only if we have a connection
  let gmailLastSync: string | null = null
  let calendarLastSync: string | null = null
  if (connection) {
    const gmailSyncRepo = createGmailSyncRepository(supabase)
    const calendarSyncRepo = createCalendarSyncRepository(supabase)
    const [gmailSync, calendarSyncs] = await Promise.all([
      gmailSyncRepo.findByConnectionId(connection.id).catch(() => null),
      calendarSyncRepo.listByConnection(connection.id).catch(() => []),
    ])
    gmailLastSync = gmailSync?.last_sync_at ?? null
    calendarLastSync = calendarSyncs[0]?.last_synced_at ?? null
  }

  const isGoogleConnected = connection !== null && connection.status === "active"
  const hasGmailScope = isGoogleConnected && connection.scopes.includes(GMAIL_SCOPE)
  const hasCalendarScope = isGoogleConnected && connection.scopes.includes(CALENDAR_SCOPE)

  const bossIntelligence: BossIntelligenceSummary | null = context
    ? {
        memoryCount: context.recentMemories.length,
        signalCount: context.learningSignals.length,
        recommendationCount: context.activeRecommendations.length,
        awaitingReplies: context.emailIntelligence.awaitingReplies.length,
        knowledgeDocuments: knowledgeDocCount,
        isGoogleConnected,
        hasGmailScope,
        hasCalendarScope,
        gmailLastSync,
        calendarLastSync,
      }
    : null

  const fullName = profile?.full_name ?? null

  const devToolsEnabled = process.env.NODE_ENV !== "production"

  return (
    <AIAssistantLayout
      initialConversations={conversations}
      metrics={context?.executiveMetrics ?? null}
      workspaceId={workspace?.id}
      context={context}
      bossIntelligence={bossIntelligence}
      userFullName={fullName}
      devToolsEnabled={devToolsEnabled}
    />
  )
}
