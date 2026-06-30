import {
  DealForm,
  DealStageForm,
  DeleteRecordButton,
} from "@/components/crm/CRMForms";
import { EmptyState } from "@/components/crm/EmptyState";
import {
  crmPipelineStageDefinitions,
  type CrmDealRecord,
  type CrmSelectOption,
} from "@/config/crm";
import { deleteDealAction } from "@/app/(dashboard)/dashboard/crm/actions";

type PipelineBoardProps = {
  board: Record<string, CrmDealRecord[]>;
  companies: CrmSelectOption[];
  contacts: CrmSelectOption[];
  owners: CrmSelectOption[];
  dataMode: "live" | "fallback";
  emptyTitle: string;
  emptyDescription: string;
};

export function PipelineBoard({
  board,
  companies,
  contacts,
  owners,
  dataMode,
  emptyTitle,
  emptyDescription,
}: PipelineBoardProps) {
  const hasDeals = Object.values(board).some((items) => items.length > 0);

  if (!hasDeals) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="grid gap-4 xl:grid-cols-5">
      {crmPipelineStageDefinitions.map((stage) => {
        const items = board[stage.dbStage] ?? [];

        return (
          <section
            key={stage.dbStage}
            className="rounded-[1.5rem] border border-black/6 bg-slate-50/70 p-4"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-950">{stage.label}</h3>
                <p className="mt-1 text-xs text-slate-400">{items.length} deals</p>
              </div>
            </div>

            <div className="space-y-3">
              {items.map((deal) => (
                <article
                  key={deal.id}
                  className="rounded-[1.25rem] border border-black/6 bg-white p-4 shadow-[0_12px_28px_-24px_rgba(15,23,42,0.16)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-950">{deal.title}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {deal.company} · {deal.contact}
                      </p>
                    </div>
                    <span className="rounded-full border border-black/8 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-500">
                      {deal.probabilityLabel}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-2 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-400">Value</span>
                      <span className="font-medium text-slate-950">{deal.valueLabel}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-400">Owner</span>
                      <span className="text-right text-slate-700">{deal.owner}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-400">Close date</span>
                      <span className="text-right text-slate-700">{deal.expectedCloseDateLabel}</span>
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-slate-500">{deal.nextAction}</p>

                  {dataMode === "live" ? (
                    <>
                      <div className="mt-4">
                        <DealStageForm id={deal.id} currentStage={deal.stage} />
                      </div>

                      <details className="mt-4 rounded-[1rem] border border-black/6 bg-slate-50/70">
                        <summary className="cursor-pointer list-none px-3 py-2.5 text-sm font-medium text-slate-700">
                          Edit deal
                        </summary>
                        <div className="space-y-4 border-t border-black/6 px-3 py-3">
                          <DealForm
                            mode="edit"
                            companies={companies}
                            contacts={contacts}
                            owners={owners}
                            defaultValues={deal}
                          />
                          <DeleteRecordButton
                            id={deal.id}
                            entityLabel={deal.title}
                            action={deleteDealAction}
                          />
                        </div>
                      </details>
                    </>
                  ) : (
                    <div className="mt-4 rounded-[1rem] border border-blue-200 bg-blue-50 px-3 py-3 text-sm text-blue-800">
                      Sample deal. Create a live opportunity above to unlock stage updates and editing.
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
