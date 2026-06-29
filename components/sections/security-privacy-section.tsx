import type { HomepageContent } from "@/config/homepage";

type SecurityPrivacySectionProps = {
  content: HomepageContent["securityPrivacy"];
};

export function SecurityPrivacySection({
  content,
}: SecurityPrivacySectionProps) {
  return (
    <section id={content.sectionId} className="px-6 py-20 lg:px-8">
      <div className="mx-auto w-full max-w-7xl rounded-[2.6rem] border border-black/6 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-8 shadow-[0_30px_90px_-52px_rgba(15,23,42,0.3)] lg:p-10">
        <div className="max-w-3xl">
          <p className="text-sm font-medium tracking-[0.22em] text-slate-500 uppercase">
            {content.eyebrow}
          </p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">
            {content.title}
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">{content.description}</p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {content.items.map((item) => (
            <article
              key={item.title}
              className="rounded-[1.9rem] border border-black/6 bg-white/90 p-6 shadow-[0_18px_48px_-36px_rgba(15,23,42,0.24)] transition-all duration-300 hover:-translate-y-1"
            >
              <h3 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">
                {item.title}
              </h3>
              <p className="mt-4 text-base leading-7 text-slate-600">{item.description}</p>
              <p className="mt-4 text-sm leading-6 text-slate-500">{item.detail}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
