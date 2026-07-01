import { ListTodo } from "lucide-react"
import { ExecutiveEmptyState } from "@/components/dashboard/ExecutiveEmptyState"

export default function TasksPage() {
  return (
    <ExecutiveEmptyState
      icon={<ListTodo className="size-8" />}
      label="Tasks"
      title="Priorities, ownership, and follow-through"
      description="Tasks surfaces what needs to happen, who owns it, and when it's due — across every deal, project, and team commitment. Overdue items, high-priority actions, and stale follow-ups will all appear here so nothing slips."
      nextAction="Your cross-workspace task list, filters by owner and priority, and overdue alerts will be available once the Tasks module is live."
    />
  )
}
