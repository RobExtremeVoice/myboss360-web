import { FileText } from "lucide-react"
import { ExecutiveEmptyState } from "@/components/dashboard/ExecutiveEmptyState"

export default function DocumentsPage() {
  return (
    <ExecutiveEmptyState
      icon={<FileText className="size-8" />}
      label="Documents"
      title="Knowledge, notes, and shared operating context"
      description="Documents is your executive knowledge layer — meeting notes, strategic briefs, operating procedures, and shared team context. Everything your AI assistant references when answering questions about your business."
      nextAction="Documents you create or import will appear here and feed directly into your Executive AI context."
    />
  )
}
