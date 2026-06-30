import type { SupabaseClient } from "@supabase/supabase-js";

import {
  crmFallbackData,
  crmPageContent,
  crmPipelineStageDefinitions,
  type CrmActivity,
  type CrmCompanyRecord,
  type CrmContactRecord,
  type CrmCustomerHealth,
  type CrmDealRecord,
  type CrmLead,
  type CrmOpportunity,
  type CrmPipelineStage,
  type CrmPriorityCard,
  type CrmPriorityTone,
  type CrmSelectOption,
  type CrmWorkspaceView,
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

import { recordCrmAuditEvent } from "./audit";
import { shouldUseDevelopmentCrmFallback } from "./runtime";

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
  owner?: string;
  company?: string;
  workspaceId?: string;
};

function normalizeQuery(value?: string): string {
  return value?.trim() ?? "";
}

function normalizeFilter(value?: string): string {
  return value && value !== "all" ? value : "all";
}

function asMetadataRecord(value: Json): Record<string, Json | undefined> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, Json | undefined>;
  }

  return {};
}

function metadataString(value: Json, key: string): string | null {
  const entry = asMetadataRecord(value)[key];
  return typeof entry === "string" && entry.trim().length > 0 ? entry : null;
}

function metadataNumber(value: Json, key: string): number | null {
  const entry = asMetadataRecord(value)[key];
  return typeof entry === "number" ? entry : null;
}

function matchesQuery(values: Array<string | null | undefined>, query: string): boolean {
  if (!query) {
    return true;
  }

  const normalized = query.toLowerCase();
  return values.some((value) => value?.toLowerCase().includes(normalized));
}

function stageLabelFromValue(stage: string): string {
  return (
    crmPipelineStageDefinitions.find((item) => item.dbStage === stage)?.label ??
    formatTitleCase(stage)
  );
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

function displayOwner(
  profileId: string | null | undefined,
  profiles: Map<string, ProfileRow>,
  fallbackEmail?: string | null
): string {
  if (!profileId) {
    return "Unassigned";
  }

  const profile = profiles.get(profileId);
  if (profile?.full_name?.trim()) {
    return profile.full_name;
  }

  if (fallbackEmail) {
    return fallbackEmail.split("@")[0] ?? "Workspace team";
  }

  return "Workspace team";
}

function companyLabel(
  companyId: string | null | undefined,
  companies: Map<string, CompanyRow>
): string {
  if (!companyId) {
    return "Independent account";
  }

  return companies.get(companyId)?.name ?? "Independent account";
}

function contactLabel(
  contactId: string | null | undefined,
  contacts: Map<string, ContactRow>
): string {
  if (!contactId) {
    return "No contact";
  }

  const contact = contacts.get(contactId);
  if (!contact) {
    return "No contact";
  }

  return (
    formatPersonName(contact.first_name, contact.last_name) ||
    contact.email ||
    "Unnamed contact"
  );
}

function buildPipelineStages(deals: CrmDealRecord[]): CrmPipelineStage[] {
  const totals = new Map<string, { value: number; count: number }>();

  for (const stage of crmPipelineStageDefinitions) {
    totals.set(stage.dbStage, { value: 0, count: 0 });
  }

  for (const deal of deals) {
    const item = totals.get(deal.stage);
    if (!item) continue;

    item.value += Number(deal.value ?? 0);
    item.count += 1;
  }

  const highestValue = Math.max(...Array.from(totals.values()).map((item) => item.value), 0);

  return crmPipelineStageDefinitions.map((stage) => {
    const total = totals.get(stage.dbStage) ?? { value: 0, count: 0 };
    const progress =
      highestValue > 0 ? Math.max(8, Math.round((total.value / highestValue) * 100)) : 0;

    return {
      key: stage.key,
      name: stage.label,
      totalValue: formatCompactCurrency(total.value, "USD"),
      dealCount: total.count,
      progress,
      progressLabel:
        total.count === 0 ? "No deals" : `${total.count} ${total.count === 1 ? "deal" : "deals"}`,
    };
  });
}

function buildPipelineBoard(deals: CrmDealRecord[]) {
  return Object.fromEntries(
    crmPipelineStageDefinitions.map((stage) => [
      stage.dbStage,
      deals.filter((deal) => deal.stage === stage.dbStage),
    ])
  ) as Record<string, CrmDealRecord[]>;
}

function buildPriorities(params: {
  deals: DealRow[];
  leads: LeadRow[];
  activities: ActivityRow[];
  companies: Map<string, CompanyRow>;
  profiles: Map<string, ProfileRow>;
}): CrmPriorityCard[] {
  type RankedPriority = CrmPriorityCard & { sortWeight: number };
  const activityByEntity = new Map<string, ActivityRow[]>();

  for (const activity of params.activities) {
    const keys = [
      activity.deal_id,
      activity.lead_id,
      activity.company_id,
      activity.contact_id,
    ].filter(Boolean);

    for (const key of keys) {
      const items = activityByEntity.get(key as string) ?? [];
      items.push(activity);
      activityByEntity.set(key as string, items);
    }
  }

  const dealPriorities: RankedPriority[] = params.deals
    .filter((deal) => !["closed_won", "closed_lost"].includes(deal.stage))
    .map((deal) => {
      const latestActivity = (activityByEntity.get(deal.id) ?? [])[0];
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
          `Advance ${stageLabelFromValue(deal.stage).toLowerCase()} discussions and confirm the next executive touchpoint.`,
        owner: displayOwner(deal.assigned_to, params.profiles),
        dueWindow:
          daysUntilClose !== null
            ? daysUntilClose <= 0
              ? "Due now"
              : `${daysUntilClose}d window`
            : "Next review",
        tone,
        sortWeight:
          (deal.probability ?? 0) +
          (daysUntilClose !== null ? Math.max(0, 14 - daysUntilClose) * 4 : 0),
      };
    });

  const leadPriorities: RankedPriority[] = params.leads.map((lead) => {
    const latestActivity = (activityByEntity.get(lead.id) ?? [])[0];
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
    const items = dealsByCompany.get(deal.company_id) ?? [];
    items.push(deal);
    dealsByCompany.set(deal.company_id, items);
  }

  for (const activity of params.activities) {
    if (!activity.company_id) continue;
    const items = activitiesByCompany.get(activity.company_id) ?? [];
    items.push(activity);
    activitiesByCompany.set(activity.company_id, items);
  }

  return params.companies.map((company) => {
    const companyDeals = dealsByCompany.get(company.id) ?? [];
    const companyActivities = activitiesByCompany.get(company.id) ?? [];
    const openValue = companyDeals
      .filter((deal) => deal.stage !== "closed_lost")
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
    const score =
      metadataScore ??
      Math.min(96, Math.max(42, avgProbability + Math.min(companyActivities.length * 4, 18)));
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
      companyId: company.id,
      ownerId,
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
    };
  });
}

function buildFallbackView(filters: CrmWorkspaceView["filters"], workspace: WorkspaceRow | null): CrmWorkspaceView {
  const owners = [
    { value: "all", label: "All owners" },
    ...crmFallbackData.owners,
  ];

  const companyOptions = [
    { value: "all", label: "All companies" },
    ...crmFallbackData.companies.map((company) => ({
      value: company.id,
      label: company.name,
    })),
  ];

  const contactOptions = crmFallbackData.contacts.map((contact) => ({
    value: contact.id,
    label: contact.fullName,
  }));

  const companies = crmFallbackData.companies.filter((company) => {
    if (filters.company !== "all" && company.id !== filters.company) return false;
    if (filters.owner !== "all" && company.ownerId !== filters.owner) return false;
    return matchesQuery([company.name, company.domain, company.industry], filters.q);
  });

  const contacts = crmFallbackData.contacts.filter((contact) => {
    if (filters.company !== "all" && contact.companyId !== filters.company) return false;
    if (filters.owner !== "all" && contact.ownerId !== filters.owner) return false;
    return matchesQuery(
      [contact.fullName, contact.email, contact.jobTitle, contact.companyName],
      filters.q
    );
  });

  const deals = crmFallbackData.deals.filter((deal) => {
    if (filters.stage !== "all" && deal.stage !== filters.stage) return false;
    if (filters.company !== "all" && deal.companyId !== filters.company) return false;
    if (filters.owner !== "all" && deal.assignedTo !== filters.owner) return false;
    return matchesQuery([deal.title, deal.company, deal.contact, deal.notes], filters.q);
  });

  const leads = crmFallbackData.leads.filter((lead) => {
    if (filters.leadStatus !== "all" && lead.status.toLowerCase() !== filters.leadStatus) {
      return false;
    }
    if (filters.company !== "all" && lead.companyId !== filters.company) return false;
    if (filters.owner !== "all" && lead.ownerId !== filters.owner) return false;
    return matchesQuery([lead.company, lead.contact, lead.source], filters.q);
  });

  const activities = crmFallbackData.activities.filter((activity) => {
    if (filters.company !== "all" && activity.companyId !== filters.company) return false;
    if (filters.owner !== "all" && activity.ownerId !== filters.owner) return false;
    return matchesQuery([activity.title, activity.detail, activity.actor, activity.type], filters.q);
  });

  const customerHealth = crmFallbackData.customerHealth.filter((account) => {
    if (filters.company !== "all" && account.companyId !== filters.company) return false;
    if (filters.owner !== "all" && account.ownerId !== filters.owner) return false;
    return matchesQuery([account.company, account.detail, account.owner], filters.q);
  });

  const opportunities = deals
    .filter((deal) => !["closed_won", "closed_lost"].includes(deal.stage))
    .map((deal) => ({
      id: deal.id,
      company: deal.company,
      arr: deal.valueLabel,
      probability: deal.probabilityLabel,
      stage: deal.stageLabel,
      owner: deal.owner,
      nextAction: deal.nextAction,
      detail: deal.notes,
      confidence: deal.probability ?? 0,
    }));

  return {
    dataMode: "fallback",
    workspace: workspace ? { id: workspace.id, name: workspace.name } : null,
    filters,
    ownerOptions: owners,
    companyOptions,
    contactOptions,
    pipelineStages: buildPipelineStages(deals),
    pipelineBoard: buildPipelineBoard(deals),
    companies,
    contacts,
    deals,
    recentLeads: leads,
    priorities: crmFallbackData.priorities,
    opportunities,
    activities,
    customerHealth,
  };
}

function buildEmptyWorkspaceView(
  filters: CrmWorkspaceView["filters"],
  workspace: WorkspaceRow | null
): CrmWorkspaceView {
  return {
    dataMode: "live",
    workspace: workspace ? { id: workspace.id, name: workspace.name } : null,
    filters,
    ownerOptions: [{ value: "all", label: "All owners" }],
    companyOptions: [{ value: "all", label: "All companies" }],
    contactOptions: [],
    pipelineStages: [],
    pipelineBoard: buildPipelineBoard([]),
    companies: [],
    contacts: [],
    deals: [],
    recentLeads: [],
    priorities: [],
    opportunities: [],
    activities: [],
    customerHealth: [],
  };
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
      return workspaces.find((workspace) => workspace.id === preferredWorkspaceId) ?? workspaces[0];
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
      stage: normalizeFilter(filters.stage),
      leadStatus: normalizeFilter(filters.leadStatus),
      owner: normalizeFilter(filters.owner),
      company: normalizeFilter(filters.company),
    };

    if (!workspace) {
      return buildEmptyWorkspaceView(normalizedFilters, null);
    }

    const [companies, contacts, leads, deals, activities, currentUserProfile] =
      await Promise.all([
        companiesRepo.list(workspace.id),
        contactsRepo.list(workspace.id),
        leadsRepo.list(workspace.id),
        dealsRepo.list(workspace.id),
        activitiesRepo.listByWorkspace(workspace.id),
        profilesRepo.findById(userId),
      ]);

    const hasLiveRecords =
      companies.length + contacts.length + leads.length + deals.length + activities.length > 0;

    if (shouldUseDevelopmentCrmFallback({ hasLiveRecords })) {
      return buildFallbackView(normalizedFilters, workspace);
    }

    if (!hasLiveRecords) {
      return buildEmptyWorkspaceView(normalizedFilters, workspace);
    }

    const profileIds = Array.from(
      new Set(
        [
          userId,
          ...companies.map((company) => company.created_by),
          ...contacts.map((contact) => contact.created_by),
          ...leads.map((lead) => lead.assigned_to),
          ...leads.map((lead) => lead.created_by),
          ...deals.map((deal) => deal.assigned_to),
          ...deals.map((deal) => deal.created_by),
          ...activities.map((activity) => activity.created_by),
        ].filter((value): value is string => Boolean(value))
      )
    );

    const profiles = await profilesRepo.listByIds(profileIds);
    if (currentUserProfile && !profiles.find((profile) => profile.id === currentUserProfile.id)) {
      profiles.push(currentUserProfile);
    }

    const profilesMap = new Map(profiles.map((profile) => [profile.id, profile]));
    const companiesMap = new Map(companies.map((company) => [company.id, company]));
    const contactsMap = new Map(contacts.map((contact) => [contact.id, contact]));

    const companyContactCounts = new Map<string, number>();
    for (const contact of contacts) {
      if (!contact.company_id) continue;
      companyContactCounts.set(
        contact.company_id,
        (companyContactCounts.get(contact.company_id) ?? 0) + 1
      );
    }

    const companyDeals = new Map<string, DealRow[]>();
    for (const deal of deals) {
      if (!deal.company_id) continue;
      const items = companyDeals.get(deal.company_id) ?? [];
      items.push(deal);
      companyDeals.set(deal.company_id, items);
    }

    const baseCompanies: CrmCompanyRecord[] = companies.map((company) => {
      const relatedDeals = companyDeals.get(company.id) ?? [];
      const openDeals = relatedDeals.filter(
        (deal) => !["closed_won", "closed_lost"].includes(deal.stage)
      );
      const ownerId = relatedDeals[0]?.assigned_to ?? company.created_by;

      return {
        id: company.id,
        name: company.name,
        domain: company.domain ?? "",
        industry: company.industry ?? "",
        size: company.size ?? "",
        website: company.website ?? "",
        phone: company.phone ?? "",
        notes: company.notes ?? "",
        ownerId,
        owner: displayOwner(ownerId, profilesMap),
        contactCount: companyContactCounts.get(company.id) ?? 0,
        openDealCount: openDeals.length,
        openValue: formatCurrency(
          openDeals.reduce((sum, deal) => sum + Number(deal.value ?? 0), 0),
          "USD"
        ),
      };
    });

    const baseContacts: CrmContactRecord[] = contacts.map((contact) => ({
      id: contact.id,
      companyId: contact.company_id,
      companyName: companyLabel(contact.company_id, companiesMap),
      firstName: contact.first_name,
      lastName: contact.last_name ?? "",
      fullName:
        formatPersonName(contact.first_name, contact.last_name) || contact.email || "Unnamed contact",
      email: contact.email ?? "",
      phone: contact.phone ?? "",
      jobTitle: contact.job_title ?? "",
      notes: contact.notes ?? "",
      ownerId: contact.created_by,
      owner: displayOwner(contact.created_by, profilesMap),
    }));

    const baseDeals: CrmDealRecord[] = deals.map((deal) => ({
      id: deal.id,
      companyId: deal.company_id,
      contactId: deal.contact_id,
      leadId: deal.lead_id,
      title: deal.title,
      company: companyLabel(deal.company_id, companiesMap),
      contact: contactLabel(deal.contact_id, contactsMap),
      stage: deal.stage,
      stageLabel: stageLabelFromValue(deal.stage),
      value: deal.value,
      valueLabel: formatCurrency(deal.value, deal.currency),
      currency: deal.currency,
      probability: deal.probability,
      probabilityLabel: `${deal.probability ?? 0}%`,
      expectedCloseDate: deal.expected_close_date,
      expectedCloseDateLabel: deal.expected_close_date
        ? formatDateLabel(deal.expected_close_date)
        : "No close date",
      assignedTo: deal.assigned_to,
      owner: displayOwner(deal.assigned_to, profilesMap),
      notes: deal.notes ?? "",
      nextAction:
        metadataString(deal.metadata, "nextAction") ??
        (deal.expected_close_date
          ? `Review before ${formatDateLabel(deal.expected_close_date)}`
          : "Confirm next stakeholder step"),
    }));

    const baseActivities: CrmActivity[] = activities.map((activity) => ({
      id: activity.id,
      companyId: activity.company_id,
      ownerId: activity.created_by,
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
            (value) => value !== "Independent account" && value !== "No contact"
          )
          .join(" • ") || "Workspace activity recorded."),
      timestamp: formatRelativeTime(activity.occurred_at),
    }));

    const baseLeads: CrmLead[] = leads.map((lead) => {
      const linkedDeal =
        deals.find((deal) => deal.lead_id === lead.id) ??
        deals.find(
          (deal) =>
            deal.company_id === lead.company_id && deal.contact_id === lead.contact_id
        );
      const relatedActivities = activities
        .filter(
          (activity) =>
            activity.lead_id === lead.id ||
            activity.company_id === lead.company_id ||
            activity.contact_id === lead.contact_id
        )
        .sort((a, b) => +new Date(b.occurred_at) - +new Date(a.occurred_at));
      const metadataValue = metadataNumber(lead.metadata, "estimatedValue");

      return {
        id: lead.id,
        companyId: lead.company_id,
        ownerId: lead.assigned_to,
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

    const ownerOptionMap = new Map<string, CrmSelectOption>();
    for (const profile of profiles) {
      const option = {
        value: profile.id,
        label: profile.full_name?.trim() || "Workspace team",
      };

      if (option.label === "Workspace team" && profile.id !== userId) {
        continue;
      }

      ownerOptionMap.set(profile.id, option);
    }

    const ownerOptions: CrmSelectOption[] = [
      { value: "all", label: "All owners" },
      ...Array.from(ownerOptionMap.values()),
    ];

    const companyOptions: CrmSelectOption[] = [
      { value: "all", label: "All companies" },
      ...baseCompanies.map((company) => ({
        value: company.id,
        label: company.name,
      })),
    ];

    const contactOptions: CrmSelectOption[] = baseContacts.map((contact) => ({
      value: contact.id,
      label: contact.fullName,
    }));

    const filteredCompanies = baseCompanies.filter((company) => {
      if (normalizedFilters.company !== "all" && company.id !== normalizedFilters.company) return false;
      if (normalizedFilters.owner !== "all" && company.ownerId !== normalizedFilters.owner) return false;
      return matchesQuery([company.name, company.domain, company.industry], normalizedFilters.q);
    });

    const filteredContacts = baseContacts.filter((contact) => {
      if (normalizedFilters.company !== "all" && contact.companyId !== normalizedFilters.company) return false;
      if (normalizedFilters.owner !== "all" && contact.ownerId !== normalizedFilters.owner) return false;
      return matchesQuery(
        [contact.fullName, contact.email, contact.jobTitle, contact.companyName],
        normalizedFilters.q
      );
    });

    const filteredDeals = baseDeals.filter((deal) => {
      if (normalizedFilters.stage !== "all" && deal.stage !== normalizedFilters.stage) return false;
      if (normalizedFilters.company !== "all" && deal.companyId !== normalizedFilters.company) return false;
      if (normalizedFilters.owner !== "all" && deal.assignedTo !== normalizedFilters.owner) return false;
      return matchesQuery([deal.title, deal.company, deal.contact, deal.notes], normalizedFilters.q);
    });

    const filteredLeads = baseLeads.filter((lead) => {
      if (
        normalizedFilters.leadStatus !== "all" &&
        lead.status.toLowerCase() !== normalizedFilters.leadStatus
      ) {
        return false;
      }
      if (normalizedFilters.company !== "all" && lead.companyId !== normalizedFilters.company) return false;
      if (normalizedFilters.owner !== "all" && lead.ownerId !== normalizedFilters.owner) return false;
      return matchesQuery([lead.company, lead.contact, lead.source], normalizedFilters.q);
    });

    const filteredActivities = baseActivities.filter((activity) => {
      if (normalizedFilters.company !== "all" && activity.companyId !== normalizedFilters.company) return false;
      if (normalizedFilters.owner !== "all" && activity.ownerId !== normalizedFilters.owner) return false;
      return matchesQuery([activity.title, activity.detail, activity.actor, activity.type], normalizedFilters.q);
    });

    const filteredActivityRows = activities.filter((activity) =>
      filteredActivities.some((item) => item.id === activity.id)
    );
    const filteredDealRows = deals.filter((deal) => filteredDeals.some((item) => item.id === deal.id));
    const filteredLeadRows = leads.filter((lead) => filteredLeads.some((item) => item.id === lead.id));

    const priorities = buildPriorities({
      deals: filteredDealRows,
      leads: filteredLeadRows,
      activities: filteredActivityRows,
      companies: companiesMap,
      profiles: profilesMap,
    });

    const customerHealth = buildCustomerHealth({
      companies: companies.filter((company) =>
        normalizedFilters.company === "all" ? true : company.id === normalizedFilters.company
      ),
      deals: filteredDealRows,
      activities: filteredActivityRows,
      profiles: profilesMap,
    }).filter((account) => {
      if (normalizedFilters.owner !== "all" && account.ownerId !== normalizedFilters.owner) return false;
      return matchesQuery([account.company, account.detail, account.owner], normalizedFilters.q);
    });

    const opportunities: CrmOpportunity[] = filteredDeals
      .filter((deal) => !["closed_won", "closed_lost"].includes(deal.stage))
      .sort((a, b) => Number(b.value ?? 0) - Number(a.value ?? 0))
      .slice(0, 8)
      .map((deal) => ({
        id: deal.id,
        company: deal.company,
        arr: deal.valueLabel,
        probability: deal.probabilityLabel,
        stage: deal.stageLabel,
        owner: deal.owner,
        nextAction: deal.nextAction,
        detail:
          deal.notes || `${deal.contact} • ${deal.expectedCloseDateLabel}`,
        confidence: deal.probability ?? 0,
      }));

    return {
      dataMode: "live",
      workspace: { id: workspace.id, name: workspace.name },
      filters: normalizedFilters,
      ownerOptions,
      companyOptions,
      contactOptions,
      pipelineStages: buildPipelineStages(filteredDeals),
      pipelineBoard: buildPipelineBoard(filteredDeals),
      companies: filteredCompanies,
      contacts: filteredContacts,
      deals: filteredDeals,
      recentLeads: filteredLeads.slice(0, 8),
      priorities,
      opportunities,
      activities: filteredActivities.slice(0, 12),
      customerHealth: customerHealth.slice(0, 6),
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

      const company = await companiesRepo.create({
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

      await recordCrmAuditEvent({
        action: "company.created",
        actorUserId: userId,
        workspaceId: workspace.id,
        entityId: company.id,
        entityType: "company",
      });

      return company;
    },

    async updateCompany(
      userId: string,
      id: string,
      input: Database["public"]["Tables"]["companies"]["Update"]
    ) {
      const existing = await companiesRepo.findById(id);
      if (!existing) {
        throw new Error("Company not found or not accessible.");
      }

      const updated = await companiesRepo.update(id, input);
      await recordCrmAuditEvent({
        action: "company.updated",
        actorUserId: userId,
        workspaceId: existing.workspace_id,
        entityId: id,
        entityType: "company",
      });
      return updated;
    },

    async deleteCompany(userId: string, id: string) {
      const existing = await companiesRepo.findById(id);
      if (!existing) {
        throw new Error("Company not found or not accessible.");
      }

      await companiesRepo.softDelete(id);
      await recordCrmAuditEvent({
        action: "company.deleted",
        actorUserId: userId,
        workspaceId: existing.workspace_id,
        entityId: id,
        entityType: "company",
      });
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

      const contact = await contactsRepo.create({
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

      await recordCrmAuditEvent({
        action: "contact.created",
        actorUserId: userId,
        workspaceId: workspace.id,
        entityId: contact.id,
        entityType: "contact",
      });

      return contact;
    },

    async updateContact(
      userId: string,
      id: string,
      input: Database["public"]["Tables"]["contacts"]["Update"]
    ) {
      const existing = await contactsRepo.findById(id);
      if (!existing) {
        throw new Error("Contact not found or not accessible.");
      }

      const updated = await contactsRepo.update(id, input);
      await recordCrmAuditEvent({
        action: "contact.updated",
        actorUserId: userId,
        workspaceId: existing.workspace_id,
        entityId: id,
        entityType: "contact",
      });
      return updated;
    },

    async deleteContact(userId: string, id: string) {
      const existing = await contactsRepo.findById(id);
      if (!existing) {
        throw new Error("Contact not found or not accessible.");
      }

      await contactsRepo.softDelete(id);
      await recordCrmAuditEvent({
        action: "contact.deleted",
        actorUserId: userId,
        workspaceId: existing.workspace_id,
        entityId: id,
        entityType: "contact",
      });
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

      const deal = await dealsRepo.create({
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

      await recordCrmAuditEvent({
        action: "deal.created",
        actorUserId: userId,
        workspaceId: workspace.id,
        entityId: deal.id,
        entityType: "deal",
      });

      return deal;
    },

    async updateDeal(
      userId: string,
      id: string,
      input: Database["public"]["Tables"]["deals"]["Update"]
    ) {
      const existing = await dealsRepo.findById(id);
      if (!existing) {
        throw new Error("Deal not found or not accessible.");
      }

      const updated = await dealsRepo.update(id, input);
      await recordCrmAuditEvent({
        action: input.stage && input.stage !== existing.stage ? "deal.stage_updated" : "deal.updated",
        actorUserId: userId,
        workspaceId: existing.workspace_id,
        entityId: id,
        entityType: "deal",
        metadata: input.stage && input.stage !== existing.stage
          ? { previousStage: existing.stage, nextStage: input.stage }
          : undefined,
      });
      return updated;
    },

    async deleteDeal(userId: string, id: string) {
      const existing = await dealsRepo.findById(id);
      if (!existing) {
        throw new Error("Deal not found or not accessible.");
      }

      await dealsRepo.softDelete(id);
      await recordCrmAuditEvent({
        action: "deal.deleted",
        actorUserId: userId,
        workspaceId: existing.workspace_id,
        entityId: id,
        entityType: "deal",
      });
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

      const activity = await activitiesRepo.create({
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

      await recordCrmAuditEvent({
        action: "activity.created",
        actorUserId: userId,
        workspaceId: workspace.id,
        entityId: activity.id,
        entityType: "activity",
      });

      return activity;
    },
  };
}
