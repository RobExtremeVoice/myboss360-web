import type { DashboardHomeContent } from "@/config/dashboard";

type ExecutiveBriefCardProps = {
  content: DashboardHomeContent["executiveBrief"];
};

const riskDotColor = {
  critical: "bg-rose-400",
  watch: "bg-amber-400",
  ready: "bg-emerald-400",
} as const;

export function ExecutiveBriefCard({ content }: ExecutiveBriefCardProps) {
  const healthScore = Number(content.healthScore);
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (healthScore / 100) * circumference;

  return (
    <section className="rounded-[2rem] border border-black/6 bg-slate-950 p-6 text-white shadow-[0_24px_56px_-30px_rgba(15,23,42,0.36)] sm:p-7">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">
            AI Executive Brief
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">
            {content.title}
          </h2>
          <p className="mt-1.5 text-sm text-white/55">Good morning, Robson.</p>
        </div>
        <span className="shrink-0 rounded-full border border-white/12 bg-white/8 px-3 py-1 text-xs font-medium text-white/70">
          {content.confidenceLabel}
        </span>
      </div>

      {/* Health + Recommendation row */}
      <div className="mt-6 grid gap-4 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-stretch">
        <div className="flex items-center gap-4 rounded-[1.5rem] border border-white/10 bg-white/8 p-4">
          <div className="relative flex size-20 shrink-0 items-center justify-center">
            <svg viewBox="0 0 80 80" className="size-20 -rotate-90">
              <circle cx="40" cy="40" r={radius} stroke="rgba(255,255,255,0.10)" strokeWidth="7" fill="none" />
              <circle
                cx="40"
                cy="40"
                r={radius}
                stroke="white"
                strokeWidth="7"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute text-center">
              <p className="tabular-nums text-2xl font-semibold tracking-[-0.05em] text-white">
                {content.healthScore}
              </p>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50">
              Business health
            </p>
            <p className="mt-2 text-sm leading-6 text-white/75">{content.summary}</p>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-white/10 bg-white/8 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50">
            Recommended action
          </p>
          <div className="mt-3 border-l-2 border-white/25 pl-4">
            <p className="text-sm leading-7 text-white/90">{content.recommendation}</p>
          </div>
        </div>
      </div>

      {/* Signal grid */}
      <div className="mt-4 grid gap-3 xl:grid-cols-3">
        {content.items.map((item) => (
          <div
            key={item.label}
            className="rounded-[1.25rem] border border-white/10 bg-white/8 p-4"
          >
            <p className="text-xs font-semibold text-white/80">{item.label}</p>
            <p className="mt-1.5 text-sm leading-6 text-white/60">{item.detail}</p>
          </div>
        ))}
      </div>

      {/* Risks + Actions */}
      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50">
            Top risks
          </p>
          <div className="mt-3 space-y-2.5">
            {content.risks.map((risk) => (
              <div key={risk.title} className="rounded-[1.25rem] border border-white/10 bg-white/8 p-4">
                <div className="flex items-center gap-2.5">
                  <span className={["size-2 shrink-0 rounded-full", riskDotColor[risk.tone]].join(" ")} />
                  <p className="text-sm font-medium text-white">{risk.title}</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-white/60">{risk.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50">
            Action queue
          </p>
          <div className="mt-3 space-y-2.5">
            {content.actions.map((action, index) => (
              <div
                key={action.title}
                className="flex cursor-pointer gap-3 rounded-[1.25rem] border border-white/10 bg-white/8 p-4 transition-colors duration-150 hover:border-white/20 hover:bg-white/12"
              >
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-[11px] font-semibold text-white/80">
                  {index + 1}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{action.title}</p>
                  <p className="mt-1.5 text-sm leading-6 text-white/60">{action.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
