"use client"

import { DashboardError } from "@/components/ui/DashboardError"

export default function CalendarError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <DashboardError
      title="Calendar unavailable"
      message={error.message || "We couldn't load your calendar. Check your Google Calendar connection in Settings."}
      onRetry={reset}
    />
  )
}
