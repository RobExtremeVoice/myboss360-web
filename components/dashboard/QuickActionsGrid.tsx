import { ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { DashboardQuickAction } from "@/config/dashboard";

type QuickActionsGridProps = {
  actions: DashboardQuickAction[];
};

export function QuickActionsGrid({ actions }: QuickActionsGridProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {actions.map((action) => (
        <Button
          key={action.label}
          type="button"
          variant="outline"
          className="group h-auto items-start justify-between rounded-[1.35rem] border-black/8 bg-slate-50/70 px-4 py-4 text-left text-sm text-slate-950 transition-all duration-150 hover:border-black/12 hover:bg-white hover:shadow-[0_14px_36px_-24px_rgba(15,23,42,0.14)]"
        >
          <span className="min-w-0">
            <span className="block font-medium text-slate-950">{action.label}</span>
            <span className="mt-1.5 block text-xs leading-5 text-slate-500">
              {action.description}
            </span>
          </span>
          <ArrowUpRight className="mt-0.5 size-4 shrink-0 text-slate-400 transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-slate-700" />
        </Button>
      ))}
    </div>
  );
}
