export type CrmPriorityTone = "critical" | "watch" | "ready";

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
  type: string;
  actor: string;
  title: string;
  detail: string;
  timestamp: string;
};

export type CrmCustomerHealth = {
  id: string;
  company: string;
  owner: string;
  healthScore: number;
  renewalDate: string;
  risk: string;
  nps: string;
  expansionOpportunity: string;
  detail: string;
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

export const crmPageContent = {
  header: {
    eyebrow: "Revenue workspace",
    title: "CRM",
    description:
      "Track the health of your pipeline, monitor follow-through, and keep sales execution visible across the workspace.",
    summary:
      "This workspace is now backed by live Supabase data. Search, filters, pipeline totals, leads, opportunities, and activity all resolve server-side within the active workspace.",
    primaryActionLabel: "New record",
  },
  toolbar: {
    searchLabel: "Search",
    searchPlaceholder: "Search companies, contacts, deals, and activity",
    stageLabel: "Deal stage",
    leadStatusLabel: "Lead status",
    submitLabel: "Apply filters",
    resetLabel: "Reset",
  },
  pipelineSummary: {
    title: "Pipeline Summary",
    description:
      "Live stage totals across the current workspace, with values aggregated from real deals.",
    emptyState: {
      title: "No active pipeline yet",
      description:
        "Create the first deal in Supabase and the pipeline summary will populate automatically.",
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
        "Try clearing the search or lead status filter, or create a new lead in the current workspace.",
    },
  },
  priorities: {
    title: "Today's Priorities",
    description:
      "Server-generated priorities based on upcoming close dates, pipeline risk, and recent engagement gaps.",
    emptyState: {
      title: "No urgent priorities right now",
      description:
        "As deals, leads, and activities accumulate, this queue will surface the highest-leverage next actions.",
    },
  },
  openOpportunities: {
    title: "Open Opportunities",
    description:
      "Live deals in motion across the pipeline, ordered by value and probability.",
    emptyState: {
      title: "No open opportunities found",
      description:
        "Open deals will appear here automatically once your workspace starts tracking pipeline activity.",
    },
  },
  activityTimeline: {
    title: "Activity Timeline",
    description:
      "Recent CRM activity pulled directly from the shared workspace timeline.",
    emptyState: {
      title: "No CRM activity yet",
      description:
        "Meetings, emails, calls, proposals, and signed contracts will appear here as activities are created.",
    },
  },
  customerHealth: {
    title: "Customer Health",
    description:
      "Company health signals derived from account activity, pipeline momentum, and stored metadata.",
    emptyState: {
      title: "No customer health data available",
      description:
        "Add companies and related opportunities to begin building account health visibility.",
    },
  },
  workspaceEmptyState: {
    title: "No workspace access found",
    description:
      "This account does not currently belong to a workspace, so CRM data cannot be loaded yet.",
  },
};
