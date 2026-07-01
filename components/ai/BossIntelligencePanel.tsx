"use client"

import {
  Activity,
  Brain,
  CheckCircle,
  Clock,
  Database,
  Mail,
  RefreshCw,
  Wifi,
  WifiOff,
} from "lucide-react"
import type { BossIntelligenceSummary } from "@/types/executive"
import { formatRelativeTime } from "@/utils/formatters"

type Props = {
  summary: BossIntelligenceSummary
}


interface StatRowProps {
  icon: React.ReactNode
  label: string
  value: string | number
  badge?: "ok" | "warn" | "none"
}

function StatRow({ icon, label, value, badge }: StatRowProps) {
  return (
    <div className="flex items-center justify-between gap-2 py-1.5">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}
        <span className="text-[11px]">{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-medium tabular-nums text-slate-900">{value}</span>
        {badge === "ok" ? (
          <CheckCircle className="size-3 text-emerald-500" />
        ) : badge === "warn" ? (
          <Activity className="size-3 text-amber-500" />
        ) : null}
      </div>
    </div>
  )
}

export function BossIntelligencePanel({ summary }: Props) {
  return (
    <div className="rounded-2xl border border-black/6 bg-white shadow-[0_4px_16px_-8px_rgba(15,23,42,0.08)]">
      {/* Header */}
      <div className="border-b border-black/6 px-4 py-3">
        <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
          Boss Intelligence
        </h3>
      </div>

      <div className="divide-y divide-black/6">
        {/* Connected Sources */}
        <div className="px-4 py-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Sources
          </p>
          <div className="space-y-0.5">
            <div className="flex items-center justify-between gap-2 py-1">
              <div className="flex items-center gap-2 text-slate-500">
                {summary.isGoogleConnected ? (
                  <Wifi className="size-3 shrink-0 text-emerald-500" />
                ) : (
                  <WifiOff className="size-3 shrink-0 text-slate-400" />
                )}
                <span className="text-[11px]">Google</span>
              </div>
              <span
                className={[
                  "text-[10px] font-medium",
                  summary.isGoogleConnected ? "text-emerald-600" : "text-slate-400",
                ].join(" ")}
              >
                {summary.isGoogleConnected ? "Connected" : "Not connected"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 py-1">
              <div className="flex items-center gap-2 text-slate-500">
                <Mail className="size-3 shrink-0" />
                <span className="text-[11px]">Gmail</span>
              </div>
              <span
                className={[
                  "text-[10px] font-medium",
                  summary.hasGmailScope ? "text-emerald-600" : "text-slate-400",
                ].join(" ")}
              >
                {summary.hasGmailScope ? "Active" : "No scope"}
              </span>
            </div>
          </div>
        </div>

        {/* Intelligence Counts */}
        <div className="px-4 py-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Intelligence
          </p>
          <div className="space-y-0.5">
            <StatRow
              icon={<Brain className="size-3 shrink-0" />}
              label="Memories"
              value={summary.memoryCount}
              badge={summary.memoryCount > 0 ? "ok" : "none"}
            />
            <StatRow
              icon={<Database className="size-3 shrink-0" />}
              label="Knowledge docs"
              value={summary.knowledgeDocuments}
              badge={summary.knowledgeDocuments > 0 ? "ok" : "none"}
            />
            <StatRow
              icon={<Activity className="size-3 shrink-0" />}
              label="Active signals"
              value={summary.signalCount}
              badge={summary.signalCount > 0 ? "warn" : "none"}
            />
            <StatRow
              icon={<CheckCircle className="size-3 shrink-0" />}
              label="Recommendations"
              value={summary.recommendationCount}
              badge={summary.recommendationCount > 0 ? "ok" : "none"}
            />
            <StatRow
              icon={<Mail className="size-3 shrink-0" />}
              label="Awaiting replies"
              value={summary.awaitingReplies}
              badge={summary.awaitingReplies > 0 ? "warn" : "none"}
            />
          </div>
        </div>

        {/* Last Sync */}
        <div className="px-4 py-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Last Sync
          </p>
          <div className="space-y-0.5">
            <div className="flex items-center justify-between gap-2 py-1">
              <div className="flex items-center gap-2 text-slate-500">
                <RefreshCw className="size-3 shrink-0" />
                <span className="text-[11px]">Gmail</span>
              </div>
              <span className="text-[11px] text-slate-400">
                {formatRelativeTime(summary.gmailLastSync)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 py-1">
              <div className="flex items-center gap-2 text-slate-500">
                <Clock className="size-3 shrink-0" />
                <span className="text-[11px]">Calendar</span>
              </div>
              <span className="text-[11px] text-slate-400">
                {formatRelativeTime(summary.calendarLastSync)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
