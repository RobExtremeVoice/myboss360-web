import type { DashboardActivityItem } from "@/config/dashboard";

type ActivityListProps = {
  items: DashboardActivityItem[];
};

export function ActivityList({ items }: ActivityListProps) {
  return (
    <div className="space-y-2.5">
      {items.map((item) => (
        <article
          key={item.title + item.timestamp}
          className="grid cursor-pointer gap-4 rounded-[1.3rem] border border-black/6 bg-slate-50/70 p-4 transition-all duration-150 hover:border-black/10 hover:bg-white sm:grid-cols-[auto_minmax(0,1fr)_auto]"
        >
          <div className="flex items-start gap-4 sm:contents">
            <div className="mt-1.5 size-2 shrink-0 rounded-full bg-slate-950" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded-full border border-black/8 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-500">
                  {item.category}
                </span>
                <span className="text-[11px] text-slate-400">{item.actor}</span>
              </div>
              <p className="mt-1.5 text-sm font-medium text-slate-950">{item.title}</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">{item.detail}</p>
            </div>
          </div>
          <p className="shrink-0 self-start text-[11px] font-medium text-slate-400 sm:text-right">
            {item.timestamp}
          </p>
        </article>
      ))}
    </div>
  );
}
