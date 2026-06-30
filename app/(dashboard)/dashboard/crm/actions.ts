"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createServerClient } from "@/lib/supabase/server";
import { createCRMService } from "@/services/crm/crm-service";
import {
  createActivitySchema,
  createCompanySchema,
  createContactSchema,
  createDealSchema,
  updateCompanySchema,
  updateContactSchema,
  updateDealSchema,
} from "@/services/crm/schemas";

export type ActionState = {
  success: boolean;
  error?: string;
};

const updateDealStageSchema = z.object({
  id: z.string().uuid("Invalid deal identifier."),
  stage: z.enum([
    "prospect",
    "qualified",
    "proposal",
    "negotiation",
    "closed_won",
    "closed_lost",
  ]),
});

function getString(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
}

async function getContext() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be signed in to modify CRM records.");
  }

  return {
    user,
    service: createCRMService(supabase),
  };
}

export async function createCompanyAction(formData: FormData): Promise<ActionState> {
  try {
    const parsed = createCompanySchema.safeParse({
      name: getString(formData, "name"),
      domain: getString(formData, "domain"),
      industry: getString(formData, "industry"),
      size: getString(formData, "size"),
      website: getString(formData, "website"),
      phone: getString(formData, "phone"),
      notes: getString(formData, "notes"),
    });

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message };
    }

    const { user, service } = await getContext();
    await service.createCompany(user.id, parsed.data);
    revalidatePath("/dashboard/crm");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to create company.",
    };
  }
}

export async function updateCompanyAction(formData: FormData): Promise<ActionState> {
  try {
    const parsed = updateCompanySchema.safeParse({
      id: getString(formData, "id"),
      name: getString(formData, "name"),
      domain: getString(formData, "domain"),
      industry: getString(formData, "industry"),
      size: getString(formData, "size"),
      website: getString(formData, "website"),
      phone: getString(formData, "phone"),
      notes: getString(formData, "notes"),
    });

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message };
    }

    const { user, service } = await getContext();
    const { id, ...input } = parsed.data;
    await service.updateCompany(user.id, id, {
      name: input.name,
      domain: input.domain,
      industry: input.industry,
      size: input.size,
      website: input.website,
      phone: input.phone,
      notes: input.notes,
    });
    revalidatePath("/dashboard/crm");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to update company.",
    };
  }
}

export async function deleteCompanyAction(formData: FormData): Promise<ActionState> {
  try {
    const id = getString(formData, "id");
    if (!id) {
      return { success: false, error: "Company id is required." };
    }

    const { user, service } = await getContext();
    await service.deleteCompany(user.id, id);
    revalidatePath("/dashboard/crm");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to delete company.",
    };
  }
}

export async function createContactAction(formData: FormData): Promise<ActionState> {
  try {
    const parsed = createContactSchema.safeParse({
      companyId: getString(formData, "companyId"),
      firstName: getString(formData, "firstName"),
      lastName: getString(formData, "lastName"),
      email: getString(formData, "email"),
      phone: getString(formData, "phone"),
      jobTitle: getString(formData, "jobTitle"),
      linkedinUrl: getString(formData, "linkedinUrl"),
      notes: getString(formData, "notes"),
    });

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message };
    }

    const { user, service } = await getContext();
    await service.createContact(user.id, parsed.data);
    revalidatePath("/dashboard/crm");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to create contact.",
    };
  }
}

export async function updateContactAction(formData: FormData): Promise<ActionState> {
  try {
    const parsed = updateContactSchema.safeParse({
      id: getString(formData, "id"),
      companyId: getString(formData, "companyId"),
      firstName: getString(formData, "firstName"),
      lastName: getString(formData, "lastName"),
      email: getString(formData, "email"),
      phone: getString(formData, "phone"),
      jobTitle: getString(formData, "jobTitle"),
      linkedinUrl: getString(formData, "linkedinUrl"),
      notes: getString(formData, "notes"),
    });

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message };
    }

    const { user, service } = await getContext();
    const { id, companyId, firstName, lastName, email, phone, jobTitle, linkedinUrl, notes } =
      parsed.data;
    await service.updateContact(user.id, id, {
      company_id: companyId,
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      job_title: jobTitle,
      linkedin_url: linkedinUrl,
      notes,
    });
    revalidatePath("/dashboard/crm");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to update contact.",
    };
  }
}

export async function deleteContactAction(formData: FormData): Promise<ActionState> {
  try {
    const id = getString(formData, "id");
    if (!id) {
      return { success: false, error: "Contact id is required." };
    }

    const { user, service } = await getContext();
    await service.deleteContact(user.id, id);
    revalidatePath("/dashboard/crm");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to delete contact.",
    };
  }
}

export async function createDealAction(formData: FormData): Promise<ActionState> {
  try {
    const parsed = createDealSchema.safeParse({
      companyId: getString(formData, "companyId"),
      contactId: getString(formData, "contactId"),
      leadId: getString(formData, "leadId"),
      title: getString(formData, "title"),
      stage: getString(formData, "stage"),
      value: getString(formData, "value"),
      currency: getString(formData, "currency"),
      probability: getString(formData, "probability"),
      expectedCloseDate: getString(formData, "expectedCloseDate"),
      assignedTo: getString(formData, "assignedTo"),
      notes: getString(formData, "notes"),
    });

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message };
    }

    const { user, service } = await getContext();
    await service.createDeal(user.id, parsed.data);
    revalidatePath("/dashboard/crm");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to create deal.",
    };
  }
}

export async function updateDealStageAction(
  formData: FormData
): Promise<ActionState> {
  try {
    const parsed = updateDealStageSchema.safeParse({
      id: getString(formData, "id"),
      stage: getString(formData, "stage"),
    });

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message };
    }

    const { user, service } = await getContext();
    await service.updateDeal(user.id, parsed.data.id, {
      stage: parsed.data.stage,
    });
    revalidatePath("/dashboard/crm");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to update deal stage.",
    };
  }
}

export async function updateDealAction(formData: FormData): Promise<ActionState> {
  try {
    const parsed = updateDealSchema.safeParse({
      id: getString(formData, "id"),
      companyId: getString(formData, "companyId"),
      contactId: getString(formData, "contactId"),
      leadId: getString(formData, "leadId"),
      title: getString(formData, "title"),
      stage: getString(formData, "stage"),
      value: getString(formData, "value"),
      currency: getString(formData, "currency"),
      probability: getString(formData, "probability"),
      expectedCloseDate: getString(formData, "expectedCloseDate"),
      assignedTo: getString(formData, "assignedTo"),
      notes: getString(formData, "notes"),
    });

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message };
    }

    const { user, service } = await getContext();
    const {
      id,
      companyId,
      contactId,
      leadId,
      title,
      stage,
      value,
      currency,
      probability,
      expectedCloseDate,
      assignedTo,
      notes,
    } = parsed.data;

    await service.updateDeal(user.id, id, {
      company_id: companyId,
      contact_id: contactId,
      lead_id: leadId,
      title,
      stage,
      value,
      currency,
      probability,
      expected_close_date: expectedCloseDate,
      assigned_to: assignedTo,
      notes,
    });
    revalidatePath("/dashboard/crm");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to update deal.",
    };
  }
}

export async function deleteDealAction(formData: FormData): Promise<ActionState> {
  try {
    const id = getString(formData, "id");
    if (!id) {
      return { success: false, error: "Deal id is required." };
    }

    const { user, service } = await getContext();
    await service.deleteDeal(user.id, id);
    revalidatePath("/dashboard/crm");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to delete deal.",
    };
  }
}

export async function createActivityAction(formData: FormData): Promise<ActionState> {
  try {
    const parsed = createActivitySchema.safeParse({
      type: getString(formData, "type"),
      title: getString(formData, "title"),
      body: getString(formData, "body"),
      companyId: getString(formData, "companyId"),
      contactId: getString(formData, "contactId"),
      leadId: getString(formData, "leadId"),
      dealId: getString(formData, "dealId"),
      occurredAt: getString(formData, "occurredAt"),
    });

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message };
    }

    const { user, service } = await getContext();
    await service.createActivity(user.id, parsed.data);
    revalidatePath("/dashboard/crm");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to create activity.",
    };
  }
}
