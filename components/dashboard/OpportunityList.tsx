import type { DashboardOpportunityItem } from "@/config/dashboard";

type OpportunityListProps = {
  items: DashboardOpportunityItem[];
};

function confidenceBarColor(confidence: string): string {
  const value = parseInt(confidence, 10);
  if (value >= 80) return "bg-emerald-500";
  if (value >= 60) return "bg-blue-500";
  return "bg-amber-500";
}

export function OpportunityList({ items }: OpportunityListProps) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <article
          key={item.name}
          className="cursor-pointer rounded-[1.25rem] border border-black/6 bg-slate-50/70 p-4 transition-all duration-150 hover:border-black/10 hover:bg-white"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-950">{item.name}</p>
              <p className="mt-1 text-sm text-slate-400">{item.company}</p>
            </div>
            <div className="text-right">
              <p className="tabular-nums text-sm font-semibold text-slate-950">{item.value}</p>
              <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">{item.stage}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-1.5 flex-1 rounded-full bg-slate-200">
              <div
                className={["h-1.5 rounded-full transition-all duration-300", confidenceBarColor(item.confidence)].join(" ")}
                style={{ width: item.confidence }}
              />
            </div>
            <p className="tabular-nums text-[11px] font-semibold text-slate-500">{item.confidence}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
