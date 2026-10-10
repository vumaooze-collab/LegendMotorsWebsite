import { AboutSection, EnquiryBanner } from "@/components/brand-sections";
import { ContactSection } from "@/components/contact-section";
import { HeroSection } from "@/components/hero-section";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { VehicleCatalog } from "@/components/vehicle-catalog";

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main-content">
        <HeroSection />
        <VehicleCatalog featuredOnly />
        <AboutSection />
        <EnquiryBanner />
        <ContactSection />
      </main>
      <SiteFooter />
    </>
  );
}
