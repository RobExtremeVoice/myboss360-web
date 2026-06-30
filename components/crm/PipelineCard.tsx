import type { CrmPipelineStage } from "@/config/crm";

type PipelineCardProps = {
  stage: CrmPipelineStage;
};

function stageBarColor(progress: number): string {
  if (progress === 100) return "bg-emerald-500";
  if (progress >= 70) return "bg-amber-500";
  if (progress >= 45) return "bg-indigo-500";
  if (progress >= 25) return "bg-blue-500";
  return "bg-slate-400";
}

export function PipelineCard({ stage }: PipelineCardProps) {
  const barColor = stageBarColor(stage.progress);

  return (
    <article className="group rounded-[1.5rem] border border-black/6 bg-white p-5 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.12)] transition-all duration-200 hover:-translate-y-px hover:border-black/10 hover:shadow-[0_24px_50px_-30px_rgba(15,23,42,0.18)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{stage.name}</p>
          <p className="mt-3 tabular-nums text-[1.75rem] font-semibold tracking-[-0.06em] text-slate-950">
            {stage.totalValue}
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-black/8 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-500">
          {stage.progressLabel}
        </span>
      </div>

      <div className="mt-5 flex items-center justify-between text-xs font-medium text-slate-400">
        <span>{stage.dealCount} deals</span>
        <span className="tabular-nums">{stage.progress}%</span>
      </div>

      <div className="mt-2.5 h-1.5 rounded-full bg-slate-100">
        <div
          className={["h-1.5 rounded-full transition-all duration-300", barColor].join(" ")}
          style={{ width: `${stage.progress}%` }}
        />
      </div>
    </article>
  );
}
