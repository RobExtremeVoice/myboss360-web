import type { HomepageContent } from "@/config/homepage";

type TestimonialsSectionProps = {
  content: HomepageContent["testimonials"];
};

export function TestimonialsSection({ content }: TestimonialsSectionProps) {
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

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {content.items.map((item) => (
            <article
              key={item.name + item.company}
              className="flex h-full flex-col justify-between rounded-[2rem] border border-black/6 bg-white/88 p-7 shadow-[0_20px_60px_-44px_rgba(15,23,42,0.28)] transition-all duration-300 hover:-translate-y-1"
            >
              <p className="text-base leading-8 text-slate-700">&ldquo;{item.quote}&rdquo;</p>
              <div className="mt-8 border-t border-black/6 pt-5">
                <p className="text-sm font-semibold text-slate-950">{item.name}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {item.role}, {item.company}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
