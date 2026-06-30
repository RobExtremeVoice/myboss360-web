import type { DashboardMetric } from "@/config/dashboard";

type KpiCardProps = {
  metric: DashboardMetric;
};

export function KpiCard({ metric }: KpiCardProps) {
  return (
    <article className="rounded-[1.5rem] border border-black/6 bg-white p-5 shadow-[0_18px_44px_-34px_rgba(15,23,42,0.16)]">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-slate-500">{metric.label}</p>
        <span className="rounded-full border border-black/6 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
          {metric.change}
        </span>
      </div>
      <p className="mt-5 text-3xl font-semibold tracking-[-0.05em] text-slate-950">
        {metric.value}
      </p>
      <p className="mt-3 text-sm leading-6 text-slate-500">{metric.detail}</p>
    </article>
  );
}
