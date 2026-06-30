export type DashboardMetricTrend = "up" | "flat" | "attention";

export type DashboardShellStatus = {
  label: string;
  value: string;
};

export type DashboardShellContent = {
  workspaceName: string;
  workspaceStatus: DashboardShellStatus;
  aiStatus: DashboardShellStatus;
  primaryActionLabel: string;
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

export const dashboardShellContent: DashboardShellContent = {
  workspaceName: "MyBoss360 HQ",
  workspaceStatus: {
    label: "Workspace status",
    value: "Stable",
  },
  aiStatus: {
    label: "AI",
    value: "Online",
  },
  primaryActionLabel: "New",
};

export const dashboardHomeContent: DashboardHomeContent = {
  title: "Executive Dashboard",
  description:
    "A concise operating view for leadership, bringing commercial health, execution pressure, cash posture, and AI-guided direction into one workspace.",
  greeting: "Good morning, Robson. Here is what needs your attention today.",
  metrics: [
    {
      label: "Revenue",
      value: "$1.46M",
      change: "+9.1%",
      comparison: "vs last month",
      detail: "Recognized revenue remains ahead of plan with stronger renewal conversion this week.",
      trend: "up",
      sparkline: [42, 44, 47, 46, 50, 54, 58],
    },
    {
      label: "Pipeline",
      value: "$3.94M",
      change: "+4 deals",
      comparison: "qualified this week",
      detail: "Late-stage opportunities are concentrated in expansion and multi-team rollout work.",
      trend: "up",
      sparkline: [38, 40, 41, 43, 48, 52, 57],
    },
    {
      label: "Tasks Due",
      value: "14",
      change: "6 high priority",
      comparison: "requiring review today",
      detail: "Open follow-through is concentrated around pricing, onboarding, and leadership approvals.",
      trend: "attention",
      sparkline: [18, 17, 19, 18, 16, 15, 14],
    },
    {
      label: "Cash Flow",
      value: "$312K",
      change: "+6.8%",
      comparison: "30-day net inflow",
      detail: "Collections remain stable, though two invoices still need outreach before Friday.",
      trend: "flat",
      sparkline: [26, 28, 27, 29, 30, 31, 31],
    },
  ],
  recentActivity: [
    {
      title: "Atlas Growth proposal approved",
      detail: "Commercial terms were finalized after finance cleared the revised margin position.",
      timestamp: "10 min ago",
      category: "Revenue",
      actor: "Marcus Lee",
    },
    {
      title: "Q3 operating plan updated",
      detail: "Leadership decisions from this morning were converted into owners, dates, and follow-ups.",
      timestamp: "42 min ago",
      category: "Planning",
      actor: "Olivia Chen",
    },
    {
      title: "Onboarding dependency escalated",
      detail: "A design handoff was flagged early enough to protect the Northstar launch timeline.",
      timestamp: "1 hr ago",
      category: "Projects",
      actor: "Sophie Bennett",
    },
    {
      title: "Collections review shared",
      detail: "Finance surfaced two invoices that now need executive nudging to preserve cash timing.",
      timestamp: "2 hrs ago",
      category: "Finance",
      actor: "Nina Patel",
    },
  ],
  upcomingMeetings: [
    {
      title: "Leadership Operating Review",
      time: "11:00 AM",
      attendees: "CEO, COO, Finance, Delivery",
      location: "Board Room / Meet",
    },
    {
      title: "Northstar Expansion Call",
      time: "1:30 PM",
      attendees: "Revenue Team, Client Partner",
      location: "Google Meet",
    },
    {
      title: "Hiring Decision Debrief",
      time: "3:00 PM",
      attendees: "Founder, Operations, Talent",
      location: "HQ - Room 4",
    },
  ],
  priorities: [
    {
      title: "Approve the Atlas pricing exception",
      detail: "The account is ready to close, but final contract language still requires executive approval.",
      status: "Needs approval",
      owner: "Revenue",
      dueWindow: "Before 1:00 PM",
      tone: "critical",
    },
    {
      title: "Confirm owner for onboarding dependency",
      detail: "One cross-functional handoff is at risk of slowing the client launch sequence this week.",
      status: "Escalated",
      owner: "Delivery",
      dueWindow: "Today",
      tone: "watch",
    },
    {
      title: "Review collections follow-up list",
      detail: "Two overdue invoices are manageable now, but should not carry into next week unaddressed.",
      status: "Ready to review",
      owner: "Finance",
      dueWindow: "By end of day",
      tone: "ready",
    },
  ],
  executiveBrief: {
    title: "AI Executive Brief",
    summary:
      "Commercial momentum remains strong, delivery risk is contained, and the most important decision today is closing the Atlas pricing exception without creating margin leakage.",
    confidenceLabel: "High confidence",
    healthScore: "91",
    recommendation:
      "Approve Atlas with the revised terms, then move directly into the onboarding escalation so delivery stays ahead of customer expectations.",
    items: [
      {
        label: "Revenue signal",
        detail: "Three late-stage opportunities are supporting forecast confidence above target, with Atlas representing the highest-leverage decision today.",
      },
      {
        label: "Execution signal",
        detail: "Most active projects are on track, but one onboarding dependency should be reassigned before the afternoon review.",
      },
      {
        label: "Finance signal",
        detail: "Cash posture is stable, though the overdue collections list should be touched before day-end to avoid unnecessary drag.",
      },
    ],
    risks: [
      {
        title: "Pricing approval delay",
        detail: "Atlas could slip if the exception is not resolved before the client call.",
        tone: "critical",
      },
      {
        title: "Onboarding handoff bottleneck",
        detail: "A delivery dependency still lacks a final owner ahead of this week’s launch sequence.",
        tone: "watch",
      },
    ],
    actions: [
      {
        title: "Close the pricing decision",
        detail: "Give revenue final direction on Atlas before the 1:30 PM customer call.",
      },
      {
        title: "Reassign the onboarding blocker",
        detail: "Shift ownership during the operating review so delivery can keep launch timing intact.",
      },
      {
        title: "Prompt the collections follow-up",
        detail: "Ask finance to send the escalation list before the end-of-day recap.",
      },
    ],
  },
  recentDocuments: [
    {
      name: "Q3 Leadership Operating Plan",
      category: "Strategy",
      updatedAt: "Updated 32 min ago",
      owner: "Olivia Chen",
    },
    {
      name: "Atlas Renewal Summary",
      category: "Sales",
      updatedAt: "Updated 1 hr ago",
      owner: "Marcus Lee",
    },
    {
      name: "Collections Follow-up Notes",
      category: "Finance",
      updatedAt: "Updated 2 hrs ago",
      owner: "Nina Patel",
    },
  ],
  recentOpportunities: [
    {
      name: "Atlas Growth Expansion",
      company: "Atlas Growth",
      value: "$420K",
      stage: "Proposal",
      confidence: "92%",
    },
    {
      name: "Northstar Advisory Renewal",
      company: "Northstar Advisory",
      value: "$185K",
      stage: "Negotiation",
      confidence: "78%",
    },
    {
      name: "Crestpoint Consulting Rollout",
      company: "Crestpoint",
      value: "$96K",
      stage: "Discovery",
      confidence: "64%",
    },
  ],
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
};
