import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { createAIService } from "@/services/ai/ai-service"
import { createIntelligenceService } from "@/services/intelligence/intelligence-service"
import { createWorkspacesRepository } from "@/repositories/workspaces"
import { AIAssistantLayout } from "./AIAssistantLayout"

export default async function AiAssistantPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const workspacesRepo = createWorkspacesRepository(supabase)
  const workspaces = await workspacesRepo.listForUser(user.id)
  const workspace = workspaces[0] ?? null

  const [conversations, context] = await Promise.all([
    workspace
      ? createAIService(supabase).listConversations(user.id, workspace.id)
      : Promise.resolve([]),
    workspace
      ? createIntelligenceService(supabase).getIntelligenceContext(
          user.id,
          workspace.id
        )
      : Promise.resolve(null),
  ])

  return (
    <AIAssistantLayout
      initialConversations={conversations}
      metrics={context?.executiveMetrics ?? null}
      workspaceId={workspace?.id}
    />
  )
}
