"use client"

import { ArrowUp, Loader2 } from "lucide-react"
import { useRef, useState } from "react"
import { cn } from "@/lib/utils"

type Props = {
  onSend: (content: string) => void
  isLoading: boolean
  disabled?: boolean
}

export function AIComposer({ onSend, isLoading, disabled }: Props) {
  const [value, setValue] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleSubmit() {
    const trimmed = value.trim()
    if (!trimmed || isLoading) return
    onSend(trimmed)
    setValue("")
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value)
    // Auto-grow textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }

  const canSend = value.trim().length > 0 && !isLoading && !disabled

  return (
    <div className="border-t border-black/6 bg-white/80 px-4 py-4 backdrop-blur-sm">
      <div className="flex items-end gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3 shadow-[0_4px_16px_-8px_rgba(15,23,42,0.12)] focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-400/30 transition-all">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Ask your Executive AI anything…"
          rows={1}
          disabled={isLoading || disabled}
          className="min-h-[24px] flex-1 resize-none bg-transparent text-sm leading-6 text-slate-800 placeholder:text-slate-400 focus:outline-none disabled:opacity-50"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSend}
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full transition-all",
            canSend
              ? "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"
          )}
          aria-label="Send message"
        >
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ArrowUp className="size-4" />
          )}
        </button>
      </div>
      <p className="mt-2 text-center text-[11px] text-slate-400">
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  )
}
