import { Users } from "lucide-react"
import { SectionCard } from "@/components/dashboard/SectionCard"
import type { EmailIntelligenceThread, ExecutiveRisk } from "@/types/intelligence"

type Props = {
  criticalThreads: EmailIntelligenceThread[]
  topRisks: ExecutiveRisk[]
}

export function CriticalCustomersWidget({ criticalThreads, topRisks }: Props) {
  const totalCount = criticalThreads.length + topRisks.filter((r) => r.entityType === "contact" || r.entityType === "company").length

  return (
    <SectionCard
      title="Critical Customers"
      description={totalCount > 0 ? `${totalCount} customer${totalCount === 1 ? "" : "s"} need immediate attention` : undefined}
      action={
        totalCount > 0 ? (
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-50 px-1.5 text-[11px] font-semibold text-rose-600">
            {totalCount}
          </span>
        ) : null
      }
    >
      {criticalThreads.length === 0 && topRisks.length === 0 ? (
        <div className="flex items-center gap-3 rounded-[1.1rem] border border-dashed border-black/10 bg-slate-50/70 px-4 py-5">
          <Users className="size-4 shrink-0 text-slate-400" />
          <p className="text-sm text-slate-500">No critical customer issues detected</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {criticalThreads.slice(0, 3).map((thread) => (
            <article
              key={thread.id}
              className="rounded-[1.1rem] border border-rose-100 bg-rose-50/50 px-4 py-3"
            >
              <p className="truncate text-sm font-medium text-slate-950">
                {thread.subject ?? "(no subject)"}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">
                {thread.participantEmails.slice(0, 2).join(", ")}
              </p>
            </article>
          ))}
          {topRisks.filter((r) => r.entityType === "contact" || r.entityType === "company").slice(0, 3).map((risk) => (
            <article
              key={risk.id}
              className="rounded-[1.1rem] border border-amber-100 bg-amber-50/50 px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <span className="size-2 shrink-0 rounded-full bg-amber-500" />
                <p className="text-sm font-medium text-slate-950">{risk.title}</p>
              </div>
              {risk.description ? (
                <p className="mt-1 text-[11px] text-slate-500 line-clamp-1">{risk.description}</p>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </SectionCard>
  )
}
