"use client"

import { useState } from "react"
import { AIChatWindow } from "@/components/ai/AIChatWindow"
import { AIConversationSidebar } from "@/components/ai/AIConversationSidebar"
import { ExecutiveContextPanel } from "@/components/ai/ExecutiveContextPanel"
import { BossIntelligencePanel } from "@/components/ai/BossIntelligencePanel"
import { PromptPreviewPanel } from "@/components/ai/PromptPreviewPanel"
import type { ConversationListItem } from "@/types/ai"
import type { ExecutiveMetrics, IntelligenceContext } from "@/types/intelligence"
import type { BossIntelligenceSummary } from "@/types/executive"

type Props = {
  initialConversations: ConversationListItem[]
  metrics: ExecutiveMetrics | null
  workspaceId?: string
  context: IntelligenceContext | null
  bossIntelligence: BossIntelligenceSummary | null
  userFullName: string | null
  devToolsEnabled: boolean
}

export function AIAssistantLayout({
  initialConversations,
  metrics,
  workspaceId,
  context,
  bossIntelligence,
  userFullName,
  devToolsEnabled,
}: Props) {
  const [conversations, setConversations] =
    useState<ConversationListItem[]>(initialConversations)
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null)

  function handleNewConversation() {
    setActiveConversationId(null)
  }

  function handleConversationCreated(
    id: string,
    updatedList: ConversationListItem[]
  ) {
    setConversations(updatedList)
    setActiveConversationId(id)
  }

  return (
    <div className="flex flex-col gap-0">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
          Executive AI
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Grounded in your live business context. Powered by Mock Provider.
        </p>
      </div>

      {/* Main layout */}
      <div
        className="flex overflow-hidden rounded-[1.75rem] border border-black/6 bg-white shadow-[0_18px_48px_-36px_rgba(15,23,42,0.18)]"
        style={{ height: "calc(100vh - 14rem)" }}
      >
        {/* Conversation sidebar */}
        <AIConversationSidebar
          conversations={conversations}
          activeId={activeConversationId}
          onSelect={setActiveConversationId}
          onNew={handleNewConversation}
        />

        {/* Chat window */}
        <AIChatWindow
          conversationId={activeConversationId}
          workspaceId={workspaceId}
          onConversationCreated={handleConversationCreated}
        />

        {/* Right panel */}
        <div className="hidden w-72 shrink-0 flex-col gap-4 overflow-y-auto border-l border-black/6 bg-white/60 p-4 xl:flex">
          <ExecutiveContextPanel metrics={metrics} />

          {bossIntelligence ? (
            <BossIntelligencePanel summary={bossIntelligence} />
          ) : null}

          {devToolsEnabled && context ? (
            <PromptPreviewPanel context={context} userFullName={userFullName} />
          ) : null}

          <div className="rounded-xl border border-black/6 bg-slate-50 p-3 text-xs text-slate-500">
            <p className="font-medium text-slate-700">About Mock Provider</p>
            <p className="mt-1 leading-5">
              Responses are deterministic and data-driven. Connect OpenAI,
              Anthropic, or Gemini for generative AI analysis.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
