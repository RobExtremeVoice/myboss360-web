import type { DashboardDocumentItem } from "@/config/dashboard";

type DocumentListProps = {
  items: DashboardDocumentItem[];
};

export function DocumentList({ items }: DocumentListProps) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <article
          key={item.name}
          className="flex items-start justify-between gap-4 rounded-[1.25rem] border border-black/6 bg-slate-50/70 p-4"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-950">{item.name}</p>
            <p className="mt-2 text-sm text-slate-500">{item.category}</p>
            <p className="mt-1 text-xs text-slate-400">{item.owner}</p>
          </div>
          <p className="shrink-0 text-xs text-slate-400">{item.updatedAt}</p>
        </article>
      ))}
    </div>
  );
}
