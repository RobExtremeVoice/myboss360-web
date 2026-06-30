import { appRoutes } from "@/config/routes";

export type MarketingNavigationItem = {
  label: string;
  href: string;
  description?: string;
  featureKey?: string;
};

export type DashboardNavigationIcon =
  | "layout-dashboard"
  | "users"
  | "folder-kanban"
  | "check-square"
  | "calendar-days"
  | "wallet"
  | "file-text"
  | "sparkles"
  | "bar-chart-3"
  | "settings";

export type DashboardNavigationItem = {
  label: string;
  href: string;
  description: string;
  icon: DashboardNavigationIcon;
};

export type DashboardNavigationSection = {
  title: string;
  items: DashboardNavigationItem[];
};

export const marketingNavigation: MarketingNavigationItem[] = [
  {
    label: "Platform",
    href: "/#platform",
    description: "Overview of the executive operating system.",
  },
  {
    label: "Workspace",
    href: "/#workspace",
    description: "Preview the leadership workspace experience.",
  },
  {
    label: "Assistant",
    href: "/#assistant",
    description: "Review the AI executive assistant positioning.",
  },
  {
    label: "Security",
    href: appRoutes.marketing.security,
    description: "See privacy and trust positioning.",
  },
  {
    label: "Pricing",
    href: appRoutes.marketing.pricing,
    description: "Review packaging and pricing preview.",
  },
];

export const dashboardNavigationSections: DashboardNavigationSection[] = [
  {
    title: "Overview",
    items: [
      {
        label: "Dashboard",
        href: appRoutes.dashboard.home,
        description: "Executive overview and operating pulse.",
        icon: "layout-dashboard",
      },
    ],
  },
  {
    title: "Operations",
    items: [
      {
        label: "CRM",
        href: appRoutes.dashboard.crm,
        description: "Customer relationships and pipeline management.",
        icon: "users",
      },
      {
        label: "Projects",
        href: appRoutes.dashboard.projects,
        description: "Project execution and delivery tracking.",
        icon: "folder-kanban",
      },
      {
        label: "Tasks",
        href: appRoutes.dashboard.tasks,
        description: "Task ownership and follow-through.",
        icon: "check-square",
      },
      {
        label: "Calendar",
        href: appRoutes.dashboard.calendar,
        description: "Schedule, events, and meeting planning.",
        icon: "calendar-days",
      },
      {
        label: "Finance",
        href: appRoutes.dashboard.finance,
        description: "Financial visibility and billing workflows.",
        icon: "wallet",
      },
      {
        label: "Documents",
        href: appRoutes.dashboard.documents,
        description: "Documents, notes, and shared knowledge.",
        icon: "file-text",
      },
    ],
  },
  {
    title: "Intelligence",
    items: [
      {
        label: "AI Assistant",
        href: appRoutes.dashboard.assistant,
        description: "AI briefings, recommendations, and support.",
        icon: "sparkles",
      },
      {
        label: "Reports",
        href: appRoutes.dashboard.reports,
        description: "Reporting and business performance review.",
        icon: "bar-chart-3",
      },
    ],
  },
  {
    title: "System",
    items: [
      {
        label: "Settings",
        href: appRoutes.dashboard.settings,
        description: "Workspace and account configuration.",
        icon: "settings",
      },
    ],
  },
];

export const footerNavigation: MarketingNavigationItem[] = [
  {
    label: "Home",
    href: appRoutes.marketing.home,
  },
  {
    label: "Contact",
    href: appRoutes.marketing.contact,
  },
  {
    label: "Login",
    href: appRoutes.auth.login,
  },
];
