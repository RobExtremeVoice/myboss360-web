import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import type {
  ConnectionHealthCheck,
  ExecutiveHealthReport,
  KnowledgeHealthCheck,
  LearningHealthCheck,
  MemoryHealthCheck,
  OverallHealth,
  RecommendationsHealthCheck,
  SyncHealthCheck,
} from "@/types/executive"
import { createGoogleConnectionsRepository } from "@/repositories/google/connections"
import { createGmailSyncRepository } from "@/repositories/google/gmail-sync"
import { createCalendarSyncRepository } from "@/repositories/google/calendar-sync"
import { GMAIL_SCOPE } from "@/config/google"

const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.readonly"

// Stale threshold: if last sync is older than 6h, report "warn"
const SYNC_STALE_MS = 6 * 60 * 60 * 1_000

export function createExecutiveHealthService(db: SupabaseClient<Database>) {
  return {
    async getHealthReport(userId: string, workspaceId: string): Promise<ExecutiveHealthReport> {
      const connectionsRepo = createGoogleConnectionsRepository(db)
      const gmailSyncRepo = createGmailSyncRepository(db)
      const calendarSyncRepo = createCalendarSyncRepository(db)

      // Fetch all health data concurrently; each check is non-fatal
      const [connection, memoryCount, signalRows, patternRows, recRows, docRows, chunkCount] =
        await Promise.all([
          connectionsRepo.findByWorkspaceAndUser(workspaceId, userId).catch(() => null),
          db
            .from("memories")
            .select("id", { count: "exact", head: true })
            .eq("workspace_id", workspaceId)
            .is("deleted_at", null)
            .then(({ count }) => count ?? 0),
          db
            .from("learning_signals")
            .select("id", { count: "exact", head: true })
            .eq("workspace_id", workspaceId)
            .is("resolved_at", null)
            .then(({ count }) => count ?? 0),
          db
            .from("learning_patterns")
            .select("id", { count: "exact", head: true })
            .eq("workspace_id", workspaceId)
            .then(({ count }) => count ?? 0),
          db
            .from("recommendations")
            .select("id, status", { count: "exact" })
            .eq("workspace_id", workspaceId)
            .is("deleted_at", null)
            .then(({ data, count }) => ({ data: data ?? [], count: count ?? 0 })),
          db
            .from("knowledge_documents")
            .select("id", { count: "exact", head: true })
            .eq("workspace_id", workspaceId)
            .is("deleted_at", null)
            .then(({ count }) => count ?? 0),
          db
            .from("knowledge_chunks")
            .select("id", { count: "exact", head: true })
            .eq("workspace_id", workspaceId)
            .then(({ count }) => count ?? 0),
        ])

      // ── Connection check ─────────────────────────────────────────────────────
      const googleConnected = connection !== null && connection.status === "active"
      const hasGmailScope = googleConnected && connection.scopes.includes(GMAIL_SCOPE)
      const hasCalendarScope = googleConnected && connection.scopes.includes(CALENDAR_SCOPE)

      const connectionCheck: ConnectionHealthCheck = {
        status: !googleConnected ? "warn" : "ok",
        googleConnected,
        hasGmailScope,
        hasCalendarScope,
        accountEmail: connection?.google_account_email ?? null,
      }

      // ── Gmail sync check ─────────────────────────────────────────────────────
      let gmailSyncCheck: SyncHealthCheck = { status: "never", lastSyncAt: null, totalSynced: 0 }
      if (connection) {
        const gmailSync = await gmailSyncRepo.findByConnectionId(connection.id).catch(() => null)
        if (gmailSync) {
          const age = gmailSync.last_sync_at
            ? Date.now() - new Date(gmailSync.last_sync_at).getTime()
            : Infinity
          gmailSyncCheck = {
            status: age > SYNC_STALE_MS ? "warn" : "ok",
            lastSyncAt: gmailSync.last_sync_at,
            totalSynced: gmailSync.total_threads_synced,
          }
        }
      }

      // ── Calendar sync check ──────────────────────────────────────────────────
      let calendarSyncCheck: SyncHealthCheck = { status: "never", lastSyncAt: null, totalSynced: 0 }
      if (connection) {
        const calSyncs = await calendarSyncRepo.listByConnection(connection.id).catch(() => [])
        if (calSyncs.length > 0) {
          const latest = calSyncs[0]
          const age = latest.last_synced_at
            ? Date.now() - new Date(latest.last_synced_at).getTime()
            : Infinity
          const total = calSyncs.reduce((s, c) => s + (c.total_events_synced ?? 0), 0)
          calendarSyncCheck = {
            status: age > SYNC_STALE_MS ? "warn" : "ok",
            lastSyncAt: latest.last_synced_at,
            totalSynced: total,
          }
        }
      }

      // ── Memory check ─────────────────────────────────────────────────────────
      const memoryCheck: MemoryHealthCheck = {
        status: memoryCount === 0 ? "empty" : "ok",
        count: memoryCount,
      }

      // ── Learning check ───────────────────────────────────────────────────────
      const pendingRecs = recRows.data.filter((r) => r.status === "pending").length
      const learningCheck: LearningHealthCheck = {
        status: signalRows === 0 && patternRows === 0 ? "empty" : "ok",
        activeSignals: signalRows,
        patterns: patternRows,
        pendingRecommendations: pendingRecs,
      }

      // ── Knowledge check ──────────────────────────────────────────────────────
      const knowledgeCheck: KnowledgeHealthCheck = {
        status: docRows === 0 ? "empty" : "ok",
        documents: docRows,
        chunks: chunkCount,
      }

      // ── Recommendations check ────────────────────────────────────────────────
      const recsCheck: RecommendationsHealthCheck = {
        status: recRows.count === 0 ? "empty" : "ok",
        pending: pendingRecs,
        total: recRows.count,
      }

      // ── Overall status ───────────────────────────────────────────────────────
      const checks = {
        connections: connectionCheck,
        calendarSync: calendarSyncCheck,
        gmailSync: gmailSyncCheck,
        memory: memoryCheck,
        learning: learningCheck,
        knowledge: knowledgeCheck,
        recommendations: recsCheck,
      }

      const statuses = Object.values(checks).map((c) => c.status)
      const overall: OverallHealth = statuses.includes("error")
        ? "critical"
        : statuses.some((s) => s === "warn")
        ? "degraded"
        : "healthy"

      return {
        status: overall,
        timestamp: new Date().toISOString(),
        checks,
      }
    },
  }
}

export type ExecutiveHealthService = ReturnType<typeof createExecutiveHealthService>
