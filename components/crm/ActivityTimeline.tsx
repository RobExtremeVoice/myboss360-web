import type { CrmActivity } from "@/config/crm";

type ActivityTimelineProps = {
  items: CrmActivity[];
};

const typeDot: Record<string, string> = {
  "Contract Signed": "bg-emerald-500",
  "Proposal Viewed": "bg-indigo-500",
  Meeting: "bg-blue-500",
  Call: "bg-amber-500",
  Email: "bg-slate-400",
};

function getTypeDot(type: string): string {
  return typeDot[type] ?? "bg-slate-400";
}

export function ActivityTimeline({ items }: ActivityTimelineProps) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <article
          key={item.actor + item.timestamp + item.title}
          className="flex cursor-pointer gap-4 rounded-[1.35rem] border border-black/6 bg-slate-50/70 p-4 transition-all duration-150 hover:border-black/10 hover:bg-white"
        >
          <div className={["mt-2 size-2 shrink-0 rounded-full", getTypeDot(item.type)].join(" ")} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded-full border border-black/8 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-500">
                {item.type}
              </span>
              <span className="text-[11px] text-slate-400">{item.actor}</span>
            </div>
            <p className="mt-2 text-sm font-medium text-slate-950">{item.title}</p>
            <p className="mt-1.5 text-sm leading-6 text-slate-500">{item.detail}</p>
          </div>
          <p className="shrink-0 text-[11px] font-medium text-slate-400">{item.timestamp}</p>
        </article>
      ))}
    </div>
  );
}
