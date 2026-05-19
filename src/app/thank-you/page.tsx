import type { Metadata } from "next";
import { cn } from "@/lib/utils";
import { Marquee, Footer } from "@/components/site-chrome";

/* =============================================================================
 * THANK YOU PAGE — Akhila PCOS Metabolic Programme
 * =============================================================================
 * Final step of the funnel. Pure presentation, no interactivity. Server-rendered.
 * Everything (icons, navbar, footer, content) lives in this file.
 *
 * Global concerns (brand CSS, fonts, UTM capture) live in src/app/layout.tsx
 * and globals.css.
 * =============================================================================
 */

export const metadata: Metadata = {
  title: "You're All Set. See You On The Call",
  description:
    "Thank you for booking your PCOS metabolic assessment with Dr. Aditya & Akhila.",
  robots: { index: false, follow: false },
};

/* ─────────────────────────────────────────────────────────────────────────────
 * INLINE ICONS
 * ─────────────────────────────────────────────────────────────────────────────
 */
const baseIconProps = (className?: string, strokeWidth = 1.6) => ({
  className: cn("h-4 w-4 shrink-0", className),
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
});
const CheckIcon = ({ className, strokeWidth }: { className?: string; strokeWidth?: number }) => (
  <svg {...baseIconProps(className, strokeWidth)}><path d="M20 6 9 17l-5-5" /></svg>
);
const ClockIcon = ({ className, strokeWidth }: { className?: string; strokeWidth?: number }) => (
  <svg {...baseIconProps(className, strokeWidth)}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);
const ShieldIcon = ({ className, strokeWidth }: { className?: string; strokeWidth?: number }) => (
  <svg {...baseIconProps(className, strokeWidth)}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

/* Navbar + Footer live in src/components/site-chrome.tsx — see import at top. */

/* ─────────────────────────────────────────────────────────────────────────────
 * PAGE EXPORT
 * ─────────────────────────────────────────────────────────────────────────────
 */
export default function ThankYouPage() {
  const steps = [
    {
      icon: CheckIcon,
      title: "Check your inbox",
      body: "We've sent a confirmation with your call details, calendar invite, and prep notes.",
    },
    {
      icon: ClockIcon,
      title: "What to expect on the call",
      body: "Akhila will walk through your PCOS history, current symptoms, sleep, stress and what you have already tried, then give you a clear read on whether the programme is the right fit. Dr. Aditya joins your protocol once you enrol.",
    },
    {
      icon: ShieldIcon,
      title: "Refund policy",
      body: "If you finish the call without clarity on your next step, your assessment fee is fully refunded. No questions asked.",
    },
  ];
  return (
    <>
      <Marquee />
      <main className="min-h-screen pt-8 pb-24 sm:pt-10 lg:pt-12">
        <div className="container-narrow text-center">
          <span className="icon-disc icon-disc-glass-hero inline-flex h-16 w-16 sm:h-20 sm:w-20">
            <CheckIcon className="relative h-7 w-7 sm:h-9 sm:w-9" strokeWidth={2.5} />
          </span>
          <h1 className="mt-7 font-display text-display-xl font-medium leading-[1.05] text-ink-800 sm:text-display-2xl">
            You&rsquo;re in.{" "}
            <span className="block text-gradient-wine">See you on the call.</span>
          </h1>
          <p className="mt-5 text-[14px] leading-relaxed text-ink-500 sm:text-[15px]">
            Your slot is booked. The clinical team will review your details
            before the call so we hit the ground running.
          </p>

          <ol className="mt-12 grid gap-5 text-left sm:gap-6">
            {steps.map((s, i) => (
              <li key={s.title} className="card-premium group flex items-start gap-4 sm:gap-5">
                <span className="icon-disc icon-disc-wine h-11 w-11 shrink-0 !rounded-full sm:h-12 sm:w-12">
                  <span className="relative font-display text-base font-medium leading-none">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </span>
                <div>
                  <h2 className="font-display text-lg font-medium text-ink-800 sm:text-xl">
                    {s.title}
                  </h2>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-ink-500 sm:text-[15px]">
                    {s.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-14 rounded-2xl border border-wine-200/40 bg-wine-50/60 p-6 text-left sm:p-7">
            <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-wine-700 sm:text-[13px]">
              One favour
            </p>
            <p className="mt-3 text-[14px] leading-relaxed text-ink-700 sm:text-[15px]">
              If you have recent bloodwork (fasting insulin, HOMA-IR,
              testosterone, AMH, TSH, vitamin D, B12), please scan and email
              them to{" "}
              <a href="mailto:hello@akhila.example.com" className="font-medium text-wine-700 underline-offset-4 hover:underline">
                hello@akhila.example.com
              </a>{" "}
              before your call. Optional, but it lets us dig deeper from minute
              one.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
