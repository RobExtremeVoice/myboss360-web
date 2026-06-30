import type { CrmLead, CrmPageContent } from "@/config/crm";

type LeadTableProps = {
  labels: CrmPageContent["recentLeads"]["columnLabels"];
  leads: CrmLead[];
};

const statusBadge: Record<string, string> = {
  Qualified: "border-emerald-200 bg-emerald-50 text-emerald-700",
  New: "border-blue-200 bg-blue-50 text-blue-700",
  Working: "border-amber-200 bg-amber-50 text-amber-700",
};

function getStatusBadge(status: string): string {
  return statusBadge[status] ?? "border-slate-200 bg-slate-100 text-slate-600";
}

export function LeadTable({ labels, leads }: LeadTableProps) {
  return (
    <div>
      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-[1.4rem] border border-black/6 md:block">
        <table className="w-full border-collapse text-left">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{labels.company}</th>
              <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{labels.contact}</th>
              <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{labels.source}</th>
              <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{labels.owner}</th>
              <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{labels.status}</th>
              <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{labels.value}</th>
              <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{labels.lastContact}</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead, index) => (
              <tr
                key={lead.contact + lead.company}
                className={[
                  "cursor-pointer transition-colors duration-100 hover:bg-slate-50/80",
                  index !== leads.length - 1 ? "border-t border-black/6" : "",
                ].join(" ")}
              >
                <td className="px-5 py-4">
                  <p className="text-sm font-medium text-slate-950">{lead.company}</p>
                </td>
                <td className="px-5 py-4 text-sm text-slate-600">{lead.contact}</td>
                <td className="px-5 py-4 text-sm text-slate-500">{lead.source}</td>
                <td className="px-5 py-4 text-sm text-slate-600">{lead.owner}</td>
                <td className="px-5 py-4">
                  <span
                    className={[
                      "inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
                      getStatusBadge(lead.status),
                    ].join(" ")}
                  >
                    {lead.status}
                  </span>
                </td>
                <td className="tabular-nums px-5 py-4 text-sm font-medium text-slate-950">{lead.value}</td>
                <td className="px-5 py-4 text-sm text-slate-500">{lead.lastContact}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {leads.map((lead) => (
          <article
            key={lead.contact + lead.company}
            className="cursor-pointer rounded-[1.35rem] border border-black/6 bg-slate-50/70 p-4 transition-all duration-150 hover:border-black/10 hover:bg-white"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-950">{lead.company}</p>
                <p className="mt-1 text-sm text-slate-500">{lead.contact}</p>
              </div>
              <span
                className={[
                  "shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
                  getStatusBadge(lead.status),
                ].join(" ")}
              >
                {lead.status}
              </span>
            </div>
            <div className="mt-3 space-y-1.5 text-sm text-slate-500">
              <p>{labels.source}: <span className="text-slate-700">{lead.source}</span></p>
              <p>{labels.owner}: <span className="text-slate-700">{lead.owner}</span></p>
              <p>{labels.value}: <span className="tabular-nums font-medium text-slate-950">{lead.value}</span></p>
              <p>{labels.lastContact}: <span className="text-slate-700">{lead.lastContact}</span></p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
