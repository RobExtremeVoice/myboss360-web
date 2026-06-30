import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { createWorkspacesRepository } from '@/repositories/workspaces'
import { createLearningService } from '@/services/learning/learning-service'
import { signalTitles } from '@/config/intelligence'

type CalendarEventRow = Database['public']['Tables']['calendar_events']['Row']
type CalendarEventInsert = Database['public']['Tables']['calendar_events']['Insert']
type CalendarEventUpdate = Database['public']['Tables']['calendar_events']['Update']

export function createCalendarService(db: SupabaseClient<Database>) {
  const workspacesRepo = createWorkspacesRepository(db)

  async function resolveWorkspaceOrg(workspaceId: string) {
    const ws = await workspacesRepo.findById(workspaceId)
    return ws ? { workspaceId: ws.id, organizationId: ws.organization_id } : null
  }

  return {
    async listUpcomingEvents(workspaceId: string, limit = 20): Promise<CalendarEventRow[]> {
      const { data, error } = await db
        .from('calendar_events')
        .select('*')
        .eq('workspace_id', workspaceId)
        .is('deleted_at', null)
        .gte('start_at', new Date().toISOString())
        .order('start_at', { ascending: true })
        .limit(limit)
      if (error) throw error
      return data ?? []
    },

    async createEvent(input: CalendarEventInsert): Promise<CalendarEventRow> {
      const { data, error } = await db
        .from('calendar_events')
        .insert(input)
        .select()
        .single()
      if (error) throw error
      const event = data

      // Fire-and-forget: emit signal if event is happening very soon (within 24h) and was just added
      const context = await resolveWorkspaceOrg(event.workspace_id).catch(() => null)
      if (context) {
        const hoursUntil = (new Date(event.start_at).getTime() - Date.now()) / 3_600_000
        if (hoursUntil <= 24 && hoursUntil > 0) {
          const learningService = createLearningService(db)
          void learningService.createLearningSignal({
            workspaceId: context.workspaceId,
            organizationId: context.organizationId,
            signalType: 'recommended_action',
            entityType: 'calendar_event',
            entityId: event.id,
            severity: hoursUntil <= 2 ? 'warning' : 'info',
            title: signalTitles.recommended_action,
            description: `Meeting "${event.title}" starts in ${Math.round(hoursUntil)} hour(s). Prepare now.`,
            data: { eventTitle: event.title, hoursUntil: Math.round(hoursUntil), startAt: event.start_at },
          }).catch(() => null)
        }
      }

      return event
    },

    async updateEvent(id: string, input: CalendarEventUpdate): Promise<CalendarEventRow> {
      const { data, error } = await db
        .from('calendar_events')
        .update(input)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },

    async softDeleteEvent(id: string): Promise<void> {
      const { error } = await db
        .from('calendar_events')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },

    async getEvent(id: string): Promise<CalendarEventRow | null> {
      const { data, error } = await db
        .from('calendar_events')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .maybeSingle()
      if (error) throw error
      return data
    },
  }
}

export type CalendarService = ReturnType<typeof createCalendarService>
