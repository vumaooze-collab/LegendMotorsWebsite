import { AboutSection, EnquiryBanner, ServicesSection, WhyChooseSection } from "@/components/brand-sections";
import { BusinessActions } from "@/components/business-actions";
import { ContactSection } from "@/components/contact-section";
import { HeroSection, QuickShoppingBar } from "@/components/hero-section";
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
        <QuickShoppingBar />
        <VehicleCatalog />
        <ServicesSection />
        <BusinessActions />
        <WhyChooseSection />
        <AboutSection />
        <EnquiryBanner />
        <ContactSection />
      </main>
      <SiteFooter />
    </>
  );
}
