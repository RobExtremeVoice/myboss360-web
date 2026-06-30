export type CrmPriorityTone = "critical" | "watch" | "ready";
export type CrmDataMode = "live" | "fallback";

export type CrmSelectOption = {
  value: string;
  label: string;
};

export type CrmPipelineStageDefinition = {
  key: string;
  dbStage: string;
  label: string;
};

export type CrmPipelineStage = {
  key: string;
  name: string;
  totalValue: string;
  dealCount: number;
  progress: number;
  progressLabel: string;
};

export type CrmLead = {
  id: string;
  companyId: string | null;
  ownerId: string | null;
  company: string;
  contact: string;
  source: string;
  owner: string;
  status: string;
  value: string;
  lastContact: string;
};

export type CrmPriorityCard = {
  id: string;
  title: string;
  detail: string;
  owner: string;
  dueWindow: string;
  tone: CrmPriorityTone;
};

export type CrmOpportunity = {
  id: string;
  company: string;
  arr: string;
  probability: string;
  stage: string;
  owner: string;
  nextAction: string;
  detail: string;
  confidence: number;
};

export type CrmActivity = {
  id: string;
  companyId: string | null;
  ownerId: string | null;
  type: string;
  actor: string;
  title: string;
  detail: string;
  timestamp: string;
};

export type CrmCustomerHealth = {
  id: string;
  companyId: string;
  ownerId: string | null;
  company: string;
  owner: string;
  healthScore: number;
  renewalDate: string;
  risk: string;
  nps: string;
  expansionOpportunity: string;
  detail: string;
};

export type CrmCompanyRecord = {
  id: string;
  name: string;
  domain: string;
  industry: string;
  size: string;
  website: string;
  phone: string;
  notes: string;
  ownerId: string | null;
  owner: string;
  contactCount: number;
  openDealCount: number;
  openValue: string;
};

export type CrmContactRecord = {
  id: string;
  companyId: string | null;
  companyName: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  jobTitle: string;
  notes: string;
  ownerId: string | null;
  owner: string;
};

export type CrmDealRecord = {
  id: string;
  companyId: string | null;
  contactId: string | null;
  leadId: string | null;
  title: string;
  company: string;
  contact: string;
  stage: string;
  stageLabel: string;
  value: number | null;
  valueLabel: string;
  currency: string;
  probability: number | null;
  probabilityLabel: string;
  expectedCloseDate: string | null;
  expectedCloseDateLabel: string;
  assignedTo: string | null;
  owner: string;
  notes: string;
  nextAction: string;
};

export type CrmWorkspaceView = {
  dataMode: CrmDataMode;
  workspace: {
    id: string;
    name: string;
  } | null;
  filters: {
    q: string;
    stage: string;
    leadStatus: string;
    owner: string;
    company: string;
  };
  ownerOptions: CrmSelectOption[];
  companyOptions: CrmSelectOption[];
  contactOptions: CrmSelectOption[];
  pipelineStages: CrmPipelineStage[];
  pipelineBoard: Record<string, CrmDealRecord[]>;
  companies: CrmCompanyRecord[];
  contacts: CrmContactRecord[];
  deals: CrmDealRecord[];
  recentLeads: CrmLead[];
  priorities: CrmPriorityCard[];
  opportunities: CrmOpportunity[];
  activities: CrmActivity[];
  customerHealth: CrmCustomerHealth[];
};

export type CrmPageContent = typeof crmPageContent;

export const crmPipelineStageDefinitions: CrmPipelineStageDefinition[] = [
  { key: "prospecting", dbStage: "prospect", label: "Prospecting" },
  { key: "qualified", dbStage: "qualified", label: "Qualified" },
  { key: "proposal", dbStage: "proposal", label: "Proposal" },
  { key: "negotiation", dbStage: "negotiation", label: "Negotiation" },
  { key: "won", dbStage: "closed_won", label: "Won" },
];

export const crmLeadStatusOptions = [
  { value: "all", label: "All lead statuses" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "disqualified", label: "Disqualified" },
] as const;

export const crmStageFilterOptions = [
  { value: "all", label: "All deal stages" },
  ...crmPipelineStageDefinitions.map((stage) => ({
    value: stage.dbStage,
    label: stage.label,
  })),
] as const;

export const crmActivityTypeOptions = [
  { value: "meeting", label: "Meeting" },
  { value: "email", label: "Email" },
  { value: "call", label: "Call" },
  { value: "proposal_viewed", label: "Proposal Viewed" },
  { value: "contract_signed", label: "Contract Signed" },
] as const;

export const crmFallbackData = {
  owners: [
    { value: "sample-olivia", label: "Olivia Carter" },
    { value: "sample-daniel", label: "Daniel Kim" },
    { value: "sample-priya", label: "Priya Shah" },
  ],
  companies: [
    {
      id: "sample-company-atlas",
      name: "Atlas Systems",
      domain: "atlas-systems.com",
      industry: "Enterprise software",
      size: "201-500",
      website: "https://atlas-systems.com",
      phone: "+1 (415) 555-0188",
      notes: "Expansion account with executive sponsorship already established.",
      ownerId: "sample-olivia",
      owner: "Olivia Carter",
      contactCount: 2,
      openDealCount: 2,
      openValue: "$420K",
    },
    {
      id: "sample-company-acme",
      name: "Acme Logistics",
      domain: "acmelogistics.com",
      industry: "Logistics",
      size: "501-1000",
      website: "https://acmelogistics.com",
      phone: "+1 (312) 555-0112",
      notes: "Procurement cycle is active. Leadership wants finance alignment before closing.",
      ownerId: "sample-daniel",
      owner: "Daniel Kim",
      contactCount: 1,
      openDealCount: 1,
      openValue: "$180K",
    },
  ] satisfies CrmCompanyRecord[],
  contacts: [
    {
      id: "sample-contact-maya",
      companyId: "sample-company-atlas",
      companyName: "Atlas Systems",
      firstName: "Maya",
      lastName: "Johnson",
      fullName: "Maya Johnson",
      email: "maya@atlas-systems.com",
      phone: "+1 (415) 555-0141",
      jobTitle: "VP Operations",
      notes: "Primary champion. Wants rollout timeline before procurement approval.",
      ownerId: "sample-olivia",
      owner: "Olivia Carter",
    },
    {
      id: "sample-contact-diego",
      companyId: "sample-company-acme",
      companyName: "Acme Logistics",
      firstName: "Diego",
      lastName: "Martinez",
      fullName: "Diego Martinez",
      email: "diego@acmelogistics.com",
      phone: "+1 (312) 555-0193",
      jobTitle: "Finance Director",
      notes: "Reviewing pricing structure with CFO this week.",
      ownerId: "sample-daniel",
      owner: "Daniel Kim",
    },
  ] satisfies CrmContactRecord[],
  deals: [
    {
      id: "sample-deal-atlas-proposal",
      companyId: "sample-company-atlas",
      contactId: "sample-contact-maya",
      leadId: null,
      title: "Atlas Executive Rollout",
      company: "Atlas Systems",
      contact: "Maya Johnson",
      stage: "proposal",
      stageLabel: "Proposal",
      value: 240000,
      valueLabel: "$240K",
      currency: "USD",
      probability: 72,
      probabilityLabel: "72%",
      expectedCloseDate: "2026-07-12",
      expectedCloseDateLabel: "Jul 12, 2026",
      assignedTo: "sample-olivia",
      owner: "Olivia Carter",
      notes: "Proposal is under review with COO and finance.",
      nextAction: "Review procurement checklist",
    },
    {
      id: "sample-deal-atlas-expansion",
      companyId: "sample-company-atlas",
      contactId: "sample-contact-maya",
      leadId: null,
      title: "Atlas AI Expansion",
      company: "Atlas Systems",
      contact: "Maya Johnson",
      stage: "negotiation",
      stageLabel: "Negotiation",
      value: 180000,
      valueLabel: "$180K",
      currency: "USD",
      probability: 84,
      probabilityLabel: "84%",
      expectedCloseDate: "2026-07-06",
      expectedCloseDateLabel: "Jul 6, 2026",
      assignedTo: "sample-priya",
      owner: "Priya Shah",
      notes: "Security terms are aligned. Final redlines pending legal approval.",
      nextAction: "Prepare final redline response",
    },
    {
      id: "sample-deal-acme",
      companyId: "sample-company-acme",
      contactId: "sample-contact-diego",
      leadId: null,
      title: "Acme Margin Visibility",
      company: "Acme Logistics",
      contact: "Diego Martinez",
      stage: "qualified",
      stageLabel: "Qualified",
      value: 180000,
      valueLabel: "$180K",
      currency: "USD",
      probability: 58,
      probabilityLabel: "58%",
      expectedCloseDate: "2026-07-20",
      expectedCloseDateLabel: "Jul 20, 2026",
      assignedTo: "sample-daniel",
      owner: "Daniel Kim",
      notes: "Finance sponsor engaged. Waiting on implementation estimate.",
      nextAction: "Share implementation estimate",
    },
  ] satisfies CrmDealRecord[],
  leads: [
    {
      id: "sample-lead-nova",
      companyId: "sample-company-atlas",
      ownerId: "sample-olivia",
      company: "Atlas Systems",
      contact: "Maya Johnson",
      source: "Referral",
      owner: "Olivia Carter",
      status: "Qualified",
      value: "$240K",
      lastContact: "2 hours ago",
    },
    {
      id: "sample-lead-acme",
      companyId: "sample-company-acme",
      ownerId: "sample-daniel",
      company: "Acme Logistics",
      contact: "Diego Martinez",
      source: "Outbound",
      owner: "Daniel Kim",
      status: "Contacted",
      value: "$180K",
      lastContact: "Yesterday",
    },
  ] satisfies CrmLead[],
  priorities: [
    {
      id: "sample-priority-1",
      title: "Finalize Atlas redlines",
      detail: "Legal review is the last blocker before signature.",
      owner: "Priya Shah",
      dueWindow: "Today",
      tone: "critical",
    },
    {
      id: "sample-priority-2",
      title: "Send Acme implementation estimate",
      detail: "Finance sponsor is waiting on rollout clarity before approval.",
      owner: "Daniel Kim",
      dueWindow: "48h",
      tone: "watch",
    },
  ] satisfies CrmPriorityCard[],
  activities: [
    {
      id: "sample-activity-1",
      companyId: "sample-company-atlas",
      ownerId: "sample-priya",
      type: "Contract Signed",
      actor: "Priya Shah",
      title: "Atlas legal team approved security terms",
      detail: "Final contract pass completed with no additional revisions requested.",
      timestamp: "35 minutes ago",
    },
    {
      id: "sample-activity-2",
      companyId: "sample-company-acme",
      ownerId: "sample-daniel",
      type: "Meeting",
      actor: "Daniel Kim",
      title: "Acme finance review scheduled",
      detail: "CFO and operations team requested a margin visibility walkthrough.",
      timestamp: "Yesterday",
    },
  ] satisfies CrmActivity[],
  customerHealth: [
    {
      id: "sample-health-atlas",
      companyId: "sample-company-atlas",
      ownerId: "sample-priya",
      company: "Atlas Systems",
      owner: "Priya Shah",
      healthScore: 91,
      renewalDate: "Sep 30, 2026",
      risk: "Low",
      nps: "62",
      expansionOpportunity: "High",
      detail: "Strong engagement, executive sponsorship, and expansion budget confirmed.",
    },
    {
      id: "sample-health-acme",
      companyId: "sample-company-acme",
      ownerId: "sample-daniel",
      company: "Acme Logistics",
      owner: "Daniel Kim",
      healthScore: 69,
      renewalDate: "Oct 14, 2026",
      risk: "Moderate",
      nps: "Pending",
      expansionOpportunity: "Moderate",
      detail: "Positive interest, but implementation clarity remains the main blocker.",
    },
  ] satisfies CrmCustomerHealth[],
};

export const crmPageContent = {
  header: {
    eyebrow: "Revenue workspace",
    title: "CRM",
    description:
      "Track the health of your pipeline, manage core records, and keep sales execution visible across the workspace.",
    summary:
      "Search, filters, CRUD workflows, pipeline controls, and activity logging all run through the authenticated workspace.",
    primaryActionLabel: "Create records",
    primaryActionHref: "#crm-control-center",
  },
  toolbar: {
    searchLabel: "Search",
    searchPlaceholder: "Search companies, contacts, deals, and activity",
    stageLabel: "Deal stage",
    leadStatusLabel: "Lead status",
    ownerLabel: "Owner",
    companyLabel: "Company",
    submitLabel: "Apply filters",
    resetLabel: "Reset",
  },
  fallbackNotice: {
    title: "Development CRM dataset",
    description:
      "No live Supabase CRM records were found for this workspace yet, so a local development dataset is shown while you begin creating real data.",
  },
  controlCenter: {
    title: "CRM Control Center",
    description:
      "Create companies, contacts, deals, and activity from one shared command area.",
  },
  companies: {
    title: "Companies",
    description:
      "Production company records with editable firmographic details and soft delete controls.",
    emptyState: {
      title: "No companies yet",
      description:
        "Create the first company to start organizing accounts, contacts, and deal activity.",
    },
  },
  contacts: {
    title: "Contacts",
    description:
      "Key buyer and stakeholder records connected to the accounts in your workspace.",
    emptyState: {
      title: "No contacts yet",
      description:
        "Add the first contact so opportunities and account activity can be attached to real people.",
    },
  },
  pipelineSummary: {
    title: "Pipeline Summary",
    description:
      "Live stage totals across the current workspace, aggregated from actual deals.",
    emptyState: {
      title: "No active pipeline yet",
      description:
        "Create the first deal and the pipeline summary will populate automatically.",
    },
  },
  pipelineBoard: {
    title: "Pipeline Board",
    description:
      "Move deals across core stages with lightweight controls and keep the board aligned with the current filters.",
    emptyState: {
      title: "No deals in the current view",
      description:
        "Adjust the filters or create a new deal to populate the pipeline board.",
    },
  },
  recentLeads: {
    title: "Recent Leads",
    description:
      "Fresh inbound demand and follow-up visibility based on real lead records.",
    columnLabels: {
      company: "Company",
      contact: "Contact",
      source: "Source",
      owner: "Owner",
      status: "Status",
      value: "Value",
      lastContact: "Last Contact",
    },
    emptyState: {
      title: "No leads match the current filters",
      description:
        "Try clearing the search or filters, or create new lead-linked activity in the current workspace.",
    },
  },
  priorities: {
    title: "Today's Priorities",
    description:
      "Server-generated priorities based on close dates, deal momentum, and engagement gaps.",
    emptyState: {
      title: "No urgent priorities right now",
      description:
        "As more deals, leads, and activities accumulate, the queue will highlight leadership follow-through.",
    },
  },
  openOpportunities: {
    title: "Open Opportunities",
    description:
      "Active deals ordered by value and confidence so leadership can focus on the highest-leverage revenue work.",
    emptyState: {
      title: "No open opportunities found",
      description:
        "Open deals will appear here automatically once your workspace starts tracking pipeline activity.",
    },
  },
  activityTimeline: {
    title: "Activity Timeline",
    description:
      "Recent CRM activity pulled directly from the current workspace.",
    emptyState: {
      title: "No CRM activity yet",
      description:
        "Meetings, emails, calls, proposals, and signed contracts will appear here as activities are created.",
    },
  },
  customerHealth: {
    title: "Customer Health",
    description:
      "Account health signals derived from real company, deal, and activity data.",
    emptyState: {
      title: "No customer health data available",
      description:
        "Add companies and related activity to begin building account health visibility.",
    },
  },
  workspaceEmptyState: {
    title: "No workspace access found",
    description:
      "This account does not currently belong to a workspace, so CRM data cannot be loaded yet.",
  },
};
