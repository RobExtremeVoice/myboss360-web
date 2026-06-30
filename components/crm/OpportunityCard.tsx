import type { CrmOpportunity } from "@/config/crm";

type OpportunityCardProps = {
  opportunity: CrmOpportunity;
};

function confidenceBarColor(confidence: number): string {
  if (confidence >= 80) return "bg-emerald-500";
  if (confidence >= 60) return "bg-blue-500";
  return "bg-amber-500";
}

function probabilityBadge(probability: string): string {
  const value = parseInt(probability, 10);
  if (value >= 80) return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (value >= 60) return "border-blue-200 bg-blue-50 text-blue-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

export function OpportunityCard({ opportunity }: OpportunityCardProps) {
  const barColor = confidenceBarColor(opportunity.confidence);

  return (
    <article className="rounded-[1.5rem] border border-black/6 bg-white p-5 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.12)] transition-all duration-200 hover:-translate-y-px hover:border-black/10 hover:shadow-[0_24px_50px_-30px_rgba(15,23,42,0.18)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-950">{opportunity.company}</p>
          <p className="mt-1.5 text-xs font-medium uppercase tracking-[0.12em] text-slate-400">{opportunity.stage}</p>
        </div>
        <span
          className={[
            "shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
            probabilityBadge(opportunity.probability),
          ].join(" ")}
        >
          {opportunity.probability}
        </span>
      </div>

      <p className="mt-4 tabular-nums text-[1.75rem] font-semibold tracking-[-0.06em] text-slate-950">
        {opportunity.arr}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{opportunity.detail}</p>

      <div className="mt-4 space-y-2 text-sm">
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-400">Owner</span>
          <span className="font-medium text-slate-700">{opportunity.owner}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-400">Next action</span>
          <span className="text-right font-medium text-slate-700">{opportunity.nextAction}</span>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-[11px] font-medium text-slate-400">
          <span>Confidence</span>
          <span className="tabular-nums">{opportunity.confidence}%</span>
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-slate-100">
          <div
            className={["h-1.5 rounded-full transition-all duration-300", barColor].join(" ")}
            style={{ width: `${opportunity.confidence}%` }}
          />
        </div>
      </div>
    </article>
  );
}
