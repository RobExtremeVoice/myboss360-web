import type { CrmPipelineStage } from "@/config/crm";

type PipelineCardProps = {
  stage: CrmPipelineStage;
};

export function PipelineCard({ stage }: PipelineCardProps) {
  return (
    <article className="rounded-[1.5rem] border border-black/6 bg-white p-5 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.12)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{stage.name}</p>
          <p className="mt-4 text-3xl font-semibold tracking-[-0.06em] text-slate-950">
            {stage.totalValue}
          </p>
        </div>
        <span className="rounded-full border border-black/6 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
          {stage.progressLabel}
        </span>
      </div>

      <div className="mt-5 flex items-center justify-between text-sm text-slate-500">
        <span>{stage.dealCount} deals</span>
        <span>{stage.progress}%</span>
      </div>

      <div className="mt-4 h-2 rounded-full bg-slate-200">
        <div
          className="h-2 rounded-full bg-slate-950"
          style={{ width: `${stage.progress}%` }}
        />
      </div>
    </article>
  );
}
