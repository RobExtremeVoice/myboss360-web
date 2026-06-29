import type { HomepageContent } from "@/config/homepage";

type AiExecutiveAssistantSectionProps = {
  content: HomepageContent["aiExecutiveAssistant"];
};

export function AiExecutiveAssistantSection({
  content,
}: AiExecutiveAssistantSectionProps) {
  return (
    <section id={content.sectionId} className="px-6 py-20 lg:px-8 lg:py-24">
      <div className="mx-auto grid w-full max-w-7xl gap-8 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <div className="max-w-2xl">
          <p className="text-sm font-medium tracking-[0.22em] text-slate-500 uppercase">
            {content.eyebrow}
          </p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">
            {content.title}
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">{content.description}</p>

          <div className="mt-8 space-y-4">
            {content.features.map((feature) => (
              <article
                key={feature.title}
                className="rounded-[1.7rem] border border-black/6 bg-white/88 p-5 shadow-[0_16px_42px_-34px_rgba(15,23,42,0.24)]"
              >
                <h3 className="text-lg font-semibold text-slate-950">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-[2.4rem] border border-black/6 bg-slate-950 p-5 text-white shadow-[0_32px_100px_-54px_rgba(15,23,42,0.5)] sm:p-6">
          <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-5">
            <div>
              <p className="text-sm font-medium text-white/60">Assistant command deck</p>
              <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-white">
                AI Executive Assistant
              </p>
            </div>
            <div className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs font-medium text-white/70">
              Context aware
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            {content.panels.map((panel) => (
              <div
                key={panel.title}
                className="rounded-[1.5rem] border border-white/10 bg-white/6 p-5 transition-colors duration-300 hover:bg-white/10"
              >
                <p className="text-base font-medium text-white">{panel.title}</p>
                <p className="mt-2 text-sm leading-6 text-white/70">{panel.detail}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-[1.6rem] border border-white/10 bg-white/6 p-5">
            <p className="text-sm font-medium text-white/60">Suggested prompts</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {content.promptChips.map((chip) => (
                <div
                  key={chip}
                  className="rounded-full border border-white/10 bg-white/8 px-3 py-2 text-xs font-medium text-white/78"
                >
                  {chip}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
