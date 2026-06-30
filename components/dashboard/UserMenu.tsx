import { ChevronDown } from "lucide-react";

export function UserMenu() {
  return (
    <button
      type="button"
      className="flex items-center gap-2 rounded-full border border-black/8 bg-white pl-2 pr-3 py-2 shadow-[0_10px_28px_-24px_rgba(15,23,42,0.18)] transition-colors hover:bg-slate-50"
      aria-label="User menu"
    >
      <div className="flex size-9 items-center justify-center rounded-full bg-slate-950 text-xs font-semibold text-white">
        MB
      </div>
      <div className="hidden text-left sm:block">
        <p className="text-sm font-medium text-slate-950">MyBoss Admin</p>
        <p className="text-xs text-slate-500">Administrator</p>
      </div>
      <ChevronDown className="size-4 text-slate-400" />
    </button>
  );
}
