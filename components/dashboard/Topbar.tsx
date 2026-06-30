"use client";

import { Menu, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { dashboardShellContent } from "@/config/dashboard";

import { NotificationBell } from "./NotificationBell";
import { SearchBar } from "./SearchBar";
import { StatusPill } from "./StatusPill";
import { UserMenu } from "./UserMenu";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";

type TopbarProps = {
  onMenuToggle: () => void;
};

export function Topbar({ onMenuToggle }: TopbarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-black/6 bg-slate-100/92 backdrop-blur-xl">
      <div className="flex flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:px-8">
        <div className="flex items-center gap-3 lg:min-w-0 lg:flex-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onMenuToggle}
            className="rounded-full border-black/8 bg-white lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="size-4" />
          </Button>

          <div className="w-full max-w-xl min-w-0">
            <SearchBar />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 xl:gap-3">
          <div className="hidden lg:block">
            <WorkspaceSwitcher compact />
          </div>
          <div className="hidden xl:block">
            <StatusPill
              label={dashboardShellContent.workspaceStatus.label}
              value={dashboardShellContent.workspaceStatus.value}
            />
          </div>
          <div className="hidden lg:block">
            <StatusPill
              label={dashboardShellContent.aiStatus.label}
              value={dashboardShellContent.aiStatus.value}
              tone="success"
            />
          </div>
          <Button
            type="button"
            size="lg"
            className="rounded-full px-4 shadow-[0_10px_28px_-24px_rgba(15,23,42,0.18)]"
          >
            <Plus className="size-4" />
            {dashboardShellContent.primaryActionLabel}
          </Button>
        </div>

        <div className="flex items-center justify-end gap-2 sm:gap-3">
          <NotificationBell />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
