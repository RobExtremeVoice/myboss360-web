import { SkeletonPageHeader } from "@/components/dashboard/SkeletonCard"

function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={[
        "animate-pulse rounded-xl bg-slate-100",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  )
}

export default function AIAssistantLoading() {
  return (
    <div className="flex flex-col gap-0" aria-label="Loading AI assistant" aria-busy="true">
      <div className="mb-6">
        <SkeletonPageHeader />
      </div>

      <div
        className="flex overflow-hidden rounded-[1.75rem] border border-black/6 bg-white shadow-[0_18px_48px_-36px_rgba(15,23,42,0.18)]"
        style={{ height: "calc(100vh - 14rem)" }}
        aria-hidden="true"
      >
        {/* Sidebar skeleton */}
        <div className="hidden w-64 shrink-0 flex-col border-r border-black/6 p-3 lg:flex">
          <Shimmer className="mb-3 h-9 w-full rounded-full" />
          <div className="space-y-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Shimmer key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        </div>

        {/* Chat skeleton */}
        <div className="flex flex-1 flex-col">
          <div className="flex h-14 items-center gap-3 border-b border-black/6 px-5">
            <Shimmer className="size-8 rounded-full" />
            <div className="space-y-1">
              <Shimmer className="h-3.5 w-24" />
              <Shimmer className="h-3 w-16" />
            </div>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <Shimmer className="size-14 rounded-full" />
            <Shimmer className="h-4 w-48" />
            <Shimmer className="h-3.5 w-64" />
            <div className="flex gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Shimmer key={i} className="h-8 w-28 rounded-full" />
              ))}
            </div>
          </div>
          <div className="border-t border-black/6 p-4">
            <Shimmer className="h-12 w-full rounded-2xl" />
          </div>
        </div>

        {/* Right panel skeleton */}
        <div className="hidden w-72 shrink-0 border-l border-black/6 p-4 xl:flex xl:flex-col xl:gap-3">
          <Shimmer className="h-36 w-full rounded-[1.35rem]" />
          <Shimmer className="h-48 w-full rounded-[1.35rem]" />
        </div>
      </div>
    </div>
  )
}
