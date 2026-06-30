import type { DashboardHomeContent } from "@/config/dashboard";

type ExecutiveBriefCardProps = {
  content: DashboardHomeContent["executiveBrief"];
};

export function ExecutiveBriefCard({ content }: ExecutiveBriefCardProps) {
  const healthScore = Number(content.healthScore);
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (healthScore / 100) * circumference;

  return (
    <section className="rounded-[2rem] border border-black/6 bg-slate-950 p-6 text-white shadow-[0_20px_50px_-34px_rgba(15,23,42,0.32)] sm:p-7">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/50">
            AI Executive Brief
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">
            {content.title}
          </h2>
          <p className="mt-2 text-sm text-white/60">Good morning, Robson.</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs font-medium text-white/70">
          {content.confidenceLabel}
        </span>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-center">
        <div className="flex items-center gap-4 rounded-[1.5rem] border border-white/10 bg-white/6 p-4">
          <div className="relative flex size-20 items-center justify-center">
            <svg viewBox="0 0 80 80" className="size-20 -rotate-90">
              <circle cx="40" cy="40" r={radius} stroke="rgba(255,255,255,0.12)" strokeWidth="8" fill="none" />
              <circle
                cx="40"
                cy="40"
                r={radius}
                stroke="white"
                strokeWidth="8"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute text-center">
              <p className="text-2xl font-semibold tracking-[-0.05em] text-white">
                {content.healthScore}
              </p>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-white/45">
              Business health
            </p>
            <p className="mt-2 text-sm leading-7 text-white/76">{content.summary}</p>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-white/10 bg-white/6 p-4">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-white/45">
            Recommended action
          </p>
          <p className="mt-3 text-base leading-7 text-white">{content.recommendation}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {content.items.map((item) => (
          <div
            key={item.label}
            className="rounded-[1.25rem] border border-white/10 bg-white/6 p-4"
          >
            <p className="text-sm font-medium text-white">{item.label}</p>
            <p className="mt-2 text-sm leading-6 text-white/68">{item.detail}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-white/45">
            Top risks
          </p>
          <div className="mt-4 space-y-3">
            {content.risks.map((risk) => (
              <div key={risk.title} className="rounded-[1.25rem] border border-white/10 bg-white/6 p-4">
                <div className="flex items-center gap-3">
                  <span
                    className={[
                      "size-2.5 rounded-full",
                      risk.tone === "critical"
                        ? "bg-rose-400"
                        : risk.tone === "watch"
                          ? "bg-amber-400"
                          : "bg-emerald-400",
                    ].join(" ")}
                  />
                  <p className="text-sm font-medium text-white">{risk.title}</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-white/68">{risk.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-white/45">
            Action queue
          </p>
          <div className="mt-4 space-y-3">
            {content.actions.map((action, index) => (
              <div key={action.title} className="flex gap-3 rounded-[1.25rem] border border-white/10 bg-white/6 p-4">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white">
                  0{index + 1}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{action.title}</p>
                  <p className="mt-2 text-sm leading-6 text-white/68">{action.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
