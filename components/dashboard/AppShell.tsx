"use client";

import { X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      {/* Skip navigation link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-indigo-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:shadow-lg focus:outline-none"
      >
        Skip to main content
      </a>

      <div className="flex min-h-screen">
        <div className="hidden w-80 shrink-0 lg:block">
          <Sidebar />
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar onMenuToggle={() => setIsMobileSidebarOpen(true)} />
          <main
            id="main-content"
            role="main"
            className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
            tabIndex={-1}
          >
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>
        </div>
      </div>

      {isMobileSidebarOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            onClick={() => setIsMobileSidebarOpen(false)}
            aria-label="Close navigation overlay"
          />
          <div className="relative h-full w-[88vw] max-w-sm bg-white shadow-[0_30px_80px_-30px_rgba(15,23,42,0.32)]">
            <div className="flex items-center justify-end border-b border-black/6 p-4">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setIsMobileSidebarOpen(false)}
                className="rounded-full border-black/8 bg-white"
                aria-label="Close navigation"
              >
                <X className="size-4" />
              </Button>
            </div>
            <div className="h-[calc(100%-73px)]">
              <Sidebar onNavigate={() => setIsMobileSidebarOpen(false)} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
