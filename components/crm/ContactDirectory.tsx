import {
  ContactForm,
  DeleteRecordButton,
} from "@/components/crm/CRMForms";
import { EmptyState } from "@/components/crm/EmptyState";
import type { CrmContactRecord, CrmSelectOption } from "@/config/crm";
import { deleteContactAction } from "@/app/(dashboard)/dashboard/crm/actions";

type ContactDirectoryProps = {
  contacts: CrmContactRecord[];
  companies: CrmSelectOption[];
  dataMode: "live" | "fallback";
  emptyTitle: string;
  emptyDescription: string;
};

export function ContactDirectory({
  contacts,
  companies,
  dataMode,
  emptyTitle,
  emptyDescription,
}: ContactDirectoryProps) {
  if (contacts.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="space-y-4">
      {contacts.map((contact) => (
        <article
          key={contact.id}
          className="rounded-[1.45rem] border border-black/6 bg-slate-50/70 p-5 transition-all duration-150 hover:border-black/10 hover:bg-white"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-950">{contact.fullName}</p>
              <p className="mt-1.5 text-sm text-slate-500">
                {contact.jobTitle || "No title set"} · {contact.companyName}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm lg:min-w-[16rem]">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Owner
                </p>
                <p className="mt-1 text-slate-700">{contact.owner}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Company
                </p>
                <p className="mt-1 text-slate-700">{contact.companyName}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Email
                </p>
                <p className="mt-1 text-slate-700">{contact.email || "Not provided"}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Phone
                </p>
                <p className="mt-1 text-slate-700">{contact.phone || "Not provided"}</p>
              </div>
            </div>
          </div>

          {contact.notes ? (
            <p className="mt-4 text-sm leading-6 text-slate-500">{contact.notes}</p>
          ) : null}

          {dataMode === "live" ? (
            <details className="mt-4 rounded-[1.2rem] border border-black/6 bg-white">
              <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-slate-700">
                Edit contact
              </summary>
              <div className="space-y-4 border-t border-black/6 px-4 py-4">
                <ContactForm mode="edit" companies={companies} defaultValues={contact} />
                <DeleteRecordButton
                  id={contact.id}
                  entityLabel={contact.fullName}
                  action={deleteContactAction}
                />
              </div>
            </details>
          ) : (
            <div className="mt-4 rounded-[1rem] border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              Sample record. Create a live contact above to begin real CRM management.
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
