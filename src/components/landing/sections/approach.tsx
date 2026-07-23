"use client";

import { Reveal } from "../shared-client";
import { Pmos } from "../shared-static";

/* =============================================================================
 * THE APPROACH — why the root-cause method works differently
 * =============================================================================
 * Four numbered blocks in a 2x2 grid (single column on phones), mirroring the
 * reference layout's "mechanism" section.
 * =============================================================================
 */

const PILLARS: { n: string; title: string; body: React.ReactNode }[] = [
  {
    n: "01",
    title: "We treat the root cause, not just the diagnosis",
    body: (
      <>
        <Pmos /> is often the result of deeper metabolic and hormonal
        imbalances, not the starting point. That&rsquo;s why we first identify
        what&rsquo;s driving your symptoms before recommending treatment.
      </>
    ),
  },
  {
    n: "02",
    title: "Every plan is built around your body",
    body: (
      <>
        Your symptoms, blood reports, metabolic health, lifestyle, stress and
        goals all influence your treatment plan. No two women leave with the
        same recommendations.
      </>
    ),
  },
  {
    n: "03",
    title: "Medicine + nutrition work together",
    body: (
      <>
        Dr. Aditya identifies what&rsquo;s happening inside your body. Akhila
        translates those insights into personalised nutrition and lifestyle
        strategies that support long-term hormonal health.
      </>
    ),
  },
  {
    n: "04",
    title: "We build lasting health, not quick fixes",
    body: (
      <>
        Our goal isn&rsquo;t simply better reports or temporary symptom relief.
        It&rsquo;s helping you improve your metabolic health so your hormones,
        energy, weight and cycles can improve together.
      </>
    ),
  },
];

export function ApproachSection() {
  return (
    <section id="approach" className="section-peach relative scroll-mt-20 py-14 sm:py-20 lg:py-24">
      <div className="container-tight">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="section-label">The Approach</span>
            <h2 className="display-headline text-display-lg sm:text-display-xl">
              Why Our Root Cause Approach{" "}
              <span className="title-underline text-gradient-wine italic">Works Differently</span>
            </h2>
            <p className="body-lede mt-6">
              Most women with <Pmos /> receive the same diagnosis. We believe
              the treatment should never be the same.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:mt-14 sm:gap-6 lg:grid-cols-2">
          {PILLARS.map((p, i) => (
            <Reveal key={p.n} delay={i * 0.06}>
              <article className="group relative h-full overflow-hidden rounded-3xl border border-ink-100/80 bg-gradient-to-br from-white via-white to-cream-100/60 p-6 shadow-premium transition-all duration-500 ease-smooth hover:-translate-y-1 hover:border-gold-200/80 hover:shadow-premium-lg sm:p-8">
                <span
                  aria-hidden="true"
                  className="absolute inset-x-8 top-0 h-px origin-center scale-x-0 bg-gradient-to-r from-transparent via-gold-400 to-transparent transition-transform duration-700 ease-smooth group-hover:scale-x-100"
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -bottom-6 right-2 select-none font-display text-[100px] font-medium leading-none text-gold-100/70 transition-all duration-700 group-hover:-translate-y-1 group-hover:text-gold-200/80 sm:right-4 sm:text-[128px]"
                >
                  {p.n}
                </span>
                <div className="relative">
                  <h3 className="font-display text-[19px] font-medium leading-snug text-ink-800 sm:text-[22px]">
                    {p.title}
                  </h3>
                  <p className="body-prose mt-3 text-[14px] sm:text-[15px]">{p.body}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
