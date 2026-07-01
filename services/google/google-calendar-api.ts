import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type {
  AgendaEvent,
  CalendarSyncState,
  FreeTimeBlock,
  GoogleCalendar,
  GoogleCalendarEvent,
  GoogleCalendarEventsResponse,
  GoogleCalendarListResponse,
  TodayAgenda,
} from '@/types/google'
import { googleConfig } from '@/config/google'
import { createGoogleOAuthService } from './google-oauth-service'
import { createCalendarSyncRepository } from '@/repositories/google/calendar-sync'
import { createGoogleConnectionsRepository } from '@/repositories/google/connections'
import { createMemoryService } from '@/services/memory/memory-service'
import { createLearningService } from '@/services/learning/learning-service'

type CalendarEventInsert = Database['public']['Tables']['calendar_events']['Insert']

// ─── Low-level Google Calendar API calls ─────────────────────────────────────

async function calendarFetch<T>(path: string, accessToken: string): Promise<T> {
  const res = await fetch(`${googleConfig.calendarApiBase}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    if (res.status === 401) throw new Error('GOOGLE_UNAUTHORIZED')
    const text = await res.text()
    throw new Error(`Google Calendar API error (${res.status}): ${text}`)
  }
  return res.json() as Promise<T>
}

// ─── Service factory ──────────────────────────────────────────────────────────

export function createGoogleCalendarApiService(db: SupabaseClient<Database>) {
  const oauthService = createGoogleOAuthService(db)
  const syncRepo = createCalendarSyncRepository(db)
  const connectionsRepo = createGoogleConnectionsRepository(db)

  async function getAccessToken(connectionId: string): Promise<string> {
    const tokens = await oauthService.getActiveTokens(connectionId)
    return tokens.accessToken
  }

  return {
    async listCalendars(connectionId: string): Promise<GoogleCalendar[]> {
      const accessToken = await getAccessToken(connectionId)
      const response = await calendarFetch<GoogleCalendarListResponse>(
        '/users/me/calendarList?maxResults=50',
        accessToken
      )
      return response.items ?? []
    },

    async getPrimaryCalendar(connectionId: string): Promise<GoogleCalendar | null> {
      const calendars = await this.listCalendars(connectionId)
      return calendars.find((c) => c.primary) ?? calendars[0] ?? null
    },

    async listEvents(
      connectionId: string,
      calendarId: string,
      options: {
        timeMin?: string
        timeMax?: string
        maxResults?: number
        pageToken?: string
        syncToken?: string
      } = {}
    ): Promise<GoogleCalendarEventsResponse> {
      const accessToken = await getAccessToken(connectionId)
      const params = new URLSearchParams({
        singleEvents: 'true',
        orderBy: 'startTime',
        maxResults: String(options.maxResults ?? googleConfig.maxEventsPerPage),
      })
      if (options.timeMin) params.set('timeMin', options.timeMin)
      if (options.timeMax) params.set('timeMax', options.timeMax)
      if (options.pageToken) params.set('pageToken', options.pageToken)
      if (options.syncToken) params.set('syncToken', options.syncToken)

      const encodedId = encodeURIComponent(calendarId)
      return calendarFetch<GoogleCalendarEventsResponse>(
        `/calendars/${encodedId}/events?${params.toString()}`,
        accessToken
      )
    },

    async getUpcomingEvents(
      connectionId: string,
      calendarId = 'primary',
      days = googleConfig.defaultSyncLookAheadDays
    ): Promise<GoogleCalendarEvent[]> {
      const timeMin = new Date().toISOString()
      const timeMax = new Date(Date.now() + days * 86_400_000).toISOString()
      const response = await this.listEvents(connectionId, calendarId, { timeMin, timeMax })
      return response.items ?? []
    },

    async getTodayEvents(
      connectionId: string,
      calendarId = 'primary'
    ): Promise<GoogleCalendarEvent[]> {
      const now = new Date()
      const startOfDay = new Date(now)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(now)
      endOfDay.setHours(23, 59, 59, 999)

      const response = await this.listEvents(connectionId, calendarId, {
        timeMin: startOfDay.toISOString(),
        timeMax: endOfDay.toISOString(),
        maxResults: 50,
      })
      return response.items ?? []
    },

    // Sync Google events into the calendar_events table and emit context signals.
    async syncCalendar(
      connectionId: string,
      workspaceId: string,
      organizationId: string,
      userId: string,
      calendarId = 'primary'
    ): Promise<{ synced: number; syncToken: string | null }> {
      const syncState = await syncRepo.findByConnectionAndCalendar(connectionId, calendarId)
      const isIncremental = Boolean(syncState?.sync_token)

      const timeMin = isIncremental
        ? undefined
        : new Date(Date.now() - googleConfig.defaultSyncLookBehindDays * 86_400_000).toISOString()
      const timeMax = isIncremental
        ? undefined
        : new Date(Date.now() + googleConfig.defaultSyncLookAheadDays * 86_400_000).toISOString()

      let pageToken: string | undefined = undefined
      let nextSyncToken: string | null = null
      let totalSynced = 0

      const memoryService = createMemoryService(db)
      const learningService = createLearningService(db)

      do {
        const response = await this.listEvents(connectionId, calendarId, {
          timeMin,
          timeMax,
          pageToken,
          syncToken: isIncremental && syncState?.sync_token ? syncState.sync_token : undefined,
        })

        const events = response.items ?? []

        for (const event of events) {
          if (!event.summary) continue

          const startAt = event.start.dateTime ?? event.start.date ?? ''
          const endAt = event.end.dateTime ?? event.end.date ?? ''
          if (!startAt || !endAt) continue

          const insert: CalendarEventInsert = {
            workspace_id: workspaceId,
            title: event.summary,
            description: event.description ?? null,
            location: event.location ?? null,
            start_at: startAt,
            end_at: endAt,
            all_day: Boolean(event.start.date && !event.start.dateTime),
            attendees: (event.attendees ?? []).map((a) => a.email),
            organizer_id: null,
            metadata: {
              googleEventId: event.id,
              googleCalendarId: calendarId,
              googleHtmlLink: event.htmlLink ?? null,
              connectionId,
              source: 'google',
            },
            created_by: userId,
          }

          // Upsert via metadata googleEventId match — prefer simple insert for now
          // (future: use a unique index on metadata->>'googleEventId' per workspace)
          const { error: upsertError } = await db
            .from('calendar_events')
            .upsert(insert, { ignoreDuplicates: false })
          if (upsertError) continue

          totalSynced++

          // Part 6: Feed into Memory Engine as meeting_summary
          const eventDate = new Date(startAt).toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric',
          })
          await memoryService.createMemory({
            workspaceId,
            organizationId,
            userId,
            type: 'meeting_summary',
            title: `Meeting: ${event.summary}`,
            content: [
              `Date: ${eventDate}`,
              event.location ? `Location: ${event.location}` : null,
              event.attendees?.length
                ? `Attendees: ${event.attendees.map((a) => a.displayName ?? a.email).join(', ')}`
                : null,
              event.description ? `Notes: ${event.description}` : null,
            ]
              .filter(Boolean)
              .join('\n'),
            source: 'system',
            metadata: { googleEventId: event.id, calendarId, source: 'google_calendar' },
            createdBy: userId,
          }).catch(() => null)

          // Part 6: Feed into Learning Engine as calendar_event signal
          const hoursUntil = (new Date(startAt).getTime() - Date.now()) / 3_600_000
          if (hoursUntil > 0 && hoursUntil <= 24) {
            await learningService.createLearningSignal({
              workspaceId,
              organizationId,
              signalType: 'recommended_action',
              entityType: 'calendar_event',
              severity: hoursUntil <= 2 ? 'warning' : 'info',
              title: `Upcoming: ${event.summary}`,
              description: `Meeting "${event.summary}" starts in ${Math.round(hoursUntil)}h. Prepare now.`,
              data: { googleEventId: event.id, startAt, hoursUntil: Math.round(hoursUntil) },
            }).catch(() => null)
          }
        }

        nextSyncToken = response.nextSyncToken ?? null
        pageToken = response.nextPageToken ?? undefined
      } while (pageToken)

      await syncRepo.recordSync(connectionId, calendarId, nextSyncToken, totalSynced)

      return { synced: totalSynced, syncToken: nextSyncToken }
    },

    async getTodayAgenda(workspaceId: string, userId: string): Promise<TodayAgenda> {
      const today = new Date()
      const dateLabel = today.toISOString().slice(0, 10)

      const connection = await connectionsRepo.findByWorkspaceAndUser(workspaceId, userId)
      const isConnected = Boolean(connection && connection.status === 'active')

      // Always read from local calendar_events table (source of truth after sync)
      const startOfDay = new Date(today)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(today)
      endOfDay.setHours(23, 59, 59, 999)

      const { data: rows } = await db
        .from('calendar_events')
        .select('*')
        .eq('workspace_id', workspaceId)
        .is('deleted_at', null)
        .gte('start_at', startOfDay.toISOString())
        .lte('start_at', endOfDay.toISOString())
        .order('start_at', { ascending: true })

      const events: AgendaEvent[] = (rows ?? []).map((row) => {
        const startMs = new Date(row.start_at).getTime()
        const nowMs = Date.now()
        const minutesUntil = Math.round((startMs - nowMs) / 60_000)
        const isNow = minutesUntil <= 0 && nowMs < new Date(row.end_at).getTime()
        const meta = (row.metadata as Record<string, unknown>) ?? {}
        return {
          id: row.id,
          title: row.title,
          startAt: row.start_at,
          endAt: row.end_at,
          allDay: row.all_day,
          location: row.location,
          attendees: row.attendees,
          isNow,
          minutesUntil: minutesUntil > 0 ? minutesUntil : null,
          source: meta['source'] === 'google' ? 'google' : 'local',
        }
      })

      const freeBlocks = computeFreeBlocks(events, startOfDay, endOfDay)

      return {
        date: dateLabel,
        events,
        meetingCount: events.length,
        freeBlocks,
        isConnected,
        googleAccountEmail: connection?.google_account_email ?? null,
      }
    },

    getSyncState(connectionId: string, calendarId: string): Promise<CalendarSyncState | null> {
      return syncRepo.findByConnectionAndCalendar(connectionId, calendarId) as Promise<CalendarSyncState | null>
    },
  }
}

export type GoogleCalendarApiService = ReturnType<typeof createGoogleCalendarApiService>

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeFreeBlocks(
  events: AgendaEvent[],
  startOfDay: Date,
  endOfDay: Date
): FreeTimeBlock[] {
  const WORK_START = new Date(startOfDay)
  WORK_START.setHours(8, 0, 0, 0)
  const WORK_END = new Date(endOfDay)
  WORK_END.setHours(18, 0, 0, 0)
  const MIN_FREE_MINUTES = 30

  const sorted = events
    .filter((e) => !e.allDay)
    .map((e) => ({ start: new Date(e.startAt), end: new Date(e.endAt) }))
    .sort((a, b) => a.start.getTime() - b.start.getTime())

  const blocks: FreeTimeBlock[] = []
  let cursor = WORK_START

  for (const { start, end } of sorted) {
    if (start > cursor) {
      const gapMs = start.getTime() - cursor.getTime()
      const durationMinutes = Math.round(gapMs / 60_000)
      if (durationMinutes >= MIN_FREE_MINUTES) {
        blocks.push({
          startAt: cursor.toISOString(),
          endAt: start.toISOString(),
          durationMinutes,
        })
      }
    }
    if (end > cursor) cursor = end
  }

  if (cursor < WORK_END) {
    const durationMinutes = Math.round((WORK_END.getTime() - cursor.getTime()) / 60_000)
    if (durationMinutes >= MIN_FREE_MINUTES) {
      blocks.push({
        startAt: cursor.toISOString(),
        endAt: WORK_END.toISOString(),
        durationMinutes,
      })
    }
  }

  return blocks
}
