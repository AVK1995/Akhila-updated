"use client";

import { Reveal } from "../shared-client";
import { CheckIcon } from "../icons";
import { Pmos } from "../shared-static";
import { CtaBlock } from "../cta-block";

/* =============================================================================
 * THIS IS FOR YOU IF — qualification list
 * =============================================================================
 * Single-column list of five "that's me" statements, each opening with the
 * bolded hook so it reads at a skim. Closes with the repeating CTA block.
 * =============================================================================
 */
export function EligibilitySection() {
  const points: { lead: string; rest: React.ReactNode }[] = [
    {
      lead: "You've spent years trying different diets, supplements, medications or workout plans,",
      rest: " only to see your symptoms improve for a while before everything slowly comes back again.",
    },
    {
      lead: "You're balancing a demanding career, long workdays and constant stress,",
      rest: " making it difficult to follow restrictive diets or unrealistic health plans consistently.",
    },
    {
      lead: "You're frustrated that despite “doing everything right,”",
      rest: " you're still struggling with stubborn weight gain, irregular periods, facial hair, acne or low energy.",
    },
    {
      lead: "You're thinking about starting a family, trying to conceive naturally,",
      rest: " or preparing your body for fertility treatment, and you want to optimise your health before taking that next step.",
    },
    {
      lead: "You're looking for a personalised, doctor-led approach",
      rest: (
        <>
          {" "}that identifies what&rsquo;s actually driving your <Pmos />, so you
          can stop chasing temporary fixes and create results that last.
        </>
      ),
    },
  ];

  return (
    <section id="eligibility" className="section-peach relative scroll-mt-20 py-14 sm:py-20 lg:py-24">
      <div className="container-tight">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="section-label">For Career-Driven Women Across India &amp; Abroad</span>
            <h2 className="display-headline text-display-lg sm:text-display-xl">
              This Is For You{" "}
              {/* Only "if" is highlighted, and the rule is attached to that
                  span — see .title-underline in globals.css, shared by every
                  section heading. */}
              <span className="title-underline italic text-wine-700">if:</span>
            </h2>
          </div>
        </Reveal>

        <ul className="mx-auto mt-10 max-w-3xl space-y-3.5 sm:mt-12 sm:space-y-4">
          {points.map((p, i) => (
            <Reveal key={p.lead} delay={i * 0.05} as="li">
              <div className="flex items-start gap-3.5 rounded-2xl border border-ink-100/80 bg-white/80 px-4 py-4 shadow-premium-sm backdrop-blur-sm transition-all duration-500 ease-smooth hover:-translate-y-0.5 hover:border-gold-200/80 hover:shadow-premium sm:gap-4 sm:px-6 sm:py-5">
                <span className="icon-disc icon-disc-gold mt-0.5 h-7 w-7 shrink-0 !rounded-full sm:h-8 sm:w-8">
                  <CheckIcon className="relative h-3.5 w-3.5" strokeWidth={2.6} />
                </span>
                <p className="text-pretty text-[14px] leading-relaxed text-ink-600 sm:text-[15.5px]">
                  <span className="font-semibold text-ink-800">{p.lead}</span>
                  {p.rest}
                </p>
              </div>
            </Reveal>
          ))}
        </ul>

        <Reveal delay={0.1}>
          <CtaBlock className="mt-12 sm:mt-14" />
        </Reveal>
      </div>
    </section>
  );
}
