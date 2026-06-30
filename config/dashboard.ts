export type DashboardMetric = {
  label: string;
  value: string;
  change: string;
  detail: string;
};

export type DashboardActivityItem = {
  title: string;
  detail: string;
  timestamp: string;
  category: string;
};

export type DashboardMeetingItem = {
  title: string;
  time: string;
  attendees: string;
  location: string;
};

export type DashboardPriorityItem = {
  title: string;
  detail: string;
  status: string;
};

export type DashboardBriefItem = {
  label: string;
  detail: string;
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
};

export type DashboardQuickAction = {
  label: string;
  description: string;
};

export type DashboardHomeContent = {
  title: string;
  description: string;
  metrics: DashboardMetric[];
  recentActivity: DashboardActivityItem[];
  upcomingMeetings: DashboardMeetingItem[];
  priorities: DashboardPriorityItem[];
  executiveBrief: {
    title: string;
    summary: string;
    items: DashboardBriefItem[];
  };
  recentDocuments: DashboardDocumentItem[];
  recentOpportunities: DashboardOpportunityItem[];
  quickActions: DashboardQuickAction[];
};

export const dashboardHomeContent: DashboardHomeContent = {
  title: "Executive Dashboard",
  description:
    "A focused operating view for leadership, with revenue, execution, cash posture, and AI-guided context in one place.",
  metrics: [
    {
      label: "Revenue",
      value: "$1.42M",
      change: "+8.4%",
      detail: "Monthly recognized revenue trending ahead of plan.",
    },
    {
      label: "Pipeline",
      value: "$3.86M",
      change: "12 active deals",
      detail: "Qualified opportunities across expansion and new business.",
    },
    {
      label: "Tasks Due",
      value: "17",
      change: "5 today",
      detail: "Priority follow-through requiring leadership visibility.",
    },
    {
      label: "Cash Flow",
      value: "$284K",
      change: "+11.2%",
      detail: "Net operating cash inflow over the last 30 days.",
    },
  ],
  recentActivity: [
    {
      title: "Proposal approved for Atlas Growth",
      detail: "Finance and sales aligned on final commercial terms.",
      timestamp: "10 min ago",
      category: "Revenue",
    },
    {
      title: "Q3 operating plan updated",
      detail: "Leadership notes and task owners were captured after the review.",
      timestamp: "42 min ago",
      category: "Planning",
    },
    {
      title: "Client onboarding milestone moved forward",
      detail: "Project delivery shifted ahead after stakeholder confirmation.",
      timestamp: "1 hr ago",
      category: "Projects",
    },
    {
      title: "Collections summary shared",
      detail: "Finance prepared a short list of invoices requiring follow-up.",
      timestamp: "2 hrs ago",
      category: "Finance",
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
      detail: "Margin remains healthy, but legal language needs final executive sign-off.",
      status: "Needs approval",
    },
    {
      title: "Confirm owner for onboarding dependency",
      detail: "One design handoff is blocking the client launch schedule this week.",
      status: "Time sensitive",
    },
    {
      title: "Review collections follow-up list",
      detail: "Two invoices over 30 days could affect short-term cash timing.",
      status: "Today",
    },
  ],
  executiveBrief: {
    title: "AI Executive Brief",
    summary:
      "Revenue posture is healthy, project delivery is stable, and one financial follow-up needs attention before end of day.",
    items: [
      {
        label: "Revenue signal",
        detail: "Three late-stage opportunities are holding forecast confidence above target.",
      },
      {
        label: "Execution signal",
        detail: "Most active projects are on track, with one onboarding dependency requiring reassignment.",
      },
      {
        label: "Finance signal",
        detail: "Collections timing is manageable, but two overdue invoices should be escalated today.",
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
    },
    {
      name: "Northstar Advisory Renewal",
      company: "Northstar Advisory",
      value: "$185K",
      stage: "Negotiation",
    },
    {
      name: "Crestpoint Consulting Rollout",
      company: "Crestpoint",
      value: "$96K",
      stage: "Discovery",
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
