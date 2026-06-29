import { Button } from "@/components/ui/button";
import type { HomepageContent } from "@/config/homepage";

type SiteHeaderProps = {
  brand: HomepageContent["brand"];
  navigation: HomepageContent["navigation"];
  cta: HomepageContent["hero"]["primaryCta"];
};

export function SiteHeader({ brand, navigation, cta }: SiteHeaderProps) {
  return (
    <header
      id="top"
      className="sticky top-0 z-40 border-b border-black/5 bg-white/75 backdrop-blur-2xl"
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-6 py-4 lg:px-8">
        <div className="flex items-center justify-between gap-6">
          <a href="#top" className="min-w-0 transition-transform duration-300 hover:scale-[1.01]">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl border border-white/80 bg-white/90 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.4)]">
                <span className="text-sm font-semibold tracking-[0.24em] text-slate-950">
                  MB
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold tracking-[0.18em] text-slate-950 uppercase">
                  {brand.name}
                </p>
                <p className="text-xs text-slate-500">{brand.tagline}</p>
              </div>
            </div>
          </a>

          <nav className="hidden items-center gap-2 rounded-full border border-black/5 bg-white/70 p-1 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.35)] md:flex">
            {navigation.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-full px-4 py-2 text-sm text-slate-600 transition-colors duration-200 hover:bg-slate-950 hover:text-white"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <Button
            asChild
            size="lg"
            className="rounded-full px-5 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.38)] transition-transform duration-300 hover:-translate-y-0.5"
          >
            <a href={cta.href}>{cta.label}</a>
          </Button>
        </div>

        <nav className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1 md:hidden">
          {navigation.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="shrink-0 rounded-full border border-black/8 bg-white/80 px-4 py-2 text-sm text-slate-600 transition-colors duration-200 hover:border-slate-950 hover:text-slate-950"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
