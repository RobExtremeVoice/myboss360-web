import {
  SkeletonCard,
  SkeletonPageHeader,
} from "@/components/dashboard/SkeletonCard"

export default function CalendarLoading() {
  return (
    <div className="space-y-8 lg:space-y-10" aria-label="Loading calendar" aria-busy="true">
      <SkeletonPageHeader />
      <section
        className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]"
        aria-hidden="true"
      >
        <SkeletonCard lines={5} />
        <div className="space-y-6">
          <SkeletonCard lines={2} />
          <SkeletonCard lines={3} />
        </div>
      </section>
    </div>
  )
}
