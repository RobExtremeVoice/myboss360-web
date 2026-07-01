export type PeopleSource = 'crm' | 'gmail' | 'calendar'
export type RelationshipType = 'champion' | 'decision_maker' | 'influencer' | 'collaborator' | 'contact'
export type InteractionType = 'email_sent' | 'email_received' | 'meeting' | 'crm_activity'
export type PeopleSignalType =
  | 'going_cold'
  | 'champion_detected'
  | 'new_relationship'
  | 'decision_maker_identified'
  | 'awaiting_reply'
  | 'follow_up_overdue'
export type PeopleSignalSeverity = 'info' | 'warning' | 'critical'

export interface PersonProfile {
  id: string
  workspaceId: string
  organizationId: string
  email: string
  fullName: string | null
  jobTitle: string | null
  companyName: string | null
  companyId: string | null
  crmContactId: string | null
  gmailContactId: string | null
  sources: PeopleSource[]
  relationshipStrength: number
  engagementScore: number
  influenceScore: number
  isChampion: boolean
  isDecisionMaker: boolean
  isStale: boolean
  isNewRelationship: boolean
  emailCount: number
  meetingCount: number
  lastInteractionAt: string | null
  firstInteractionAt: string | null
  awaitingReply: boolean
  followUpRequired: boolean
  followUpDue: string | null
  metadata: Record<string, unknown>
  lastScoredAt: string | null
  createdAt: string
  updatedAt: string
}

export interface PersonRelationship {
  id: string
  workspaceId: string
  organizationId: string
  personProfileId: string
  relationshipType: RelationshipType
  relationshipStrength: number
  source: PeopleSource
  sourceId: string | null
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface PersonInteraction {
  id: string
  workspaceId: string
  organizationId: string
  personProfileId: string
  interactionType: InteractionType
  source: PeopleSource
  sourceId: string | null
  direction: 'inbound' | 'outbound' | 'bidirectional' | null
  subject: string | null
  occurredAt: string
  metadata: Record<string, unknown>
  createdAt: string
}

export interface PersonSignal {
  id: string
  workspaceId: string
  organizationId: string
  personProfileId: string
  signalType: PeopleSignalType
  severity: PeopleSignalSeverity
  title: string
  description: string | null
  resolvedAt: string | null
  metadata: Record<string, unknown>
  createdAt: string
}

export interface PersonScore {
  id: string
  workspaceId: string
  personProfileId: string
  relationshipStrength: number
  engagementScore: number
  influenceScore: number
  scoredAt: string
}

export interface ListPeopleOptions {
  isChampion?: boolean
  isDecisionMaker?: boolean
  isStale?: boolean
  isNewRelationship?: boolean
  awaitingReply?: boolean
  followUpRequired?: boolean
  minRelationshipStrength?: number
  limit?: number
  offset?: number
  orderBy?: 'relationship_strength' | 'engagement_score' | 'last_interaction_at'
}

export interface PeopleInsights {
  totalProfiles: number
  champions: PersonProfile[]
  decisionMakers: PersonProfile[]
  topRelationships: PersonProfile[]
  staleRelationships: PersonProfile[]
  newRelationships: PersonProfile[]
  awaitingReply: PersonProfile[]
  needingFollowUp: PersonProfile[]
  sourceCounts: { crm: number; gmail: number; calendar: number }
}

// Merged source data fed into the engine for a single person
export interface PersonMergeInput {
  email: string
  fullName: string | null
  jobTitle: string | null
  companyName: string | null
  companyId: string | null
  crmContactId: string | null
  gmailContactId: string | null
  sources: PeopleSource[]
  emailCount: number
  meetingCount: number
  inboundEmailCount: number
  outboundEmailCount: number
  lastInteractionAt: string | null
  firstInteractionAt: string | null
  awaitingReply: boolean
  hasActiveDeal: boolean
}
