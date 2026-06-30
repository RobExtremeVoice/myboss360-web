import { z } from "zod";

function emptyToNull(value: unknown) {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

const optionalString = z.preprocess(
  emptyToNull,
  z.string().trim().nullable().optional()
);

const optionalUrl = z.preprocess(
  emptyToNull,
  z.string().trim().url("Please enter a valid URL.").nullable().optional()
);

const optionalUuid = z.preprocess(
  emptyToNull,
  z.string().uuid("Invalid identifier.").nullable().optional()
);

const optionalNumber = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) {
      return null;
    }

    return value;
  },
  z.coerce.number().nonnegative().nullable().optional()
);

const optionalPercentage = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) {
      return null;
    }

    return value;
  },
  z.coerce.number().min(0).max(100).nullable().optional()
);

export const createCompanySchema = z.object({
  name: z.string().trim().min(2, "Company name is required."),
  domain: optionalString,
  industry: optionalString,
  size: optionalString,
  website: optionalUrl,
  phone: optionalString,
  notes: optionalString,
});

export const updateCompanySchema = createCompanySchema.partial().extend({
  id: z.string().uuid("Invalid company identifier."),
});

export const createContactSchema = z.object({
  companyId: optionalUuid,
  firstName: z.string().trim().min(1, "First name is required."),
  lastName: optionalString,
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address.")
    .transform((value) => value || null)
    .nullable()
    .optional(),
  phone: optionalString,
  jobTitle: optionalString,
  linkedinUrl: optionalUrl,
  notes: optionalString,
});

export const updateContactSchema = createContactSchema.partial().extend({
  id: z.string().uuid("Invalid contact identifier."),
});

export const createDealSchema = z.object({
  companyId: optionalUuid,
  contactId: optionalUuid,
  leadId: optionalUuid,
  title: z.string().trim().min(2, "Deal title is required."),
  stage: z.enum([
    "prospect",
    "qualified",
    "proposal",
    "negotiation",
    "closed_won",
    "closed_lost",
  ]),
  value: optionalNumber,
  currency: z.string().trim().min(3).max(3).default("USD"),
  probability: optionalPercentage,
  expectedCloseDate: optionalString,
  assignedTo: optionalUuid,
  notes: optionalString,
});

export const updateDealSchema = createDealSchema.partial().extend({
  id: z.string().uuid("Invalid deal identifier."),
});

export const createActivitySchema = z.object({
  type: z.string().trim().min(2, "Activity type is required."),
  title: z.string().trim().min(2, "Activity title is required."),
  body: optionalString,
  companyId: optionalUuid,
  contactId: optionalUuid,
  leadId: optionalUuid,
  dealId: optionalUuid,
  occurredAt: optionalString,
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
export type CreateDealInput = z.infer<typeof createDealSchema>;
export type UpdateDealInput = z.infer<typeof updateDealSchema>;
export type CreateActivityInput = z.infer<typeof createActivitySchema>;
