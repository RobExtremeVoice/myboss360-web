"use client"

import { BarChart2, Calendar, CheckSquare, MessageSquare, Target, TrendingDown } from "lucide-react"

const suggestions = [
  {
    icon: MessageSquare,
    label: "Morning briefing",
    prompt: "Give me my executive briefing. What should I focus on today?",
  },
  {
    icon: BarChart2,
    label: "Pipeline health",
    prompt: "What's the current state of my sales pipeline? Any deals at risk?",
  },
  {
    icon: CheckSquare,
    label: "Overdue tasks",
    prompt: "What tasks are overdue? Summarize by priority.",
  },
  {
    icon: Calendar,
    label: "Today's agenda",
    prompt: "What's on my calendar today?",
  },
  {
    icon: TrendingDown,
    label: "Top risks",
    prompt: "What are the top business risks I should be aware of right now?",
  },
  {
    icon: Target,
    label: "Opportunities",
    prompt: "What growth opportunities or follow-ups should I act on this week?",
  },
] as const

type Props = {
  onSelect: (prompt: string) => void
}

export function AIPromptSuggestions({ onSelect }: Props) {
  return (
    <div className="px-4 pb-2">
      <p className="mb-3 text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
        Quick prompts
      </p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s) => {
          const Icon = s.icon
          return (
            <button
              key={s.label}
              type="button"
              onClick={() => onSelect(s.prompt)}
              className="inline-flex items-center gap-1.5 rounded-full border border-black/8 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 active:scale-95"
            >
              <Icon className="size-3" />
              {s.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
