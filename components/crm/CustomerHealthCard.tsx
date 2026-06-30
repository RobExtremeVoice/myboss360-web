import type { CrmCustomerHealth } from "@/config/crm";

type CustomerHealthCardProps = {
  account: CrmCustomerHealth;
};

export function CustomerHealthCard({ account }: CustomerHealthCardProps) {
  return (
    <article className="rounded-[1.5rem] border border-black/6 bg-white p-5 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.12)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-950">{account.company}</p>
          <p className="mt-2 text-sm text-slate-500">{account.owner}</p>
        </div>
        <span className="rounded-full border border-black/6 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
          {account.risk}
        </span>
      </div>

      <div className="mt-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
            Health Score
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.06em] text-slate-950">
            {account.healthScore}
          </p>
        </div>
        <p className="text-xs font-medium text-slate-400">{account.renewalDate}</p>
      </div>

      <div className="mt-4 h-2 rounded-full bg-slate-200">
        <div
          className="h-2 rounded-full bg-slate-950"
          style={{ width: `${account.healthScore}%` }}
        />
      </div>

      <div className="mt-4 grid gap-3 text-sm text-slate-500">
        <div className="flex items-center justify-between gap-4">
          <span>NPS</span>
          <span>{account.nps}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span>Expansion Opportunity</span>
          <span>{account.expansionOpportunity}</span>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-500">{account.detail}</p>
    </article>
  );
}
