import { AiExecutiveAssistantSection } from "@/components/sections/ai-executive-assistant-section";
import { SiteHeader } from "@/components/layout/site-header";
import { CtaSection } from "@/components/sections/cta-section";
import { EnterpriseFooter } from "@/components/sections/enterprise-footer";
import { HeroSection } from "@/components/sections/hero-section";
import { PlatformCapabilitiesSection } from "@/components/sections/platform-capabilities-section";
import { PlatformPillarsSection } from "@/components/sections/platform-pillars-section";
import { PricingPreviewSection } from "@/components/sections/pricing-preview-section";
import { SecurityPrivacySection } from "@/components/sections/security-privacy-section";
import { TestimonialsSection } from "@/components/sections/testimonials-section";
import { TrustedBySection } from "@/components/sections/trusted-by-section";
import { WorkspacePreviewSection } from "@/components/sections/workspace-preview-section";
import { homepageContent } from "@/config/homepage";

export default function Home() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fbfbfa_0%,#ffffff_24%,#f8fafc_100%)]">
      <SiteHeader
        brand={homepageContent.brand}
        navigation={homepageContent.navigation}
        cta={homepageContent.hero.primaryCta}
      />
      <main>
        <HeroSection content={homepageContent.hero} />
        <TrustedBySection content={homepageContent.trustedBy} />
        <PlatformPillarsSection content={homepageContent.platformPillars} />
        <PlatformCapabilitiesSection content={homepageContent.platformCapabilities} />
        <WorkspacePreviewSection content={homepageContent.workspacePreview} />
        <AiExecutiveAssistantSection content={homepageContent.aiExecutiveAssistant} />
        <SecurityPrivacySection content={homepageContent.securityPrivacy} />
        <TestimonialsSection content={homepageContent.testimonials} />
        <PricingPreviewSection content={homepageContent.pricingPreview} />
        <CtaSection content={homepageContent.cta} />
      </main>
      <EnterpriseFooter
        brand={homepageContent.brand}
        content={homepageContent.footer}
      />
    </div>
  );
}
