"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, Code2 } from "lucide-react"
import { buildSystemPrompt } from "@/services/ai/prompt-builder"
import type { IntelligenceContext } from "@/types/intelligence"

type Props = {
  context: IntelligenceContext
  userFullName: string | null
}

function estimateTokens(text: string): number {
  // ~4 chars per token (rough approximation used by most providers)
  return Math.ceil(text.length / 4)
}

export function PromptPreviewPanel({ context, userFullName }: Props) {
  const [open, setOpen] = useState(false)

  const prompt = buildSystemPrompt({ context, userFullName })
  const tokenEstimate = estimateTokens(prompt)

  const sourceCount = [
    context.emailIntelligence.criticalThreads.length > 0 ? "Gmail (critical)" : null,
    context.emailIntelligence.awaitingReplies.length > 0 ? "Gmail (awaiting)" : null,
    context.todayAgenda.length > 0 ? "Calendar" : null,
    context.recentMemories.length > 0 ? "Memory" : null,
    context.activeRecommendations.length > 0 ? "Recommendations" : null,
    context.learningSignals.length > 0 ? "Signals" : null,
  ].filter(Boolean)

  return (
    <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/60 text-xs">
      <button
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-amber-700 hover:bg-amber-50"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <div className="flex items-center gap-1.5">
          <Code2 className="size-3.5 shrink-0" />
          <span className="font-semibold">Dev: Prompt Preview</span>
        </div>
        {open ? (
          <ChevronDown className="size-3.5 shrink-0" />
        ) : (
          <ChevronRight className="size-3.5 shrink-0" />
        )}
      </button>

      {open ? (
        <div className="border-t border-amber-200 px-3 py-3 space-y-3">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-1.5">
            <div className="rounded-lg bg-white border border-amber-200 px-2.5 py-2">
              <p className="text-[10px] text-amber-600 font-medium">Est. tokens</p>
              <p className="text-sm font-semibold text-slate-900 tabular-nums">{tokenEstimate.toLocaleString()}</p>
            </div>
            <div className="rounded-lg bg-white border border-amber-200 px-2.5 py-2">
              <p className="text-[10px] text-amber-600 font-medium">Memories</p>
              <p className="text-sm font-semibold text-slate-900 tabular-nums">{context.recentMemories.length}</p>
            </div>
            <div className="rounded-lg bg-white border border-amber-200 px-2.5 py-2">
              <p className="text-[10px] text-amber-600 font-medium">Signals</p>
              <p className="text-sm font-semibold text-slate-900 tabular-nums">{context.learningSignals.length}</p>
            </div>
            <div className="rounded-lg bg-white border border-amber-200 px-2.5 py-2">
              <p className="text-[10px] text-amber-600 font-medium">Recommendations</p>
              <p className="text-sm font-semibold text-slate-900 tabular-nums">{context.activeRecommendations.length}</p>
            </div>
          </div>

          {/* Active sources */}
          {sourceCount.length > 0 ? (
            <div>
              <p className="text-[10px] font-medium text-amber-600 mb-1.5">Active sources</p>
              <div className="flex flex-wrap gap-1">
                {sourceCount.map((src) => (
                  <span
                    key={src}
                    className="rounded-full border border-amber-200 bg-white px-2 py-0.5 text-[10px] text-slate-600"
                  >
                    {src}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {/* Prompt preview */}
          <div>
            <p className="text-[10px] font-medium text-amber-600 mb-1.5">System prompt</p>
            <textarea
              readOnly
              value={prompt}
              rows={8}
              className="w-full resize-none rounded-lg border border-amber-200 bg-white p-2 font-mono text-[10px] text-slate-700 leading-relaxed"
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}
