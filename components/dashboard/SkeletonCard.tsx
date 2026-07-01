import { cn } from "@/lib/utils"

// Single shimmer block
function Shimmer({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-slate-100", className)} />
}

// Full-height skeleton card matching SectionCard
export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-[1.75rem] border border-black/6 bg-white shadow-[0_18px_48px_-36px_rgba(15,23,42,0.18)]">
      <div className="border-b border-black/8 px-6 py-5">
        <Shimmer className="h-4 w-36" />
        <Shimmer className="mt-2 h-3 w-52" />
      </div>
      <div className="space-y-3 px-6 py-5">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-3 rounded-[1.1rem] border border-black/4 bg-slate-50/70 px-4 py-3"
          >
            <div className="min-w-0 flex-1 space-y-1.5">
              <Shimmer className="h-3.5 w-3/4" />
              <Shimmer className="h-3 w-1/2" />
            </div>
            <Shimmer className="h-5 w-14 shrink-0 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

// KPI card skeleton
export function SkeletonKpiCard() {
  return (
    <div className="rounded-[1.75rem] border border-black/6 bg-white p-5 shadow-[0_18px_44px_-34px_rgba(15,23,42,0.14)] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <Shimmer className="h-3.5 w-24" />
          <Shimmer className="mt-4 h-8 w-28" />
          <Shimmer className="mt-2 h-3 w-32" />
        </div>
        <Shimmer className="h-6 w-16 shrink-0 rounded-full" />
      </div>
      <div className="mt-5 flex items-end justify-between gap-4">
        <Shimmer className="h-4 w-40" />
        <Shimmer className="h-8 w-16 shrink-0 rounded-lg" />
      </div>
    </div>
  )
}

// Page header skeleton
export function SkeletonPageHeader() {
  return (
    <div className="space-y-2">
      <Shimmer className="h-9 w-48" />
      <Shimmer className="h-4 w-80" />
    </div>
  )
}

// Section heading row skeleton
export function SkeletonSectionHeader() {
  return (
    <div className="space-y-1.5">
      <Shimmer className="h-4 w-40" />
      <Shimmer className="h-3.5 w-64" />
    </div>
  )
}
