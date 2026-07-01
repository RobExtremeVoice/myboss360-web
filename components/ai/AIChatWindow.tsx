"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Bot } from "lucide-react"
import { AIMessage, type AIMessageItem } from "./AIMessage"
import { AIComposer } from "./AIComposer"
import { AIPromptSuggestions } from "./AIPromptSuggestions"
import { AIStatusBadge } from "./AIStatusBadge"
import type { ConversationListItem } from "@/types/ai"

type Props = {
  conversationId: string | null
  workspaceId?: string
  onConversationCreated: (id: string, conversations: ConversationListItem[]) => void
}

export function AIChatWindow({
  conversationId,
  workspaceId,
  onConversationCreated,
}: Props) {
  const [messages, setMessages] = useState<AIMessageItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  // Track which conversation id the current messages belong to (avoids setState-in-effect)
  const loadedConvIdRef = useRef<string | null>(null)

  // Load messages when the conversation prop changes
  useEffect(() => {
    if (loadedConvIdRef.current === conversationId) return

    loadedConvIdRef.current = conversationId
    setMessages([])
    setError(null)

    if (!conversationId) return

    fetch(`/api/ai/conversations/${conversationId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.messages) {
          setMessages(
            data.messages
              .filter((m: AIMessageItem) => m.role !== "system")
              .map((m: AIMessageItem) => ({
                id: m.id,
                role: m.role,
                content: m.content,
                createdAt: m.createdAt,
              }))
          )
        }
      })
      .catch(() => setError("Failed to load conversation history."))
  }, [conversationId])

  // Scroll to bottom after new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  const handleSend = useCallback(
    async (content: string) => {
      setError(null)
      setIsLoading(true)

      const tempId = `temp-${Date.now()}`
      const userMsg: AIMessageItem = {
        id: tempId,
        role: "user",
        content,
        createdAt: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, userMsg])

      try {
        const res = await fetch("/api/ai/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content,
            conversationId: conversationId ?? undefined,
            workspaceId,
          }),
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error ?? "Failed to send message.")
        }

        const result = await res.json()
        const newConvId: string = result.conversationId

        setMessages((prev) => [
          ...prev.filter((m) => m.id !== tempId),
          {
            id: result.userMessage.id,
            role: "user" as const,
            content: result.userMessage.content,
            createdAt: result.userMessage.createdAt,
          },
          {
            id: result.assistantMessage.id,
            role: "assistant" as const,
            content: result.assistantMessage.content,
            createdAt: result.assistantMessage.createdAt,
          },
        ])

        if (result.isNewConversation) {
          // Mark as loaded so the effect doesn't re-fetch what we just added
          loadedConvIdRef.current = newConvId
          const listRes = await fetch(
            `/api/ai/conversations${workspaceId ? `?workspaceId=${workspaceId}` : ""}`
          )
          const listData = await listRes.json()
          onConversationCreated(newConvId, listData.conversations ?? [])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.")
        setMessages((prev) => prev.filter((m) => m.id !== tempId))
      } finally {
        setIsLoading(false)
      }
    },
    [conversationId, workspaceId, onConversationCreated]
  )

  const isEmpty = messages.length === 0 && !isLoading

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-slate-50/60">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-black/6 bg-white/80 px-5 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-full border border-indigo-200 bg-indigo-50 text-indigo-600">
            <Bot className="size-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Executive AI</p>
            <p className="text-[11px] text-slate-400">MyBoss360</p>
          </div>
        </div>
        <AIStatusBadge providerName="Mock Provider" status="active" />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            {error && (
              <p className="w-full rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
                {error}
              </p>
            )}
            <div className="flex size-14 items-center justify-center rounded-full border border-indigo-200 bg-indigo-50">
              <Bot className="size-7 text-indigo-500" />
            </div>
            <div>
              <p className="text-base font-semibold text-slate-800">
                Good morning, Executive.
              </p>
              <p className="mt-1 text-sm text-slate-500">
                I have your business context loaded. What would you like to
                know?
              </p>
            </div>
            <AIPromptSuggestions onSelect={handleSend} />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((msg) => (
              <AIMessage key={msg.id} message={msg} />
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50">
                  <Bot className="size-4 text-slate-400" />
                </div>
                <div className="rounded-2xl rounded-tl-sm border border-black/6 bg-white px-4 py-3 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.08)]">
                  <div className="flex gap-1 py-1">
                    <span className="size-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:0ms]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:150ms]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
            {error && (
              <p className="text-center text-xs text-red-500">{error}</p>
            )}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <AIComposer onSend={handleSend} isLoading={isLoading} />
    </div>
  )
}
