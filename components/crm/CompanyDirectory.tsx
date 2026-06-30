import {
  CompanyForm,
  DeleteRecordButton,
} from "@/components/crm/CRMForms";
import { EmptyState } from "@/components/crm/EmptyState";
import type { CrmCompanyRecord } from "@/config/crm";
import { deleteCompanyAction } from "@/app/(dashboard)/dashboard/crm/actions";

type CompanyDirectoryProps = {
  companies: CrmCompanyRecord[];
  dataMode: "live" | "fallback";
  emptyTitle: string;
  emptyDescription: string;
};

export function CompanyDirectory({
  companies,
  dataMode,
  emptyTitle,
  emptyDescription,
}: CompanyDirectoryProps) {
  if (companies.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="space-y-4">
      {companies.map((company) => (
        <article
          key={company.id}
          className="rounded-[1.45rem] border border-black/6 bg-slate-50/70 p-5 transition-all duration-150 hover:border-black/10 hover:bg-white"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-slate-950">{company.name}</p>
                {company.industry ? (
                  <span className="rounded-full border border-black/8 bg-white px-2.5 py-0.5 text-[11px] font-medium text-slate-500">
                    {company.industry}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {company.domain || company.website || "No website or domain recorded yet."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm lg:min-w-[16rem]">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Owner
                </p>
                <p className="mt-1 text-slate-700">{company.owner}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Contacts
                </p>
                <p className="mt-1 text-slate-700">{company.contactCount}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Open deals
                </p>
                <p className="mt-1 text-slate-700">{company.openDealCount}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Open value
                </p>
                <p className="mt-1 font-medium text-slate-950">{company.openValue}</p>
              </div>
            </div>
          </div>

          {company.notes ? (
            <p className="mt-4 text-sm leading-6 text-slate-500">{company.notes}</p>
          ) : null}

          {dataMode === "live" ? (
            <details className="mt-4 rounded-[1.2rem] border border-black/6 bg-white">
              <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-slate-700">
                Edit company
              </summary>
              <div className="space-y-4 border-t border-black/6 px-4 py-4">
                <CompanyForm mode="edit" defaultValues={company} />
                <DeleteRecordButton
                  id={company.id}
                  entityLabel={company.name}
                  action={deleteCompanyAction}
                />
              </div>
            </details>
          ) : (
            <div className="mt-4 rounded-[1rem] border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              Sample record. Create a live company above to begin real CRM management.
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
