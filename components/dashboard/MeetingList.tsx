import type { DashboardMeetingItem } from "@/config/dashboard";

type MeetingListProps = {
  items: DashboardMeetingItem[];
};

export function MeetingList({ items }: MeetingListProps) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <article
          key={item.title + item.time}
          className="cursor-pointer rounded-[1.25rem] border border-black/6 bg-slate-50/70 p-4 transition-all duration-150 hover:border-black/10 hover:bg-white"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-950">{item.title}</p>
              <p className="mt-1.5 text-sm text-slate-500">{item.attendees}</p>
            </div>
            <div className="shrink-0 rounded-full border border-black/8 bg-white px-3 py-1 text-xs font-semibold text-slate-950 shadow-[0_4px_12px_-6px_rgba(15,23,42,0.10)]">
              {item.time}
            </div>
          </div>
          <p className="mt-2.5 text-[11px] font-medium text-slate-400">{item.location}</p>
        </article>
      ))}
    </div>
  );
}
