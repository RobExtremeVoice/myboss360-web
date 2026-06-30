export type DashboardMetricTrend = "up" | "flat" | "attention";

export type DashboardShellStatus = {
  label: string;
  value: string;
};

export type DashboardMetric = {
  label: string;
  value: string;
  change: string;
  comparison: string;
  detail: string;
  trend: DashboardMetricTrend;
  sparkline: number[];
};

export type DashboardActivityItem = {
  title: string;
  detail: string;
  timestamp: string;
  category: string;
  actor: string;
};

export type DashboardMeetingItem = {
  title: string;
  time: string;
  attendees: string;
  location: string;
};

export type DashboardPriorityTone = "critical" | "watch" | "ready";

export type DashboardPriorityItem = {
  title: string;
  detail: string;
  status: string;
  owner: string;
  dueWindow: string;
  tone: DashboardPriorityTone;
};

export type DashboardBriefItem = {
  label: string;
  detail: string;
};

export type DashboardBriefAction = {
  title: string;
  detail: string;
};

export type DashboardBriefRisk = {
  title: string;
  detail: string;
  tone: DashboardPriorityTone;
};

export type DashboardDocumentItem = {
  name: string;
  category: string;
  updatedAt: string;
  owner: string;
};

export type DashboardOpportunityItem = {
  name: string;
  company: string;
  value: string;
  stage: string;
  confidence: string;
};

export type DashboardQuickAction = {
  label: string;
  description: string;
};

export type DashboardHomeContent = {
  title: string;
  description: string;
  greeting: string;
  metrics: DashboardMetric[];
  recentActivity: DashboardActivityItem[];
  upcomingMeetings: DashboardMeetingItem[];
  priorities: DashboardPriorityItem[];
  executiveBrief: {
    title: string;
    summary: string;
    confidenceLabel: string;
    healthScore: string;
    recommendation: string;
    items: DashboardBriefItem[];
    risks: DashboardBriefRisk[];
    actions: DashboardBriefAction[];
  };
  recentDocuments: DashboardDocumentItem[];
  recentOpportunities: DashboardOpportunityItem[];
  quickActions: DashboardQuickAction[];
};

export type DashboardStageSummary = {
  stage: string;
  label: string;
  count: number;
  value: number;
};

export type DashboardCashFlowSummary = {
  currentPeriodValue: number;
  previousPeriodValue: number;
};

export type ExecutiveDashboard = DashboardHomeContent & {
  workspace: {
    id: string;
    name: string;
  } | null;
  hasLiveData: boolean;
  insights: {
    dealsByStage: DashboardStageSummary[];
    tasksDueToday: number;
    projectsAtRisk: number;
    customerHealthScore: number | null;
    unreadNotifications: number;
    cashFlowSummary: DashboardCashFlowSummary;
  };
};

export const dashboardStageDefinitions = [
  { value: "prospect", label: "Prospecting" },
  { value: "qualified", label: "Qualified" },
  { value: "proposal", label: "Proposal" },
  { value: "negotiation", label: "Negotiation" },
  { value: "closed_won", label: "Won" },
  { value: "closed_lost", label: "Lost" },
] as const;

export const dashboardPageContent = {
  title: "Executive Dashboard",
  description:
    "A concise operating view for leadership, bringing commercial health, execution pressure, cash posture, and AI-guided direction into one workspace.",
  greetingTemplate: "Good morning, {name}. Here is what needs your attention today.",
  emptyWorkspaceState: {
    title: "No workspace connected yet",
    description:
      "Join or create a workspace to start populating executive metrics, operating visibility, and CRM performance data.",
  },
  emptyDashboardState: {
    title: "No live operating data yet",
    description:
      "As soon as deals, tasks, meetings, projects, activities, or documents exist in this workspace, the executive dashboard will populate automatically.",
  },
  sections: {
    priorities: {
      title: "Today's Executive Priorities",
      description:
        "High-leverage decisions and follow-through that need leadership attention.",
      emptyTitle: "No executive priorities yet",
      emptyDescription:
        "Once urgent tasks, risk signals, or revenue decisions appear, the priority queue will surface them here.",
    },
    opportunities: {
      title: "Top Opportunities",
      description:
        "Commercial opportunities with the strongest near-term leverage.",
      emptyTitle: "No open opportunities yet",
      emptyDescription:
        "Create or sync your first deals to surface the highest-value pipeline opportunities here.",
    },
    meetings: {
      title: "Upcoming Meetings",
      description: "Meetings requiring awareness today.",
      emptyTitle: "No upcoming meetings",
      emptyDescription:
        "Calendar events scheduled in the workspace will appear here automatically.",
    },
    quickActions: {
      title: "Quick Actions",
      description: "Common entry points for the next operating task.",
    },
    activity: {
      title: "Recent Activity",
      description:
        "The latest cross-functional updates affecting leadership visibility.",
      emptyTitle: "No recent activity yet",
      emptyDescription:
        "Calls, meetings, notes, and tracked workspace events will surface here once your teams begin working inside MyBoss360.",
    },
    documents: {
      title: "Recent Documents",
      description:
        "Recently updated notes and files from across the workspace.",
      emptyTitle: "No recent documents yet",
      emptyDescription:
        "As documents are added or updated, the latest workspace knowledge will appear here.",
    },
  },
  quickActions: [
    {
      label: "Create executive note",
      description: "Capture a leadership update or decision summary.",
    },
    {
      label: "Review open deals",
      description: "Jump into pipeline items that need action this week.",
    },
    {
      label: "Open task board",
      description: "Inspect due work and outstanding owners.",
    },
    {
      label: "Prepare meeting brief",
      description: "Generate context for the next leadership conversation.",
    },
  ],
} as const;
