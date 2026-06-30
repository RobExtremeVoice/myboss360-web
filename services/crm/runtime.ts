type CrmFallbackDecision = {
  hasLiveRecords: boolean;
  nodeEnv?: string;
};

export function shouldUseDevelopmentCrmFallback({
  hasLiveRecords,
  nodeEnv = process.env.NODE_ENV,
}: CrmFallbackDecision): boolean {
  return !hasLiveRecords && nodeEnv !== "production";
}
