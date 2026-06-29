import { appRoutes } from "@/config/routes";

export type NavigationItem = {
  label: string;
  href: string;
  description?: string;
  featureKey?: string;
};

export const marketingNavigation: NavigationItem[] = [
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

export const dashboardNavigation: NavigationItem[] = [
  {
    label: "Workspace",
    href: appRoutes.dashboard.workspace,
    description: "Executive workspace and operating overview.",
  },
  {
    label: "Projects",
    href: appRoutes.dashboard.projects,
    description: "Project and delivery management.",
  },
  {
    label: "CRM",
    href: appRoutes.dashboard.crm,
    description: "Customers, contacts, and deal management.",
  },
  {
    label: "Finance",
    href: appRoutes.dashboard.finance,
    description: "Finance visibility and billing workflows.",
  },
  {
    label: "Calendar",
    href: appRoutes.dashboard.calendar,
    description: "Scheduling and event intelligence.",
  },
  {
    label: "AI Assistant",
    href: appRoutes.dashboard.assistant,
    description: "Embedded AI guidance and recommendations.",
  },
];

export const footerNavigation: NavigationItem[] = [
  {
    label: "Home",
    href: appRoutes.marketing.home,
  },
  {
    label: "Contact",
    href: appRoutes.marketing.contact,
  },
  {
    label: "Sign In",
    href: appRoutes.auth.signIn,
    featureKey: "authentication",
  },
];
