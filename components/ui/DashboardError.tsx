"use client"

import { AlertTriangle, RefreshCw } from "lucide-react"

type Props = {
  title?: string
  message?: string
  onRetry?: () => void
}

export function DashboardError({
  title = "Something went wrong",
  message = "This page encountered an unexpected error. Try refreshing or come back shortly.",
  onRetry,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex size-14 items-center justify-center rounded-full border border-rose-200 bg-rose-50">
        <AlertTriangle className="size-6 text-rose-500" aria-hidden="true" />
      </div>
      <h2 className="mt-5 text-lg font-semibold text-slate-950">{title}</h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-black/8 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-[0_4px_12px_-6px_rgba(15,23,42,0.14)] transition-all hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 active:scale-95"
        >
          <RefreshCw className="size-4" aria-hidden="true" />
          Try again
        </button>
      ) : null}
    </div>
  )
}
