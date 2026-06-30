import type { CrmOpportunity } from "@/config/crm";

type OpportunityCardProps = {
  opportunity: CrmOpportunity;
};

export function OpportunityCard({ opportunity }: OpportunityCardProps) {
  return (
    <article className="rounded-[1.5rem] border border-black/6 bg-white p-5 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.12)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-950">{opportunity.company}</p>
          <p className="mt-2 text-sm text-slate-500">{opportunity.stage}</p>
        </div>
        <span className="rounded-full border border-black/6 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
          {opportunity.probability}
        </span>
      </div>

      <p className="mt-5 text-3xl font-semibold tracking-[-0.06em] text-slate-950">
        {opportunity.arr}
      </p>
      <p className="mt-3 text-sm leading-6 text-slate-500">{opportunity.detail}</p>

      <div className="mt-5 grid gap-3 text-sm text-slate-500">
        <div className="flex items-center justify-between gap-4">
          <span>Owner</span>
          <span>{opportunity.owner}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span>Next Action</span>
          <span className="text-right">{opportunity.nextAction}</span>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs font-medium text-slate-400">
          <span>Confidence</span>
          <span>{opportunity.confidence}%</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-slate-200">
          <div
            className="h-2 rounded-full bg-slate-950"
            style={{ width: `${opportunity.confidence}%` }}
          />
        </div>
      </div>
    </article>
  );
}
