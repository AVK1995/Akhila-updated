"use client";

import { Reveal } from "../shared-client";
import { withPmos } from "../shared-static";
import { publicEnv } from "@/lib/env";
import { FREE_FUNNEL_MODE } from "@/lib/funnel";

const fee = publicEnv.assessmentFeeDisplay;

const faqs: { q: string; a: string; hideInFree?: boolean }[] = [
  {
    q: "I've already tried diets, medications and supplements. How is this different?",
    a: "Most women who come to us have already tried multiple approaches with only temporary improvements. Instead of giving every woman with PCOS the same advice, we first identify what's actually driving your symptoms through a detailed clinical assessment. Your treatment plan is then built around your body, not just your diagnosis.",
  },
  {
    q: "My work schedule is unpredictable. What if I can't be perfectly consistent?",
    a: "You don't need a perfect routine to make progress. Our recommendations are designed to work within real life, whether you're working long hours, travelling frequently or managing a demanding career. The goal isn't perfection. It's building an approach you can actually sustain.",
  },
  {
    q: "I'm planning to conceive in the next few years. Is this the right time to address my PCOS?",
    a: "Absolutely. Many women choose to improve their metabolic and hormonal health before trying to conceive or before beginning fertility treatment. While we never promise pregnancy outcomes, optimising your health beforehand can play an important role in supporting fertility and overall reproductive health.",
  },
  {
    q: "Will I receive the same plan as everyone else?",
    a: "No. Every recommendation is personalised based on your symptoms, blood reports, metabolic health, lifestyle, work schedule and long-term goals. No two women receive identical treatment plans because no two women develop PCOS for exactly the same reasons.",
  },
  {
    q: "How do I know if this programme is right for me?",
    a: "It starts with a one-on-one consultation. We'll understand your symptoms, review your medical history and discuss your goals before recommending the next steps. If we don't believe our approach is the right fit for you, we'll tell you honestly.",
  },
];


export function FAQSection() {
  // Free mode hides the refund/payment-specific question(s).
  const visibleFaqs = faqs.filter((f) => !(FREE_FUNNEL_MODE && f.hideInFree));
  return (
    <section id="faq" className="relative scroll-mt-20 py-14 sm:py-20 lg:py-24">
      <div className="container-tight">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="section-label">Common Questions</span>
            <h2 className="display-headline text-display-lg sm:text-display-xl">
              Common Questions From{" "}
              <span className="title-underline text-gradient-wine italic">
                Career-Driven Women With {withPmos("PCOS")}
              </span>
            </h2>
            <p className="body-lede mt-6">
              If something isn&apos;t answered here, write to us. We respond personally.
            </p>
          </div>
        </Reveal>

        <div className="mx-auto mt-12 max-w-3xl space-y-3 sm:mt-14">
          {visibleFaqs.map((f, i) => (
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
                      {withPmos(f.a)}
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
