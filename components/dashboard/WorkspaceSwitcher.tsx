import { ChevronsUpDown } from "lucide-react";

type WorkspaceSwitcherProps = {
  compact?: boolean;
};

export function WorkspaceSwitcher({ compact = false }: WorkspaceSwitcherProps) {
  return (
    <button
      type="button"
      className={[
        "flex items-center justify-between gap-3 border border-black/8 bg-white text-left shadow-[0_10px_28px_-24px_rgba(15,23,42,0.14)] transition-colors hover:bg-slate-50",
        compact ? "rounded-full px-4 py-2.5" : "w-full rounded-[1.25rem] px-4 py-3",
      ].join(" ")}
      aria-label="Switch workspace"
    >
      <div>
        {!compact ? (
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
            Workspace
          </p>
        ) : null}
        <p className={compact ? "text-sm font-medium text-slate-950" : "mt-1 text-sm font-semibold text-slate-950"}>
          MyBoss360 HQ
        </p>
      </div>
      <ChevronsUpDown className="size-4 text-slate-400" />
    </button>
  );
}
