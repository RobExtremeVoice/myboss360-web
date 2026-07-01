import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { createWorkspacesRepository } from "@/repositories/workspaces"
import { createExecutiveHealthService } from "@/services/executive/executive-health-service"

// GET /api/executive/health
// Returns internal diagnostics across all connected executive sources.
export async function GET(request: Request) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const url = new URL(request.url)
    const workspaceIdHint = url.searchParams.get("workspaceId") ?? undefined

    const workspacesRepo = createWorkspacesRepository(supabase)
    const workspaces = await workspacesRepo.listForUser(user.id)
    if (workspaces.length === 0) {
      return NextResponse.json({ error: "No workspace found." }, { status: 404 })
    }

    const workspace = workspaceIdHint
      ? (workspaces.find((w) => w.id === workspaceIdHint) ?? workspaces[0])
      : workspaces[0]

    const healthService = createExecutiveHealthService(supabase)
    const report = await healthService.getHealthReport(user.id, workspace.id)

    const httpStatus = report.status === "critical" ? 503 : 200
    return NextResponse.json(report, { status: httpStatus })
  } catch (err) {
    console.error("[executive/health] error:", err instanceof Error ? err.message : err)
    return NextResponse.json({ error: "Internal server error." }, { status: 500 })
  }
}
