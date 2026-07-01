"use client"

import { memo } from "react"
import { MessageSquarePlus, MessagesSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ConversationListItem } from "@/types/ai"

type Props = {
  conversations: ConversationListItem[]
  activeId: string | null
  onSelect: (id: string) => void
  onNew: () => void
}

function formatRelative(isoDate: string): string {
  const now = Date.now()
  const diff = now - new Date(isoDate).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export const AIConversationSidebar = memo(function AIConversationSidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
}: Props) {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-black/6 bg-white/60 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-black/6 px-4 py-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <MessagesSquare className="size-4 text-slate-500" />
          Conversations
        </div>
        <button
          type="button"
          onClick={onNew}
          className="flex size-7 items-center justify-center rounded-lg border border-black/8 bg-white text-slate-500 transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1"
          aria-label="New conversation"
        >
          <MessageSquarePlus className="size-3.5" />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-2">
        {conversations.length === 0 ? (
          <p className="px-4 py-8 text-center text-xs text-slate-400">
            No conversations yet.
            <br />
            Start by asking a question.
          </p>
        ) : (
          conversations.map((conv) => (
            <button
              key={conv.id}
              type="button"
              onClick={() => onSelect(conv.id)}
              className={cn(
                "flex w-full flex-col gap-0.5 px-4 py-2.5 text-left transition-colors hover:bg-slate-50",
                activeId === conv.id && "bg-indigo-50/70"
              )}
            >
              <span
                className={cn(
                  "truncate text-sm font-medium",
                  activeId === conv.id ? "text-indigo-700" : "text-slate-800"
                )}
              >
                {conv.title ?? "New conversation"}
              </span>
              <span className="text-[11px] text-slate-400">
                {formatRelative(conv.updatedAt)}
              </span>
            </button>
          ))
        )}
      </div>
    </aside>
  )
})
