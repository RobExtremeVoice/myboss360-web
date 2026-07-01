import { Wallet } from "lucide-react"
import { ExecutiveEmptyState } from "@/components/dashboard/ExecutiveEmptyState"

export default function FinancePage() {
  return (
    <ExecutiveEmptyState
      icon={<Wallet className="size-8" />}
      label="Finance"
      title="Cash flow, invoices, and financial operating context"
      description="Finance surfaces the numbers that drive executive decisions — cash position, invoice aging, burn rate, and revenue signals. Connected to your billing systems so the AI always has accurate financial context."
      nextAction="Revenue metrics, invoice status, and financial health signals will appear here once the Finance module is connected."
    />
  )
}
