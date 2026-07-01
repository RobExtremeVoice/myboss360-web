import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { PersonProfile, ListPeopleOptions } from '@/types/people'

type Row = Database['public']['Tables']['people_profiles']['Row']
type InsertRow = Database['public']['Tables']['people_profiles']['Insert']

function toPersonProfile(row: Row): PersonProfile {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    organizationId: row.organization_id,
    email: row.email,
    fullName: row.full_name,
    jobTitle: row.job_title,
    companyName: row.company_name,
    companyId: row.company_id,
    crmContactId: row.crm_contact_id,
    gmailContactId: row.gmail_contact_id,
    sources: (row.sources ?? []) as PersonProfile['sources'],
    relationshipStrength: row.relationship_strength,
    engagementScore: row.engagement_score,
    influenceScore: row.influence_score,
    isChampion: row.is_champion,
    isDecisionMaker: row.is_decision_maker,
    isStale: row.is_stale,
    isNewRelationship: row.is_new_relationship,
    emailCount: row.email_count,
    meetingCount: row.meeting_count,
    lastInteractionAt: row.last_interaction_at,
    firstInteractionAt: row.first_interaction_at,
    awaitingReply: row.awaiting_reply,
    followUpRequired: row.follow_up_required,
    followUpDue: row.follow_up_due,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    lastScoredAt: row.last_scored_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function createPeopleProfilesRepository(db: SupabaseClient<Database>) {
  return {
    async upsert(data: InsertRow): Promise<PersonProfile> {
      const { data: row, error } = await db
        .from('people_profiles')
        .upsert({ ...data, updated_at: new Date().toISOString() }, { onConflict: 'workspace_id,email' })
        .select()
        .single()
      if (error) throw error
      return toPersonProfile(row)
    },

    async listByWorkspace(workspaceId: string, options: ListPeopleOptions = {}): Promise<PersonProfile[]> {
      let query = db
        .from('people_profiles')
        .select('*')
        .eq('workspace_id', workspaceId)
        .is('deleted_at', null)

      if (options.isChampion !== undefined) query = query.eq('is_champion', options.isChampion)
      if (options.isDecisionMaker !== undefined) query = query.eq('is_decision_maker', options.isDecisionMaker)
      if (options.isStale !== undefined) query = query.eq('is_stale', options.isStale)
      if (options.isNewRelationship !== undefined) query = query.eq('is_new_relationship', options.isNewRelationship)
      if (options.awaitingReply !== undefined) query = query.eq('awaiting_reply', options.awaitingReply)
      if (options.followUpRequired !== undefined) query = query.eq('follow_up_required', options.followUpRequired)
      if (options.minRelationshipStrength !== undefined) {
        query = query.gte('relationship_strength', options.minRelationshipStrength)
      }

      const orderCol = options.orderBy ?? 'relationship_strength'
      const orderMap = {
        relationship_strength: 'relationship_strength',
        engagement_score: 'engagement_score',
        last_interaction_at: 'last_interaction_at',
      } as const
      query = query.order(orderMap[orderCol], { ascending: false })

      if (options.limit) query = query.limit(options.limit)
      if (options.offset) query = query.range(options.offset, options.offset + (options.limit ?? 50) - 1)

      const { data, error } = await query
      if (error) throw error
      return (data ?? []).map(toPersonProfile)
    },

    async findByEmail(workspaceId: string, email: string): Promise<PersonProfile | null> {
      const { data, error } = await db
        .from('people_profiles')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('email', email)
        .is('deleted_at', null)
        .maybeSingle()
      if (error) throw error
      return data ? toPersonProfile(data) : null
    },

    async findById(id: string): Promise<PersonProfile | null> {
      const { data, error } = await db
        .from('people_profiles')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .maybeSingle()
      if (error) throw error
      return data ? toPersonProfile(data) : null
    },

    async countByWorkspace(workspaceId: string): Promise<number> {
      const { count, error } = await db
        .from('people_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .is('deleted_at', null)
      if (error) throw error
      return count ?? 0
    },
  }
}
