import type { DashboardHomeContent } from "@/config/dashboard";

type ExecutiveBriefCardProps = {
  content: DashboardHomeContent["executiveBrief"];
};

export function ExecutiveBriefCard({ content }: ExecutiveBriefCardProps) {
  return (
    <section className="rounded-[1.75rem] border border-black/6 bg-slate-950 p-6 text-white shadow-[0_20px_50px_-34px_rgba(15,23,42,0.38)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/50">
            AI Executive Brief
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-white">
            {content.title}
          </h2>
        </div>
        <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs font-medium text-white/70">
          Updated now
        </span>
      </div>

      <p className="mt-5 text-sm leading-7 text-white/76">{content.summary}</p>

      <div className="mt-6 space-y-3">
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
    </section>
  );
}
