import { Brain } from "lucide-react"
import { SectionCard } from "@/components/dashboard/SectionCard"
import type { Memory } from "@/types/memory"
import { formatRelativeTime } from "@/utils/formatters"

const typeLabels: Record<string, string> = {
  observation: "Observation",
  decision: "Decision",
  meeting_summary: "Meeting",
  ai_insight: "AI Insight",
  user_preference: "Preference",
  org_goal: "Goal",
  workspace_context: "Context",
  executive_note: "Note",
}


type Props = {
  memories: Memory[]
}

export function RecentMemoriesWidget({ memories }: Props) {
  const items = memories.slice(0, 5)

  return (
    <SectionCard
      title="Recent Memories"
      description={items.length > 0 ? `${memories.length} stored memory entries` : undefined}
    >
      {items.length === 0 ? (
        <div className="flex items-center gap-3 rounded-[1.1rem] border border-dashed border-black/10 bg-slate-50/70 px-4 py-5">
          <Brain className="size-4 shrink-0 text-slate-400" />
          <p className="text-sm text-slate-500">No memories stored yet</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((memory) => (
            <article
              key={memory.id}
              className="rounded-[1.1rem] border border-black/6 bg-slate-50/70 px-4 py-3"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-slate-950 line-clamp-1">{memory.title}</p>
                <span className="shrink-0 rounded-full border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-600">
                  {typeLabels[memory.type] ?? memory.type}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between gap-2">
                <p className="text-[11px] text-slate-500 line-clamp-1">{memory.content}</p>
                <span className="shrink-0 text-[10px] text-slate-400">{formatRelativeTime(memory.createdAt)}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </SectionCard>
  )
}
