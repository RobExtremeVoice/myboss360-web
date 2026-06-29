import {
  BriefcaseBusiness,
  Bot,
  CalendarDays,
  ChartColumnIncreasing,
  FolderKanban,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import type { CapabilityIcon, HomepageContent } from "@/config/homepage";

const iconMap: Record<CapabilityIcon, LucideIcon> = {
  briefcase: BriefcaseBusiness,
  bot: Bot,
  chart: ChartColumnIncreasing,
  folder: FolderKanban,
  calendar: CalendarDays,
  wallet: Wallet,
};

type PlatformCapabilitiesSectionProps = {
  content: HomepageContent["platformCapabilities"];
};

export function PlatformCapabilitiesSection({
  content,
}: PlatformCapabilitiesSectionProps) {
  return (
    <section id={content.sectionId} className="px-6 py-20 lg:px-8">
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

        <div className="mt-12 grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {content.capabilities.map((capability) => {
            const Icon = iconMap[capability.icon];

            return (
              <article
                key={capability.title}
                className="rounded-[2rem] border border-black/6 bg-white/88 p-7 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.24)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_26px_72px_-38px_rgba(15,23,42,0.3)]"
              >
                <div className="flex size-12 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-[0_18px_36px_-24px_rgba(15,23,42,0.55)]">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-8 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                  {capability.title}
                </h3>
                <p className="mt-4 text-base leading-7 text-slate-600">
                  {capability.description}
                </p>
                <p className="mt-5 text-sm font-medium text-slate-950">{capability.outcome}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
