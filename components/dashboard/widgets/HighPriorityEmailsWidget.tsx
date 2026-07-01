import { Inbox } from "lucide-react"
import { SectionCard } from "@/components/dashboard/SectionCard"
import type { EmailIntelligenceThread } from "@/types/intelligence"

const priorityStyles = {
  critical: "border-rose-200 bg-rose-50 text-rose-700",
  high: "border-amber-200 bg-amber-50 text-amber-700",
  medium: "border-blue-200 bg-blue-50 text-blue-700",
  low: "border-slate-200 bg-slate-100 text-slate-600",
} as const

type Props = {
  threads: EmailIntelligenceThread[]
}

export function HighPriorityEmailsWidget({ threads }: Props) {
  const items = threads.slice(0, 6)

  return (
    <SectionCard
      title="High Priority Emails"
      description={items.length > 0 ? `${items.length} email${items.length === 1 ? "" : "s"} flagged high priority` : undefined}
      action={
        items.length > 0 ? (
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-50 px-1.5 text-[11px] font-semibold text-amber-600">
            {items.length}
          </span>
        ) : null
      }
    >
      {items.length === 0 ? (
        <div className="flex items-center gap-3 rounded-[1.1rem] border border-dashed border-black/10 bg-slate-50/70 px-4 py-5">
          <Inbox className="size-4 shrink-0 text-slate-400" />
          <p className="text-sm text-slate-500">No high-priority emails at this time</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((thread) => {
            const badgeClass = priorityStyles[thread.priorityLabel as keyof typeof priorityStyles] ?? priorityStyles.low
            return (
              <article
                key={thread.id}
                className="flex items-center justify-between gap-3 rounded-[1.1rem] border border-black/6 bg-slate-50/70 px-4 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-950">
                    {thread.subject ?? "(no subject)"}
                  </p>
                </div>
                <span className={["shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium", badgeClass].join(" ")}>
                  {thread.priorityLabel}
                </span>
              </article>
            )
          })}
        </div>
      )}
    </SectionCard>
  )
}
