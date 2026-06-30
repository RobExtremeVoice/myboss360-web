export const appRoutes = {
  marketing: {
    home: "/",
    pricing: "/#pricing",
    security: "/#security",
    testimonials: "/#testimonials",
    contact: "/#final-cta",
  },
  auth: {
    login: "/login",
    register: "/register",
    forgotPassword: "/forgot-password",
  },
  dashboard: {
    home: "/dashboard",
    crm: "/dashboard/crm",
    projects: "/dashboard/projects",
    tasks: "/dashboard/tasks",
    calendar: "/dashboard/calendar",
    finance: "/dashboard/finance",
    documents: "/dashboard/documents",
    assistant: "/dashboard/ai-assistant",
    reports: "/dashboard/reports",
    settings: "/dashboard/settings",
  },
} as const;

export type RouteGroup = keyof typeof appRoutes;
