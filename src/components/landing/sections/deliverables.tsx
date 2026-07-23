"use client";

import { Reveal } from "../shared-client";
import { Pmos } from "../shared-static";
import {
  StethoscopeIcon,
  FlaskIcon,
  DropletIcon,
  CalendarIcon,
  CheckIcon,
  ShieldIcon,
} from "../icons";

/* =============================================================================
 * THE PROGRAMME — what's included in the 90 days
 * =============================================================================
 * Six components, each a titled block with a short description. Collapsible on
 * mobile (keeps the CTA within reach); always expanded from `sm` up.
 * =============================================================================
 */

const INCLUSIONS: {
  icon: typeof StethoscopeIcon;
  title: string;
  body: React.ReactNode;
}[] = [
  {
    icon: StethoscopeIcon,
    title: "Comprehensive Medical Assessment",
    body: "Your journey begins with an in-depth consultation covering your symptoms, medical history, menstrual health, lifestyle, stress, sleep, previous treatments and health goals.",
  },
  {
    icon: FlaskIcon,
    title: "Root Cause Investigation",
    body: (
      <>
        We analyse your blood reports, metabolic markers and hormonal health to
        identify what&rsquo;s actually driving your <Pmos />, rather than simply
        treating the symptoms.
      </>
    ),
  },
  {
    icon: DropletIcon,
    title: "Personalised Nutrition & Lifestyle Plan",
    body: "No generic meal plans. Every recommendation is tailored to your body, food preferences, work schedule, symptoms and long-term health goals.",
  },
  {
    icon: CheckIcon,
    title: "Doctor + Nutritionist Support",
    body: "Your care is guided by both Dr. Aditya and Akhila, combining clinical medicine with functional nutrition for a more complete approach.",
  },
  {
    icon: CalendarIcon,
    title: "Regular Reviews & Plan Optimisation",
    body: "As your body changes, your treatment plan evolves with it through structured follow-ups, progress reviews and ongoing adjustments.",
  },
  {
    icon: ShieldIcon,
    title: "A Long-Term Recovery Strategy",
    body: "Whether your goal is regular cycles, sustainable weight loss, better metabolic health or preparing for pregnancy, every step is designed to create results that last, not just temporary improvements.",
  },
];

export function DeliverablesSection() {
  return (
    <section id="what-you-get" className="relative scroll-mt-20 py-14 sm:py-20 lg:py-24">
      <div className="container-tight">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="section-label">The Programme</span>
            <h2 className="display-headline text-display-lg sm:text-display-xl">
              What&rsquo;s Included In Your{" "}
              <span className="title-underline text-gradient-wine italic">90-Day Programme</span>
            </h2>
            <p className="body-lede mt-6">
              A complete doctor-led care plan designed around your symptoms,
              metabolism and long-term goals.
            </p>
          </div>
        </Reveal>

        <div className="mx-auto mt-12 max-w-3xl space-y-3 sm:mt-14">
          {INCLUSIONS.map((d, i) => (
            <Reveal key={d.title} delay={i * 0.04}>
              {/* `open` from sm up via CSS is not possible on <details>, so the
                  mobile-first pattern is: collapsed on phones, and the summary
                  marker hidden + content forced visible from sm. */}
              <details
                open
                className="group rounded-2xl border border-ink-100 bg-white shadow-premium-sm transition-all duration-500 ease-smooth open:border-gold-200/80 open:shadow-premium hover:border-gold-200/70"
              >
                <summary className="flex cursor-pointer list-none items-center gap-3.5 px-4 py-3.5 sm:cursor-default sm:px-6 sm:py-4">
                  <span className="icon-disc icon-disc-wine h-10 w-10 shrink-0 sm:h-11 sm:w-11">
                    <d.icon className="relative h-4 w-4 sm:h-5 sm:w-5" strokeWidth={1.6} />
                  </span>
                  <span className="min-w-0 flex-1 text-pretty font-display text-[15px] font-medium leading-snug text-ink-800 sm:text-[17px]">
                    {d.title}
                  </span>
                  <span
                    aria-hidden="true"
                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-ink-100 bg-cream-50 text-wine-700 transition-transform duration-300 group-open:rotate-45 sm:hidden"
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                </summary>
                <div className="px-4 pb-4 pt-0 sm:px-6 sm:pb-5">
                  <div className="border-t border-ink-100/70 pt-3.5 sm:pl-[3.6rem]">
                    <p className="body-prose text-[13.5px] sm:text-[15px]">{d.body}</p>
                  </div>
                </div>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
