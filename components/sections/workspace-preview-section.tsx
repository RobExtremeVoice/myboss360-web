import type { HomepageContent } from "@/config/homepage";

type WorkspacePreviewSectionProps = {
  content: HomepageContent["workspacePreview"];
};

export function WorkspacePreviewSection({
  content,
}: WorkspacePreviewSectionProps) {
  return (
    <section id={content.sectionId} className="px-6 py-20 lg:px-8">
      <div className="mx-auto w-full max-w-7xl overflow-hidden rounded-[2.5rem] border border-black/6 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-8 shadow-[0_30px_90px_-48px_rgba(15,23,42,0.4)] lg:p-12">
        <div className="max-w-3xl">
          <p className="text-sm font-medium tracking-[0.22em] text-slate-500 uppercase">
            {content.eyebrow}
          </p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">
            {content.title}
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">{content.description}</p>
        </div>

        <div className="mt-12 space-y-6">
          <div className="grid gap-4 lg:grid-cols-3">
            {content.summaryCards.map((card) => (
              <article
                key={card.title}
                className="rounded-[1.75rem] border border-black/6 bg-white p-6"
              >
                <p className="text-sm font-medium text-slate-500">{card.title}</p>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
                  {card.value}
                </p>
                <p className="mt-4 text-sm leading-6 text-slate-600">{card.detail}</p>
              </article>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div className="rounded-[2rem] border border-black/6 bg-white p-6">
              <div className="flex items-center justify-between gap-4 border-b border-black/6 pb-5">
                <div>
                  <p className="text-sm font-medium text-slate-500">Weekly workspace</p>
                  <p className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                    Execution lanes
                  </p>
                </div>
                <div className="rounded-full border border-black/8 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                  Live marketing preview
                </div>
              </div>

              <div className="mt-6 grid gap-4">
                {content.executionLanes.map((lane, index) => (
                  <div
                    key={lane.title}
                    className="rounded-[1.5rem] border border-black/6 bg-slate-50/80 p-5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-full bg-slate-950 text-xs font-semibold text-white">
                        0{index + 1}
                      </div>
                      <p className="text-base font-medium text-slate-950">{lane.title}</p>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{lane.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-6">
              <div className="rounded-[2rem] border border-black/6 bg-slate-950 p-6 text-white">
                <p className="text-sm font-medium text-white/70">AI advisor</p>
                <div className="mt-6 space-y-4">
                  {content.assistantFeed.map((item) => (
                    <div
                      key={item.title}
                      className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4"
                    >
                      <p className="text-sm font-medium text-white">{item.title}</p>
                      <p className="mt-2 text-sm leading-6 text-white/70">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-black/6 bg-white p-6">
                <p className="text-sm font-medium text-slate-500">Suggested prompts</p>
                <div className="mt-5 flex flex-wrap gap-3">
                  {content.advisorPrompts.map((prompt) => (
                    <div
                      key={prompt}
                      className="rounded-full border border-black/8 bg-slate-50 px-4 py-2 text-sm text-slate-700"
                    >
                      {prompt}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
