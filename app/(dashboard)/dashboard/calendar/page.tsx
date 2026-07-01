import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { createWorkspacesRepository } from '@/repositories/workspaces'
import { createGoogleCalendarApiService } from '@/services/google/google-calendar-api'
import { SectionCard } from '@/components/dashboard/SectionCard'
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader'
import { isGoogleConfigured } from '@/config/google'
import type { AgendaEvent, FreeTimeBlock } from '@/types/google'

// ─── Sub-components ───────────────────────────────────────────────────────────

function AgendaEventCard({ event }: { event: AgendaEvent }) {
  const start = new Date(event.startAt)
  const end = new Date(event.endAt)
  const timeLabel = event.allDay
    ? 'All day'
    : `${formatTime(start)} – ${formatTime(end)}`

  return (
    <article className="cursor-pointer rounded-[1.25rem] border border-black/6 bg-slate-50/70 p-4 transition-all duration-150 hover:border-black/10 hover:bg-white">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-950">{event.title}</p>
          {event.attendees.length > 0 && (
            <p className="mt-1 text-sm text-slate-500">
              {event.attendees.slice(0, 3).join(', ')}
              {event.attendees.length > 3 ? ` +${event.attendees.length - 3} more` : ''}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="rounded-full border border-black/8 bg-white px-3 py-1 text-xs font-semibold text-slate-950 shadow-[0_4px_12px_-6px_rgba(15,23,42,0.10)]">
            {timeLabel}
          </span>
          {event.isNow && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
              Now
            </span>
          )}
          {!event.isNow && event.minutesUntil !== null && event.minutesUntil <= 60 && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
              In {event.minutesUntil}m
            </span>
          )}
        </div>
      </div>
      {event.location && (
        <p className="mt-2.5 text-[11px] font-medium text-slate-400">{event.location}</p>
      )}
    </article>
  )
}

function FreeBlockBadge({ block }: { block: FreeTimeBlock }) {
  const hours = Math.floor(block.durationMinutes / 60)
  const mins = block.durationMinutes % 60
  const label = hours > 0
    ? mins > 0 ? `${hours}h ${mins}m free` : `${hours}h free`
    : `${mins}m free`

  return (
    <div className="flex items-center justify-between rounded-[1.25rem] border border-dashed border-black/10 bg-slate-50/50 px-4 py-3">
      <p className="text-sm text-slate-500">
        {formatTime(new Date(block.startAt))} – {formatTime(new Date(block.endAt))}
      </p>
      <span className="rounded-full border border-black/8 bg-white px-3 py-1 text-xs font-medium text-slate-600">
        {label}
      </span>
    </div>
  )
}

function ConnectBanner({ workspaceId }: { workspaceId: string }) {
  return (
    <div className="rounded-[1.75rem] border border-black/6 bg-white p-6 shadow-[0_18px_48px_-36px_rgba(15,23,42,0.18)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-950">Connect Google Calendar</h3>
          <p className="mt-1 text-sm text-slate-500">
            Sync your calendar events to see your agenda here and feed meetings into your Executive Context.
          </p>
        </div>
        <a
          href={`/api/google/connect?workspaceId=${workspaceId}`}
          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-black/8 bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_12px_-6px_rgba(15,23,42,0.35)] transition-all hover:bg-slate-800"
        >
          Connect Google Calendar
        </a>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const params = await searchParams
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const workspacesRepo = createWorkspacesRepository(supabase)
  const workspaces = await workspacesRepo.listForUser(user.id)
  const workspace = workspaces[0] ?? null

  if (!workspace) {
    return (
      <div className="space-y-8">
        <DashboardPageHeader
          title="Calendar"
          description="Sync your Google Calendar to surface your agenda here."
          greeting=""
        />
        <SectionCard title="No workspace found">
          <p className="text-sm text-slate-500">Complete onboarding to set up your workspace.</p>
        </SectionCard>
      </div>
    )
  }

  const calendarApiService = createGoogleCalendarApiService(supabase)
  const agenda = await calendarApiService.getTodayAgenda(workspace.id, user.id)

  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  const connected = params['google_connected'] === '1'

  return (
    <div className="space-y-8 lg:space-y-10">
      <DashboardPageHeader
        title="Calendar"
        description={`${todayLabel} · ${agenda.meetingCount} meeting${agenda.meetingCount !== 1 ? 's' : ''} today`}
        greeting=""
      />

      {connected && (
        <div className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50 px-5 py-4">
          <p className="text-sm font-medium text-emerald-800">
            Google Calendar connected successfully. Your events are syncing.
          </p>
        </div>
      )}

      {!agenda.isConnected && isGoogleConfigured() && (
        <ConnectBanner workspaceId={workspace.id} />
      )}

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        {/* Today's Agenda */}
        <SectionCard
          title="Today's Agenda"
          description={todayLabel}
          action={
            agenda.isConnected ? (
              <form action="/api/calendar/events" method="POST">
                <input type="hidden" name="workspaceId" value={workspace.id} />
                <button
                  type="submit"
                  className="rounded-full border border-black/8 bg-white px-3 py-1 text-xs font-semibold text-slate-950 shadow-[0_4px_12px_-6px_rgba(15,23,42,0.10)] transition-all hover:border-black/12"
                >
                  Sync now
                </button>
              </form>
            ) : undefined
          }
        >
          {agenda.events.length > 0 ? (
            <div className="space-y-3">
              {agenda.events.map((event) => (
                <AgendaEventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="rounded-[1.25rem] border border-dashed border-black/10 bg-slate-50/70 px-4 py-6">
              <p className="text-sm font-medium text-slate-950">No events today</p>
              <p className="mt-1.5 text-sm text-slate-500">
                {agenda.isConnected
                  ? 'Your calendar is clear. Enjoy the focus time.'
                  : 'Connect Google Calendar to see your events here.'}
              </p>
            </div>
          )}
        </SectionCard>

        {/* Free Time & Stats */}
        <div className="space-y-6">
          <SectionCard title="Meeting Summary" description="Today at a glance">
            <div className="grid grid-cols-2 gap-3">
              <StatBox label="Meetings" value={String(agenda.meetingCount)} />
              <StatBox
                label="Free blocks"
                value={String(agenda.freeBlocks.length)}
              />
              <StatBox
                label="Connected"
                value={agenda.isConnected ? 'Yes' : 'No'}
                accent={agenda.isConnected ? 'green' : undefined}
              />
              {agenda.googleAccountEmail && (
                <div className="col-span-2 rounded-[1rem] border border-black/6 bg-slate-50/70 px-3 py-2">
                  <p className="text-[11px] font-medium text-slate-400">Synced from</p>
                  <p className="mt-0.5 truncate text-xs font-semibold text-slate-700">
                    {agenda.googleAccountEmail}
                  </p>
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Free Time Blocks" description="Focus windows 8:00 – 18:00">
            {agenda.freeBlocks.length > 0 ? (
              <div className="space-y-2">
                {agenda.freeBlocks.map((block) => (
                  <FreeBlockBadge key={block.startAt} block={block} />
                ))}
              </div>
            ) : (
              <div className="rounded-[1.25rem] border border-dashed border-black/10 bg-slate-50/70 px-4 py-5">
                <p className="text-sm text-slate-500">
                  {agenda.events.length > 0
                    ? 'No free blocks of 30+ minutes today.'
                    : 'No events — the whole day is open.'}
                </p>
              </div>
            )}
          </SectionCard>
        </div>
      </section>
    </div>
  )
}

// ─── Utility helpers ──────────────────────────────────────────────────────────

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function StatBox({ label, value, accent }: { label: string; value: string; accent?: 'green' }) {
  return (
    <div className="rounded-[1rem] border border-black/6 bg-slate-50/70 px-3 py-2">
      <p className="text-[11px] font-medium text-slate-400">{label}</p>
      <p
        className={`mt-0.5 text-lg font-bold tracking-tight ${
          accent === 'green' ? 'text-emerald-600' : 'text-slate-950'
        }`}
      >
        {value}
      </p>
    </div>
  )
}
