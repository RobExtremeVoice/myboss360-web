export type CrmHeaderContent = {
  eyebrow: string;
  title: string;
  description: string;
  summary: string;
  primaryActionLabel: string;
};

export type CrmPipelineStage = {
  name: string;
  dealCount: number;
  totalValue: string;
  progressLabel: string;
  progress: number;
};

export type CrmLead = {
  company: string;
  contact: string;
  source: string;
  owner: string;
  status: string;
  value: string;
  lastContact: string;
};

export type CrmPriorityCard = {
  title: string;
  detail: string;
  owner: string;
  dueWindow: string;
};

export type CrmOpportunity = {
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
  actor: string;
  title: string;
  detail: string;
  timestamp: string;
  type: string;
};

export type CrmCustomerHealth = {
  company: string;
  healthScore: number;
  renewalDate: string;
  risk: string;
  nps: string;
  expansionOpportunity: string;
  owner: string;
  detail: string;
};

export type CrmEmptyState = {
  title: string;
  description: string;
};

export type CrmPageContent = {
  header: CrmHeaderContent;
  pipelineSummary: {
    title: string;
    description: string;
    stages: CrmPipelineStage[];
  };
  recentLeads: {
    title: string;
    description: string;
    columnLabels: {
      company: string;
      contact: string;
      source: string;
      owner: string;
      status: string;
      value: string;
      lastContact: string;
    };
    leads: CrmLead[];
  };
  priorities: {
    title: string;
    description: string;
    items: CrmPriorityCard[];
  };
  openOpportunities: {
    title: string;
    description: string;
    opportunities: CrmOpportunity[];
  };
  activityTimeline: {
    title: string;
    description: string;
    items: CrmActivity[];
    emptyState: CrmEmptyState;
  };
  customerHealth: {
    title: string;
    description: string;
    accounts: CrmCustomerHealth[];
  };
};

export const crmPageContent: CrmPageContent = {
  header: {
    eyebrow: "CRM Workspace",
    title: "A structured commercial workspace for pipeline, relationships, and account health.",
    description:
      "The CRM module is evolving from a snapshot into a workspace leaders can actually operate from, combining pipeline clarity, lead management, account activity, and customer risk visibility.",
    summary:
      "Proposal-stage momentum is strong today, with Atlas and Northstar driving the highest-value decisions while renewal timing and demo follow-through require active attention.",
    primaryActionLabel: "New Lead",
  },
  pipelineSummary: {
    title: "Pipeline Summary",
    description:
      "A stage-by-stage view of active commercial momentum across the CRM.",
    stages: [
      {
        name: "Prospecting",
        dealCount: 9,
        totalValue: "$540K",
        progressLabel: "Top of funnel",
        progress: 18,
      },
      {
        name: "Qualified",
        dealCount: 7,
        totalValue: "$1.16M",
        progressLabel: "Validated demand",
        progress: 36,
      },
      {
        name: "Proposal",
        dealCount: 6,
        totalValue: "$1.82M",
        progressLabel: "Best current leverage",
        progress: 64,
      },
      {
        name: "Negotiation",
        dealCount: 4,
        totalValue: "$710K",
        progressLabel: "Close coordination",
        progress: 82,
      },
      {
        name: "Won",
        dealCount: 5,
        totalValue: "$930K",
        progressLabel: "Closed this quarter",
        progress: 100,
      },
    ],
  },
  recentLeads: {
    title: "Recent Leads",
    description:
      "New leads and contacts moving through initial qualification and commercial follow-up.",
    columnLabels: {
      company: "Company",
      contact: "Contact",
      source: "Source",
      owner: "Owner",
      status: "Status",
      value: "Value",
      lastContact: "Last Contact",
    },
    leads: [
      {
        company: "Northstream Partners",
        contact: "Avery Collins",
        source: "Referral",
        owner: "Marcus Lee",
        status: "Qualified",
        value: "$120K",
        lastContact: "Today, 9:20 AM",
      },
      {
        company: "Summit Forge",
        contact: "Mina Patel",
        source: "Website",
        owner: "Olivia Chen",
        status: "New",
        value: "$75K",
        lastContact: "Yesterday",
      },
      {
        company: "Crestline Advisory",
        contact: "Jordan Brooks",
        source: "Event",
        owner: "Sophie Bennett",
        status: "Working",
        value: "$180K",
        lastContact: "Today, 8:05 AM",
      },
      {
        company: "Harbor Studio",
        contact: "Daniel Wu",
        source: "Inbound",
        owner: "Marcus Lee",
        status: "Qualified",
        value: "$95K",
        lastContact: "Yesterday",
      },
      {
        company: "Vantage Collective",
        contact: "Elena Morris",
        source: "Partner",
        owner: "Olivia Chen",
        status: "Working",
        value: "$210K",
        lastContact: "Today, 11:15 AM",
      },
    ],
  },
  priorities: {
    title: "Today's Priorities",
    description:
      "The highest-value CRM actions that should stay in front of leadership and revenue ops.",
    items: [
      {
        title: "Call Acme Inc.",
        detail: "Reconnect with the buyer after yesterday’s pricing review and unblock procurement questions.",
        owner: "Marcus Lee",
        dueWindow: "Before 12:00 PM",
      },
      {
        title: "Review Atlas Proposal",
        detail: "Confirm margin guardrails and finalize the executive note before customer send-off.",
        owner: "Olivia Chen",
        dueWindow: "Today",
      },
      {
        title: "Prepare Renewal",
        detail: "Package the Northstar renewal summary with delivery performance and adoption notes.",
        owner: "Sophie Bennett",
        dueWindow: "By 2:00 PM",
      },
      {
        title: "Schedule Demo",
        detail: "Lock the Crestline stakeholder demo while interest and internal momentum are still high.",
        owner: "Marcus Lee",
        dueWindow: "This afternoon",
      },
    ],
  },
  openOpportunities: {
    title: "Open Opportunities",
    description:
      "Commercial opportunities that still need active coordination, executive visibility, or follow-through.",
    opportunities: [
      {
        company: "Atlas Growth",
        arr: "$420K",
        probability: "92%",
        stage: "Proposal",
        owner: "Marcus Lee",
        nextAction: "Finalize executive approval",
        detail: "Executive approval is the last blocker before customer confirmation.",
        confidence: 92,
      },
      {
        company: "Northstar Advisory",
        arr: "$185K",
        probability: "78%",
        stage: "Negotiation",
        owner: "Olivia Chen",
        nextAction: "Resolve legal language",
        detail: "Scope alignment is positive, though legal review is still open.",
        confidence: 78,
      },
      {
        company: "Crestpoint",
        arr: "$96K",
        probability: "64%",
        stage: "Qualified",
        owner: "Sophie Bennett",
        nextAction: "Confirm stakeholder map",
        detail: "The opportunity is real, and the next move is aligning the buying group.",
        confidence: 64,
      },
      {
        company: "Acme Inc.",
        arr: "$240K",
        probability: "71%",
        stage: "Proposal",
        owner: "Marcus Lee",
        nextAction: "Address pricing concern",
        detail: "Commercial interest is strong, but timing depends on a fast pricing response.",
        confidence: 71,
      },
    ],
  },
  activityTimeline: {
    title: "Activity Timeline",
    description:
      "A structured timeline of revenue interactions across meetings, emails, calls, and closing signals.",
    items: [
      {
        actor: "Marcus Lee",
        title: "Proposal viewed by Atlas Growth",
        detail: "The buyer reopened the revised proposal and spent nine minutes on the pricing section.",
        timestamp: "18 min ago",
        type: "Proposal Viewed",
      },
      {
        actor: "Olivia Chen",
        title: "Northstar renewal meeting completed",
        detail: "The client confirmed positive delivery sentiment and requested updated legal wording.",
        timestamp: "47 min ago",
        type: "Meeting",
      },
      {
        actor: "Sophie Bennett",
        title: "Call logged with Crestline Advisory",
        detail: "Discovery follow-up surfaced a second operational use case and two more stakeholders.",
        timestamp: "1 hr ago",
        type: "Call",
      },
      {
        actor: "Marcus Lee",
        title: "Email sent to Acme Inc.",
        detail: "Commercial clarification was sent to the procurement lead with revised implementation timing.",
        timestamp: "1 hr ago",
        type: "Email",
      },
      {
        actor: "Nina Patel",
        title: "Contract signed for Meridian Ops",
        detail: "The account is now closed-won and handed off for onboarding coordination.",
        timestamp: "2 hrs ago",
        type: "Contract Signed",
      },
    ],
    emptyState: {
      title: "No CRM activity yet",
      description:
        "When meetings, calls, emails, and commercial milestones are available, they will appear here.",
    },
  },
  customerHealth: {
    title: "Customer Health",
    description:
      "An account-level view of renewal timing, health score, risk posture, sentiment, and expansion potential.",
    accounts: [
      {
        company: "Atlas Growth",
        healthScore: 91,
        renewalDate: "Sep 02, 2026",
        risk: "Low",
        nps: "61",
        expansionOpportunity: "High",
        owner: "Marcus Lee",
        detail: "Stakeholder alignment is strong and commercial expansion remains likely this quarter.",
      },
      {
        company: "Northstar Advisory",
        healthScore: 74,
        renewalDate: "Jul 28, 2026",
        risk: "Moderate",
        nps: "42",
        expansionOpportunity: "Medium",
        owner: "Olivia Chen",
        detail: "Relationship quality is positive, but renewal timing pressure requires closer attention this week.",
      },
      {
        company: "Crestpoint",
        healthScore: 86,
        renewalDate: "New rollout account",
        risk: "Low",
        nps: "Pending",
        expansionOpportunity: "High",
        owner: "Sophie Bennett",
        detail: "Implementation readiness is good and stakeholder appetite suggests a larger footprint over time.",
      },
    ],
  },
};
