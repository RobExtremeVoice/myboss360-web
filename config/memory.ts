import type { MemoryType, MemorySource } from '@/types/memory'

export const memoryTypeLabels: Record<MemoryType, string> = {
  user_preference: 'User Preference',
  org_goal: 'Organization Goal',
  workspace_context: 'Workspace Context',
  decision: 'Decision',
  meeting_summary: 'Meeting Summary',
  observation: 'Business Observation',
  executive_note: 'Executive Note',
  ai_insight: 'AI Insight',
  historical_recommendation: 'Historical Recommendation',
  accepted_recommendation: 'Accepted Recommendation',
  rejected_recommendation: 'Rejected Recommendation',
}

export const memorySourceLabels: Record<MemorySource, string> = {
  manual: 'Manual Entry',
  ai_generated: 'AI Generated',
  crm_event: 'CRM Event',
  integration: 'Integration Event',
  system: 'System',
}

export const memoryConfig = {
  maxContentLength: 10_000,
  defaultPageSize: 20,
  maxPinnedMemories: 50,
  // Default TTL in days for time-sensitive memory types (undefined = no expiry)
  expirationDefaults: {
    ai_insight: 90,
    historical_recommendation: 180,
    meeting_summary: 365,
  } satisfies Partial<Record<MemoryType, number>>,
}

export const GLOBAL_MEMORY_TYPES: MemoryType[] = [
  'org_goal',
  'workspace_context',
  'executive_note',
]

export const ENTITY_MEMORY_TYPES: MemoryType[] = [
  'decision',
  'meeting_summary',
  'observation',
  'ai_insight',
]
