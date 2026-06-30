"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type NavigationItemProps = {
  href: string;
  label: string;
  description: string;
  icon: ReactNode;
  onNavigate?: () => void;
};

export function NavigationItem({
  href,
  label,
  description,
  icon,
  onNavigate,
}: NavigationItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex items-start gap-3 rounded-[1.1rem] px-3 py-3 text-sm transition-colors",
        isActive
          ? "bg-slate-950 text-white shadow-[0_16px_34px_-24px_rgba(15,23,42,0.55)]"
          : "text-slate-600 hover:bg-white hover:text-slate-950"
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border",
          isActive
            ? "border-white/10 bg-white/10 text-white"
            : "border-black/8 bg-white text-slate-500"
        )}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block font-medium">{label}</span>
        <span
          className={cn(
            "mt-1 block text-xs leading-5",
            isActive ? "text-white/68" : "text-slate-500"
          )}
        >
          {description}
        </span>
      </span>
    </Link>
  );
}
