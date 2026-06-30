import { ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { DashboardQuickAction } from "@/config/dashboard";

type QuickActionsGridProps = {
  actions: DashboardQuickAction[];
};

export function QuickActionsGrid({ actions }: QuickActionsGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {actions.map((action) => (
        <Button
          key={action.label}
          type="button"
          variant="outline"
          className="h-auto items-start justify-between rounded-[1.25rem] border-black/8 bg-slate-50/70 px-4 py-4 text-left text-sm text-slate-950 hover:bg-white"
        >
          <span className="min-w-0">
            <span className="block font-medium">{action.label}</span>
            <span className="mt-2 block text-sm leading-6 text-slate-500">
              {action.description}
            </span>
          </span>
          <ArrowUpRight className="mt-0.5 size-4 shrink-0 text-slate-400" />
        </Button>
      ))}
    </div>
  );
}
