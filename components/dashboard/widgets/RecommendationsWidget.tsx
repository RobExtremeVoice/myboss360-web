import { Lightbulb } from "lucide-react"
import { SectionCard } from "@/components/dashboard/SectionCard"
import type { Recommendation } from "@/types/learning"

const priorityStyles = {
  critical: "border-rose-200 bg-rose-50 text-rose-700",
  high: "border-amber-200 bg-amber-50 text-amber-700",
  medium: "border-blue-200 bg-blue-50 text-blue-700",
  low: "border-slate-200 bg-slate-100 text-slate-600",
} as const

const typeIcon: Record<string, string> = {
  action: "→",
  warning: "⚠",
  opportunity: "↑",
  insight: "◎",
}

type Props = {
  recommendations: Recommendation[]
}

export function RecommendationsWidget({ recommendations }: Props) {
  const items = recommendations.slice(0, 5)

  return (
    <SectionCard
      title="Recommendations"
      description={items.length > 0 ? `${recommendations.length} pending recommendation${recommendations.length === 1 ? "" : "s"}` : undefined}
      action={
        items.length > 0 ? (
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-50 px-1.5 text-[11px] font-semibold text-indigo-600">
            {recommendations.length}
          </span>
        ) : null
      }
    >
      {items.length === 0 ? (
        <div className="flex items-center gap-3 rounded-[1.1rem] border border-dashed border-black/10 bg-slate-50/70 px-4 py-5">
          <Lightbulb className="size-4 shrink-0 text-slate-400" />
          <p className="text-sm text-slate-500">No pending recommendations</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((rec) => {
            const badgeClass = priorityStyles[rec.priority] ?? priorityStyles.low
            const icon = typeIcon[rec.type] ?? "·"
            return (
              <article
                key={rec.id}
                className="rounded-[1.1rem] border border-black/6 bg-slate-50/70 px-4 py-3"
              >
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 shrink-0 text-sm text-slate-400" aria-hidden>
                    {icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start gap-2">
                      <p className="text-sm font-medium text-slate-950">{rec.title}</p>
                      <span className={["shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium", badgeClass].join(" ")}>
                        {rec.priority}
                      </span>
                    </div>
                    {rec.description ? (
                      <p className="mt-0.5 text-[11px] text-slate-500 line-clamp-1">{rec.description}</p>
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
