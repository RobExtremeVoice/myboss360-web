import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, InsertTables, UpdateTables } from '@/types/database'

type SyncStateRow = Database['public']['Tables']['gmail_sync_state']['Row']

export function createGmailSyncRepository(db: SupabaseClient<Database>) {
  return {
    async findByConnectionId(connectionId: string): Promise<SyncStateRow | null> {
      const { data, error } = await db
        .from('gmail_sync_state')
        .select('*')
        .eq('connection_id', connectionId)
        .maybeSingle()
      if (error) throw error
      return data
    },

    async upsert(input: InsertTables<'gmail_sync_state'>): Promise<SyncStateRow> {
      const { data, error } = await db
        .from('gmail_sync_state')
        .upsert(input, { onConflict: 'connection_id' })
        .select()
        .single()
      if (error) throw error
      return data
    },

    async update(connectionId: string, input: UpdateTables<'gmail_sync_state'>): Promise<SyncStateRow> {
      const { data, error } = await db
        .from('gmail_sync_state')
        .update(input)
        .eq('connection_id', connectionId)
        .select()
        .single()
      if (error) throw error
      return data
    },

    // Increments total_threads_synced by deltaCount and advances history_id.
    async recordSync(connectionId: string, deltaCount: number, historyId: string): Promise<SyncStateRow> {
      const current = await this.findByConnectionId(connectionId)
      const newTotal = (current?.total_threads_synced ?? 0) + deltaCount
      return this.upsert({
        connection_id: connectionId,
        history_id: historyId,
        last_sync_at: new Date().toISOString(),
        total_threads_synced: newTotal,
      })
    },
  }
}

export type GmailSyncRepository = ReturnType<typeof createGmailSyncRepository>
