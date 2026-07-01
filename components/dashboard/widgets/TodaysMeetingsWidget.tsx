import { Calendar } from "lucide-react"
import { SectionCard } from "@/components/dashboard/SectionCard"
import type { TodayAgendaItem } from "@/types/intelligence"

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

type Props = {
  items: TodayAgendaItem[]
}

export function TodaysMeetingsWidget({ items }: Props) {
  return (
    <SectionCard
      title="Today's Meetings"
      description={items.length > 0 ? `${items.length} on your agenda today` : undefined}
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
          <Calendar className="size-4 shrink-0 text-slate-400" />
          <p className="text-sm text-slate-500">No meetings scheduled for today</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.slice(0, 5).map((item) => (
            <article
              key={item.id}
              className="flex items-start justify-between gap-3 rounded-[1.1rem] border border-black/6 bg-slate-50/70 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-950">{item.title}</p>
                {item.location ? (
                  <p className="mt-0.5 text-[11px] text-slate-400">{item.location}</p>
                ) : null}
              </div>
              <span className="shrink-0 rounded-full border border-black/8 bg-white px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 shadow-[0_2px_8px_-4px_rgba(15,23,42,0.10)]">
                {formatTime(item.startAt)}
              </span>
            </article>
          ))}
        </div>
      )}
    </SectionCard>
  )
}
