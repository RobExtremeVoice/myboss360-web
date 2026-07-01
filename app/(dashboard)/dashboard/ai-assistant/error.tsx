"use client"

import { DashboardError } from "@/components/ui/DashboardError"

export default function AIAssistantError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <DashboardError
      title="Executive AI unavailable"
      message={error.message || "We couldn't start your AI session. Your intelligence context is intact — try again."}
      onRetry={reset}
    />
  )
}
