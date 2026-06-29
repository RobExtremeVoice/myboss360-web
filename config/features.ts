export const featureFlags = {
  marketingHomepage: true,
  authentication: false,
  dashboard: false,
  crm: false,
  finance: false,
  calendar: false,
  aiAssistant: false,
  notifications: false,
  multiWorkspace: false,
} as const;

export type FeatureKey = keyof typeof featureFlags;
