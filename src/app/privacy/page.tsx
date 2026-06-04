import type { Metadata } from "next";
import { Marquee, StickyCTA, Footer } from "@/components/site-chrome";

/* =============================================================================
 * PRIVACY POLICY — Akhila Metabolic Wellness Programme
 * =============================================================================
 * All content for /privacy lives here. Edit any clause directly below.
 * Pure server component — no interactivity, no client state.
 *
 * Global concerns (brand CSS, fonts, UTM capture) live in src/app/layout.tsx
 * and globals.css.
 * =============================================================================
 */

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Dr. Aditya & Akhila collect, use and protect your personal information.",
};

/* Navbar + Footer live in src/components/site-chrome.tsx — see import at top. */

/* ─────────────────────────────────────────────────────────────────────────────
 * PAGE EXPORT — Privacy Policy content
 * Edit any section title or body directly in the `sections` array below.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export default function PrivacyPage() {
  const updatedOn = "May 15, 2026";
  const intro =
    "Your personal information matters to us. This Policy explains what we collect, why, how we protect it, and what choices you have. We follow Indian data protection law (including the DPDP Act, 2023) and reasonable global best practices.";

  const sections: { heading: string; body: string | string[] }[] = [
    {
      heading: "1. What we collect",
      body: [
        "Contact details: full name, email address, phone number, city.",
        "Context you choose to share during booking or during the call: age range, your main goal, and lifestyle, routine and wellbeing information.",
        "Marketing context: UTM parameters from the ad you came through (e.g. utm_source, utm_campaign, fbclid), used only to attribute and improve our marketing.",
        "Payment metadata: order ID, payment ID and amount. Card numbers are processed by Razorpay and never stored by us.",
      ],
    },
    {
      heading: "2. Why we collect it",
      body: [
        "To deliver the service you booked (the assessment call and any subsequent programme).",
        "To send you confirmation, prep notes, calendar invites, and follow-up communications relevant to your booking.",
        "To run our automations (e.g. Pabbly) so legitimate communications reach you on time.",
        "To measure ad performance in aggregate and improve targeting.",
        "To meet legal, tax and regulatory obligations.",
      ],
    },
    {
      heading: "3. How we store it",
      body: "We store your data on access-controlled systems. Any sensitive details you share are treated with care and limited to the team working with you. Payments are tokenised by Razorpay; we never have access to your full card details.",
    },
    {
      heading: "4. Who we share it with",
      body: [
        "Razorpay, for payment processing.",
        "Pabbly Connect, for transactional and follow-up automations.",
        "Our calendar/scheduling provider (e.g. Calendly), to confirm and remind you of your call.",
        "We never sell your data. We never share the personal details you provide with advertisers.",
      ],
    },
    {
      heading: "5. Cookies and tracking",
      body: "We use minimal cookies and browser storage to remember your form state across pages, to attribute the ad that brought you, and to keep the site secure. We do not run third-party advertising trackers on protected pages (checkout, book-a-call, thank-you).",
    },
    {
      heading: "6. Your rights",
      body: "You have the right to access, correct or delete your personal data. To exercise any of these rights, email draditya.cim@gmail.com from the address you used to book. We'll respond within 14 working days.",
    },
    {
      heading: "7. Retention",
      body: "We retain your data for as long as we have an active working relationship and for a reasonable period after, to meet legal and recordkeeping obligations. You can request earlier deletion at any time, subject to those obligations.",
    },
    {
      heading: "8. Children",
      body: "This service is intended for adults aged 18 and over. We do not knowingly collect information from anyone under 18.",
    },
    {
      heading: "9. Security",
      body: "We use HTTPS, signed payment verification, and limited internal access controls. No system is perfectly secure. Please use a strong, unique password if/when you create an account, and notify us immediately of any suspected unauthorised access.",
    },
    {
      heading: "10. Updates",
      body: 'We may update this Policy. The "Last updated" date at the top reflects the latest revision.',
    },
    {
      heading: "11. Contact",
      body: "Privacy questions: draditya.cim@gmail.com.",
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
              Privacy Policy
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
