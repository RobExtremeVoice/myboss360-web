import type { HomepageContent } from "@/config/homepage";

type EnterpriseFooterProps = {
  brand: HomepageContent["brand"];
  content: HomepageContent["footer"];
};

export function EnterpriseFooter({ brand, content }: EnterpriseFooterProps) {
  return (
    <footer id={content.sectionId} className="px-6 py-10 lg:px-8 lg:py-14">
      <div className="mx-auto w-full max-w-7xl rounded-[2.4rem] border border-black/6 bg-slate-950 px-8 py-10 text-white shadow-[0_36px_110px_-56px_rgba(15,23,42,0.58)] lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div className="max-w-md">
            <p className="text-sm font-semibold tracking-[0.18em] uppercase text-white">
              {brand.name}
            </p>
            <p className="mt-3 text-sm leading-7 text-white/65">{content.description}</p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {content.linkGroups.map((group) => (
              <div key={group.title}>
                <p className="text-sm font-medium text-white/68">{group.title}</p>
                <div className="mt-4 space-y-3">
                  {group.links.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      className="block text-sm text-white/84 transition-colors duration-200 hover:text-white"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-5 text-sm text-white/55">
          {content.copyright}
        </div>
      </div>
    </footer>
  );
}
