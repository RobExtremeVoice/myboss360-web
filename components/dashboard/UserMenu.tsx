import { ChevronDown } from "lucide-react";

export function UserMenu() {
  return (
    <button
      type="button"
      className="flex items-center gap-2 rounded-full border border-black/8 bg-white pl-1.5 pr-3 py-1.5 shadow-[0_10px_28px_-24px_rgba(15,23,42,0.18)] transition-all duration-150 hover:border-black/12 hover:bg-slate-50 active:scale-[0.98]"
      aria-label="User menu"
    >
      <div className="flex size-8 items-center justify-center rounded-full bg-slate-950 text-[11px] font-semibold text-white ring-2 ring-white">
        MB
      </div>
      <div className="hidden text-left sm:block">
        <p className="text-sm font-medium leading-tight text-slate-950">MyBoss Admin</p>
        <p className="text-[11px] leading-tight text-slate-400">Administrator</p>
      </div>
      <ChevronDown className="size-3.5 text-slate-400" />
    </button>
  );
}
