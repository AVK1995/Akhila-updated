"use client";

/* =============================================================================
 * BOOK A CALL PAGE — Akhila PCOS Metabolic Programme
 * =============================================================================
 * Step 3 of the funnel: after the user pays on /checkout, they land here to
 * pick a Calendly slot.
 *
 * Page structure:
 *   - Marquee
 *   - Hero header (You're in / pick a time that works)
 *   - Calendly embed (centered, prominent)
 *   - 3-card highlight row (30min · Come prepared · Honest fit)
 *   - Akshita testimonial (imported from landing)
 *   - FAQ (imported from landing)
 *   - Footer
 *
 * Page metadata (noindex) lives in ./layout.tsx because this file is "use client".
 * =============================================================================
 */

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { getLead } from "@/lib/session";
import { getStoredUtm, withUtm } from "@/lib/utm";
import { publicEnv } from "@/lib/env";
import { Marquee, Footer } from "@/components/site-chrome";
import { Reveal } from "@/components/landing/shared-client";
import { CalendarIcon, CheckIcon, ClockIcon } from "@/components/landing/icons";
import { AkshitaTestimonialSection } from "@/components/landing/sections/akshita-testimonial";
import { FAQSection } from "@/components/landing/sections/faq";

/* ─────────────────────────────────────────────────────────────────────────────
 * HERO + CALENDLY — wraps useSearchParams (must live inside Suspense)
 * ─────────────────────────────────────────────────────────────────────────────
 */
function BookACallTop() {
  const router = useRouter();
  const params = useSearchParams();
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [paid, setPaid] = useState<boolean>(false);

  useEffect(() => {
    const lead = getLead();
    if (lead) {
      setName(lead.firstName);
      setEmail(lead.email);
      setPaid(Boolean(lead.paid) || Boolean(params.get("pid")));
    } else {
      setPaid(Boolean(params.get("pid")));
    }
  }, [params]);

  function goToThankYou() {
    const utm = getStoredUtm();
    router.push(withUtm("/thank-you", utm));
  }

  const calendlyUrl = publicEnv.calendlyUrl;
  const calendlyEmbedSrc = calendlyUrl
    ? `${calendlyUrl}?hide_gdpr_banner=1&primary_color=5A1E30${
        name ? `&name=${encodeURIComponent(name)}` : ""
      }${email ? `&email=${encodeURIComponent(email)}` : ""}`
    : "";

  return (
    <>
      {/* ── HERO HEADER ───────────────────────────────────────────────── */}
      <section className="relative scroll-mt-20 pt-6 sm:pt-14 lg:pt-16">
        <div className="container-tight">
          <div className="mx-auto max-w-2xl text-center">
            {paid && (
              <Reveal>
                <div className="inline-flex items-center gap-2 rounded-full bg-gold-50 px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-gold-700 sm:text-[13px]">
                  <CheckIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
                  Payment Confirmed
                </div>
              </Reveal>
            )}
            <Reveal delay={0.05}>
              <h1 className="mt-4 font-display text-[clamp(1.85rem,5vw+0.5rem,2.5rem)] font-medium leading-[1.05] tracking-tight text-ink-800 sm:mt-5">
                {name ? `${name.split(" ")[0]}, you're in.` : "You're in."}
                <br />
                <span className="text-gradient-wine">
                  pick a time that works.
                </span>
              </h1>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="mx-auto mt-3.5 max-w-xl text-[14.5px] leading-relaxed text-ink-500 sm:mt-5 sm:text-[15.5px]">
                This is your 30-minute clinical assessment call with Akhila.
                Block a slot in the next 7 days for the fastest start. Dr.
                Aditya joins your protocol once you enrol.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── CALENDLY EMBED ────────────────────────────────────────────── */}
      <section className="relative scroll-mt-20 py-10 sm:py-14">
        <div className="container-tight">
          <Reveal delay={0.05}>
            <div className="relative mx-auto max-w-3xl">
              {/* Soft brand halo behind the booking card */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-wine-100/40 via-gold-100/40 to-wine-100/40 blur-3xl"
              />
              <div
                className={cn(
                  "overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-premium-lg",
                  !calendlyEmbedSrc && "p-8"
                )}
              >
                {calendlyEmbedSrc ? (
                  <div className="h-[720px] w-full sm:h-[760px] lg:h-[820px]">
                    <iframe
                      title="Schedule your assessment call"
                      src={calendlyEmbedSrc}
                      width="100%"
                      height="100%"
                      frameBorder={0}
                      loading="lazy"
                      allow="payment; fullscreen"
                      className="block h-full w-full"
                    />
                  </div>
                ) : (
                  <div className="flex h-[420px] flex-col items-center justify-center text-center">
                    <span className="icon-disc icon-disc-wine h-14 w-14 !rounded-full">
                      <CalendarIcon className="relative h-5 w-5" strokeWidth={2} />
                    </span>
                    <p className="mt-4 font-display text-lg font-medium text-ink-800 sm:text-xl">
                      Calendar will appear here
                    </p>
                    <p className="mt-3 max-w-md text-[14px] leading-relaxed text-ink-500 sm:text-[15px]">
                      Set{" "}
                      <code className="rounded bg-cream-100 px-1.5 py-0.5 text-[12px] text-wine-700">
                        NEXT_PUBLIC_CALENDLY_URL
                      </code>{" "}
                      in
                      <code className="ml-1 rounded bg-cream-100 px-1.5 py-0.5 text-[12px] text-wine-700">
                        .env.local
                      </code>{" "}
                      to embed your booking page.
                    </p>
                    <button onClick={goToThankYou} type="button" className="btn-primary mt-6">
                      Continue to thank-you page
                    </button>
                  </div>
                )}
              </div>

              <p className="mt-4 text-center text-[12px] text-ink-400 sm:text-[13px]">
                Issues with the calendar? Email{" "}
                <a
                  href="mailto:hello@akhila.example.com"
                  className="font-medium text-wine-700 underline-offset-4 hover:underline"
                >
                  hello@akhila.example.com
                </a>{" "}
                and we&apos;ll book you manually.
              </p>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * HIGHLIGHT ROW — three brand-styled cards under the calendar
 * ─────────────────────────────────────────────────────────────────────────────
 */
function HighlightRow() {
  const items = [
    {
      icon: CalendarIcon,
      title: "30 minutes, one-on-one",
      body: "Not a sales call. A clinical conversation with Akhila about your specific case.",
    },
    {
      icon: ClockIcon,
      title: "Come prepared",
      body: "If you have recent bloodwork, scan and email it to us before the call. Optional, not required.",
    },
    {
      icon: CheckIcon,
      title: "Honest fit assessment",
      body: "If the programme is not right for you, we will tell you. No pressure, no upsell.",
    },
  ];
  return (
    <section className="relative scroll-mt-20 py-10 sm:py-14">
      <div className="container-tight">
        <div className="grid gap-4 sm:gap-5 lg:grid-cols-3">
          {items.map((item, i) => (
            <Reveal key={item.title} delay={i * 0.06}>
              <article className="group relative h-full overflow-hidden rounded-3xl border border-ink-100/80 bg-gradient-to-br from-white via-white to-cream-100/50 p-6 shadow-premium transition-all duration-500 ease-smooth hover:-translate-y-1 hover:border-gold-200/80 hover:shadow-premium-lg sm:p-7">
                {/* Top gold hairline accent — appears on hover */}
                <span
                  aria-hidden="true"
                  className="absolute inset-x-8 top-0 h-px origin-center scale-x-0 bg-gradient-to-r from-transparent via-gold-400 to-transparent transition-transform duration-700 ease-smooth group-hover:scale-x-100"
                />
                <div className="flex items-start gap-4">
                  <span className="icon-disc icon-disc-wine h-12 w-12 shrink-0 !rounded-full">
                    <item.icon className="relative h-4 w-4" strokeWidth={2} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-display text-[15.5px] font-medium leading-snug text-ink-800 sm:text-[17px]">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-[13px] leading-relaxed text-ink-500 sm:text-[14px]">
                      {item.body}
                    </p>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * PAGE EXPORT
 * ─────────────────────────────────────────────────────────────────────────────
 */
export default function BookACallPage() {
  return (
    <>
      <Marquee />
      <main id="main" className="relative min-h-screen pb-12">
        <Suspense
          fallback={
            <div className="grid place-items-center py-32 text-ink-400">
              Loading your booking page…
            </div>
          }
        >
          <BookACallTop />
        </Suspense>
        <HighlightRow />
        <AkshitaTestimonialSection />
        <FAQSection />
      </main>
      <Footer />
    </>
  );
}
