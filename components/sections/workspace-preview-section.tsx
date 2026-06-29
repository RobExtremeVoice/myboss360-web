import type { HomepageContent } from "@/config/homepage";

type WorkspacePreviewSectionProps = {
  content: HomepageContent["workspacePreview"];
};

export function WorkspacePreviewSection({
  content,
}: WorkspacePreviewSectionProps) {
  return (
    <section id={content.sectionId} className="px-6 py-20 lg:px-8 lg:py-24">
      <div className="mx-auto w-full max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-sm font-medium tracking-[0.22em] text-slate-500 uppercase">
            {content.eyebrow}
          </p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">
            {content.title}
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">{content.description}</p>
        </div>

        <div className="mt-12 overflow-hidden rounded-[2.75rem] border border-black/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(248,250,252,0.98)_100%)] p-4 shadow-[0_40px_120px_-58px_rgba(15,23,42,0.4)] backdrop-blur-xl sm:p-6 lg:p-8">
          <div className="rounded-[2.2rem] border border-black/6 bg-white/92 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
            <div className="flex flex-col gap-4 border-b border-black/6 px-5 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-7">
              <div>
                <p className="text-sm font-medium text-slate-500">MyBoss360 workspace</p>
                <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                  Executive operations view
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {content.promptChips.map((chip) => (
                  <div
                    key={chip}
                    className="rounded-full border border-black/8 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600"
                  >
                    {chip}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 px-5 py-5 lg:grid-cols-4 lg:px-7">
              {content.kpis.map((kpi) => (
                <article
                  key={kpi.title}
                  className="rounded-[1.6rem] border border-black/6 bg-white/88 p-5 shadow-[0_18px_48px_-36px_rgba(15,23,42,0.28)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_-36px_rgba(15,23,42,0.34)]"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-medium text-slate-500">{kpi.title}</p>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                      {kpi.trend}
                    </span>
                  </div>
                  <p className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-slate-950">
                    {kpi.value}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{kpi.detail}</p>
                </article>
              ))}
            </div>

            <div className="grid gap-5 border-t border-black/6 px-5 py-5 xl:grid-cols-[220px_minmax(0,1fr)_320px] lg:px-7">
              <aside className="rounded-[1.8rem] border border-black/6 bg-slate-950 p-5 text-white">
                <p className="text-sm font-medium text-white/60">Today&apos;s agenda</p>
                <div className="mt-5 space-y-4">
                  {content.agenda.map((item) => (
                    <div
                      key={item.time + item.title}
                      className="rounded-[1.35rem] border border-white/10 bg-white/6 p-4"
                    >
                      <p className="text-sm font-medium text-white/70">{item.time}</p>
                      <p className="mt-2 text-base font-medium text-white">{item.title}</p>
                      <p className="mt-2 text-sm leading-6 text-white/70">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </aside>

              <div className="rounded-[1.8rem] border border-black/6 bg-slate-50/70 p-4 sm:p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Execution board</p>
                    <p className="mt-1 text-xl font-semibold tracking-[-0.03em] text-slate-950">
                      Weekly operating lanes
                    </p>
                  </div>
                  <div className="rounded-full border border-black/6 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                    Live leadership view
                  </div>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-3">
                  {content.boardColumns.map((column) => (
                    <div
                      key={column.title}
                      className="rounded-[1.45rem] border border-black/6 bg-white p-4 shadow-[0_16px_40px_-34px_rgba(15,23,42,0.24)]"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-sm font-medium text-slate-950">{column.title}</p>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          {column.count}
                        </span>
                      </div>
                      <div className="mt-4 space-y-3">
                        {column.items.map((item) => (
                          <div
                            key={item}
                            className="rounded-[1.15rem] border border-black/6 bg-slate-50 px-3 py-3 text-sm leading-6 text-slate-600"
                          >
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <aside className="rounded-[1.8rem] border border-black/6 bg-white p-5 shadow-[0_18px_48px_-36px_rgba(15,23,42,0.22)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-500">AI recommendations</p>
                    <p className="mt-1 text-xl font-semibold tracking-[-0.03em] text-slate-950">
                      What leadership should do next
                    </p>
                  </div>
                  <div className="rounded-full border border-black/6 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                    Updated now
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  {content.recommendations.map((item) => (
                    <div
                      key={item.title}
                      className="rounded-[1.35rem] border border-black/6 bg-slate-50/70 p-4 transition-colors duration-300 hover:bg-slate-100/80"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-sm font-medium text-slate-950">{item.title}</p>
                        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500">
                          {item.priority}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-600">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
