"use client";

import { Reveal } from "../shared-client";
import { publicEnv } from "@/lib/env";

const fee = publicEnv.assessmentFeeDisplay;

const faqs = [
  {
    q: "What exactly happens on the 30-minute assessment call?",
    a: "Akhila walks through your PCOS history, current symptoms, sleep, stress, gut, and what you have already tried. You leave with a clear read on what is driving your specific pattern and an honest assessment of whether the programme is the right fit for you. Dr. Aditya joins only after you enrol; the first call is with Akhila.",
  },
  {
    q: "Do I need recent bloodwork before the call with Akhila?",
    a: "No. The call with Akhila is a clinical conversation first. If we need tests, we order them after. If you do have recent reports (insulin, HOMA-IR, thyroid, AMH, anything relevant), email them to us before the call so Akhila can read them in context.",
  },
  {
    q: "How is this different from a regular gynaecologist visit?",
    a: "We do not open with a prescription. We open with the metabolic markers most PCOS plans skip: fasting insulin, HOMA-IR, cortisol, inflammatory load, gut markers. The protocol is then built around what those actually reveal about your body.",
  },
  {
    q: "What does the full programme cost after the assessment?",
    a: "Programme pricing is determined after the assessment, based on the protocols your case actually needs. There is no fixed package. It is calibrated to your clinical picture. That is the whole point of doing the assessment first.",
  },
  {
    q: "What if I do not feel I got clarity from the call?",
    a: `We refund the ${fee} in full. No friction, no chasing, no cooling-off period. Provided you attend the full call and answer Akhila's questions honestly, the refund is processed within 7 working days.`,
  },
  {
    q: "How soon can I start the programme after my assessment?",
    a: "If you are a fit and choose to proceed, your protocol begins within 5–7 working days. IV infusions are scheduled at a partner clinic close to your location, with timings that work around your week.",
  },
  {
    q: "Is this programme for men too, or only women?",
    a: "This programme is built specifically for women with PCOS and metabolic dysregulation. We do not take male patients into this track. Dr. Aditya does consult male patients separately for general metabolic concerns. Reach out and we will point you to the right path.",
  },
  {
    q: "Can I do the programme if I live outside India?",
    a: "Yes for the clinical consultations and nutrition architecture; both run remotely. IV infusions require an in-person clinic visit, so we will assess at your assessment call whether your city allows that component or whether we adapt the protocol accordingly.",
  },
];

export function FAQSection() {
  return (
    <section id="faq" className="relative scroll-mt-20 py-14 sm:py-20 lg:py-24">
      <div className="container-tight">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="section-label">Common Questions</span>
            <h2 className="display-headline text-display-lg sm:text-display-xl">
              The questions women{" "}
              <span className="italic text-wine-700">actually ask</span> us.
            </h2>
            <div className="section-divider mt-6" />
            <p className="body-lede mt-6">
              If something isn&apos;t answered here, write to us. We respond personally.
            </p>
          </div>
        </Reveal>

        <div className="mx-auto mt-12 max-w-3xl space-y-3 sm:mt-14">
          {faqs.map((f, i) => (
            <Reveal key={f.q} delay={i * 0.04}>
              <details className="group rounded-2xl border border-ink-100 bg-white shadow-premium-sm transition-all duration-500 ease-smooth open:border-gold-200/80 open:shadow-premium hover:border-gold-200/70">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-5 py-4 sm:px-6 sm:py-5">
                  <span className="text-pretty font-display text-[15px] font-medium leading-snug text-ink-800 sm:text-[16.5px]">
                    {f.q}
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
                <div className="px-5 pb-5 pt-0 sm:px-6 sm:pb-6">
                  <div className="border-t border-ink-100/70 pt-4">
                    <p className="text-pretty text-[13.5px] leading-relaxed text-ink-600 sm:text-[14.5px]">
                      {f.a}
                    </p>
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
