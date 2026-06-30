"use client"

import { Bot, User } from "lucide-react"
import { cn } from "@/lib/utils"

export type AIMessageItem = {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  createdAt?: string
}

type Props = {
  message: AIMessageItem
}

export function AIMessage({ message }: Props) {
  const isAssistant = message.role === "assistant"

  return (
    <div
      className={cn(
        "flex gap-3",
        isAssistant ? "flex-row" : "flex-row-reverse"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full border",
          isAssistant
            ? "border-slate-200 bg-slate-50 text-slate-600"
            : "border-indigo-200 bg-indigo-50 text-indigo-600"
        )}
      >
        {isAssistant ? (
          <Bot className="size-4" />
        ) : (
          <User className="size-4" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6",
          isAssistant
            ? "rounded-tl-sm border border-black/6 bg-white text-slate-800 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.08)]"
            : "rounded-tr-sm bg-indigo-600 text-white"
        )}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        {message.createdAt && (
          <p
            className={cn(
              "mt-1.5 text-[10px]",
              isAssistant ? "text-slate-400" : "text-indigo-200"
            )}
          >
            {new Date(message.createdAt).toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>
    </div>
  )
}
