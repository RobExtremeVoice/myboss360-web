import { SiteHeader } from "@/components/layout/site-header";
import { CtaSection } from "@/components/sections/cta-section";
import { HeroSection } from "@/components/sections/hero-section";
import { PlatformPillarsSection } from "@/components/sections/platform-pillars-section";
import { WorkspacePreviewSection } from "@/components/sections/workspace-preview-section";
import { homepageContent } from "@/config/homepage";

export default function Home() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fafaf9_0%,#ffffff_28%,#f8fafc_100%)]">
      <SiteHeader
        brand={homepageContent.brand}
        navigation={homepageContent.navigation}
        cta={homepageContent.hero.primaryCta}
      />
      <main>
        <HeroSection content={homepageContent.hero} />
        <PlatformPillarsSection content={homepageContent.platformPillars} />
        <WorkspacePreviewSection content={homepageContent.workspacePreview} />
        <CtaSection content={homepageContent.cta} />
      </main>
    </div>
  );
}
