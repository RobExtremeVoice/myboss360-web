function SkeletonBlock({ className }: { className: string }) {
  return <div className={["animate-pulse rounded-[1.35rem] bg-slate-100", className].join(" ")} />;
}

export default function Loading() {
  return (
    <div className="space-y-8 lg:space-y-10">
      <div className="space-y-5">
        <div className="space-y-3">
          <SkeletonBlock className="h-3 w-32" />
          <SkeletonBlock className="h-12 w-72 max-w-full" />
          <SkeletonBlock className="h-6 w-full max-w-3xl" />
        </div>
        <SkeletonBlock className="h-28 w-full" />
      </div>

      <SkeletonBlock className="h-28 w-full" />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-40 w-full" />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <SkeletonBlock className="h-[28rem] w-full" />
        <SkeletonBlock className="h-[28rem] w-full" />
      </section>

      <SkeletonBlock className="h-[18rem] w-full" />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <SkeletonBlock className="h-[26rem] w-full" />
        <SkeletonBlock className="h-[26rem] w-full" />
      </section>
    </div>
  );
}

