import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

type GoogleConnectionRow = Database['public']['Tables']['google_connections']['Row']

export interface IntegrationConnectionData {
  googleConnection: GoogleConnectionRow | null
  gmailLastSync: string | null
  calendarLastSync: string | null
}

export function createIntegrationRepository(db: SupabaseClient<Database>) {
  return {
    async getWorkspaceIntegrationData(
      workspaceId: string,
      userId: string
    ): Promise<IntegrationConnectionData> {
      // Fetch Google connection for this workspace+user
      const { data: googleConnection } = await db
        .from('google_connections')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId)
        .maybeSingle()

      let gmailLastSync: string | null = null
      let calendarLastSync: string | null = null

      if (googleConnection) {
        // Gmail last sync — from gmail_sync_state joined to connection
        const { data: gmailSync } = await db
          .from('gmail_sync_state')
          .select('last_sync_at')
          .eq('connection_id', googleConnection.id)
          .maybeSingle()
        gmailLastSync = gmailSync?.last_sync_at ?? null

        // Calendar last sync — most recent calendar sync state for this connection
        const { data: calSyncs } = await db
          .from('calendar_sync_state')
          .select('last_synced_at')
          .eq('connection_id', googleConnection.id)
          .order('last_synced_at', { ascending: false })
          .limit(1)
          .then(({ data, error }) => ({ data: data ?? [], error }))
        calendarLastSync = calSyncs?.[0]?.last_synced_at ?? null
      }

      return {
        googleConnection: googleConnection ?? null,
        gmailLastSync,
        calendarLastSync,
      }
    },
  }
}

export type IntegrationRepository = ReturnType<typeof createIntegrationRepository>
