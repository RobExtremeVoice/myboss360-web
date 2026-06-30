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
    <header className="sticky top-0 z-20 border-b border-black/6 bg-slate-100/94 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onMenuToggle}
          className="shrink-0 rounded-full border-black/8 bg-white lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="size-4" />
        </Button>

        <div className="min-w-0 flex-1">
          <div className="w-full max-w-md">
            <SearchBar />
          </div>
        </div>

        <div className="flex items-center gap-2">
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
            size="sm"
            className="rounded-full px-4 shadow-[0_8px_24px_-16px_rgba(15,23,42,0.32)] transition-all duration-150 hover:shadow-[0_12px_32px_-16px_rgba(15,23,42,0.42)]"
          >
            <Plus className="size-3.5" />
            <span className="font-medium">{dashboardShellContent.primaryActionLabel}</span>
          </Button>

          <NotificationBell />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
