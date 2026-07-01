import { Bell } from "lucide-react"
import { SectionCard } from "@/components/dashboard/SectionCard"
import type { LearningSignal } from "@/types/learning"

const severityStyles = {
  critical: {
    badge: "border-rose-200 bg-rose-50 text-rose-700",
    dot: "bg-rose-500",
  },
  warning: {
    badge: "border-amber-200 bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
  },
  info: {
    badge: "border-slate-200 bg-slate-100 text-slate-600",
    dot: "bg-slate-400",
  },
} as const

type Props = {
  signals: LearningSignal[]
}

export function AttentionWidget({ signals }: Props) {
  const prioritized = signals
    .filter((s) => s.severity === "critical" || s.severity === "warning")
    .slice(0, 5)

  return (
    <SectionCard
      title="Needs Your Attention"
      description={prioritized.length > 0 ? `${prioritized.length} active alert${prioritized.length === 1 ? "" : "s"}` : undefined}
      action={
        prioritized.length > 0 ? (
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-50 px-1.5 text-[11px] font-semibold text-amber-600">
            {prioritized.length}
          </span>
        ) : null
      }
    >
      {prioritized.length === 0 ? (
        <div className="flex items-center gap-3 rounded-[1.1rem] border border-dashed border-black/10 bg-slate-50/70 px-4 py-5">
          <Bell className="size-4 shrink-0 text-slate-400" />
          <p className="text-sm text-slate-500">All clear — no active alerts</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {prioritized.map((signal) => {
            const style = severityStyles[signal.severity] ?? severityStyles.info
            return (
              <article
                key={signal.id}
                className="rounded-[1.1rem] border border-black/6 bg-slate-50/70 px-4 py-3"
              >
                <div className="flex items-start gap-2.5">
                  <span className={["mt-1.5 size-2 shrink-0 rounded-full", style.dot].join(" ")} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-slate-950">{signal.title}</p>
                      <span className={["shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium", style.badge].join(" ")}>
                        {signal.severity}
                      </span>
                    </div>
                    {signal.description ? (
                      <p className="mt-1 text-[11px] leading-4 text-slate-500 line-clamp-2">{signal.description}</p>
                    ) : null}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </SectionCard>
  )
}
