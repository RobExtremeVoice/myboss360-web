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
      className="sticky top-0 z-30 border-b border-black/5 bg-white/80 backdrop-blur-xl"
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-6 py-4 lg:px-8">
        <a href="#top" className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl border border-black/10 bg-white shadow-[0_12px_30px_-20px_rgba(15,23,42,0.55)]">
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

        <nav className="hidden items-center gap-8 md:flex">
          {navigation.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm text-slate-600 transition-colors hover:text-slate-950"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <Button asChild size="lg" className="rounded-full px-5 shadow-sm">
          <a href={cta.href}>{cta.label}</a>
        </Button>
      </div>
    </header>
  );
}
