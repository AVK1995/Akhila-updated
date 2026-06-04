import type { Metadata } from "next";
import { Marquee, StickyCTA, Footer } from "@/components/site-chrome";
import { publicEnv } from "@/lib/env";

/* =============================================================================
 * REFUND POLICY — Akhila Metabolic Wellness Programme
 * =============================================================================
 * All content for /refund lives here. Edit any clause directly below.
 * Pure server component — no interactivity, no client state.
 *
 * Global concerns (brand CSS, fonts, UTM capture) live in src/app/layout.tsx
 * and globals.css.
 * =============================================================================
 */

export const metadata: Metadata = {
  title: "Refund Policy",
  description: `How refunds work for the ${publicEnv.assessmentFeeDisplay} metabolic assessment call and the Programme.`,
};

/* Navbar + Footer live in src/components/site-chrome.tsx — see import at top. */

/* ─────────────────────────────────────────────────────────────────────────────
 * PAGE EXPORT — Refund Policy content
 * Edit any section title or body directly in the `sections` array below.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export default function RefundPage() {
  const updatedOn = "May 15, 2026";
  const fee = publicEnv.assessmentFeeDisplay;
  const intro =
    `We stand behind the value of the assessment call. This Policy explains exactly when and how refunds are issued for the ${fee} assessment fee and for the longer Programme.`;

  const sections: { heading: string; body: string | string[] }[] = [
    {
      heading: `1. The ${fee} Assessment Call`,
      body: [
        "The assessment fee is fully refundable if you complete the 30-minute call with Akhila and feel no clarity was gained on your specific case. We are confident enough in the value of the call to make this offer unconditional.",
        "To request a refund: email draditya.cim@gmail.com within 7 days of completing the call, using the same email you booked with. We will process the refund within 7–10 working days back to your original payment method.",
      ],
    },
    {
      heading: "2. No-shows",
      body: "If you book a slot and do not attend the call without notifying us at least 6 hours in advance, the fee is non-refundable. You may reschedule once at no charge. Just request a new slot via email.",
    },
    {
      heading: "3. The 90-Day Programme",
      body: [
        "Programme pricing is determined after your assessment call, based on your specific case. We do not collect Programme fees online without first having had the assessment conversation.",
        "Programme refunds, where applicable, are governed by the written agreement signed at the time of enrolment. Because the Programme includes time-bound, personalised inputs delivered on a schedule, pro-rated refunds depend on the stage at which a cancellation request is made.",
      ],
    },
    {
      heading: "4. Failed payments",
      body: "If a payment is debited but you did not receive confirmation, please email us with the order ID. We will reconcile with Razorpay and either deliver the service or refund within 7 working days.",
    },
    {
      heading: "5. Currency and processing fees",
      body: "Refunds are made in INR to the original payment method. Razorpay, your bank or your card issuer may take additional time to reflect the credit. We do not charge a processing fee for refunds.",
    },
    {
      heading: "6. Disputes",
      body: "Before raising a chargeback, please email us. We will resolve any genuine concern quickly and amicably. Chargebacks raised without a prior email may delay refund processing.",
    },
    {
      heading: "7. Contact",
      body: "Refund requests: draditya.cim@gmail.com (use the same email as your booking).",
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
              Refund Policy
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
