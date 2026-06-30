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
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-950">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.attendees}</p>
            </div>
            <div className="rounded-full border border-black/6 bg-white px-3 py-1 text-xs font-medium text-slate-600">
              {item.time}
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-400">{item.location}</p>
        </article>
      ))}
    </div>
  );
}
