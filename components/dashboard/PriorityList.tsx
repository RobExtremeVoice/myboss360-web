import type { DashboardPriorityItem } from "@/config/dashboard";

type PriorityListProps = {
  items: DashboardPriorityItem[];
};

export function PriorityList({ items }: PriorityListProps) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <article
          key={item.title}
          className="rounded-[1.25rem] border border-black/6 bg-slate-50/70 p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium text-slate-950">{item.title}</p>
            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500">
              {item.status}
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
        </article>
      ))}
    </div>
  );
}
