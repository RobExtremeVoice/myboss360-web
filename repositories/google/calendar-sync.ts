import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, InsertTables, UpdateTables } from '@/types/database'

type SyncStateRow = Database['public']['Tables']['calendar_sync_state']['Row']

export function createCalendarSyncRepository(db: SupabaseClient<Database>) {
  return {
    async findByConnectionAndCalendar(
      connectionId: string,
      calendarId: string
    ): Promise<SyncStateRow | null> {
      const { data, error } = await db
        .from('calendar_sync_state')
        .select('*')
        .eq('connection_id', connectionId)
        .eq('calendar_id', calendarId)
        .maybeSingle()
      if (error) throw error
      return data
    },

    async listByConnection(connectionId: string): Promise<SyncStateRow[]> {
      const { data, error } = await db
        .from('calendar_sync_state')
        .select('*')
        .eq('connection_id', connectionId)
        .order('last_synced_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },

    async upsert(input: InsertTables<'calendar_sync_state'>): Promise<SyncStateRow> {
      const { data, error } = await db
        .from('calendar_sync_state')
        .upsert(input, { onConflict: 'connection_id,calendar_id' })
        .select()
        .single()
      if (error) throw error
      return data
    },

    async update(
      connectionId: string,
      calendarId: string,
      input: UpdateTables<'calendar_sync_state'>
    ): Promise<SyncStateRow> {
      const { data, error } = await db
        .from('calendar_sync_state')
        .update(input)
        .eq('connection_id', connectionId)
        .eq('calendar_id', calendarId)
        .select()
        .single()
      if (error) throw error
      return data
    },

    async recordSync(
      connectionId: string,
      calendarId: string,
      syncToken: string | null,
      eventsAdded: number
    ): Promise<void> {
      const existing = await this.findByConnectionAndCalendar(connectionId, calendarId)
      const current = existing?.total_events_synced ?? 0

      await this.upsert({
        connection_id: connectionId,
        calendar_id: calendarId,
        sync_token: syncToken,
        next_page_token: null,
        last_synced_at: new Date().toISOString(),
        total_events_synced: current + eventsAdded,
      })
    },
  }
}

export type CalendarSyncRepository = ReturnType<typeof createCalendarSyncRepository>
