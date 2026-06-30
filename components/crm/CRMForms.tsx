"use client";

import { useRef, useState, useTransition } from "react";
import { LoaderCircle, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  type CrmCompanyRecord,
  type CrmContactRecord,
  type CrmDealRecord,
  type CrmSelectOption,
  crmActivityTypeOptions,
  crmPipelineStageDefinitions,
} from "@/config/crm";
import type { ActionState } from "@/app/(dashboard)/dashboard/crm/actions";
import {
  createActivityAction,
  createCompanyAction,
  createContactAction,
  createDealAction,
  updateCompanyAction,
  updateContactAction,
  updateDealAction,
  updateDealStageAction,
} from "@/app/(dashboard)/dashboard/crm/actions";

type ServerAction = (formData: FormData) => Promise<ActionState>;

type CompanyFormProps = {
  mode: "create" | "edit";
  defaultValues?: Partial<CrmCompanyRecord>;
};

type ContactFormProps = {
  mode: "create" | "edit";
  companies: CrmSelectOption[];
  defaultValues?: Partial<CrmContactRecord>;
};

type DealFormProps = {
  mode: "create" | "edit";
  companies: CrmSelectOption[];
  contacts: CrmSelectOption[];
  owners: CrmSelectOption[];
  defaultValues?: Partial<CrmDealRecord>;
};

type ActivityFormProps = {
  companies: CrmSelectOption[];
  contacts: CrmSelectOption[];
  deals: Array<Pick<CrmDealRecord, "id" | "title" | "company">>;
};

type DeleteRecordButtonProps = {
  id: string;
  entityLabel: string;
  action: ServerAction;
  disabled?: boolean;
};

type DealStageFormProps = {
  id: string;
  currentStage: string;
  disabled?: boolean;
};

const inputClass =
  "w-full rounded-[1rem] border border-black/8 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition-all duration-150 placeholder:text-slate-400 focus:border-black/14 focus:bg-white focus:shadow-[0_0_0_4px_rgba(15,23,42,0.05)]";

const labelClass =
  "mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400";

const sectionClass =
  "rounded-[1.35rem] border border-black/6 bg-slate-50/70 p-4";

function StatusMessage({
  state,
  successMessage,
}: {
  state: ActionState | null;
  successMessage: string;
}) {
  if (!state) {
    return null;
  }

  if (state.success) {
    return (
      <div className="rounded-[0.9rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
        {successMessage}
      </div>
    );
  }

  return (
    <div className="rounded-[0.9rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      {state.error ?? "Something went wrong."}
    </div>
  );
}

function FormSubmitButton({
  pending,
  children,
  variant = "default",
}: {
  pending: boolean;
  children: React.ReactNode;
  variant?: "default" | "outline";
}) {
  return (
    <Button
      type="submit"
      variant={variant}
      disabled={pending}
      className={
        variant === "outline"
          ? "rounded-full border-black/8 bg-white px-5"
          : "rounded-full px-5"
      }
    >
      {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
      {children}
    </Button>
  );
}

function useServerAction(action: ServerAction) {
  const router = useRouter();
  const [state, setState] = useState<ActionState | null>(null);
  const [isPending, startTransition] = useTransition();

  function run(formData: FormData, onSuccess?: () => void) {
    startTransition(async () => {
      const result = await action(formData);
      setState(result);

      if (result.success) {
        onSuccess?.();
        router.refresh();
      }
    });
  }

  return {
    state,
    isPending,
    run,
  };
}

function baseCompanyValues(values?: Partial<CrmCompanyRecord>) {
  return {
    name: values?.name ?? "",
    domain: values?.domain ?? "",
    industry: values?.industry ?? "",
    size: values?.size ?? "",
    website: values?.website ?? "",
    phone: values?.phone ?? "",
    notes: values?.notes ?? "",
  };
}

function baseContactValues(values?: Partial<CrmContactRecord>) {
  return {
    companyId: values?.companyId ?? "",
    firstName: values?.firstName ?? "",
    lastName: values?.lastName ?? "",
    email: values?.email ?? "",
    phone: values?.phone ?? "",
    jobTitle: values?.jobTitle ?? "",
    notes: values?.notes ?? "",
  };
}

function baseDealValues(values?: Partial<CrmDealRecord>) {
  return {
    companyId: values?.companyId ?? "",
    contactId: values?.contactId ?? "",
    leadId: values?.leadId ?? "",
    title: values?.title ?? "",
    stage: values?.stage ?? "prospect",
    value: values?.value ? String(values.value) : "",
    currency: values?.currency ?? "USD",
    probability: values?.probability ? String(values.probability) : "",
    expectedCloseDate: values?.expectedCloseDate ?? "",
    assignedTo: values?.assignedTo ?? "",
    notes: values?.notes ?? "",
  };
}

export function CompanyForm({ mode, defaultValues }: CompanyFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const values = baseCompanyValues(defaultValues);
  const { state, isPending, run } = useServerAction(
    mode === "create" ? createCompanyAction : updateCompanyAction
  );

  return (
    <form
      ref={formRef}
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        run(formData, () => {
          if (mode === "create") {
            formRef.current?.reset();
          }
        });
      }}
    >
      {mode === "edit" && defaultValues?.id ? (
        <input type="hidden" name="id" value={defaultValues.id} />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <label htmlFor={`${mode}-company-name`} className={labelClass}>
            Company name
          </label>
          <input
            id={`${mode}-company-name`}
            name="name"
            defaultValue={values.name}
            className={inputClass}
            placeholder="Atlas Systems"
          />
        </div>
        <div>
          <label htmlFor={`${mode}-company-domain`} className={labelClass}>
            Domain
          </label>
          <input
            id={`${mode}-company-domain`}
            name="domain"
            defaultValue={values.domain}
            className={inputClass}
            placeholder="atlas-systems.com"
          />
        </div>
        <div>
          <label htmlFor={`${mode}-company-industry`} className={labelClass}>
            Industry
          </label>
          <input
            id={`${mode}-company-industry`}
            name="industry"
            defaultValue={values.industry}
            className={inputClass}
            placeholder="Enterprise software"
          />
        </div>
        <div>
          <label htmlFor={`${mode}-company-size`} className={labelClass}>
            Company size
          </label>
          <input
            id={`${mode}-company-size`}
            name="size"
            defaultValue={values.size}
            className={inputClass}
            placeholder="201-500"
          />
        </div>
        <div>
          <label htmlFor={`${mode}-company-website`} className={labelClass}>
            Website
          </label>
          <input
            id={`${mode}-company-website`}
            name="website"
            defaultValue={values.website}
            className={inputClass}
            placeholder="https://company.com"
          />
        </div>
        <div>
          <label htmlFor={`${mode}-company-phone`} className={labelClass}>
            Phone
          </label>
          <input
            id={`${mode}-company-phone`}
            name="phone"
            defaultValue={values.phone}
            className={inputClass}
            placeholder="+1 (555) 555-0100"
          />
        </div>
      </div>

      <div>
        <label htmlFor={`${mode}-company-notes`} className={labelClass}>
          Notes
        </label>
        <textarea
          id={`${mode}-company-notes`}
          name="notes"
          defaultValue={values.notes}
          rows={4}
          className={inputClass}
          placeholder="Executive context, buying signals, or risks."
        />
      </div>

      <StatusMessage
        state={state}
        successMessage={
          mode === "create" ? "Company created successfully." : "Company updated successfully."
        }
      />

      <FormSubmitButton pending={isPending}>
        {mode === "create" ? "Create company" : "Save company"}
      </FormSubmitButton>
    </form>
  );
}

export function ContactForm({
  mode,
  companies,
  defaultValues,
}: ContactFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const values = baseContactValues(defaultValues);
  const { state, isPending, run } = useServerAction(
    mode === "create" ? createContactAction : updateContactAction
  );

  return (
    <form
      ref={formRef}
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        run(formData, () => {
          if (mode === "create") {
            formRef.current?.reset();
          }
        });
      }}
    >
      {mode === "edit" && defaultValues?.id ? (
        <input type="hidden" name="id" value={defaultValues.id} />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <label htmlFor={`${mode}-contact-company`} className={labelClass}>
            Company
          </label>
          <select
            id={`${mode}-contact-company`}
            name="companyId"
            defaultValue={values.companyId}
            className={inputClass}
          >
            <option value="">No linked company</option>
            {companies
              .filter((option) => option.value !== "all")
              .map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${mode}-contact-job-title`} className={labelClass}>
            Job title
          </label>
          <input
            id={`${mode}-contact-job-title`}
            name="jobTitle"
            defaultValue={values.jobTitle}
            className={inputClass}
            placeholder="VP Operations"
          />
        </div>
        <div>
          <label htmlFor={`${mode}-contact-first-name`} className={labelClass}>
            First name
          </label>
          <input
            id={`${mode}-contact-first-name`}
            name="firstName"
            defaultValue={values.firstName}
            className={inputClass}
            placeholder="Maya"
          />
        </div>
        <div>
          <label htmlFor={`${mode}-contact-last-name`} className={labelClass}>
            Last name
          </label>
          <input
            id={`${mode}-contact-last-name`}
            name="lastName"
            defaultValue={values.lastName}
            className={inputClass}
            placeholder="Johnson"
          />
        </div>
        <div>
          <label htmlFor={`${mode}-contact-email`} className={labelClass}>
            Email
          </label>
          <input
            id={`${mode}-contact-email`}
            name="email"
            defaultValue={values.email}
            className={inputClass}
            placeholder="name@company.com"
          />
        </div>
        <div>
          <label htmlFor={`${mode}-contact-phone`} className={labelClass}>
            Phone
          </label>
          <input
            id={`${mode}-contact-phone`}
            name="phone"
            defaultValue={values.phone}
            className={inputClass}
            placeholder="+1 (555) 555-0100"
          />
        </div>
      </div>

      <div>
        <label htmlFor={`${mode}-contact-notes`} className={labelClass}>
          Notes
        </label>
        <textarea
          id={`${mode}-contact-notes`}
          name="notes"
          defaultValue={values.notes}
          rows={4}
          className={inputClass}
          placeholder="Buying role, personality notes, or open follow-ups."
        />
      </div>

      <StatusMessage
        state={state}
        successMessage={
          mode === "create" ? "Contact created successfully." : "Contact updated successfully."
        }
      />

      <FormSubmitButton pending={isPending}>
        {mode === "create" ? "Create contact" : "Save contact"}
      </FormSubmitButton>
    </form>
  );
}

export function DealForm({
  mode,
  companies,
  contacts,
  owners,
  defaultValues,
}: DealFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const values = baseDealValues(defaultValues);
  const { state, isPending, run } = useServerAction(
    mode === "create" ? createDealAction : updateDealAction
  );

  return (
    <form
      ref={formRef}
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        run(formData, () => {
          if (mode === "create") {
            formRef.current?.reset();
          }
        });
      }}
    >
      {mode === "edit" && defaultValues?.id ? (
        <input type="hidden" name="id" value={defaultValues.id} />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <label htmlFor={`${mode}-deal-title`} className={labelClass}>
            Deal title
          </label>
          <input
            id={`${mode}-deal-title`}
            name="title"
            defaultValue={values.title}
            className={inputClass}
            placeholder="Atlas Executive Rollout"
          />
        </div>
        <div>
          <label htmlFor={`${mode}-deal-stage`} className={labelClass}>
            Stage
          </label>
          <select
            id={`${mode}-deal-stage`}
            name="stage"
            defaultValue={values.stage}
            className={inputClass}
          >
            {crmPipelineStageDefinitions.map((stage) => (
              <option key={stage.dbStage} value={stage.dbStage}>
                {stage.label}
              </option>
            ))}
            <option value="closed_lost">Closed Lost</option>
          </select>
        </div>
        <div>
          <label htmlFor={`${mode}-deal-company`} className={labelClass}>
            Company
          </label>
          <select
            id={`${mode}-deal-company`}
            name="companyId"
            defaultValue={values.companyId}
            className={inputClass}
          >
            <option value="">No linked company</option>
            {companies
              .filter((option) => option.value !== "all")
              .map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${mode}-deal-contact`} className={labelClass}>
            Contact
          </label>
          <select
            id={`${mode}-deal-contact`}
            name="contactId"
            defaultValue={values.contactId}
            className={inputClass}
          >
            <option value="">No linked contact</option>
            {contacts.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${mode}-deal-value`} className={labelClass}>
            Value
          </label>
          <input
            id={`${mode}-deal-value`}
            name="value"
            defaultValue={values.value}
            className={inputClass}
            placeholder="240000"
          />
        </div>
        <div>
          <label htmlFor={`${mode}-deal-currency`} className={labelClass}>
            Currency
          </label>
          <input
            id={`${mode}-deal-currency`}
            name="currency"
            defaultValue={values.currency}
            className={inputClass}
            placeholder="USD"
          />
        </div>
        <div>
          <label htmlFor={`${mode}-deal-probability`} className={labelClass}>
            Probability
          </label>
          <input
            id={`${mode}-deal-probability`}
            name="probability"
            defaultValue={values.probability}
            className={inputClass}
            placeholder="75"
          />
        </div>
        <div>
          <label htmlFor={`${mode}-deal-close`} className={labelClass}>
            Expected close date
          </label>
          <input
            id={`${mode}-deal-close`}
            type="date"
            name="expectedCloseDate"
            defaultValue={values.expectedCloseDate}
            className={inputClass}
          />
        </div>
        <div className="lg:col-span-2">
          <label htmlFor={`${mode}-deal-owner`} className={labelClass}>
            Owner
          </label>
          <select
            id={`${mode}-deal-owner`}
            name="assignedTo"
            defaultValue={values.assignedTo}
            className={inputClass}
          >
            <option value="">Unassigned</option>
            {owners
              .filter((option) => option.value !== "all")
              .map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor={`${mode}-deal-notes`} className={labelClass}>
          Notes
        </label>
        <textarea
          id={`${mode}-deal-notes`}
          name="notes"
          defaultValue={values.notes}
          rows={4}
          className={inputClass}
          placeholder="Commercial context, blockers, or executive notes."
        />
      </div>

      <StatusMessage
        state={state}
        successMessage={mode === "create" ? "Deal created successfully." : "Deal updated successfully."}
      />

      <FormSubmitButton pending={isPending}>
        {mode === "create" ? "Create deal" : "Save deal"}
      </FormSubmitButton>
    </form>
  );
}

export function ActivityForm({
  companies,
  contacts,
  deals,
}: ActivityFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const { state, isPending, run } = useServerAction(createActivityAction);

  return (
    <form
      ref={formRef}
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        run(formData, () => {
          formRef.current?.reset();
        });
      }}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <label htmlFor="activity-type" className={labelClass}>
            Activity type
          </label>
          <select id="activity-type" name="type" defaultValue="meeting" className={inputClass}>
            {crmActivityTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="activity-title" className={labelClass}>
            Title
          </label>
          <input
            id="activity-title"
            name="title"
            className={inputClass}
            placeholder="Atlas procurement review completed"
          />
        </div>
        <div>
          <label htmlFor="activity-company" className={labelClass}>
            Company
          </label>
          <select id="activity-company" name="companyId" defaultValue="" className={inputClass}>
            <option value="">No linked company</option>
            {companies
              .filter((option) => option.value !== "all")
              .map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
          </select>
        </div>
        <div>
          <label htmlFor="activity-contact" className={labelClass}>
            Contact
          </label>
          <select id="activity-contact" name="contactId" defaultValue="" className={inputClass}>
            <option value="">No linked contact</option>
            {contacts.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="activity-deal" className={labelClass}>
            Deal
          </label>
          <select id="activity-deal" name="dealId" defaultValue="" className={inputClass}>
            <option value="">No linked deal</option>
            {deals.map((deal) => (
              <option key={deal.id} value={deal.id}>
                {deal.title} · {deal.company}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="activity-occurred-at" className={labelClass}>
            Occurred at
          </label>
          <input
            id="activity-occurred-at"
            type="datetime-local"
            name="occurredAt"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="activity-body" className={labelClass}>
          Notes
        </label>
        <textarea
          id="activity-body"
          name="body"
          rows={4}
          className={inputClass}
          placeholder="What happened, what changed, and what needs follow-through."
        />
      </div>

      <StatusMessage state={state} successMessage="Activity created successfully." />
      <FormSubmitButton pending={isPending}>Log activity</FormSubmitButton>
    </form>
  );
}

export function DeleteRecordButton({
  id,
  entityLabel,
  action,
  disabled = false,
}: DeleteRecordButtonProps) {
  const [state, setState] = useState<ActionState | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (disabled) {
    return null;
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="destructive"
        disabled={isPending}
        className="rounded-full"
        onClick={() => {
          if (!window.confirm(`Delete ${entityLabel}? This will soft delete the record.`)) {
            return;
          }

          startTransition(async () => {
            const formData = new FormData();
            formData.set("id", id);
            const result = await action(formData);
            setState(result);

            if (result.success) {
              router.refresh();
            }
          });
        }}
      >
        {isPending ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
        Delete
      </Button>

      {state && !state.success ? (
        <p className="text-xs text-rose-600">{state.error}</p>
      ) : null}
    </div>
  );
}

export function DealStageForm({
  id,
  currentStage,
  disabled = false,
}: DealStageFormProps) {
  const { state, isPending, run } = useServerAction(updateDealStageAction);

  if (disabled) {
    return null;
  }

  return (
    <form
      className="space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        run(formData);
      }}
    >
      <input type="hidden" name="id" value={id} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          name="stage"
          defaultValue={currentStage}
          className="min-w-0 flex-1 rounded-full border border-black/8 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition-all duration-150 focus:border-black/14 focus:shadow-[0_0_0_4px_rgba(15,23,42,0.05)]"
        >
          {crmPipelineStageDefinitions.map((stage) => (
            <option key={stage.dbStage} value={stage.dbStage}>
              {stage.label}
            </option>
          ))}
          <option value="closed_lost">Closed Lost</option>
        </select>
        <FormSubmitButton pending={isPending} variant="outline">
          Update stage
        </FormSubmitButton>
      </div>

      {state && !state.success ? (
        <p className="text-xs text-rose-600">{state.error}</p>
      ) : null}
    </form>
  );
}

export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className={sectionClass}>
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      </div>
      {children}
    </div>
  );
}
