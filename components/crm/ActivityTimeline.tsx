import type { CrmActivity } from "@/config/crm";

type ActivityTimelineProps = {
  items: CrmActivity[];
};

export function ActivityTimeline({ items }: ActivityTimelineProps) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <article
          key={item.actor + item.timestamp + item.title}
          className="flex gap-4 rounded-[1.35rem] border border-black/6 bg-slate-50/70 p-4"
        >
          <div className="mt-1.5 size-2.5 shrink-0 rounded-full bg-slate-950" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-slate-500">
                {item.type}
              </span>
              <span className="text-xs text-slate-400">{item.actor}</span>
            </div>
            <p className="mt-3 text-sm font-medium text-slate-950">{item.title}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
          </div>
          <p className="shrink-0 text-xs font-medium text-slate-400">{item.timestamp}</p>
        </article>
      ))}
    </div>
  );
}
