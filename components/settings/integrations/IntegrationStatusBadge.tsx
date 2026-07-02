import type { IntegrationStatus } from '@/types/integrations'

const BADGE_STYLES: Record<IntegrationStatus, string> = {
  connected:    'border-emerald-200 bg-emerald-50 text-emerald-700',
  disconnected: 'border-slate-200 bg-slate-50 text-slate-500',
  coming_soon:  'border-indigo-100 bg-indigo-50 text-indigo-600',
  error:        'border-rose-200 bg-rose-50 text-rose-700',
}

const BADGE_LABELS: Record<IntegrationStatus, string> = {
  connected:    'Connected',
  disconnected: 'Not Connected',
  coming_soon:  'Coming Soon',
  error:        'Error',
}

type Props = { status: IntegrationStatus }

export function IntegrationStatusBadge({ status }: Props) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
        BADGE_STYLES[status],
      ].join(' ')}
    >
      {BADGE_LABELS[status]}
    </span>
  )
}
