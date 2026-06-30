import type { DashboardMeetingItem } from "@/config/dashboard";

type MeetingListProps = {
  items: DashboardMeetingItem[];
};

export function MeetingList({ items }: MeetingListProps) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <article
          key={item.title + item.time}
          className="rounded-[1.25rem] border border-black/6 bg-slate-50/70 p-4"
        >
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-medium text-slate-950">{item.title}</p>
            <span className="text-xs font-medium text-slate-500">{item.time}</span>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">{item.attendees}</p>
          <p className="mt-1 text-xs text-slate-400">{item.location}</p>
        </article>
      ))}
    </div>
  );
}
