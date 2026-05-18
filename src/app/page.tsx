/**
 * LANDING PAGE — Akhila PCOS Metabolic Programme
 *
 * Server component. Each section is a small client island in
 * src/components/landing/sections/ so HMR is incremental and the initial
 * compile is parallelised by Turbopack.
 *
 * Shared chrome (Marquee, StickyCTA, Footer) lives in
 * src/components/site-chrome.tsx.
 *
 * Edit copy/layout/animations inside the relevant section file.
 */

import { Marquee, StickyCTA, Footer } from "@/components/site-chrome";
import { HeroSection } from "@/components/landing/sections/hero";
import { DeliverablesSection } from "@/components/landing/sections/deliverables";
import { ClientResultsSection } from "@/components/landing/sections/client-results";
import { AkshitaTestimonialSection } from "@/components/landing/sections/akshita-testimonial";
import { TeamSection } from "@/components/landing/sections/team";
import { EligibilitySection } from "@/components/landing/sections/eligibility";
import { InvestmentSection } from "@/components/landing/sections/investment";
import { GuaranteeSection } from "@/components/landing/sections/guarantee";
import { FAQSection } from "@/components/landing/sections/faq";
import { CloserSection } from "@/components/landing/sections/closer";

export default function LandingPage() {
  return (
    <>
      <Marquee />
      <main id="main" className="relative">
        <HeroSection />
        <DeliverablesSection />
        <ClientResultsSection />
        <AkshitaTestimonialSection />
        <TeamSection />
        <EligibilitySection />
        <InvestmentSection />
        <GuaranteeSection />
        <CloserSection />
        <FAQSection />
      </main>
      <Footer hasSticky />
      <StickyCTA />
    </>
  );
}
