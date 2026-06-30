import type { DashboardDocumentItem } from "@/config/dashboard";

type DocumentListProps = {
  items: DashboardDocumentItem[];
};

export function DocumentList({ items }: DocumentListProps) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <article
          key={item.name}
          className="flex cursor-pointer items-center justify-between gap-4 rounded-[1.25rem] border border-black/6 bg-slate-50/70 p-4 transition-all duration-150 hover:border-black/10 hover:bg-white"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-950">{item.name}</p>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="rounded-md border border-black/8 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-500">
                {item.category}
              </span>
              <span className="text-[11px] text-slate-400">{item.owner}</span>
            </div>
          </div>
          <p className="shrink-0 text-[11px] font-medium text-slate-400">{item.updatedAt}</p>
        </article>
      ))}
    </div>
  );
}
