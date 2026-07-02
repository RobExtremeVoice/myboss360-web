import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { createWorkspacesRepository } from "@/repositories/workspaces"
import { createIntegrationRepository } from "@/repositories/integrations"
import { createIntegrationService } from "@/services/integrations/integration-service"
import { SectionCard } from "@/components/dashboard/SectionCard"
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader"
import { IntegrationGrid } from "@/components/settings/integrations"

export default async function IntegrationsPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const workspacesRepo = createWorkspacesRepository(supabase)
  const workspaces = await workspacesRepo.listForUser(user.id)
  const workspace = workspaces[0] ?? null

  if (!workspace) redirect("/dashboard")

  const integrationRepo = createIntegrationRepository(supabase)
  const integrationService = createIntegrationService(integrationRepo)
  const integrations = await integrationService.listWorkspaceIntegrations(workspace.id, user.id)

  return (
    <div className="space-y-8 lg:space-y-10">
      <DashboardPageHeader
        title="Integrations"
        description={`Workspace: ${workspace.name}`}
        greeting=""
      />
      <SectionCard
        title="Connected Integrations"
        description="Connect your email, calendar, CRM, and AI providers to give the Executive OS full context."
      >
        <IntegrationGrid states={integrations} workspaceId={workspace.id} />
      </SectionCard>
    </div>
  )
}
