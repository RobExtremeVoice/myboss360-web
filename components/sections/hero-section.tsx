import { ArrowRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { HomepageContent } from "@/config/homepage";

type HeroSectionProps = {
  content: HomepageContent["hero"];
};

export function HeroSection({ content }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 -z-20 h-[44rem] bg-[linear-gradient(180deg,#fbfbfa_0%,#f8fafc_55%,#ffffff_100%)]" />
      <div className="absolute inset-x-0 top-[-12rem] -z-10 h-[40rem] bg-[radial-gradient(circle_at_center,rgba(15,23,42,0.09),transparent_32%),radial-gradient(circle_at_top_left,rgba(255,255,255,0.9),transparent_28%),radial-gradient(circle_at_top_right,rgba(226,232,240,0.95),transparent_40%)]" />
      <div className="mx-auto grid w-full max-w-7xl gap-16 px-6 pb-24 pt-16 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:px-8 lg:pb-32 lg:pt-24">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-black/8 bg-white/75 px-4 py-2 text-sm text-slate-700 shadow-[0_20px_50px_-30px_rgba(15,23,42,0.4)] backdrop-blur-xl">
            <Sparkles className="size-4 text-slate-900" />
            <span>{content.eyebrow}</span>
          </div>

          <h1 className="mt-8 max-w-4xl text-5xl font-semibold tracking-[-0.06em] text-slate-950 sm:text-6xl lg:text-[4.75rem] lg:leading-[0.95]">
            {content.title}
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
            {content.description}
          </p>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
            {content.supportingNote}
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Button
              asChild
              size="lg"
              className="rounded-full px-6 text-sm shadow-[0_22px_48px_-28px_rgba(15,23,42,0.45)] transition-transform duration-300 hover:-translate-y-0.5"
            >
              <a href={content.primaryCta.href}>
                {content.primaryCta.label}
                <ArrowRight className="size-4" />
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-full border-black/10 bg-white/60 px-6 text-sm text-slate-700 shadow-[0_16px_36px_-26px_rgba(15,23,42,0.32)] transition-colors duration-300 hover:bg-white"
            >
              <a href={content.secondaryCta.href}>{content.secondaryCta.label}</a>
            </Button>
          </div>

          <dl className="mt-16 grid gap-6 border-t border-black/8 pt-8 sm:grid-cols-3">
            {content.metrics.map((metric) => (
              <div
                key={metric.label}
                className="space-y-2 rounded-[1.5rem] border border-white/70 bg-white/55 p-5 shadow-[0_18px_44px_-34px_rgba(15,23,42,0.3)] backdrop-blur-sm transition-transform duration-300 hover:-translate-y-1"
              >
                <dt className="text-3xl font-semibold tracking-[-0.05em] text-slate-950">
                  {metric.value}
                </dt>
                <dd className="text-sm leading-6 text-slate-600">{metric.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative lg:pl-6">
          <div className="absolute inset-0 -z-10 rounded-[2.5rem] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.92),rgba(226,232,240,0.72)_55%,transparent_78%)] blur-3xl" />
          <div className="overflow-hidden rounded-[2.25rem] border border-white/75 bg-white/72 p-5 shadow-[0_40px_100px_-50px_rgba(15,23,42,0.42)] backdrop-blur-2xl sm:p-6">
            <div className="rounded-[1.8rem] border border-black/6 bg-slate-950 p-5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <p className="text-sm font-medium text-white/60">Executive command brief</p>
                  <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-white">
                    Monday, 8:30 AM
                  </p>
                </div>
                <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
                  Board-ready
                </div>
              </div>

              <div className="mt-6 grid gap-4">
                {content.insights.map((insight) => (
                  <div
                    key={insight.label}
                    className="rounded-[1.4rem] border border-white/10 bg-white/6 p-4 backdrop-blur-sm transition-colors duration-300 hover:bg-white/10"
                  >
                    <p className="text-sm font-medium text-white">{insight.label}</p>
                    <p className="mt-2 text-sm leading-6 text-white/68">{insight.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
              <div className="rounded-[1.8rem] border border-black/6 bg-white/88 p-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.26)]">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                  Leadership focus
                </p>
                <p className="mt-3 text-lg font-semibold tracking-[-0.03em] text-slate-950">
                  Resolve pricing exceptions and confirm the hiring sequence before Thursday.
                </p>
                <div className="mt-5 flex items-center justify-between rounded-[1.3rem] border border-black/6 bg-slate-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-950">Decision confidence</p>
                    <p className="text-sm text-slate-500">Prepared from live operating context</p>
                  </div>
                  <p className="text-xl font-semibold tracking-[-0.04em] text-slate-950">94%</p>
                </div>
              </div>

              <div className="rounded-[1.8rem] border border-black/6 bg-white/72 p-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.26)] backdrop-blur-xl">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                  AI guidance
                </p>
                <p className="mt-3 text-base font-medium leading-7 text-slate-900">
                  “Prepare a renewal briefing that combines CRM notes, delivery risk, margin pressure, and executive follow-ups.”
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-medium text-white">
                    Revenue
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    Projects
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    Finance
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
