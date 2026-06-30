import type { CrmPriorityCard, CrmPriorityTone } from "@/config/crm";

type PriorityCardProps = {
  item: CrmPriorityCard;
};

const toneDot: Record<CrmPriorityTone, string> = {
  critical: "bg-rose-500",
  watch: "bg-amber-500",
  ready: "bg-emerald-500",
};

const toneBadge: Record<CrmPriorityTone, string> = {
  critical: "border-rose-200 bg-rose-50 text-rose-700",
  watch: "border-amber-200 bg-amber-50 text-amber-700",
  ready: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

export function PriorityCard({ item }: PriorityCardProps) {
  const tone = item.tone;

  return (
    <article className="cursor-pointer rounded-[1.45rem] border border-black/6 bg-white p-5 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.12)] transition-all duration-150 hover:border-black/10 hover:shadow-[0_24px_50px_-30px_rgba(15,23,42,0.18)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            {tone ? (
              <span className={["size-2 shrink-0 rounded-full", toneDot[tone]].join(" ")} />
            ) : null}
            <p className="text-sm font-medium text-slate-950">{item.title}</p>
          </div>
          <p className="mt-2.5 text-sm leading-6 text-slate-500">{item.detail}</p>
        </div>
        {tone ? (
          <span
            className={[
              "shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
              toneBadge[tone],
            ].join(" ")}
          >
            {item.dueWindow}
          </span>
        ) : null}
      </div>
      <div className="mt-4 flex items-center justify-between gap-4 text-[11px] font-medium text-slate-400">
        <span>{item.owner}</span>
        {!tone ? <span>{item.dueWindow}</span> : null}
      </div>
    </article>
  );
}
