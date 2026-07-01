import {
  SkeletonCard,
  SkeletonKpiCard,
  SkeletonPageHeader,
  SkeletonSectionHeader,
} from "@/components/dashboard/SkeletonCard"

export default function DashboardLoading() {
  return (
    <div className="space-y-8 lg:space-y-10" aria-label="Loading dashboard" aria-busy="true">
      <SkeletonPageHeader />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-hidden="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonKpiCard key={i} />
        ))}
      </section>

      <section className="space-y-6" aria-hidden="true">
        <SkeletonSectionHeader />
        <div className="grid gap-6 xl:grid-cols-2">
          <SkeletonCard lines={4} />
          <SkeletonCard lines={4} />
        </div>
        <div className="grid gap-6 xl:grid-cols-2">
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
        </div>
      </section>
    </div>
  )
}
