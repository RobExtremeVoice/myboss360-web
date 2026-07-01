import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { createWorkspacesRepository } from "@/repositories/workspaces"
import { createExecutiveHealthService } from "@/services/executive/executive-health-service"
import { SectionCard } from "@/components/dashboard/SectionCard"
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader"
import { Settings } from "lucide-react"
import { ExecutiveEmptyState } from "@/components/dashboard/ExecutiveEmptyState"
import type {
  ConnectionHealthCheck,
  KnowledgeHealthCheck,
  LearningHealthCheck,
  MemoryHealthCheck,
  OverallHealth,
  RecommendationsHealthCheck,
  SyncHealthCheck,
} from "@/types/executive"

function HealthDot({ status }: { status: string }) {
  const cls =
    status === "ok"
      ? "bg-emerald-500"
      : status === "warn"
      ? "bg-amber-400"
      : status === "error"
      ? "bg-rose-500"
      : "bg-slate-300"
  return <span className={["size-2 shrink-0 rounded-full", cls].join(" ")} aria-hidden="true" />
}

function HealthRow({ label, value, status }: { label: string; value: string; status: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[1.1rem] border border-black/6 bg-slate-50/70 px-4 py-3">
      <div className="flex items-center gap-2.5">
        <HealthDot status={status} />
        <span className="text-sm font-medium text-slate-800">{label}</span>
      </div>
      <span className="text-[11px] font-medium text-slate-400">{value}</span>
    </div>
  )
}

function overallBadgeClass(status: OverallHealth) {
  if (status === "healthy") return "border-emerald-200 bg-emerald-50 text-emerald-700"
  if (status === "degraded") return "border-amber-200 bg-amber-50 text-amber-700"
  return "border-rose-200 bg-rose-50 text-rose-700"
}

function relativeSync(isoDate: string | null): string {
  if (!isoDate) return "never"
  const mins = Math.floor((Date.now() - new Date(isoDate).getTime()) / 60_000)
  if (mins < 2) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function connectionLabel(c: ConnectionHealthCheck): string {
  if (!c.googleConnected) return "not connected"
  const scopes = [c.hasGmailScope && "Gmail", c.hasCalendarScope && "Calendar"]
    .filter(Boolean)
    .join(", ")
  return scopes ? `${c.accountEmail ?? "connected"} · ${scopes}` : (c.accountEmail ?? "connected")
}

function syncLabel(c: SyncHealthCheck): string {
  if (c.status === "never" || !c.lastSyncAt) return "never synced"
  return `${relativeSync(c.lastSyncAt)} · ${c.totalSynced} items`
}

function memoryLabel(c: MemoryHealthCheck): string {
  return c.count === 0 ? "no memories" : `${c.count} memories`
}

function learningLabel(c: LearningHealthCheck): string {
  if (c.activeSignals === 0 && c.patterns === 0) return "no signals yet"
  return `${c.activeSignals} active signals · ${c.patterns} patterns`
}

function knowledgeLabel(c: KnowledgeHealthCheck): string {
  return c.documents === 0 ? "no documents" : `${c.documents} docs · ${c.chunks} chunks`
}

function recsLabel(c: RecommendationsHealthCheck): string {
  return c.total === 0 ? "none" : `${c.pending} pending of ${c.total}`
}

export default async function SettingsPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const workspacesRepo = createWorkspacesRepository(supabase)
  const workspaces = await workspacesRepo.listForUser(user.id)
  const workspace = workspaces[0] ?? null

  if (!workspace) {
    return (
      <ExecutiveEmptyState
        icon={<Settings className="size-8" />}
        label="Settings"
        title="Workspace configuration and connections"
        description="Settings is where you manage your connected data sources, AI configuration, notification preferences, and workspace-level controls."
        nextAction="Complete onboarding to access workspace settings."
      />
    )
  }

  const healthService = createExecutiveHealthService(supabase)
  const health = await healthService.getHealthReport(user.id, workspace.id).catch(() => null)
  const checks = health?.checks

  return (
    <div className="space-y-8 lg:space-y-10">
      <DashboardPageHeader
        title="Settings"
        description={`Workspace: ${workspace.name}`}
        greeting=""
      />

      {/* System health */}
      <SectionCard
        title="System Health"
        description="Live diagnostics for all connected Executive OS components"
        action={
          health ? (
            <span
              className={[
                "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold capitalize",
                overallBadgeClass(health.status),
              ].join(" ")}
            >
              {health.status}
            </span>
          ) : null
        }
      >
        {checks ? (
          <div className="space-y-2">
            <HealthRow
              label="Google Connection"
              value={connectionLabel(checks.connections)}
              status={checks.connections.status}
            />
            <HealthRow
              label="Gmail Sync"
              value={syncLabel(checks.gmailSync)}
              status={checks.gmailSync.status === "never" ? "empty" : checks.gmailSync.status}
            />
            <HealthRow
              label="Calendar Sync"
              value={syncLabel(checks.calendarSync)}
              status={checks.calendarSync.status === "never" ? "empty" : checks.calendarSync.status}
            />
            <HealthRow
              label="Memory Engine"
              value={memoryLabel(checks.memory)}
              status={checks.memory.status}
            />
            <HealthRow
              label="Learning Signals"
              value={learningLabel(checks.learning)}
              status={checks.learning.status}
            />
            <HealthRow
              label="Knowledge Base"
              value={knowledgeLabel(checks.knowledge)}
              status={checks.knowledge.status}
            />
            <HealthRow
              label="Recommendations"
              value={recsLabel(checks.recommendations)}
              status={checks.recommendations.status}
            />
          </div>
        ) : (
          <div className="rounded-[1.1rem] border border-dashed border-black/10 bg-slate-50/70 px-4 py-5">
            <p className="text-sm text-slate-500">
              Health diagnostics unavailable. Connect a data source to enable diagnostics.
            </p>
          </div>
        )}
      </SectionCard>

      {/* Workspace */}
      <SectionCard title="Workspace" description="Your active workspace details">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4 rounded-[1.1rem] border border-black/6 bg-slate-50/70 px-4 py-3">
            <span className="text-sm font-medium text-slate-800">Name</span>
            <span className="text-sm text-slate-500">{workspace.name}</span>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-[1.1rem] border border-black/6 bg-slate-50/70 px-4 py-3">
            <span className="text-sm font-medium text-slate-800">Workspace ID</span>
            <span className="font-mono text-[11px] text-slate-400">{workspace.id}</span>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-[1.1rem] border border-black/6 bg-slate-50/70 px-4 py-3">
            <span className="text-sm font-medium text-slate-800">Account</span>
            <span className="text-sm text-slate-500">{user.email}</span>
          </div>
        </div>
      </SectionCard>

      {/* Connections */}
      <SectionCard
        title="Connections"
        description="External data sources powering your Executive OS"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4 rounded-[1.25rem] border border-black/6 bg-slate-50/70 px-4 py-3.5">
            <div>
              <p className="text-sm font-medium text-slate-950">Google Workspace</p>
              <p className="mt-0.5 text-[11px] text-slate-400">Gmail · Google Calendar</p>
            </div>
            <a
              href={`/api/google/connect?workspaceId=${workspace.id}`}
              className="shrink-0 rounded-full border border-black/8 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-[0_4px_12px_-6px_rgba(15,23,42,0.10)] transition-all hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              {checks?.connections.status === "ok" ? "Reconnect" : "Connect"}
            </a>
          </div>
        </div>
      </SectionCard>

      {/* Configuration placeholder */}
      <SectionCard
        title="Configuration"
        description="Notification settings, AI model selection, and workspace preferences"
      >
        <div className="rounded-[1.1rem] border border-dashed border-black/10 bg-slate-50/70 px-4 py-5">
          <p className="text-sm text-slate-500">
            Full configuration controls will be available in Release 2.
          </p>
        </div>
      </SectionCard>
    </div>
  )
}
