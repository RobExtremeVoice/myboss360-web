import type { DashboardPriorityItem } from "@/config/dashboard";

type PriorityListProps = {
  items: DashboardPriorityItem[];
};

const toneDot = {
  critical: "bg-rose-500",
  watch: "bg-amber-500",
  ready: "bg-emerald-500",
} as const;

const toneBadge = {
  critical: "border-rose-200 bg-rose-50 text-rose-700",
  watch: "border-amber-200 bg-amber-50 text-amber-700",
  ready: "border-emerald-200 bg-emerald-50 text-emerald-700",
} as const;

export function PriorityList({ items }: PriorityListProps) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <article
          key={item.title}
          className="cursor-pointer rounded-[1.35rem] border border-black/6 bg-slate-50/70 p-4 transition-all duration-150 hover:border-black/10 hover:bg-white"
        >
          <div className="flex items-center gap-2.5">
            <span className={["size-2 shrink-0 rounded-full", toneDot[item.tone]].join(" ")} />
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
              {item.owner} · {item.dueWindow}
            </p>
          </div>
          <div className="mt-2.5 flex flex-wrap items-start justify-between gap-3">
            <p className="text-sm font-medium text-slate-950">{item.title}</p>
            <span
              className={[
                "shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
                toneBadge[item.tone],
              ].join(" ")}
            >
              {item.status}
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-500">{item.detail}</p>
        </article>
      ))}
    </div>
  );
}
