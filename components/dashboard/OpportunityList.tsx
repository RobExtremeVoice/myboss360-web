import type { DashboardOpportunityItem } from "@/config/dashboard";

type OpportunityListProps = {
  items: DashboardOpportunityItem[];
};

export function OpportunityList({ items }: OpportunityListProps) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <article
          key={item.name}
          className="rounded-[1.25rem] border border-black/6 bg-slate-50/70 p-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-950">{item.name}</p>
              <p className="mt-2 text-sm text-slate-500">{item.company}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-slate-950">{item.value}</p>
              <p className="mt-2 text-xs text-slate-400">{item.stage}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between gap-4">
            <div className="h-1.5 flex-1 rounded-full bg-slate-200">
              <div
                className="h-1.5 rounded-full bg-slate-950"
                style={{ width: item.confidence }}
              />
            </div>
            <p className="text-xs font-medium text-slate-500">{item.confidence}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
