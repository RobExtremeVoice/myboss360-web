import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  crmLeadStatusOptions,
  crmPageContent,
  crmStageFilterOptions,
} from "@/config/crm";

type CRMToolbarProps = {
  search: string;
  stage: string;
  leadStatus: string;
};

const fieldClass =
  "h-11 w-full rounded-full border border-black/8 bg-white px-4 text-sm text-slate-950 outline-none transition-all duration-150 placeholder:text-slate-400 focus:border-black/14 focus:shadow-[0_0_0_4px_rgba(15,23,42,0.05)]";

export function CRMToolbar({ search, stage, leadStatus }: CRMToolbarProps) {
  return (
    <section className="rounded-[1.6rem] border border-black/6 bg-white p-5 shadow-[0_18px_48px_-36px_rgba(15,23,42,0.18)]">
      <form className="grid gap-3 lg:grid-cols-[minmax(0,1.5fr)_220px_220px_auto] lg:items-end">
        <div>
          <label
            htmlFor="crm-search"
            className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400"
          >
            {crmPageContent.toolbar.searchLabel}
          </label>
          <input
            id="crm-search"
            name="q"
            type="search"
            defaultValue={search}
            placeholder={crmPageContent.toolbar.searchPlaceholder}
            className={fieldClass}
          />
        </div>

        <div>
          <label
            htmlFor="crm-stage"
            className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400"
          >
            {crmPageContent.toolbar.stageLabel}
          </label>
          <select
            id="crm-stage"
            name="stage"
            defaultValue={stage}
            className={fieldClass}
          >
            {crmStageFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="crm-lead-status"
            className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400"
          >
            {crmPageContent.toolbar.leadStatusLabel}
          </label>
          <select
            id="crm-lead-status"
            name="leadStatus"
            defaultValue={leadStatus}
            className={fieldClass}
          >
            {crmLeadStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <Button type="submit" className="h-11 rounded-full px-5">
            {crmPageContent.toolbar.submitLabel}
          </Button>
          <Button
            variant="outline"
            asChild
            className="h-11 rounded-full border-black/8 bg-white px-5"
          >
            <Link href="/dashboard/crm">{crmPageContent.toolbar.resetLabel}</Link>
          </Button>
        </div>
      </form>
    </section>
  );
}
