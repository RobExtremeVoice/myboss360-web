import { AlertCircle, BarChart2, CheckSquare, TrendingUp } from "lucide-react"
import { formatCompactCurrency } from "@/utils/formatters"

type Metrics = {
  totalPipelineValue: number
  activeDeals: number
  atRiskDealsCount: number
  overdueTasksCount: number
  closedWonThisMonth: number
}

type Props = {
  metrics?: Metrics | null
}

const stats = [
  {
    label: "Pipeline",
    icon: BarChart2,
    getValue: (m: Metrics) => formatCompactCurrency(m.totalPipelineValue),
    getDetail: (m: Metrics) => `${m.activeDeals} active deals`,
    color: "text-indigo-600",
  },
  {
    label: "At risk",
    icon: AlertCircle,
    getValue: (m: Metrics) => String(m.atRiskDealsCount),
    getDetail: () => "deals need attention",
    color: "text-amber-600",
  },
  {
    label: "Overdue",
    icon: CheckSquare,
    getValue: (m: Metrics) => String(m.overdueTasksCount),
    getDetail: () => "tasks past due",
    color: "text-red-500",
  },
  {
    label: "Won MTD",
    icon: TrendingUp,
    getValue: (m: Metrics) => String(m.closedWonThisMonth),
    getDetail: () => "deals closed this month",
    color: "text-emerald-600",
  },
] as const

export function ExecutiveContextPanel({ metrics }: Props) {
  if (!metrics) {
    return (
      <div className="rounded-2xl border border-black/6 bg-white p-4">
        <p className="text-xs text-slate-400">Loading context…</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-black/6 bg-white shadow-[0_4px_16px_-8px_rgba(15,23,42,0.08)]">
      <div className="border-b border-black/6 px-4 py-3">
        <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
          Live context
        </h3>
      </div>
      <div className="grid grid-cols-2 divide-x divide-y divide-black/6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="flex flex-col gap-1 p-3">
              <div className={`flex items-center gap-1.5 ${stat.color}`}>
                <Icon className="size-3.5 shrink-0" />
                <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-slate-500">
                  {stat.label}
                </span>
              </div>
              <p className="text-xl font-semibold tabular-nums tracking-[-0.04em] text-slate-950">
                {stat.getValue(metrics)}
              </p>
              <p className="text-[11px] text-slate-400">{stat.getDetail(metrics)}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
