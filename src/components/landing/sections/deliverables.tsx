"use client";

import { Reveal } from "../shared-client";
import { withPmos } from "../shared-static";
import { StethoscopeIcon, FlaskIcon, DropletIcon, CalendarIcon } from "../icons";

export function DeliverablesSection() {
  const deliverables = [
    {
      n: "01",
      icon: StethoscopeIcon,
      title: "Physician Metabolic Consultation",
      value: "Deliverable Value · ₹7,000+",
      body: "Dr. Aditya spends a minimum of 30 minutes with you. He checks your sleep, your stress, your work history, and the markers that actually explain your PCOS: fasting insulin, HOMA-IR, cortisol, and inflammatory load. This is where your root cause gets a name.",
    },
    {
      n: "02",
      icon: FlaskIcon,
      title: "Personalised Metabolic Nutrition Plan",
      value: "Deliverable Value · ₹8,000+",
      body: "Akhila builds your nutrition plan after understanding your blood sugar response, your gut health, and your daily rhythm. Not a template. Not a low-carb PDF. A plan updated every four weeks based on how your body is actually responding, with two direct sessions with Akhila every month.",
    },
    {
      n: "03",
      icon: DropletIcon,
      title: "Therapeutic IV Infusion Support",
      value: "Deliverable Value · ₹30,000+",
      body: "This is what separates us from every health coach and online PCOS programme you have seen. When your body is in chronic inflammation, oral supplements are only partially absorbed. IV infusions bypass your gut entirely. 100% of what goes in is used by your cells. Sleep improves first. Then energy. Then weight starts moving. Protocol is customised clinically for your case.",
    },
    {
      n: "04",
      icon: CalendarIcon,
      title: "Weekly Clinical Monitoring and Movement",
      value: "Deliverable Value · ₹5,000+",
      body: "Weekly check-ins with the clinical team who know your specific case. Your movement plan updated every week, 25 to 30-minute sessions, no gym required. Stress management and gut restoration protocols adjusted as your body responds. You are not in a broadcast group. You are in a structured clinical environment.",
    },
  ];
  return (
    <section id="what-you-get" className="relative scroll-mt-20 py-14 sm:py-20 lg:py-24">
      <div className="container-tight">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="section-label">What This Actually Is</span>
            <h2 className="display-headline text-display-lg sm:text-display-xl">
              Not a consultation.{" "}
              <span className="text-gradient-wine">A diagnosis.</span>
            </h2>
            <div className="section-divider mt-6" />
            <p className="body-lede mt-6">
              It is not about what to eat or what to avoid. It is about
              understanding what is actually breaking down in your body and
              correcting it at the source. Every woman who comes to us gets a
              complete metabolic picture, not a five-minute prescription.
            </p>
          </div>
        </Reveal>

        {/* Accordion, not cards: the full write-ups pushed the CTA far below the
            fold on phones. Collapsed by default so the whole offer is scannable
            in one screen and each item expands in place, FAQ-style. */}
        <div className="mx-auto mt-12 max-w-3xl space-y-3 sm:mt-14">
          {deliverables.map((d, i) => (
            <Reveal key={d.n} delay={i * 0.04}>
              <details className="group rounded-2xl border border-ink-100 bg-white shadow-premium-sm transition-all duration-500 ease-smooth open:border-gold-200/80 open:shadow-premium hover:border-gold-200/70">
                <summary className="flex cursor-pointer list-none items-center gap-3.5 px-4 py-3.5 sm:px-6 sm:py-4">
                  <span className="icon-disc icon-disc-wine h-10 w-10 shrink-0 sm:h-11 sm:w-11">
                    <d.icon className="relative h-4 w-4 sm:h-5 sm:w-5" strokeWidth={1.6} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-pretty font-display text-[14.5px] font-medium leading-snug text-ink-800 sm:text-[16.5px]">
                      {d.title}
                    </span>
                    <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-gold-700 sm:text-[11px]">
                      {d.value}
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-ink-100 bg-cream-50 text-wine-700 transition-all duration-300 group-open:rotate-45 group-open:border-gold-200 group-open:bg-gold-50"
                  >
                    <svg
                      className="h-3.5 w-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                </summary>
                <div className="px-4 pb-4 pt-0 sm:px-6 sm:pb-6">
                  <div className="border-t border-ink-100/70 pt-3.5">
                    <p className="body-prose text-[13.5px] sm:text-[15px]">
                      {withPmos(d.body)}
                    </p>
                  </div>
                </div>
              </details>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1}>
          <div className="mx-auto mt-12 max-w-2xl sm:mt-14">
            <div className="relative overflow-hidden rounded-2xl border border-gold-200/70 bg-gradient-to-br from-gold-50/80 via-cream-50 to-wine-50/40 px-5 py-4 shadow-premium-sm sm:px-6 sm:py-5">
              <span
                aria-hidden="true"
                className="absolute inset-y-3 left-0 w-[3px] rounded-full bg-gradient-to-b from-gold-300 via-gold-500 to-wine-700"
              />
              <div className="flex items-start gap-3 sm:gap-3.5">
                <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-wine-700 text-cream-50 shadow-wine-glow sm:h-8 sm:w-8">
                  <svg
                    aria-hidden="true"
                    className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4M12 8h.01" />
                  </svg>
                </span>
                <div>
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-wine-700 sm:text-[11.5px]">
                    A note on pricing
                  </p>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-ink-700 sm:text-[15px]">
                    Programme pricing is determined{" "}
                    <span className="font-medium text-wine-700">
                      after your metabolic assessment
                    </span>
                    , based on what your body actually needs.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
