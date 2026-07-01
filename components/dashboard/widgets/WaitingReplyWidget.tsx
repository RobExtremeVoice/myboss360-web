import { Mail } from "lucide-react"
import { SectionCard } from "@/components/dashboard/SectionCard"
import type { EmailIntelligenceThread } from "@/types/intelligence"

function daysLabel(days: number | null): string {
  if (days === null) return ""
  if (days === 0) return "today"
  if (days === 1) return "1 day"
  return `${days} days`
}

type Props = {
  threads: EmailIntelligenceThread[]
}

export function WaitingReplyWidget({ threads }: Props) {
  const items = threads.slice(0, 5)

  return (
    <SectionCard
      title="Waiting For Your Reply"
      description={items.length > 0 ? `${items.length} thread${items.length === 1 ? "" : "s"} need a response` : undefined}
      action={
        items.length > 0 ? (
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-50 px-1.5 text-[11px] font-semibold text-indigo-600">
            {items.length}
          </span>
        ) : null
      }
    >
      {items.length === 0 ? (
        <div className="flex items-center gap-3 rounded-[1.1rem] border border-dashed border-black/10 bg-slate-50/70 px-4 py-5">
          <Mail className="size-4 shrink-0 text-slate-400" />
          <p className="text-sm text-slate-500">No emails waiting for your reply</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((thread) => (
            <article
              key={thread.id}
              className="flex items-start justify-between gap-3 rounded-[1.1rem] border border-black/6 bg-slate-50/70 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-950">
                  {thread.subject ?? "(no subject)"}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  {thread.participantEmails.slice(0, 2).join(", ")}
                </p>
              </div>
              {thread.daysWaiting !== null ? (
                <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700">
                  {daysLabel(thread.daysWaiting)}
                </span>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </SectionCard>
  )
}
