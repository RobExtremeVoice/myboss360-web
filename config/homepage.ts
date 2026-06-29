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
  supportingNote: string;
  primaryCta: HomepageCta;
  secondaryCta: HomepageCta;
  metrics: HeroMetric[];
  insights: HeroInsight[];
};

export type TrustedByContent = {
  sectionId: string;
  eyebrow: string;
  title: string;
  description: string;
  companies: string[];
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

export type CapabilityIcon =
  | "briefcase"
  | "bot"
  | "chart"
  | "folder"
  | "calendar"
  | "wallet";

export type PlatformCapability = {
  title: string;
  description: string;
  icon: CapabilityIcon;
  outcome: string;
};

export type PlatformCapabilitiesContent = {
  sectionId: string;
  eyebrow: string;
  title: string;
  description: string;
  capabilities: PlatformCapability[];
};

export type WorkspaceKpi = {
  title: string;
  value: string;
  trend: string;
  detail: string;
};

export type WorkspaceBoardColumn = {
  title: string;
  count: string;
  items: string[];
};

export type WorkspaceAgendaItem = {
  time: string;
  title: string;
  detail: string;
};

export type WorkspaceRecommendation = {
  title: string;
  detail: string;
  priority: string;
};

export type WorkspacePreviewContent = {
  sectionId: string;
  eyebrow: string;
  title: string;
  description: string;
  kpis: WorkspaceKpi[];
  boardColumns: WorkspaceBoardColumn[];
  agenda: WorkspaceAgendaItem[];
  recommendations: WorkspaceRecommendation[];
  promptChips: string[];
};

export type AssistantFeature = {
  title: string;
  description: string;
};

export type AssistantPanel = {
  title: string;
  detail: string;
};

export type AiExecutiveAssistantContent = {
  sectionId: string;
  eyebrow: string;
  title: string;
  description: string;
  features: AssistantFeature[];
  panels: AssistantPanel[];
  promptChips: string[];
};

export type SecurityItem = {
  title: string;
  description: string;
  detail: string;
};

export type SecurityPrivacyContent = {
  sectionId: string;
  eyebrow: string;
  title: string;
  description: string;
  items: SecurityItem[];
};

export type Testimonial = {
  quote: string;
  name: string;
  role: string;
  company: string;
};

export type TestimonialsContent = {
  sectionId: string;
  eyebrow: string;
  title: string;
  description: string;
  items: Testimonial[];
};

export type PricingFeature = {
  label: string;
};

export type PricingPlan = {
  name: string;
  price: string;
  cadence: string;
  description: string;
  featured: boolean;
  badge?: string;
  features: PricingFeature[];
  cta: HomepageCta;
};

export type PricingPreviewContent = {
  sectionId: string;
  eyebrow: string;
  title: string;
  description: string;
  plans: PricingPlan[];
  footnote: string;
};

export type CtaSectionContent = {
  sectionId: string;
  eyebrow: string;
  title: string;
  description: string;
  primaryCta: HomepageCta;
  secondaryCta: HomepageCta;
};

export type FooterLinkGroup = {
  title: string;
  links: HomepageCta[];
};

export type FooterContent = {
  sectionId: string;
  description: string;
  linkGroups: FooterLinkGroup[];
  copyright: string;
};

export type HomepageContent = {
  brand: {
    name: string;
    tagline: string;
  };
  navigation: NavigationItem[];
  hero: HeroContent;
  trustedBy: TrustedByContent;
  platformPillars: PlatformPillarsContent;
  platformCapabilities: PlatformCapabilitiesContent;
  workspacePreview: WorkspacePreviewContent;
  aiExecutiveAssistant: AiExecutiveAssistantContent;
  securityPrivacy: SecurityPrivacyContent;
  testimonials: TestimonialsContent;
  pricingPreview: PricingPreviewContent;
  cta: CtaSectionContent;
  footer: FooterContent;
};

export const homepageContent: HomepageContent = {
  brand: {
    name: "MyBoss360",
    tagline: "Executive operating system",
  },
  navigation: [
    { label: "Platform", href: "#platform" },
    { label: "Workspace", href: "#workspace" },
    { label: "Assistant", href: "#assistant" },
    { label: "Security", href: "#security" },
    { label: "Pricing", href: "#pricing" },
  ],
  hero: {
    eyebrow: "AI-first business operating system",
    title: "The executive system for running a modern business with clarity.",
    description:
      "MyBoss360 unifies revenue, projects, team execution, documents, calendar, and AI guidance into one premium workspace designed for founders, operators, and leadership teams.",
    supportingNote:
      "Built for businesses that have outgrown disconnected tools and need one intelligent command layer.",
    primaryCta: {
      label: "Book a Private Demo",
      href: "#final-cta",
    },
    secondaryCta: {
      label: "See the Workspace",
      href: "#workspace",
    },
    metrics: [
      {
        value: "360°",
        label: "leadership visibility across pipeline, delivery, team health, and cash posture",
      },
      {
        value: "< 5 min",
        label: "to review the daily brief, blockers, and recommended decisions",
      },
      {
        value: "1 system",
        label: "for CRM, work execution, collaboration, finance context, and AI operations",
      },
    ],
    insights: [
      {
        label: "Revenue momentum",
        detail: "Three opportunities are ready for executive review, with forecast confidence holding above target.",
      },
      {
        label: "Execution pressure",
        detail: "One launch dependency needs reassignment before Thursday to protect delivery timing.",
      },
      {
        label: "AI briefing",
        detail: "Leadership notes, customer signals, and project blockers are already synthesized into one decision-ready summary.",
      },
    ],
  },
  trustedBy: {
    sectionId: "trusted",
    eyebrow: "Trusted by growing businesses",
    title: "Chosen by ambitious operators who need calm at scale.",
    description:
      "Built for founder-led companies, consultancies, agencies, and modern service businesses that want stronger operating discipline without enterprise overhead.",
    companies: [
      "Northstar Advisory",
      "Atlas Growth",
      "Summit Studio",
      "Meridian Ops",
      "Crestpoint Labs",
      "Forge Collective",
    ],
  },
  platformPillars: {
    sectionId: "platform",
    eyebrow: "Executive platform pillars",
    title: "Leadership control without fragmented systems.",
    description:
      "MyBoss360 is positioned around focus, coordination, and intelligent guidance so leaders can operate from signal instead of noise.",
    pillars: [
      {
        title: "Unified business layer",
        description:
          "Keep customer activity, delivery, meetings, tasks, and operating context in one connected source of truth.",
        icon: "layers",
        accent: "Structured operations",
      },
      {
        title: "Context-aware intelligence",
        description:
          "Turn day-to-day activity into practical summaries, escalations, and next-best actions grounded in real business context.",
        icon: "sparkles",
        accent: "Trusted AI",
      },
      {
        title: "Executive governance",
        description:
          "See ownership, approvals, and risk clearly across the company without slowing teams down.",
        icon: "shield",
        accent: "Decision control",
      },
      {
        title: "Compounding clarity",
        description:
          "Spot patterns across growth, delivery, and team performance before they become operational drag.",
        icon: "chart",
        accent: "Strategic visibility",
      },
    ],
  },
  platformCapabilities: {
    sectionId: "capabilities",
    eyebrow: "Platform capabilities",
    title: "One operating system across the functions leaders review every week.",
    description:
      "The homepage should communicate breadth without feeling cluttered, so the platform capabilities focus on outcomes rather than feature overload.",
    capabilities: [
      {
        title: "CRM and revenue orchestration",
        description:
          "Track customer momentum, handoffs, renewals, and decisions from one executive view.",
        icon: "briefcase",
        outcome: "See revenue posture without jumping between tools.",
      },
      {
        title: "AI-guided operating briefings",
        description:
          "Summaries, risks, and next actions are generated from the actual state of work across the business.",
        icon: "bot",
        outcome: "Start meetings with context instead of status gathering.",
      },
      {
        title: "Projects and execution visibility",
        description:
          "Monitor delivery, milestones, ownership, and blockers with clean operational structure.",
        icon: "folder",
        outcome: "Know what is slipping before customers feel it.",
      },
      {
        title: "Calendar and meeting intelligence",
        description:
          "Connect schedules, decisions, and follow-through so important conversations lead to accountable action.",
        icon: "calendar",
        outcome: "Turn meetings into visible execution automatically.",
      },
      {
        title: "Business performance monitoring",
        description:
          "Keep an executive pulse on forecast, workload, margins, and team readiness in one place.",
        icon: "chart",
        outcome: "Review the business from signal, not spreadsheets.",
      },
      {
        title: "Financial context for operators",
        description:
          "Surface cash posture, billing signals, and priority finance insights directly inside operating workflows.",
        icon: "wallet",
        outcome: "Balance growth decisions with real financial visibility.",
      },
    ],
  },
  workspacePreview: {
    sectionId: "workspace",
    eyebrow: "Workspace preview",
    title: "A real operating workspace for leaders, not a collection of placeholder cards.",
    description:
      "This preview is a marketing representation of the MyBoss360 experience: KPI visibility at the top, operational lanes in the center, and an AI advisor connected to the full context of the business.",
    kpis: [
      {
        title: "Revenue",
        value: "$2.84M",
        trend: "+12.4%",
        detail: "Quarterly forecast pacing ahead of plan with two approvals pending.",
      },
      {
        title: "Active Projects",
        value: "24",
        trend: "5 at risk",
        detail: "Cross-functional delivery portfolio with launch and onboarding milestones.",
      },
      {
        title: "Team Performance",
        value: "91%",
        trend: "+6 pts",
        detail: "Execution score derived from follow-through, delivery timing, and blocker resolution.",
      },
      {
        title: "AI Recommendations",
        value: "07",
        trend: "3 urgent",
        detail: "Actionable suggestions prioritized from revenue, project, and team signals.",
      },
    ],
    boardColumns: [
      {
        title: "Priority reviews",
        count: "03",
        items: [
          "Approve enterprise pricing exception for Crestpoint renewal.",
          "Confirm delivery owner for the Northstar onboarding milestone.",
          "Finalize Q3 hiring plan before Friday leadership sync.",
        ],
      },
      {
        title: "In motion",
        count: "08",
        items: [
          "Customer launch sequence is on track with one design dependency.",
          "Consulting retainer expansion brief prepared for tomorrow.",
          "Finance reconciliation is ready for executive sign-off.",
        ],
      },
      {
        title: "Needs attention",
        count: "02",
        items: [
          "Margin softness detected in one service line after recent discounting.",
          "One renewal account is missing an updated success plan.",
        ],
      },
    ],
    agenda: [
      {
        time: "08:30",
        title: "Executive briefing",
        detail: "AI-generated summary of pipeline, project risk, collections timing, and key decisions.",
      },
      {
        time: "10:00",
        title: "Leadership operating review",
        detail: "Agenda preloaded with ownership changes, escalations, and decision notes.",
      },
      {
        time: "14:00",
        title: "Customer growth checkpoint",
        detail: "Account context, recent activity, and revenue implications prepared automatically.",
      },
    ],
    recommendations: [
      {
        title: "Protect margin on the Atlas renewal",
        detail: "Pricing concessions are trending above target. Review scope and approval guardrails.",
        priority: "High priority",
      },
      {
        title: "Reassign one launch dependency",
        detail: "Design review timing is likely to affect delivery. Shift ownership before Thursday.",
        priority: "Time sensitive",
      },
      {
        title: "Follow up with two hiring finalists",
        detail: "The recruiting lane is healthy, but offer momentum slows after 48 hours.",
        priority: "Recommended",
      },
    ],
    promptChips: [
      "What changed since yesterday?",
      "Summarize project risks for leadership.",
      "Where do we need an executive decision this week?",
    ],
  },
  aiExecutiveAssistant: {
    sectionId: "assistant",
    eyebrow: "AI Executive Assistant",
    title: "A strategic assistant that understands the full operating picture.",
    description:
      "Instead of another chatbot, MyBoss360 positions AI as an embedded executive partner that can brief leaders, expose risk, and recommend action from live business context.",
    features: [
      {
        title: "Daily executive briefings",
        description:
          "Generate a decision-ready morning view across revenue, delivery, finance, and team momentum.",
      },
      {
        title: "Meeting intelligence",
        description:
          "Turn calendar events, notes, and open tasks into structured agendas and follow-through.",
      },
      {
        title: "Risk and recommendation engine",
        description:
          "Surface operational issues early and pair them with the most relevant context and next step.",
      },
    ],
    panels: [
      {
        title: "Brief me on this week",
        detail: "The assistant combines pipeline confidence, project load, and team signals into one concise leadership update.",
      },
      {
        title: "Prepare the decision room",
        detail: "Open items, dependencies, account notes, and financial signals are organized before the meeting begins.",
      },
      {
        title: "Follow through after the meeting",
        detail: "Action items, owners, and due dates are carried back into the operating system automatically.",
      },
    ],
    promptChips: [
      "What should I review before the board update?",
      "Which accounts need my attention?",
      "Draft the leadership summary for today.",
      "Show blockers affecting revenue this month.",
    ],
  },
  securityPrivacy: {
    sectionId: "security",
    eyebrow: "Security & privacy",
    title: "Built with the trust standards leadership expects.",
    description:
      "The brand expression stays premium and calm, while the messaging reinforces that sensitive company context deserves deliberate governance and privacy controls.",
    items: [
      {
        title: "Role-based visibility",
        description:
          "Keep leadership context, customer records, and sensitive operations data visible to the right people only.",
        detail: "Structured access supports high-trust collaboration without exposing unnecessary data.",
      },
      {
        title: "Private by design",
        description:
          "Operational notes, decision logs, and AI context stay organized inside a deliberate workspace architecture.",
        detail: "The system is designed to reduce data sprawl and keep important business knowledge contained.",
      },
      {
        title: "Audit-friendly workflows",
        description:
          "Approvals, assignments, and key decisions can be captured in one traceable operating flow.",
        detail: "That creates clearer operational accountability for teams that are scaling fast.",
      },
    ],
  },
  testimonials: {
    sectionId: "testimonials",
    eyebrow: "Testimonials",
    title: "Teams want clarity. Leaders want confidence. MyBoss360 is built for both.",
    description:
      "These quotes are positioned to sound like early customer validation for a premium B2B platform without overstating maturity.",
    items: [
      {
        quote:
          "MyBoss360 feels like the first system that actually understands how our leadership team works across growth, delivery, and accountability.",
        name: "Elena Ramirez",
        role: "Founder & CEO",
        company: "Northstar Advisory",
      },
      {
        quote:
          "The AI brief gives us a faster way to align before leadership meetings. We spend less time gathering context and more time deciding.",
        name: "Marcus Lee",
        role: "Managing Director",
        company: "Atlas Growth",
      },
      {
        quote:
          "It brings together the operating signals we normally piece together manually. The experience feels calm, premium, and immediately useful.",
        name: "Danielle Brooks",
        role: "COO",
        company: "Summit Studio",
      },
    ],
  },
  pricingPreview: {
    sectionId: "pricing",
    eyebrow: "Pricing preview",
    title: "Simple packaging for growing companies and executive teams.",
    description:
      "Keep the pricing area intentionally light at this stage: enough structure to communicate positioning and encourage demos without locking in full commercial detail.",
    plans: [
      {
        name: "Growth",
        price: "$299",
        cadence: "/month",
        description:
          "For founder-led teams that need one operating workspace for customers, work, and weekly leadership rhythm.",
        featured: false,
        features: [
          { label: "CRM and project workspace" },
          { label: "Shared meeting and task coordination" },
          { label: "Core executive reporting views" },
          { label: "AI briefing foundation" },
        ],
        cta: {
          label: "Talk to Sales",
          href: "#final-cta",
        },
      },
      {
        name: "Executive",
        price: "Custom",
        cadence: "",
        description:
          "For scaling businesses that want a tailored operating layer, advanced AI workflows, and leadership-grade governance.",
        featured: true,
        badge: "Most aligned",
        features: [
          { label: "Everything in Growth" },
          { label: "Advanced AI executive assistant" },
          { label: "Expanded workflow and approval controls" },
          { label: "Premium onboarding and strategic support" },
        ],
        cta: {
          label: "Book a Private Demo",
          href: "#final-cta",
        },
      },
    ],
    footnote:
      "Pricing is presented as an early positioning preview and can evolve with product scope and implementation needs.",
  },
  cta: {
    sectionId: "final-cta",
    eyebrow: "Final call to action",
    title: "Run the business from one intelligent operating system.",
    description:
      "MyBoss360 is being shaped for operators who want premium clarity, tighter execution, and an AI-assisted command center for the company they are building.",
    primaryCta: {
      label: "Request a Demo",
      href: "#top",
    },
    secondaryCta: {
      label: "Review Pricing",
      href: "#pricing",
    },
  },
  footer: {
    sectionId: "footer",
    description:
      "MyBoss360 is the executive operating system for ambitious businesses that want clarity across revenue, execution, finance, collaboration, and AI decision support.",
    linkGroups: [
      {
        title: "Platform",
        links: [
          { label: "Overview", href: "#platform" },
          { label: "Workspace", href: "#workspace" },
          { label: "AI Assistant", href: "#assistant" },
        ],
      },
      {
        title: "Company",
        links: [
          { label: "Security", href: "#security" },
          { label: "Testimonials", href: "#testimonials" },
          { label: "Pricing", href: "#pricing" },
        ],
      },
      {
        title: "Contact",
        links: [
          { label: "Book Demo", href: "#final-cta" },
          { label: "Back to Top", href: "#top" },
        ],
      },
    ],
    copyright: "© 2026 MyBoss360. All rights reserved.",
  },
};
