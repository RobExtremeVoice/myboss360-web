import { FolderKanban } from "lucide-react"
import { ExecutiveEmptyState } from "@/components/dashboard/ExecutiveEmptyState"

export default function ProjectsPage() {
  return (
    <ExecutiveEmptyState
      icon={<FolderKanban className="size-8" />}
      label="Projects"
      title="Initiative tracking and delivery visibility"
      description="Projects gives you a real-time view of every active initiative across your organization — from milestone tracking to execution risk. Spot blockers early, align team effort, and ensure nothing critical falls through."
      nextAction="Active initiatives, timelines, milestones, and owner accountability will appear here once the Projects module is live."
    />
  )
}
