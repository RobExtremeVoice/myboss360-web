import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { PersonMergeInput, PersonProfile, PeopleSource } from '@/types/people'
import { peopleConfig } from '@/config/people'
import { clamp, daysSince } from '@/lib/dates'

type ContactRow = Database['public']['Tables']['contacts']['Row']
type GmailContactRow = Database['public']['Tables']['gmail_contacts']['Row']
type CalendarEventRow = Database['public']['Tables']['calendar_events']['Row']
type DealRow = Database['public']['Tables']['deals']['Row']
type GmailThreadRow = Database['public']['Tables']['gmail_threads']['Row']

const STALE_MS = peopleConfig.staleRelationshipDays * 24 * 60 * 60 * 1000
const NEW_MS = peopleConfig.newRelationshipDays * 24 * 60 * 60 * 1000

export function computeRelationshipStrength(input: PersonMergeInput): number {
  const days = daysSince(input.lastInteractionAt)
  const recency = days === null ? 0 : days < 7 ? 25 : days < 30 ? 15 : days < 90 ? 5 : 0
  const reciprocity = input.inboundEmailCount > 0 && input.outboundEmailCount > 0 ? 20 : 0
  const frequency = Math.min(input.emailCount * 2.5, 25)
  const meetings = Math.min(input.meetingCount * 10, 20)
  const deal = input.hasActiveDeal ? 10 : 0
  return clamp(recency + reciprocity + frequency + meetings + deal)
}

export function computeEngagementScore(input: PersonMergeInput): number {
  const emailFreq = Math.min(input.emailCount * 5, 50)
  const meetingFreq = Math.min(input.meetingCount * 10, 30)
  const days = daysSince(input.lastInteractionAt)
  const recencyBonus = days !== null && days < 7 ? 20 : 0
  return clamp(emailFreq + meetingFreq + recencyBonus)
}

export function computeInfluenceScore(input: PersonMergeInput): number {
  const title = (input.jobTitle ?? '').toLowerCase()
  let score = 20

  const csuite = ['ceo', 'cto', 'cfo', 'coo', 'cso', 'cmo', 'cpo', 'president', 'founder', 'co-founder', 'owner', 'chief']
  const senior = ['vp', 'vice president', 'director', 'head of', 'partner', 'principal', 'managing director']
  const mid = ['manager', 'lead', 'supervisor']

  if (csuite.some((kw) => title.includes(kw))) {
    score += 40
  } else if (senior.some((kw) => title.includes(kw))) {
    score += 25
  } else if (mid.some((kw) => title.includes(kw))) {
    score += 10
  }

  if (input.hasActiveDeal) score += 20
  score += Math.min(input.emailCount * 2, 20)
  return clamp(score)
}

export function isDecisionMaker(jobTitle: string | null): boolean {
  if (!jobTitle) return false
  const lower = jobTitle.toLowerCase()
  return peopleConfig.decisionMakerTitleKeywords.some((kw) => lower.includes(kw))
}

export function isChampion(
  relationshipStrength: number,
  engagementScore: number,
  lastInteractionAt: string | null
): boolean {
  if (relationshipStrength < peopleConfig.championMinRelationshipStrength) return false
  if (engagementScore < peopleConfig.championMinEngagementScore) return false
  const days = daysSince(lastInteractionAt)
  return days !== null && days <= 30
}

function buildProfile(
  input: PersonMergeInput,
  workspaceId: string,
  organizationId: string
): Omit<PersonProfile, 'id' | 'createdAt' | 'updatedAt'> {
  const relationshipStrength = computeRelationshipStrength(input)
  const engagementScore = computeEngagementScore(input)
  const influenceScore = computeInfluenceScore(input)

  const now = Date.now()
  const lastMs = input.lastInteractionAt ? new Date(input.lastInteractionAt).getTime() : null
  const firstMs = input.firstInteractionAt ? new Date(input.firstInteractionAt).getTime() : null

  const isStale =
    lastMs !== null && now - lastMs > STALE_MS && (input.emailCount > 0 || input.meetingCount > 0)
  const isNewRelationship = firstMs !== null && now - firstMs < NEW_MS

  return {
    workspaceId,
    organizationId,
    email: input.email,
    fullName: input.fullName,
    jobTitle: input.jobTitle,
    companyName: input.companyName,
    companyId: input.companyId,
    crmContactId: input.crmContactId,
    gmailContactId: input.gmailContactId,
    sources: input.sources,
    relationshipStrength,
    engagementScore,
    influenceScore,
    isChampion: isChampion(relationshipStrength, engagementScore, input.lastInteractionAt),
    isDecisionMaker: isDecisionMaker(input.jobTitle),
    isStale,
    isNewRelationship,
    emailCount: input.emailCount,
    meetingCount: input.meetingCount,
    lastInteractionAt: input.lastInteractionAt,
    firstInteractionAt: input.firstInteractionAt,
    awaitingReply: input.awaitingReply,
    followUpRequired: false,
    followUpDue: null,
    metadata: {},
    lastScoredAt: new Date().toISOString(),
  }
}

// Merges CRM contacts, Gmail contacts, and Calendar attendees into PersonMergeInput records.
// Deduplication key: email (case-insensitive).
function mergeSourceData(
  contacts: ContactRow[],
  gmailContacts: GmailContactRow[],
  calendarEvents: CalendarEventRow[],
  activeDeals: DealRow[],
  awaitingThreads: GmailThreadRow[]
): Map<string, PersonMergeInput> {
  const map = new Map<string, PersonMergeInput>()

  const activeDealContactIds = new Set(activeDeals.map((d) => d.contact_id).filter(Boolean))

  // Emails that have a thread awaiting our reply
  const awaitingEmails = new Set(
    awaitingThreads.flatMap((t) => t.participant_emails.map((e) => e.toLowerCase()))
  )

  function getOrCreate(email: string): PersonMergeInput {
    const key = email.toLowerCase()
    if (!map.has(key)) {
      map.set(key, {
        email: key,
        fullName: null,
        jobTitle: null,
        companyName: null,
        companyId: null,
        crmContactId: null,
        gmailContactId: null,
        sources: [],
        emailCount: 0,
        meetingCount: 0,
        inboundEmailCount: 0,
        outboundEmailCount: 0,
        lastInteractionAt: null,
        firstInteractionAt: null,
        awaitingReply: false,
        hasActiveDeal: false,
      })
    }
    return map.get(key)!
  }

  // CRM contacts (highest priority for name/title)
  for (const c of contacts) {
    if (!c.email) continue
    const p = getOrCreate(c.email)
    p.fullName ??= [c.first_name, c.last_name].filter(Boolean).join(' ') || null
    p.jobTitle ??= c.job_title
    p.companyId ??= c.company_id
    p.crmContactId ??= c.id
    if (!p.sources.includes('crm')) p.sources.push('crm')
    if (activeDealContactIds.has(c.id)) p.hasActiveDeal = true
  }

  // Gmail contacts (email frequency and recency)
  for (const g of gmailContacts) {
    const p = getOrCreate(g.email)
    // Only fill name if CRM didn't provide it
    p.fullName ??= g.display_name
    p.companyName ??= g.organization
    p.gmailContactId ??= g.id
    if (!p.sources.includes('gmail')) p.sources.push('gmail' as PeopleSource)
    p.emailCount += g.message_count

    // Gmail inbound = messages where from_email is the contact (approximated by message_count)
    p.inboundEmailCount += g.message_count

    // Track interaction dates
    const seen = g.last_seen_at
    const first = g.first_seen_at
    if (!p.lastInteractionAt || seen > p.lastInteractionAt) p.lastInteractionAt = seen
    if (!p.firstInteractionAt || first < p.firstInteractionAt) p.firstInteractionAt = first

    p.awaitingReply = p.awaitingReply || awaitingEmails.has(g.email.toLowerCase())
  }

  // Calendar events (meeting count via attendee membership)
  for (const evt of calendarEvents) {
    for (const attendeeEmail of evt.attendees) {
      const p = getOrCreate(attendeeEmail)
      if (!p.sources.includes('calendar')) p.sources.push('calendar' as PeopleSource)
      p.meetingCount += 1
      const evtStart = evt.start_at
      if (!p.lastInteractionAt || evtStart > p.lastInteractionAt) p.lastInteractionAt = evtStart
      if (!p.firstInteractionAt || evtStart < p.firstInteractionAt) p.firstInteractionAt = evtStart
    }
  }

  return map
}

// Fetches source data and returns scored PersonProfile[] (in memory, no DB write).
export async function buildPeopleProfiles(
  db: SupabaseClient<Database>,
  workspaceId: string,
  organizationId: string,
  userEmail: string | null
): Promise<PersonProfile[]> {
  const windowStart = new Date(
    Date.now() - peopleConfig.scoringWindowDays * 24 * 60 * 60 * 1000
  ).toISOString()

  const [contacts, gmailContacts, calendarEvents, activeDeals, awaitingThreads] = await Promise.all([
    db
      .from('contacts')
      .select('*')
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null)
      .not('email', 'is', null)
      .then(({ data }) => (data ?? []) as ContactRow[]),

    db
      .from('gmail_contacts')
      .select('*')
      .eq('workspace_id', workspaceId)
      .gt('message_count', 0)
      .then(({ data }) => (data ?? []) as GmailContactRow[]),

    db
      .from('calendar_events')
      .select('*')
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null)
      .gte('start_at', windowStart)
      .then(({ data }) => (data ?? []) as CalendarEventRow[]),

    db
      .from('deals')
      .select('*')
      .eq('workspace_id', workspaceId)
      .not('stage', 'in', '("closed_won","closed_lost")')
      .is('deleted_at', null)
      .then(({ data }) => (data ?? []) as DealRow[]),

    db
      .from('gmail_threads')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('response_status', 'waiting_for_me')
      .then(({ data }) => (data ?? []) as GmailThreadRow[]),
  ])

  const merged = mergeSourceData(contacts, gmailContacts, calendarEvents, activeDeals, awaitingThreads)

  // Exclude the executive's own email from the people list
  const selfEmail = userEmail?.toLowerCase()

  const now = new Date().toISOString()
  const profiles: PersonProfile[] = []

  for (const [email, input] of merged) {
    if (selfEmail && email === selfEmail) continue
    // Only include people with at least one real interaction
    if (input.emailCount === 0 && input.meetingCount === 0) continue

    const partial = buildProfile(input, workspaceId, organizationId)
    profiles.push({
      id: `virtual:${email}`,
      createdAt: now,
      updatedAt: now,
      ...partial,
    })
  }

  return profiles
}
