"use client"

import { DashboardError } from "@/components/ui/DashboardError"

export default function DashboardRootError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <DashboardError
      title="Dashboard unavailable"
      message={error.message || "We couldn't load your executive dashboard. Your data is safe — try refreshing."}
      onRetry={reset}
    />
  )
}
