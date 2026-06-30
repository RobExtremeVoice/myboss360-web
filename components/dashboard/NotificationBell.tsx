import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";

export function NotificationBell() {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="relative rounded-full border-black/8 bg-white shadow-[0_10px_28px_-24px_rgba(15,23,42,0.18)] transition-all duration-150 hover:border-black/12 hover:bg-slate-50"
      aria-label="Notifications"
    >
      <Bell className="size-4" />
      <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-emerald-500 ring-2 ring-white" />
    </Button>
  );
}
