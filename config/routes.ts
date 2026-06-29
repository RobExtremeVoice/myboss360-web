export const appRoutes = {
  marketing: {
    home: "/",
    pricing: "/#pricing",
    security: "/#security",
    testimonials: "/#testimonials",
    contact: "/#final-cta",
  },
  auth: {
    signIn: "/sign-in",
    signUp: "/sign-up",
    forgotPassword: "/forgot-password",
  },
  dashboard: {
    home: "/app",
    workspace: "/app/workspace",
    projects: "/app/projects",
    tasks: "/app/tasks",
    crm: "/app/crm",
    finance: "/app/finance",
    calendar: "/app/calendar",
    assistant: "/app/assistant",
    settings: "/app/settings",
  },
} as const;

export type RouteGroup = keyof typeof appRoutes;
