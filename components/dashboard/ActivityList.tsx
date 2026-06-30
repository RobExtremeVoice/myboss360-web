import type { DashboardActivityItem } from "@/config/dashboard";

type ActivityListProps = {
  items: DashboardActivityItem[];
};

export function ActivityList({ items }: ActivityListProps) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <article
          key={item.title + item.timestamp}
          className="flex gap-4 rounded-[1.25rem] border border-black/6 bg-slate-50/70 p-4"
        >
          <div className="mt-1 size-2.5 shrink-0 rounded-full bg-slate-950" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-slate-950">{item.title}</p>
              <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-slate-500">
                {item.category}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
          </div>
          <p className="shrink-0 text-xs text-slate-400">{item.timestamp}</p>
        </article>
      ))}
    </div>
  );
}
