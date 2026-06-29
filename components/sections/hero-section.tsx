import { ArrowRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { HomepageContent } from "@/config/homepage";

type HeroSectionProps = {
  content: HomepageContent["hero"];
};

export function HeroSection({ content }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 -z-10 h-[36rem] bg-[radial-gradient(circle_at_top_left,rgba(226,232,240,0.9),transparent_45%),radial-gradient(circle_at_top_right,rgba(241,245,249,0.95),transparent_35%),linear-gradient(180deg,#fafaf9_0%,#f8fafc_48%,#ffffff_100%)]" />
      <div className="mx-auto grid w-full max-w-7xl gap-16 px-6 py-20 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:px-8 lg:py-28">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/80 px-4 py-2 text-sm text-slate-700 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.5)]">
            <Sparkles className="size-4 text-slate-900" />
            <span>{content.eyebrow}</span>
          </div>

          <h1 className="mt-8 text-5xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-6xl lg:text-7xl">
            {content.title}
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
            {content.description}
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
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
              className="rounded-full border-black/10 bg-white/70 px-6 text-sm text-slate-700"
            >
              <a href={content.secondaryCta.href}>{content.secondaryCta.label}</a>
            </Button>
          </div>

          <dl className="mt-16 grid gap-6 border-t border-black/8 pt-8 sm:grid-cols-3">
            {content.metrics.map((metric) => (
              <div key={metric.label} className="space-y-2">
                <dt className="text-3xl font-semibold tracking-[-0.04em] text-slate-950">
                  {metric.value}
                </dt>
                <dd className="text-sm leading-6 text-slate-600">{metric.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative">
          <div className="absolute inset-0 -z-10 rounded-[2rem] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.92),rgba(226,232,240,0.7)_50%,transparent_75%)] blur-2xl" />
          <div className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/85 p-6 shadow-[0_30px_80px_-36px_rgba(15,23,42,0.45)] backdrop-blur">
            <div className="flex items-center justify-between border-b border-black/6 pb-5">
              <div>
                <p className="text-sm font-medium text-slate-500">Executive brief</p>
                <p className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                  Monday, 8:30 AM
                </p>
              </div>
              <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                Ready to review
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {content.insights.map((insight) => (
                <div
                  key={insight.label}
                  className="rounded-2xl border border-black/6 bg-slate-50/90 p-4"
                >
                  <p className="text-sm font-medium text-slate-950">{insight.label}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{insight.detail}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-black/6 bg-white p-4">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                  Priority focus
                </p>
                <p className="mt-3 text-base font-medium text-slate-950">
                  Resolve pricing exceptions before Thursday leadership review.
                </p>
              </div>
              <div className="rounded-2xl border border-black/6 bg-slate-950 p-4 text-white">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/60">
                  AI guidance
                </p>
                <p className="mt-3 text-base font-medium text-white">
                  Draft the meeting brief using live CRM, finance, and project updates.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
