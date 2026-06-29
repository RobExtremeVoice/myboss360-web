export type NavigationItem = {
  label: string;
  href: `#${string}`;
};

export type HomepageCta = {
  label: string;
  href: `#${string}`;
};

export type HeroMetric = {
  value: string;
  label: string;
};

export type HeroInsight = {
  label: string;
  detail: string;
};

export type HeroContent = {
  eyebrow: string;
  title: string;
  description: string;
  primaryCta: HomepageCta;
  secondaryCta: HomepageCta;
  metrics: HeroMetric[];
  insights: HeroInsight[];
};

export type PillarIcon = "sparkles" | "layers" | "shield" | "chart";

export type PlatformPillar = {
  title: string;
  description: string;
  icon: PillarIcon;
  accent: string;
};

export type PlatformPillarsContent = {
  sectionId: string;
  eyebrow: string;
  title: string;
  description: string;
  pillars: PlatformPillar[];
};

export type WorkspaceCard = {
  title: string;
  value: string;
  detail: string;
};

export type WorkspaceListItem = {
  title: string;
  detail: string;
};

export type WorkspacePreviewContent = {
  sectionId: string;
  eyebrow: string;
  title: string;
  description: string;
  summaryCards: WorkspaceCard[];
  executionLanes: WorkspaceListItem[];
  assistantFeed: WorkspaceListItem[];
  advisorPrompts: string[];
};

export type CtaSectionContent = {
  sectionId: string;
  eyebrow: string;
  title: string;
  description: string;
  primaryCta: HomepageCta;
  secondaryCta: HomepageCta;
};

export type HomepageContent = {
  brand: {
    name: string;
    tagline: string;
  };
  navigation: NavigationItem[];
  hero: HeroContent;
  platformPillars: PlatformPillarsContent;
  workspacePreview: WorkspacePreviewContent;
  cta: CtaSectionContent;
};

export const homepageContent: HomepageContent = {
  brand: {
    name: "MyBoss360",
    tagline: "Executive operating system",
  },
  navigation: [
    { label: "Platform", href: "#platform" },
    { label: "Workspace", href: "#workspace" },
    { label: "Contact", href: "#contact" },
  ],
  hero: {
    eyebrow: "AI-first business operating system",
    title: "Run your company from one calm, intelligent command center.",
    description:
      "MyBoss360 brings CRM, execution, finance, documents, calendar, and AI guidance into a single premium workspace built for founders, executives, and high-trust teams.",
    primaryCta: {
      label: "Book a Private Demo",
      href: "#contact",
    },
    secondaryCta: {
      label: "Explore the Platform",
      href: "#platform",
    },
    metrics: [
      { value: "360°", label: "visibility across pipeline, execution, and financial health" },
      { value: "1", label: "workspace for leadership, operations, and AI decision support" },
      { value: "24/7", label: "executive context, briefings, and next-best-action intelligence" },
    ],
    insights: [
      {
        label: "Morning brief",
        detail: "Revenue momentum is up 14% week over week while delivery risk stays contained.",
      },
      {
        label: "Executive pulse",
        detail: "Three priorities need approval today: hiring, pricing, and renewal strategy.",
      },
      {
        label: "Team rhythm",
        detail: "Projects, meetings, notes, and follow-through stay aligned in one shared view.",
      },
    ],
  },
  platformPillars: {
    sectionId: "platform",
    eyebrow: "Built for modern operators",
    title: "Everything leadership needs, without the operational noise.",
    description:
      "The first MyBoss360 homepage positions the platform around focus, alignment, and high-quality executive control instead of feature sprawl.",
    pillars: [
      {
        title: "Unified operating layer",
        description:
          "Bring CRM, tasks, calendar, documents, finance, and projects into one structured system of record.",
        icon: "layers",
        accent: "Neutral infrastructure",
      },
      {
        title: "AI that understands context",
        description:
          "Turn scattered updates into clear guidance, summaries, and next actions that leadership can trust.",
        icon: "sparkles",
        accent: "Guided intelligence",
      },
      {
        title: "Control without complexity",
        description:
          "Keep approvals, ownership, and execution visible with a clean workspace designed for fast decisions.",
        icon: "shield",
        accent: "Executive governance",
      },
      {
        title: "Clarity that compounds",
        description:
          "See the signals that matter across revenue, delivery, operations, and team momentum before they become issues.",
        icon: "chart",
        accent: "Strategic signal",
      },
    ],
  },
  workspacePreview: {
    sectionId: "workspace",
    eyebrow: "Workspace preview",
    title: "A focused command center for the week ahead.",
    description:
      "This preview is intentionally not a dashboard product yet. It is a marketing vignette of the executive experience MyBoss360 is designed to deliver.",
    summaryCards: [
      {
        title: "Pipeline confidence",
        value: "$1.84M",
        detail: "Weighted opportunities with two decisions pending this week.",
      },
      {
        title: "Execution readiness",
        value: "87%",
        detail: "Priority initiatives on track across launches, hiring, and onboarding.",
      },
      {
        title: "Cash visibility",
        value: "9.2 mo",
        detail: "Projected runway with current burn and collections timing.",
      },
    ],
    executionLanes: [
      {
        title: "Leadership priorities",
        detail: "Approve pricing model, finalize VP search, and lock Q4 operating plan.",
      },
      {
        title: "Client delivery",
        detail: "Flag one renewal risk, two launch dependencies, and one overdue document review.",
      },
      {
        title: "Team follow-through",
        detail: "Convert meeting outcomes into assigned tasks, dates, and owner visibility.",
      },
    ],
    assistantFeed: [
      {
        title: "AI brief",
        detail: "Revenue trajectory is healthy, but margin pressure is forming in two service lines.",
      },
      {
        title: "Recommended action",
        detail: "Review pricing exceptions, then schedule a 20-minute leadership decision block.",
      },
      {
        title: "Prepared context",
        detail: "Customer notes, task blockers, and finance signals are already synthesized for the conversation.",
      },
    ],
    advisorPrompts: [
      "What changed since yesterday?",
      "Show me risks across active projects.",
      "Summarize follow-ups after the leadership meeting.",
    ],
  },
  cta: {
    sectionId: "contact",
    eyebrow: "Early access",
    title: "Bring calm, visibility, and better decisions to the center of your business.",
    description:
      "MyBoss360 is being shaped for leaders who want one intelligent operating system instead of another collection of tools.",
    primaryCta: {
      label: "Request a Demo",
      href: "#top",
    },
    secondaryCta: {
      label: "Review the Platform",
      href: "#platform",
    },
  },
};
