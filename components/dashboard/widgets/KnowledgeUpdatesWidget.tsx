import { BookOpen } from "lucide-react"
import { SectionCard } from "@/components/dashboard/SectionCard"

interface KnowledgeDocItem {
  id: string
  title: string
  category: string | null
  updatedAt: string
}

const categoryStyles: Record<string, string> = {
  email: "border-indigo-100 bg-indigo-50 text-indigo-600",
  document: "border-slate-200 bg-slate-100 text-slate-600",
  crm: "border-emerald-100 bg-emerald-50 text-emerald-600",
  note: "border-amber-100 bg-amber-50 text-amber-600",
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const hours = Math.floor(diff / 3_600_000)
  if (hours < 1) return "just now"
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

type Props = {
  documents: KnowledgeDocItem[]
  totalCount: number
}

export function KnowledgeUpdatesWidget({ documents, totalCount }: Props) {
  const items = documents.slice(0, 5)

  return (
    <SectionCard
      title="Knowledge Updates"
      description={totalCount > 0 ? `${totalCount} document${totalCount === 1 ? "" : "s"} in knowledge base` : undefined}
    >
      {items.length === 0 ? (
        <div className="flex items-center gap-3 rounded-[1.1rem] border border-dashed border-black/10 bg-slate-50/70 px-4 py-5">
          <BookOpen className="size-4 shrink-0 text-slate-400" />
          <p className="text-sm text-slate-500">No knowledge documents yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((doc) => {
            const badgeClass = (doc.category && categoryStyles[doc.category]) ?? "border-slate-200 bg-slate-100 text-slate-600"
            return (
              <article
                key={doc.id}
                className="flex items-center justify-between gap-3 rounded-[1.1rem] border border-black/6 bg-slate-50/70 px-4 py-2.5"
              >
                <p className="truncate text-sm font-medium text-slate-950">{doc.title}</p>
                <div className="flex shrink-0 items-center gap-2">
                  {doc.category ? (
                    <span className={["rounded-full border px-2 py-0.5 text-[10px] font-medium", badgeClass].join(" ")}>
                      {doc.category}
                    </span>
                  ) : null}
                  <span className="text-[10px] text-slate-400">{relativeTime(doc.updatedAt)}</span>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </SectionCard>
  )
}
