import { AlertCircle, Minus, TrendingUp } from "lucide-react";

import type { DashboardMetric } from "@/config/dashboard";

import { DashboardSparkline } from "./DashboardSparkline";

type KpiCardProps = {
  metric: DashboardMetric;
};

export function KpiCard({ metric }: KpiCardProps) {
  const trendStyles = {
    up: {
      icon: TrendingUp,
      badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
    flat: {
      icon: Minus,
      badge: "border-slate-200 bg-slate-100 text-slate-600",
    },
    attention: {
      icon: AlertCircle,
      badge: "border-amber-200 bg-amber-50 text-amber-700",
    },
  } as const;

  const trend = trendStyles[metric.trend];
  const TrendIcon = trend.icon;

  return (
    <article className="rounded-[1.75rem] border border-black/6 bg-white p-5 shadow-[0_18px_44px_-34px_rgba(15,23,42,0.14)] transition-colors hover:border-black/10 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{metric.label}</p>
          <p className="mt-4 text-3xl font-semibold tracking-[-0.07em] text-slate-950 sm:text-[2rem]">
            {metric.value}
          </p>
          <p className="mt-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
            {metric.comparison}
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${trend.badge}`}
        >
          <TrendIcon className="size-3.5" />
          {metric.change}
        </span>
      </div>
      <div className="mt-5 flex items-end justify-between gap-4">
        <p className="max-w-[14rem] text-sm leading-6 text-slate-500">{metric.detail}</p>
        <div className="shrink-0">
          <DashboardSparkline points={metric.sparkline} tone={metric.trend} />
        </div>
      </div>
    </article>
  );
}
