"use client";

import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";

import { NotificationBell } from "./NotificationBell";
import { SearchBar } from "./SearchBar";
import { UserMenu } from "./UserMenu";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";

type TopbarProps = {
  onMenuToggle: () => void;
};

export function Topbar({ onMenuToggle }: TopbarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-black/6 bg-slate-100/92 backdrop-blur-xl">
      <div className="flex items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
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

        <div className="ml-auto hidden xl:block">
          <WorkspaceSwitcher compact />
        </div>

        <div className="flex items-center gap-3">
          <NotificationBell />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
