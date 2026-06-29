import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { HomepageContent } from "@/config/homepage";

type PricingPreviewSectionProps = {
  content: HomepageContent["pricingPreview"];
};

export function PricingPreviewSection({
  content,
}: PricingPreviewSectionProps) {
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

        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          {content.plans.map((plan) => (
            <article
              key={plan.name}
              className={[
                "rounded-[2.2rem] border p-8 shadow-[0_24px_70px_-48px_rgba(15,23,42,0.26)] transition-all duration-300 hover:-translate-y-1",
                plan.featured
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-black/6 bg-white/92 text-slate-950",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p
                    className={
                      plan.featured ? "text-sm font-medium text-white/65" : "text-sm font-medium text-slate-500"
                    }
                  >
                    {plan.name}
                  </p>
                  <div className="mt-4 flex items-end gap-1">
                    <span className="text-4xl font-semibold tracking-[-0.05em]">
                      {plan.price}
                    </span>
                    {plan.cadence ? (
                      <span className={plan.featured ? "pb-1 text-white/65" : "pb-1 text-slate-500"}>
                        {plan.cadence}
                      </span>
                    ) : null}
                  </div>
                </div>
                {plan.badge ? (
                  <div
                    className={
                      plan.featured
                        ? "rounded-full border border-white/12 bg-white/8 px-3 py-1 text-xs font-medium text-white"
                        : "rounded-full border border-black/6 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600"
                    }
                  >
                    {plan.badge}
                  </div>
                ) : null}
              </div>

              <p className={plan.featured ? "mt-5 text-base leading-7 text-white/72" : "mt-5 text-base leading-7 text-slate-600"}>
                {plan.description}
              </p>

              <div className="mt-8 space-y-3">
                {plan.features.map((feature) => (
                  <div key={feature.label} className="flex items-center gap-3">
                    <div
                      className={
                        plan.featured
                          ? "flex size-6 items-center justify-center rounded-full bg-white/10 text-white"
                          : "flex size-6 items-center justify-center rounded-full bg-slate-950 text-white"
                      }
                    >
                      <Check className="size-3.5" />
                    </div>
                    <p className={plan.featured ? "text-sm text-white/78" : "text-sm text-slate-600"}>
                      {feature.label}
                    </p>
                  </div>
                ))}
              </div>

              <Button
                asChild
                size="lg"
                variant={plan.featured ? "secondary" : "default"}
                className={
                  plan.featured
                    ? "mt-8 rounded-full bg-white px-6 text-slate-950 hover:bg-white/90"
                    : "mt-8 rounded-full px-6"
                }
              >
                <a href={plan.cta.href}>{plan.cta.label}</a>
              </Button>
            </article>
          ))}
        </div>

        <p className="mt-6 text-sm text-slate-500">{content.footnote}</p>
      </div>
    </section>
  );
}
