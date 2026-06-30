import type { CrmPriorityCard } from "@/config/crm";

type PriorityCardProps = {
  item: CrmPriorityCard;
};

export function PriorityCard({ item }: PriorityCardProps) {
  return (
    <article className="rounded-[1.45rem] border border-black/6 bg-white p-5 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.12)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-950">{item.title}</p>
          <p className="mt-3 text-sm leading-6 text-slate-500">{item.detail}</p>
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between gap-4 text-xs font-medium text-slate-400">
        <span>{item.owner}</span>
        <span>{item.dueWindow}</span>
      </div>
    </article>
  );
}
