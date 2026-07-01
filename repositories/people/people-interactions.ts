import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { PersonInteraction } from '@/types/people'

type Row = Database['public']['Tables']['people_interactions']['Row']
type InsertRow = Database['public']['Tables']['people_interactions']['Insert']

function toPersonInteraction(row: Row): PersonInteraction {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    organizationId: row.organization_id,
    personProfileId: row.person_profile_id,
    interactionType: row.interaction_type as PersonInteraction['interactionType'],
    source: row.source as PersonInteraction['source'],
    sourceId: row.source_id,
    direction: row.direction as PersonInteraction['direction'],
    subject: row.subject,
    occurredAt: row.occurred_at,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at,
  }
}

export function createPeopleInteractionsRepository(db: SupabaseClient<Database>) {
  return {
    async upsert(data: InsertRow): Promise<PersonInteraction> {
      const { data: row, error } = await db
        .from('people_interactions')
        .upsert(data, { onConflict: 'workspace_id,person_profile_id,source,source_id' })
        .select()
        .single()
      if (error) throw error
      return toPersonInteraction(row)
    },

    async listByProfile(personProfileId: string, limit = 50): Promise<PersonInteraction[]> {
      const { data, error } = await db
        .from('people_interactions')
        .select('*')
        .eq('person_profile_id', personProfileId)
        .order('occurred_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return (data ?? []).map(toPersonInteraction)
    },
  }
}
