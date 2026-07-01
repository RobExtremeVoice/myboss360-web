import { BarChart3 } from "lucide-react"
import { ExecutiveEmptyState } from "@/components/dashboard/ExecutiveEmptyState"

export default function ReportsPage() {
  return (
    <ExecutiveEmptyState
      icon={<BarChart3 className="size-8" />}
      label="Reports"
      title="Executive summaries and performance reviews"
      description="Reports turns your live business data into structured executive summaries — weekly pipeline reviews, team performance snapshots, and board-ready metrics. Scheduled or on-demand."
      nextAction="Custom reports, automated summaries, and shareable snapshots will appear here once the Reports module is live."
    />
  )
}
