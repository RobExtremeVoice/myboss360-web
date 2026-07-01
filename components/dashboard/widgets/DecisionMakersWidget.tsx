import { Crown } from "lucide-react"
import { SectionCard } from "@/components/dashboard/SectionCard"
import type { PersonProfile } from "@/types/people"

type Props = {
  profiles: PersonProfile[]
}

export function DecisionMakersWidget({ profiles }: Props) {
  const items = profiles.slice(0, 5)

  return (
    <SectionCard
      title="Decision Makers"
      description={items.length > 0 ? `${items.length} key decision maker${items.length === 1 ? "" : "s"} in your network` : undefined}
    >
      {items.length === 0 ? (
        <div className="flex items-center gap-3 rounded-[1.1rem] border border-dashed border-black/10 bg-slate-50/70 px-4 py-5">
          <Crown className="size-4 shrink-0 text-slate-400" />
          <p className="text-sm text-slate-500">No decision makers identified yet</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((person) => (
            <article
              key={person.id}
              className="flex items-center justify-between gap-3 rounded-[1.1rem] border border-black/6 bg-slate-50/70 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-950">
                  {person.fullName ?? person.email}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-slate-400">
                  {person.jobTitle ?? person.email}
                </p>
              </div>
              <span className="shrink-0 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[10px] font-semibold text-rose-700">
                {person.influenceScore}
              </span>
            </article>
          ))}
        </div>
      )}
    </SectionCard>
  )
}
