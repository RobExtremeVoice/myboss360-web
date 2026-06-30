import type { SupabaseClient } from "@supabase/supabase-js";

import {
  crmPageContent,
  crmPipelineStageDefinitions,
  type CrmActivity,
  type CrmCustomerHealth,
  type CrmLead,
  type CrmOpportunity,
  type CrmPipelineStage,
  type CrmPriorityCard,
  type CrmPriorityTone,
} from "@/config/crm";
import {
  createActivitiesRepository,
  createCompaniesRepository,
  createContactsRepository,
  createDealsRepository,
  createLeadsRepository,
} from "@/repositories/crm";
import { createProfilesRepository } from "@/repositories/users";
import { createWorkspacesRepository } from "@/repositories/workspaces";
import type { Database, Json } from "@/types/database";
import {
  formatCompactCurrency,
  formatCurrency,
  formatDateLabel,
  formatPersonName,
  formatRelativeTime,
  formatTitleCase,
} from "@/utils/formatters";

type CompanyRow = Database["public"]["Tables"]["companies"]["Row"];
type ContactRow = Database["public"]["Tables"]["contacts"]["Row"];
type LeadRow = Database["public"]["Tables"]["leads"]["Row"];
type DealRow = Database["public"]["Tables"]["deals"]["Row"];
type ActivityRow = Database["public"]["Tables"]["activities"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type WorkspaceRow = Database["public"]["Tables"]["workspaces"]["Row"];

export type CrmFilters = {
  q?: string;
  stage?: string;
  leadStatus?: string;
  workspaceId?: string;
};

export type CrmWorkspaceView = {
  workspace: WorkspaceRow | null;
  filters: {
    q: string;
    stage: string;
    leadStatus: string;
  };
  pipelineStages: CrmPipelineStage[];
  recentLeads: CrmLead[];
  priorities: CrmPriorityCard[];
  opportunities: CrmOpportunity[];
  activities: CrmActivity[];
  customerHealth: CrmCustomerHealth[];
};

function normalizeQuery(value?: string): string {
  return value?.trim() ?? "";
}

function asMetadataRecord(value: Json): Record<string, Json | undefined> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, Json | undefined>;
  }

  return {};
}

function metadataString(
  value: Json,
  key: string
): string | null {
  const record = asMetadataRecord(value);
  const entry = record[key];

  return typeof entry === "string" && entry.trim().length > 0 ? entry : null;
}

function metadataNumber(
  value: Json,
  key: string
): number | null {
  const record = asMetadataRecord(value);
  const entry = record[key];

  return typeof entry === "number" ? entry : null;
}

function displayOwner(profileId: string | null | undefined, profiles: Map<string, ProfileRow>): string {
  if (!profileId) {
    return "Unassigned";
  }

  const profile = profiles.get(profileId);
  return profile?.full_name?.trim() || "Workspace team";
}

function companyLabel(companyId: string | null | undefined, companies: Map<string, CompanyRow>): string {
  if (!companyId) {
    return "Independent account";
  }

  return companies.get(companyId)?.name ?? "Independent account";
}

function contactLabel(contactId: string | null | undefined, contacts: Map<string, ContactRow>): string {
  if (!contactId) {
    return "No contact";
  }

  const contact = contacts.get(contactId);
  if (!contact) {
    return "No contact";
  }

  return formatPersonName(contact.first_name, contact.last_name) || contact.email || "Unnamed contact";
}

function normalizeActivityType(type: string): string {
  const normalized = type.toLowerCase();

  if (normalized.includes("contract")) return "Contract Signed";
  if (normalized.includes("proposal")) return "Proposal Viewed";
  if (normalized.includes("meeting")) return "Meeting";
  if (normalized.includes("call")) return "Call";
  if (normalized.includes("email")) return "Email";

  return formatTitleCase(type);
}

function buildPipelineStages(deals: DealRow[]): CrmPipelineStage[] {
  const stageTotals = new Map<string, { value: number; count: number }>();

  for (const definition of crmPipelineStageDefinitions) {
    stageTotals.set(definition.dbStage, { value: 0, count: 0 });
  }

  for (const deal of deals) {
    const stage = stageTotals.get(deal.stage);
    if (!stage) {
      continue;
    }

    stage.value += Number(deal.value ?? 0);
    stage.count += 1;
  }

  const highestValue = Math.max(
    ...Array.from(stageTotals.values()).map((entry) => entry.value),
    0
  );

  return crmPipelineStageDefinitions.map((definition) => {
    const totals = stageTotals.get(definition.dbStage) ?? { value: 0, count: 0 };
    const progress =
      highestValue > 0 ? Math.max(8, Math.round((totals.value / highestValue) * 100)) : 0;

    return {
      key: definition.key,
      name: definition.label,
      totalValue: formatCompactCurrency(totals.value || 0),
      dealCount: totals.count,
      progress,
      progressLabel:
        totals.count === 0 ? "No deals" : `${totals.count} ${totals.count === 1 ? "deal" : "deals"}`,
    };
  });
}

function buildPriorities(params: {
  deals: DealRow[];
  leads: LeadRow[];
  activities: ActivityRow[];
  companies: Map<string, CompanyRow>;
  contacts: Map<string, ContactRow>;
  profiles: Map<string, ProfileRow>;
}): CrmPriorityCard[] {
  type RankedPriority = CrmPriorityCard & { sortWeight: number };
  const activityByEntity = new Map<string, ActivityRow[]>();

  for (const activity of params.activities) {
    const keys = [activity.deal_id, activity.lead_id, activity.company_id, activity.contact_id].filter(Boolean);
    for (const key of keys) {
      const existing = activityByEntity.get(key as string) ?? [];
      existing.push(activity);
      activityByEntity.set(key as string, existing);
    }
  }

  const dealPriorities: RankedPriority[] = params.deals
    .filter((deal) => !["closed_won", "closed_lost"].includes(deal.stage))
    .map((deal) => {
      const activities = activityByEntity.get(deal.id) ?? [];
      const latestActivity = activities[0];
      const daysUntilClose = deal.expected_close_date
        ? Math.ceil(
            (new Date(deal.expected_close_date).getTime() - Date.now()) /
              (1000 * 60 * 60 * 24)
          )
        : null;
      const tone: CrmPriorityTone =
        daysUntilClose !== null && daysUntilClose <= 3
          ? "critical"
          : deal.probability !== null && deal.probability >= 70
            ? "ready"
            : "watch";

      return {
        id: `deal-${deal.id}`,
        title: `${deal.title} • ${companyLabel(deal.company_id, params.companies)}`,
        detail:
          latestActivity?.body ??
          deal.notes ??
          `Advance ${formatTitleCase(deal.stage)} discussions and confirm the next executive touchpoint.`,
        owner: displayOwner(deal.assigned_to, params.profiles),
        dueWindow:
          daysUntilClose !== null
            ? daysUntilClose <= 0
              ? "Due now"
              : `${daysUntilClose}d window`
            : "Next review",
        tone,
        sortWeight:
          (deal.probability ?? 0) + (daysUntilClose !== null ? Math.max(0, 14 - daysUntilClose) * 4 : 0),
      };
    });

  const leadPriorities: RankedPriority[] = params.leads.map((lead) => {
    const activities = activityByEntity.get(lead.id) ?? [];
    const latestActivity = activities[0];
    const ageDays = Math.ceil(
      (Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    const tone: CrmPriorityTone =
      ageDays > 5 ? "critical" : lead.status === "qualified" ? "ready" : "watch";

    return {
      id: `lead-${lead.id}`,
      title: `Follow up ${companyLabel(lead.company_id, params.companies)}`,
      detail:
        latestActivity?.body ??
        lead.notes ??
        `Reconnect on ${lead.title.toLowerCase()} and update the lead status with the latest signal.`,
      owner: displayOwner(lead.assigned_to, params.profiles),
      dueWindow: ageDays <= 1 ? "Today" : `${ageDays}d open`,
      tone,
      sortWeight: ageDays * 5,
    };
  });

  return [...dealPriorities, ...leadPriorities]
    .sort((a, b) => b.sortWeight - a.sortWeight)
    .slice(0, 4)
    .map((priority) => ({
      id: priority.id,
      title: priority.title,
      detail: priority.detail,
      owner: priority.owner,
      dueWindow: priority.dueWindow,
      tone: priority.tone,
    }));
}

function buildCustomerHealth(params: {
  companies: CompanyRow[];
  deals: DealRow[];
  activities: ActivityRow[];
  profiles: Map<string, ProfileRow>;
}): CrmCustomerHealth[] {
  const dealsByCompany = new Map<string, DealRow[]>();
  const activitiesByCompany = new Map<string, ActivityRow[]>();

  for (const deal of params.deals) {
    if (!deal.company_id) continue;
    const existing = dealsByCompany.get(deal.company_id) ?? [];
    existing.push(deal);
    dealsByCompany.set(deal.company_id, existing);
  }

  for (const activity of params.activities) {
    if (!activity.company_id) continue;
    const existing = activitiesByCompany.get(activity.company_id) ?? [];
    existing.push(activity);
    activitiesByCompany.set(activity.company_id, existing);
  }

  return params.companies
    .map((company) => {
      const companyDeals = dealsByCompany.get(company.id) ?? [];
      const companyActivities = activitiesByCompany.get(company.id) ?? [];
      const openValue = companyDeals
        .filter((deal) => !["closed_lost"].includes(deal.stage))
        .reduce((sum, deal) => sum + Number(deal.value ?? 0), 0);
      const avgProbability =
        companyDeals.length > 0
          ? Math.round(
              companyDeals.reduce((sum, deal) => sum + Number(deal.probability ?? 0), 0) /
                companyDeals.length
            )
          : 0;
      const latestActivity = companyActivities[0];
      const metadataScore = metadataNumber(company.metadata, "healthScore");
      const score = metadataScore ?? Math.min(96, Math.max(42, avgProbability + Math.min(companyActivities.length * 4, 18)));
      const risk = score >= 80 ? "Low" : score >= 60 ? "Moderate" : "High";
      const npsValue = metadataNumber(company.metadata, "nps");
      const renewalDate =
        metadataString(company.metadata, "renewalDate") ??
        companyDeals.find((deal) => deal.expected_close_date)?.expected_close_date ??
        null;
      const expansionOpportunity =
        metadataString(company.metadata, "expansionOpportunity") ??
        (openValue >= 100000 ? "High" : openValue >= 40000 ? "Moderate" : "Emerging");
      const ownerId =
        companyDeals.find((deal) => deal.assigned_to)?.assigned_to ?? company.created_by;

      return {
        id: company.id,
        company: company.name,
        owner: displayOwner(ownerId, params.profiles),
        healthScore: score,
        renewalDate: renewalDate ? formatDateLabel(renewalDate) : "Renewal TBD",
        risk,
        nps: npsValue !== null ? String(npsValue) : "Pending",
        expansionOpportunity,
        detail:
          latestActivity?.body ??
          company.notes ??
          `${companyDeals.length} tracked opportunities and ${companyActivities.length} recent account activities.`,
        sortValue: score + openValue / 10000,
      };
    })
    .sort((a, b) => b.sortValue - a.sortValue)
    .slice(0, 4)
    .map((account) => ({
      id: account.id,
      company: account.company,
      owner: account.owner,
      healthScore: account.healthScore,
      renewalDate: account.renewalDate,
      risk: account.risk,
      nps: account.nps,
      expansionOpportunity: account.expansionOpportunity,
      detail: account.detail,
    }));
}

export function createCRMService(db: SupabaseClient<Database>) {
  const companiesRepo = createCompaniesRepository(db);
  const contactsRepo = createContactsRepository(db);
  const leadsRepo = createLeadsRepository(db);
  const dealsRepo = createDealsRepository(db);
  const activitiesRepo = createActivitiesRepository(db);
  const profilesRepo = createProfilesRepository(db);
  const workspacesRepo = createWorkspacesRepository(db);

  async function resolveWorkspace(
    userId: string,
    preferredWorkspaceId?: string
  ): Promise<WorkspaceRow | null> {
    const workspaces = await workspacesRepo.listForUser(userId);

    if (workspaces.length === 0) {
      return null;
    }

    if (preferredWorkspaceId) {
      return (
        workspaces.find((workspace) => workspace.id === preferredWorkspaceId) ??
        workspaces[0]
      );
    }

    return workspaces[0];
  }

  async function getWorkspaceView(
    userId: string,
    filters: CrmFilters = {}
  ): Promise<CrmWorkspaceView> {
    const workspace = await resolveWorkspace(userId, filters.workspaceId);
    const normalizedFilters = {
      q: normalizeQuery(filters.q),
      stage: filters.stage && filters.stage !== "all" ? filters.stage : "all",
      leadStatus:
        filters.leadStatus && filters.leadStatus !== "all"
          ? filters.leadStatus
          : "all",
    };

    if (!workspace) {
      return {
        workspace: null,
        filters: normalizedFilters,
        pipelineStages: [],
        recentLeads: [],
        priorities: [],
        opportunities: [],
        activities: [],
        customerHealth: [],
      };
    }

    const [companies, contacts, leads, deals, activities] = await Promise.all([
      normalizedFilters.q
        ? companiesRepo.search(workspace.id, normalizedFilters.q)
        : companiesRepo.list(workspace.id),
      normalizedFilters.q
        ? contactsRepo.search(workspace.id, normalizedFilters.q)
        : contactsRepo.list(workspace.id),
      leadsRepo.listFiltered(workspace.id, {
        query: normalizedFilters.q || undefined,
        status:
          normalizedFilters.leadStatus === "all"
            ? undefined
            : normalizedFilters.leadStatus,
        limit: 8,
      }),
      dealsRepo.listFiltered(workspace.id, {
        query: normalizedFilters.q || undefined,
        stage:
          normalizedFilters.stage === "all" ? undefined : normalizedFilters.stage,
      }),
      activitiesRepo.listByWorkspace(workspace.id, {
        query: normalizedFilters.q || undefined,
        limit: 10,
      }),
    ]);

    const profileIds = Array.from(
      new Set(
        [
          ...leads.map((lead) => lead.assigned_to),
          ...deals.map((deal) => deal.assigned_to),
          ...activities.map((activity) => activity.created_by),
          ...companies.map((company) => company.created_by),
        ].filter((value): value is string => Boolean(value))
      )
    );
    const profiles = await profilesRepo.listByIds(profileIds);
    const profilesMap = new Map(profiles.map((profile) => [profile.id, profile]));
    const companiesMap = new Map(companies.map((company) => [company.id, company]));
    const contactsMap = new Map(contacts.map((contact) => [contact.id, contact]));

    const activityByRelatedId = new Map<string, ActivityRow[]>();
    for (const activity of activities) {
      const keys = [activity.lead_id, activity.contact_id, activity.company_id, activity.deal_id].filter(Boolean);
      for (const key of keys) {
        const existing = activityByRelatedId.get(key as string) ?? [];
        existing.push(activity);
        activityByRelatedId.set(key as string, existing);
      }
    }

    const pipelineStages = buildPipelineStages(deals);

    const recentLeads: CrmLead[] = leads.map((lead) => {
      const relatedActivities =
        activityByRelatedId.get(lead.id) ??
        activityByRelatedId.get(lead.company_id ?? "") ??
        activityByRelatedId.get(lead.contact_id ?? "") ??
        [];
      const linkedDeal =
        deals.find((deal) => deal.lead_id === lead.id) ??
        deals.find(
          (deal) =>
            deal.company_id === lead.company_id && deal.contact_id === lead.contact_id
        );
      const metadataValue = metadataNumber(lead.metadata, "estimatedValue");

      return {
        id: lead.id,
        company: companyLabel(lead.company_id, companiesMap),
        contact: contactLabel(lead.contact_id, contactsMap),
        source: lead.source ?? "Direct",
        owner: displayOwner(lead.assigned_to, profilesMap),
        status: formatTitleCase(lead.status),
        value: formatCurrency(
          linkedDeal?.value ?? metadataValue ?? null,
          linkedDeal?.currency ?? "USD"
        ),
        lastContact: formatRelativeTime(relatedActivities[0]?.occurred_at),
      };
    });

    const opportunities: CrmOpportunity[] = deals
      .filter((deal) =>
        normalizedFilters.stage === "all"
          ? !["closed_won", "closed_lost"].includes(deal.stage)
          : deal.stage === normalizedFilters.stage
      )
      .sort((a, b) => Number(b.value ?? 0) - Number(a.value ?? 0))
      .slice(0, 8)
      .map((deal) => ({
        id: deal.id,
        company: companyLabel(deal.company_id, companiesMap),
        arr: formatCurrency(deal.value, deal.currency),
        probability: `${deal.probability ?? 0}%`,
        stage: formatTitleCase(deal.stage),
        owner: displayOwner(deal.assigned_to, profilesMap),
        nextAction:
          metadataString(deal.metadata, "nextAction") ??
          (deal.expected_close_date
            ? `Review before ${formatDateLabel(deal.expected_close_date)}`
            : "Confirm next stakeholder step"),
        detail:
          deal.notes ??
          `${contactLabel(deal.contact_id, contactsMap)} • ${formatRelativeTime(deal.updated_at)}`,
        confidence: deal.probability ?? 0,
      }));

    const timeline: CrmActivity[] = activities.map((activity) => ({
      id: activity.id,
      type: normalizeActivityType(activity.type),
      actor: displayOwner(activity.created_by, profilesMap),
      title: activity.title,
      detail:
        activity.body ??
        ([
          companyLabel(activity.company_id, companiesMap),
          contactLabel(activity.contact_id, contactsMap),
        ]
          .filter(
            (value) =>
              value !== "Independent account" && value !== "No contact"
          )
          .join(" • ") || "Workspace activity recorded."),
      timestamp: formatRelativeTime(activity.occurred_at),
    }));

    const priorities = buildPriorities({
      deals,
      leads,
      activities,
      companies: companiesMap,
      contacts: contactsMap,
      profiles: profilesMap,
    });

    const customerHealth = buildCustomerHealth({
      companies,
      deals,
      activities,
      profiles: profilesMap,
    });

    return {
      workspace,
      filters: normalizedFilters,
      pipelineStages,
      recentLeads,
      priorities,
      opportunities,
      activities: timeline,
      customerHealth,
    };
  }

  return {
    getWorkspaceView,

    async listCompanies(userId: string, workspaceId?: string, query?: string) {
      const workspace = await resolveWorkspace(userId, workspaceId);
      if (!workspace) return [];
      return query ? companiesRepo.search(workspace.id, query) : companiesRepo.list(workspace.id);
    },

    async createCompany(
      userId: string,
      input: {
        name: string;
        domain?: string | null;
        industry?: string | null;
        size?: string | null;
        website?: string | null;
        phone?: string | null;
        notes?: string | null;
        workspaceId?: string;
      }
    ) {
      const workspace = await resolveWorkspace(userId, input.workspaceId);
      if (!workspace) {
        throw new Error(crmPageContent.workspaceEmptyState.description);
      }

      return companiesRepo.create({
        workspace_id: workspace.id,
        name: input.name,
        domain: input.domain ?? null,
        industry: input.industry ?? null,
        size: input.size ?? null,
        website: input.website ?? null,
        phone: input.phone ?? null,
        notes: input.notes ?? null,
        created_by: userId,
      });
    },

    async updateCompany(
      _userId: string,
      id: string,
      input: Database["public"]["Tables"]["companies"]["Update"]
    ) {
      return companiesRepo.update(id, input);
    },

    async deleteCompany(_userId: string, id: string) {
      await companiesRepo.softDelete(id);
    },

    async listContacts(userId: string, workspaceId?: string, query?: string) {
      const workspace = await resolveWorkspace(userId, workspaceId);
      if (!workspace) return [];
      return query ? contactsRepo.search(workspace.id, query) : contactsRepo.list(workspace.id);
    },

    async createContact(
      userId: string,
      input: {
        companyId?: string | null;
        firstName: string;
        lastName?: string | null;
        email?: string | null;
        phone?: string | null;
        jobTitle?: string | null;
        linkedinUrl?: string | null;
        notes?: string | null;
        workspaceId?: string;
      }
    ) {
      const workspace = await resolveWorkspace(userId, input.workspaceId);
      if (!workspace) {
        throw new Error(crmPageContent.workspaceEmptyState.description);
      }

      return contactsRepo.create({
        workspace_id: workspace.id,
        company_id: input.companyId ?? null,
        first_name: input.firstName,
        last_name: input.lastName ?? null,
        email: input.email ?? null,
        phone: input.phone ?? null,
        job_title: input.jobTitle ?? null,
        linkedin_url: input.linkedinUrl ?? null,
        notes: input.notes ?? null,
        created_by: userId,
      });
    },

    async updateContact(
      _userId: string,
      id: string,
      input: Database["public"]["Tables"]["contacts"]["Update"]
    ) {
      return contactsRepo.update(id, input);
    },

    async deleteContact(_userId: string, id: string) {
      await contactsRepo.softDelete(id);
    },

    async listDeals(userId: string, workspaceId?: string, query?: string, stage?: string) {
      const workspace = await resolveWorkspace(userId, workspaceId);
      if (!workspace) return [];
      return dealsRepo.listFiltered(workspace.id, { query, stage });
    },

    async createDeal(
      userId: string,
      input: {
        companyId?: string | null;
        contactId?: string | null;
        leadId?: string | null;
        title: string;
        stage: string;
        value?: number | null;
        currency?: string;
        probability?: number | null;
        expectedCloseDate?: string | null;
        assignedTo?: string | null;
        notes?: string | null;
        workspaceId?: string;
      }
    ) {
      const workspace = await resolveWorkspace(userId, input.workspaceId);
      if (!workspace) {
        throw new Error(crmPageContent.workspaceEmptyState.description);
      }

      return dealsRepo.create({
        workspace_id: workspace.id,
        company_id: input.companyId ?? null,
        contact_id: input.contactId ?? null,
        lead_id: input.leadId ?? null,
        title: input.title,
        stage: input.stage,
        value: input.value ?? null,
        currency: input.currency ?? "USD",
        probability: input.probability ?? null,
        expected_close_date: input.expectedCloseDate ?? null,
        assigned_to: input.assignedTo ?? null,
        notes: input.notes ?? null,
        created_by: userId,
      });
    },

    async updateDeal(
      _userId: string,
      id: string,
      input: Database["public"]["Tables"]["deals"]["Update"]
    ) {
      return dealsRepo.update(id, input);
    },

    async deleteDeal(_userId: string, id: string) {
      await dealsRepo.softDelete(id);
    },

    async listActivities(userId: string, workspaceId?: string, query?: string) {
      const workspace = await resolveWorkspace(userId, workspaceId);
      if (!workspace) return [];
      return activitiesRepo.listByWorkspace(workspace.id, { query });
    },

    async createActivity(
      userId: string,
      input: {
        type: string;
        title: string;
        body?: string | null;
        companyId?: string | null;
        contactId?: string | null;
        leadId?: string | null;
        dealId?: string | null;
        occurredAt?: string | null;
        workspaceId?: string;
      }
    ) {
      const workspace = await resolveWorkspace(userId, input.workspaceId);
      if (!workspace) {
        throw new Error(crmPageContent.workspaceEmptyState.description);
      }

      return activitiesRepo.create({
        workspace_id: workspace.id,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        company_id: input.companyId ?? null,
        contact_id: input.contactId ?? null,
        lead_id: input.leadId ?? null,
        deal_id: input.dealId ?? null,
        occurred_at: input.occurredAt ?? new Date().toISOString(),
        created_by: userId,
      });
    },
  };
}
