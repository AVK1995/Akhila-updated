import type { Metadata } from "next";
import { Marquee, StickyCTA, Footer } from "@/components/site-chrome";
import { publicEnv } from "@/lib/env";

/* =============================================================================
 * TERMS OF USE — Akhila Metabolic Wellness Programme
 * =============================================================================
 * All content for /terms lives here. Edit any clause directly below.
 * Pure server component — no interactivity, no client state.
 *
 * Global concerns (brand CSS, fonts, UTM capture) live in src/app/layout.tsx
 * and globals.css.
 * =============================================================================
 */

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "Terms of Use for Dr. Aditya & Akhila's metabolic wellness programme website and services.",
};

/* Navbar + Footer live in src/components/site-chrome.tsx — see import at top. */

/* ─────────────────────────────────────────────────────────────────────────────
 * PAGE EXPORT — Terms of Use content
 * Edit any section title or body directly in the `sections` array below.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export default function TermsPage() {
  const updatedOn = "May 15, 2026";
  const fee = publicEnv.assessmentFeeDisplay;
  const intro =
    `These Terms govern your access to and use of this website and any services offered through it, including the ${fee} metabolic assessment call. By using this site or booking a call, you agree to these Terms.`;

  const sections: { heading: string; body: string | string[] }[] = [
    {
      heading: "1. Who we are",
      body: 'This site is operated by Dr. Aditya & Akhila ("we", "us", "our"). References to "the Programme" mean the 90-day metabolic wellness programme described on this site. Our content and sessions are educational and coaching in nature.',
    },
    {
      heading: "2. Nature of the services",
      body: [
        `The services offered through this site include a paid assessment call (${fee}) and, where appropriate, enrolment into the Programme. The services are educational and coaching in nature — personalised nutrition, lifestyle and wellbeing guidance — provided for informational purposes only.`,
        "Our content and sessions are not medical advice and are not a substitute for care from your own doctor. Nothing on this site is a diagnosis or treatment. Always consult a qualified healthcare professional before making changes to your diet, exercise or lifestyle.",
      ],
    },
    {
      heading: "3. Not emergency care",
      body: "Our services are not intended for emergencies. If you are experiencing a medical emergency, please call your local emergency number or attend the nearest hospital immediately.",
    },
    {
      heading: "4. Eligibility and accuracy",
      body: "You must be 18 years or older to book a call. You agree that the information you provide during booking and during the call is accurate and complete to the best of your knowledge. We rely on this information to tailor our coaching and wellness guidance.",
    },
    {
      heading: "5. Payments",
      body: [
        "Payments are processed by Razorpay. We do not store your card or banking details on our servers.",
        "All prices are in Indian Rupees (INR) and inclusive of applicable taxes unless stated otherwise.",
      ],
    },
    {
      heading: "6. Refunds",
      body: `The ${fee} assessment fee is fully refundable if you finish the call and feel no clarity was gained on your specific case. Please review our separate Refund Policy for full conditions.`,
    },
    {
      heading: "7. Intellectual property",
      body: "All content on this site, including text, graphics, branding, programme materials and audio/video, is owned by us or licensed to us. You may not reproduce, redistribute or commercially exploit any portion without prior written permission.",
    },
    {
      heading: "8. User responsibilities",
      body: "You agree not to misuse this site (including by attempting to bypass security, scrape content at scale, or interfere with service operation). We may suspend access at our discretion in cases of suspected misuse.",
    },
    {
      heading: "9. Limitation of liability",
      body: "To the maximum extent permitted by law, our liability for any claim arising from your use of this site or services is limited to the amount you paid us in the preceding 12 months. We are not liable for indirect, incidental or consequential losses.",
    },
    {
      heading: "10. Changes",
      body: 'We may update these Terms from time to time. Material changes will be reflected by the "Last updated" date above. Continued use after a change constitutes acceptance.',
    },
    {
      heading: "11. Governing law and disputes",
      body: "These Terms are governed by the laws of India. Disputes are subject to the exclusive jurisdiction of the courts in the city where our practice is registered.",
    },
    {
      heading: "12. Contact",
      body: "For any questions about these Terms, email draditya.cim@gmail.com.",
    },
  ];

  return (
    <>
      <Marquee />
      <main className="min-h-screen bg-cream-50 pt-8 pb-20 sm:pt-10 lg:pt-12">
        <div className="container-narrow">
          <header>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-700 sm:text-xs">
              Legal
            </p>
            <h1 className="mt-3 font-display text-display-lg font-medium leading-[1.1] text-ink-800 sm:text-display-xl">
              Terms of Use
            </h1>
            <p className="mt-3 text-[13px] text-ink-400 sm:text-sm">
              Last updated · {updatedOn}
            </p>
            <p className="mt-6 text-[15px] leading-relaxed text-ink-500 sm:text-base">
              {intro}
            </p>
          </header>

          <div className="mt-12 space-y-10 sm:mt-14">
            {sections.map((s) => (
              <section key={s.heading}>
                <h2 className="font-display text-lg font-medium text-ink-800 sm:text-xl">
                  {s.heading}
                </h2>
                <div className="mt-3 space-y-3 text-[14px] leading-relaxed text-ink-500 sm:text-[15px]">
                  {Array.isArray(s.body) ? (
                    s.body.map((p, i) => <p key={i}>{p}</p>)
                  ) : (
                    <p>{s.body}</p>
                  )}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>
      <Footer hasSticky />
      <StickyCTA />
    </>
  );
}
