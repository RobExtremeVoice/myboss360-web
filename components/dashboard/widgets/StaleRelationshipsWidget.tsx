import { Clock } from "lucide-react"
import { SectionCard } from "@/components/dashboard/SectionCard"
import type { PersonProfile } from "@/types/people"

function daysSince(isoDate: string | null): number | null {
  if (!isoDate) return null
  return Math.floor((Date.now() - new Date(isoDate).getTime()) / (24 * 60 * 60 * 1000))
}

type Props = {
  profiles: PersonProfile[]
}

export function StaleRelationshipsWidget({ profiles }: Props) {
  const items = profiles.slice(0, 5)

  return (
    <SectionCard
      title="Going Cold"
      description={items.length > 0 ? `${items.length} relationship${items.length === 1 ? "" : "s"} need re-engagement` : undefined}
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
          <Clock className="size-4 shrink-0 text-slate-400" />
          <p className="text-sm text-slate-500">All relationships are active</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((person) => {
            const days = daysSince(person.lastInteractionAt)
            return (
              <article
                key={person.id}
                className="flex items-center justify-between gap-3 rounded-[1.1rem] border border-black/6 bg-slate-50/70 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-950">
                    {person.fullName ?? person.email}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-slate-400">
                    {person.companyName ?? person.email}
                  </p>
                </div>
                {days !== null ? (
                  <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700">
                    {days}d ago
                  </span>
                ) : null}
              </article>
            )
          })}
        </div>
      )}
    </SectionCard>
  )
}
