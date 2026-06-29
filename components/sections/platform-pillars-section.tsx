import {
  BarChart3,
  Layers3,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import type { HomepageContent, PillarIcon } from "@/config/homepage";

const iconMap: Record<PillarIcon, LucideIcon> = {
  sparkles: Sparkles,
  layers: Layers3,
  shield: ShieldCheck,
  chart: BarChart3,
};

type PlatformPillarsSectionProps = {
  content: HomepageContent["platformPillars"];
};

export function PlatformPillarsSection({
  content,
}: PlatformPillarsSectionProps) {
  return (
    <section id={content.sectionId} className="mx-auto w-full max-w-7xl px-6 py-20 lg:px-8 lg:py-24">
      <div className="max-w-3xl">
        <p className="text-sm font-medium tracking-[0.22em] text-slate-500 uppercase">
          {content.eyebrow}
        </p>
        <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">
          {content.title}
        </h2>
        <p className="mt-5 text-lg leading-8 text-slate-600">{content.description}</p>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        {content.pillars.map((pillar) => {
          const Icon = iconMap[pillar.icon];

          return (
            <article
              key={pillar.title}
              className="rounded-[2rem] border border-black/6 bg-white/88 p-8 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.28)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_32px_80px_-42px_rgba(15,23,42,0.34)]"
            >
              <div className="flex items-start justify-between gap-6">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-[0_18px_34px_-22px_rgba(15,23,42,0.6)]">
                  <Icon className="size-5" />
                </div>
                <span className="rounded-full border border-black/6 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {pillar.accent}
                </span>
              </div>
              <h3 className="mt-8 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                {pillar.title}
              </h3>
              <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
                {pillar.description}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
