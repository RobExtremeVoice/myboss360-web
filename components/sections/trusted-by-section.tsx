import type { HomepageContent } from "@/config/homepage";

type TrustedBySectionProps = {
  content: HomepageContent["trustedBy"];
};

export function TrustedBySection({ content }: TrustedBySectionProps) {
  return (
    <section id={content.sectionId} className="px-6 py-8 lg:px-8 lg:py-10">
      <div className="mx-auto w-full max-w-7xl rounded-[2.2rem] border border-black/6 bg-white/72 p-8 shadow-[0_24px_70px_-48px_rgba(15,23,42,0.28)] backdrop-blur-xl">
        <div className="max-w-3xl">
          <p className="text-sm font-medium tracking-[0.22em] text-slate-500 uppercase">
            {content.eyebrow}
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
            {content.title}
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">{content.description}</p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {content.companies.map((company) => (
            <div
              key={company}
              className="rounded-[1.4rem] border border-black/6 bg-white/88 px-5 py-4 text-sm font-medium text-slate-700 transition-all duration-300 hover:-translate-y-0.5 hover:text-slate-950"
            >
              {company}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
