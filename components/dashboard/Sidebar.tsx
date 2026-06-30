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
    <aside className="flex h-full w-full flex-col border-r border-black/6 bg-white px-4 pb-4 pt-5">
      <Link href="/" className="flex items-center gap-3 px-2 py-2">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-xs font-semibold tracking-[0.2em] text-white shadow-[0_8px_20px_-8px_rgba(15,23,42,0.36)]">
          MB
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-950">
            MyBoss360
          </p>
          <p className="text-[11px] leading-4 text-slate-400">Executive workspace</p>
        </div>
      </Link>

      <nav className="mt-8 flex-1 space-y-7 overflow-y-auto pr-1">
        {dashboardNavigationSections.map((section) => (
          <div key={section.title}>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              {section.title}
            </p>
            <div className="space-y-0.5">
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

      <div className="mt-6 rounded-[1.35rem] border border-black/6 bg-gradient-to-b from-slate-50 to-slate-100/70 p-4">
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            System status
          </p>
        </div>
        <p className="mt-2 text-sm font-medium text-slate-700">All systems operational</p>
        <p className="mt-1 text-xs leading-5 text-slate-400">
          CRM, projects, finance, calendar, and AI ready.
        </p>
      </div>
    </aside>
  );
}
