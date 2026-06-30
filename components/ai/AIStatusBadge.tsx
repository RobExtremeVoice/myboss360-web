"use client"

import { Cpu } from "lucide-react"

type Props = {
  providerName?: string
  status?: "active" | "unconfigured" | "unavailable"
}

const statusStyles = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  unconfigured: "border-amber-200 bg-amber-50 text-amber-700",
  unavailable: "border-red-200 bg-red-50 text-red-700",
} as const

export function AIStatusBadge({
  providerName = "Mock Provider",
  status = "active",
}: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${statusStyles[status]}`}
    >
      <Cpu className="size-3 shrink-0" />
      {providerName}
      {status === "unconfigured" && " — not configured"}
    </span>
  )
}
