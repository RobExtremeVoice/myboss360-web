'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { cn } from '@/lib/utils'
import type { IntegrationState } from '@/types/integrations'
import { IntegrationLogoIcon } from './IntegrationLogoIcon'
import { IntegrationStatusBadge } from './IntegrationStatusBadge'

type Props = {
  state: IntegrationState
  workspaceId: string
}

/** Format an ISO date string as a human-readable relative time label. */
function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

const BUTTON_BASE =
  'rounded-full border border-black/8 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-[0_4px_12px_-6px_rgba(15,23,42,0.10)] transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50'

export function IntegrationCard({ state, workspaceId }: Props) {
  const { definition, status, accountEmail, lastSync } = state
  const router = useRouter()
  const [syncing, setSyncing] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  async function handleDisconnect() {
    setDisconnecting(true)
    try {
      await fetch(`/api/google/connect?workspaceId=${workspaceId}`, { method: 'DELETE' })
      router.refresh()
    } finally {
      setDisconnecting(false)
    }
  }

  async function handleSync() {
    if (!definition.syncHref) return
    setSyncing(true)
    // Fire-and-forget — we refresh after a brief moment to show updated lastSync
    fetch(`${definition.syncHref}?workspaceId=${workspaceId}`, { method: 'POST' }).finally(() => {
      setSyncing(false)
      router.refresh()
    })
  }

  return (
    <div
      className={cn(
        'rounded-[1.25rem] border border-black/6 bg-white p-5 shadow-[0_4px_12px_-6px_rgba(15,23,42,0.08)] transition-all hover:border-black/10',
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <IntegrationLogoIcon provider={definition.id} className="shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 leading-tight truncate">
              {definition.name}
            </p>
            <div className="mt-1">
              <IntegrationStatusBadge status={status} />
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="mt-2 text-sm text-slate-500 leading-relaxed">
        {definition.description}
      </p>

      {/* Connection details (shown when connected) */}
      {status === 'connected' && (accountEmail || lastSync) && (
        <div className="mt-2 flex flex-col gap-0.5 text-[11px] text-slate-400">
          {accountEmail && <span>{accountEmail}</span>}
          {lastSync && <span>Last sync: {formatRelativeTime(lastSync)}</span>}
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex gap-2 flex-wrap">
        {status === 'coming_soon' && (
          <span className="text-[11px] text-slate-400 font-medium">Coming soon</span>
        )}

        {status === 'disconnected' && definition.connectHref && (
          <a
            href={`${definition.connectHref}?workspaceId=${workspaceId}`}
            className={BUTTON_BASE}
          >
            Connect
          </a>
        )}

        {status === 'connected' && (
          <>
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={disconnecting}
              className={BUTTON_BASE}
            >
              {disconnecting ? 'Disconnecting…' : 'Disconnect'}
            </button>
            {definition.syncHref && (
              <button
                type="button"
                onClick={handleSync}
                disabled={syncing}
                className={BUTTON_BASE}
              >
                {syncing ? 'Syncing…' : 'Sync Now'}
              </button>
            )}
          </>
        )}

        {status === 'error' && definition.connectHref && (
          <a
            href={`${definition.connectHref}?workspaceId=${workspaceId}`}
            className={BUTTON_BASE}
          >
            Re-connect
          </a>
        )}
      </div>
    </div>
  )
}
