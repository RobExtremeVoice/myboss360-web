import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { HomepageContent } from "@/config/homepage";

type CtaSectionProps = {
  content: HomepageContent["cta"];
};

export function CtaSection({ content }: CtaSectionProps) {
  return (
    <section id={content.sectionId} className="px-6 py-20 lg:px-8 lg:pb-28">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 rounded-[2.5rem] border border-black/6 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_55%,#f1f5f9_100%)] p-8 shadow-[0_30px_90px_-48px_rgba(15,23,42,0.38)] lg:flex-row lg:items-end lg:justify-between lg:p-12">
        <div className="max-w-3xl">
          <p className="text-sm font-medium tracking-[0.22em] text-slate-500 uppercase">
            {content.eyebrow}
          </p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">
            {content.title}
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">{content.description}</p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <Button asChild size="lg" className="rounded-full px-6 text-sm shadow-sm">
            <a href={content.primaryCta.href}>
              {content.primaryCta.label}
              <ArrowRight className="size-4" />
            </a>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="rounded-full border-black/10 bg-white/80 px-6 text-sm text-slate-700"
          >
            <a href={content.secondaryCta.href}>{content.secondaryCta.label}</a>
          </Button>
        </div>
      </div>
    </section>
  );
}
