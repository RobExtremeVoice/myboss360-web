import type { CrmCustomerHealth } from "@/config/crm";

type CustomerHealthCardProps = {
  account: CrmCustomerHealth;
};

function healthBarColor(score: number): string {
  if (score >= 85) return "bg-emerald-500";
  if (score >= 65) return "bg-blue-500";
  return "bg-amber-500";
}

const riskBadge: Record<string, string> = {
  Low: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Moderate: "border-amber-200 bg-amber-50 text-amber-700",
  High: "border-rose-200 bg-rose-50 text-rose-700",
};

function getRiskBadge(risk: string): string {
  return riskBadge[risk] ?? "border-slate-200 bg-slate-100 text-slate-600";
}

export function CustomerHealthCard({ account }: CustomerHealthCardProps) {
  const barColor = healthBarColor(account.healthScore);

  return (
    <article className="rounded-[1.5rem] border border-black/6 bg-white p-5 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.12)] transition-all duration-200 hover:-translate-y-px hover:border-black/10 hover:shadow-[0_24px_50px_-30px_rgba(15,23,42,0.18)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-950">{account.company}</p>
          <p className="mt-1.5 text-xs text-slate-400">{account.owner}</p>
        </div>
        <span
          className={[
            "shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
            getRiskBadge(account.risk),
          ].join(" ")}
        >
          {account.risk} risk
        </span>
      </div>

      <div className="mt-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Health score
          </p>
          <p className="mt-1.5 tabular-nums text-[1.75rem] font-semibold tracking-[-0.06em] text-slate-950">
            {account.healthScore}
          </p>
        </div>
        <p className="text-[11px] font-medium text-slate-400">{account.renewalDate}</p>
      </div>

      <div className="mt-3 h-1.5 rounded-full bg-slate-100">
        <div
          className={["h-1.5 rounded-full transition-all duration-300", barColor].join(" ")}
          style={{ width: `${account.healthScore}%` }}
        />
      </div>

      <div className="mt-4 space-y-2 text-sm">
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-400">NPS</span>
          <span className="tabular-nums font-medium text-slate-700">{account.nps}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-400">Expansion</span>
          <span className="font-medium text-slate-700">{account.expansionOpportunity}</span>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-500">{account.detail}</p>
    </article>
  );
}
