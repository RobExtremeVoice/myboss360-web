"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
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

function timeGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

function ConversationLoadingState() {
  return (
    <div className="flex flex-col gap-4 py-2" aria-label="Loading conversation" aria-busy="true">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className={["flex gap-3", i % 2 === 1 ? "flex-row-reverse" : "flex-row"].join(" ")}
          aria-hidden="true"
        >
          <div className="size-8 animate-pulse shrink-0 rounded-full bg-slate-100" />
          <div
            className="animate-pulse rounded-2xl bg-slate-100"
            style={{ width: `${40 + (i % 3) * 20}%`, height: 56 }}
          />
        </div>
      ))}
    </div>
  )
}

export function AIChatWindow({
  conversationId,
  workspaceId,
  onConversationCreated,
}: Props) {
  const [messages, setMessages] = useState<AIMessageItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const loadedConvIdRef = useRef<string | null>(null)

  const greeting = useMemo(() => timeGreeting(), [])

  // Load messages when the conversation prop changes
  useEffect(() => {
    if (loadedConvIdRef.current === conversationId) return

    loadedConvIdRef.current = conversationId

    // Batch all synchronous state resets so React can merge them in one render
    setMessages([])
    setError(null)
    setIsLoadingHistory(conversationId !== null)

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
      .catch(() => setError("Failed to load conversation history. Try selecting the conversation again."))
      .finally(() => setIsLoadingHistory(false))
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
          loadedConvIdRef.current = newConvId
          const listRes = await fetch(
            `/api/ai/conversations${workspaceId ? `?workspaceId=${workspaceId}` : ""}`
          )
          const listData = await listRes.json()
          onConversationCreated(newConvId, listData.conversations ?? [])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
        setMessages((prev) => prev.filter((m) => m.id !== tempId))
      } finally {
        setIsLoading(false)
      }
    },
    [conversationId, workspaceId, onConversationCreated]
  )

  const isEmpty = messages.length === 0 && !isLoading && !isLoadingHistory

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-slate-50/60">
      {/* Header */}
      <div
        className="flex items-center justify-between border-b border-black/6 bg-white/80 px-5 py-3 backdrop-blur-sm"
        role="banner"
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex size-8 items-center justify-center rounded-full border border-indigo-200 bg-indigo-50 text-indigo-600"
            aria-hidden="true"
          >
            <Bot className="size-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Executive AI</p>
            <p className="text-[11px] text-slate-400">MyBoss360</p>
          </div>
        </div>
        <AIStatusBadge providerName="AI" status="active" />
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-5 py-4"
        role="log"
        aria-label="Conversation messages"
        aria-live="polite"
      >
        {isLoadingHistory ? (
          <ConversationLoadingState />
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            {error && (
              <p
                className="w-full rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600"
                role="alert"
              >
                {error}
              </p>
            )}
            <div
              className="flex size-14 items-center justify-center rounded-full border border-indigo-200 bg-indigo-50"
              aria-hidden="true"
            >
              <Bot className="size-7 text-indigo-500" />
            </div>
            <div>
              <p className="text-base font-semibold text-slate-800">
                {greeting}, Executive.
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Your business context is loaded. What would you like to know?
              </p>
            </div>
            <AIPromptSuggestions onSelect={handleSend} />
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {messages.map((msg) => (
              <AIMessage key={msg.id} message={msg} />
            ))}
            {isLoading && (
              <div className="flex gap-3" aria-label="Executive AI is thinking" aria-busy="true">
                <div
                  className="flex size-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50"
                  aria-hidden="true"
                >
                  <Bot className="size-4 text-slate-400" />
                </div>
                <div className="rounded-2xl rounded-tl-sm border border-black/6 bg-white px-4 py-3 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.08)]">
                  <div className="flex items-center gap-1.5 py-0.5">
                    <span className="size-1.5 animate-bounce rounded-full bg-indigo-300 [animation-delay:0ms]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:120ms]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-indigo-500 [animation-delay:240ms]" />
                  </div>
                </div>
              </div>
            )}
            {error && (
              <p className="text-center text-xs text-red-500" role="alert">
                {error}
              </p>
            )}
          </div>
        )}
        <div ref={bottomRef} aria-hidden="true" />
      </div>

      {/* Composer */}
      <AIComposer onSend={handleSend} isLoading={isLoading} />
    </div>
  )
}
