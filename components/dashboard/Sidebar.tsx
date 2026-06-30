"use client";

import Link from "next/link";
import {
  BarChart3,
  CalendarDays,
  FileText,
  FolderKanban,
  LayoutDashboard,
  ListTodo,
  Settings,
  Sparkles,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import {
  dashboardNavigationSections,
  type DashboardNavigationIcon,
} from "@/config/navigation";

import { NavigationItem } from "./NavigationItem";

type SidebarProps = {
  onNavigate?: () => void;
};

const iconMap: Record<DashboardNavigationIcon, LucideIcon> = {
  "layout-dashboard": LayoutDashboard,
  users: Users,
  "folder-kanban": FolderKanban,
  "check-square": ListTodo,
  "calendar-days": CalendarDays,
  wallet: Wallet,
  "file-text": FileText,
  sparkles: Sparkles,
  "bar-chart-3": BarChart3,
  settings: Settings,
};

export function Sidebar({ onNavigate }: SidebarProps) {
  return (
    <aside className="flex h-full w-full flex-col border-r border-black/6 bg-white p-4">
      <Link href="/" className="flex items-center gap-3 px-2 py-3">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold tracking-[0.2em] text-white">
          MB
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-950">
            MyBoss360
          </p>
          <p className="text-xs text-slate-500">Executive workspace</p>
        </div>
      </Link>

      <nav className="mt-6 flex-1 space-y-6 overflow-y-auto pr-1">
        {dashboardNavigationSections.map((section) => (
          <div key={section.title}>
            <p className="px-3 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              {section.title}
            </p>
            <div className="mt-2 space-y-1">
              {section.items.map((item) => {
                const Icon = iconMap[item.icon];

                return (
                  <NavigationItem
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    description={item.description}
                    icon={<Icon className="size-4" />}
                    onNavigate={onNavigate}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-6 rounded-[1.35rem] border border-black/6 bg-slate-50 p-4">
        <p className="text-sm font-medium text-slate-950">Workspace status</p>
        <p className="mt-2 text-xs leading-6 text-slate-500">
          The authenticated shell is ready for CRM, projects, finance, calendar, and AI module expansion.
        </p>
      </div>
    </aside>
  );
}
