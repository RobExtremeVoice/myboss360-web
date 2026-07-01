import type { ReactNode } from "react"

type Props = {
  icon: ReactNode
  label: string
  title: string
  description: string
  nextAction?: string
  badge?: string
}

export function ExecutiveEmptyState({
  icon,
  label,
  title,
  description,
  nextAction,
  badge = "Coming in Release 2",
}: Props) {
  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
          {label}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">{description}</p>
      </div>

      <div className="rounded-[1.75rem] border border-black/6 bg-white p-8 shadow-[0_18px_48px_-36px_rgba(15,23,42,0.18)]">
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-black/6 bg-slate-50 text-slate-400">
            {icon}
          </div>
          <div className="max-w-xl">
            <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
              {badge}
            </span>
            <h2 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-slate-950">
              {title}
            </h2>
            {nextAction ? (
              <p className="mt-2 text-sm leading-6 text-slate-500">{nextAction}</p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
