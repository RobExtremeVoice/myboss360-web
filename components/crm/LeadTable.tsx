import type { CrmLead, CrmPageContent } from "@/config/crm";

type LeadTableProps = {
  labels: CrmPageContent["recentLeads"]["columnLabels"];
  leads: CrmLead[];
};

export function LeadTable({ labels, leads }: LeadTableProps) {
  return (
    <div>
      <div className="hidden overflow-hidden rounded-[1.4rem] border border-black/6 md:block">
        <table className="w-full border-collapse text-left">
          <thead className="bg-slate-50 text-xs uppercase tracking-[0.16em] text-slate-400">
            <tr>
              <th className="px-5 py-4 font-medium">{labels.company}</th>
              <th className="px-5 py-4 font-medium">{labels.contact}</th>
              <th className="px-5 py-4 font-medium">{labels.source}</th>
              <th className="px-5 py-4 font-medium">{labels.owner}</th>
              <th className="px-5 py-4 font-medium">{labels.status}</th>
              <th className="px-5 py-4 font-medium">{labels.value}</th>
              <th className="px-5 py-4 font-medium">{labels.lastContact}</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead, index) => (
              <tr
                key={lead.contact + lead.company}
                className={index !== leads.length - 1 ? "border-t border-black/6" : ""}
              >
                <td className="px-5 py-4">
                  <p className="text-sm font-medium text-slate-950">{lead.company}</p>
                </td>
                <td className="px-5 py-4 text-sm text-slate-600">{lead.contact}</td>
                <td className="px-5 py-4 text-sm text-slate-600">{lead.source}</td>
                <td className="px-5 py-4 text-sm text-slate-600">{lead.owner}</td>
                <td className="px-5 py-4 text-sm text-slate-600">{lead.status}</td>
                <td className="px-5 py-4 text-sm text-slate-600">{lead.value}</td>
                <td className="px-5 py-4 text-sm text-slate-600">{lead.lastContact}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-4 md:hidden">
        {leads.map((lead) => (
          <article
            key={lead.contact + lead.company}
            className="rounded-[1.35rem] border border-black/6 bg-slate-50/70 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-950">{lead.company}</p>
                <p className="mt-1 text-sm text-slate-500">{lead.contact}</p>
              </div>
              <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500">
                {lead.status}
              </span>
            </div>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <p>{labels.source}: {lead.source}</p>
              <p>{labels.owner}: {lead.owner}</p>
              <p>{labels.value}: {lead.value}</p>
              <p>{labels.lastContact}: {lead.lastContact}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
