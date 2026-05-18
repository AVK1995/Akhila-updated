"use client";

import { Reveal } from "../shared-client";
import { ImagePlaceholder } from "../shared-static";
import { StarIcon } from "../icons";

export function ClientResultsSection() {
  const results = [
    {
      title: "The Shift-Worker Case",
      outcome: "Cycles Restored",
      sub: "Without hormonal suppression",
      profile: "IT Professional · Rotational Night Shifts",
      tags: ["Energy Restored", "Migraines Gone", "Weight Moving"],
      placeholder: "Place client photo · /public/images/results/result-1.jpg",
    },
    {
      title: "The Lean PCOS Case",
      outcome: "Skin Cleared",
      sub: "Root correction, not cosmetic treatment",
      profile: "Student · Age 21 · No Weight Gain",
      tags: ["Sleep Normalised", "Cycles Predictable", "Acne Resolved"],
      placeholder: "Place client photo · /public/images/results/result-2.jpg",
    },
    {
      title: "The Metabolic Plateau Case",
      outcome: "Weight Moving",
      sub: "After years of doing everything right",
      profile: "Working Professional · Insulin-Driven PCOS",
      tags: ["Energy Back", "Cravings Managed", "Inches Lost"],
      placeholder: "Place client photo · /public/images/results/result-3.jpg",
    },
    {
      title: "The Fertility Concern Case",
      outcome: "Insulin Corrected",
      sub: "Hormonal rhythm restored without surgery",
      profile: "Trying to Conceive · Age 29",
      tags: ["Follicles Developing", "Surgery Avoided", "Cycles Regular"],
      placeholder: "Place client photo · /public/images/results/result-4.jpg",
    },
  ];
  return (
    <section id="results" className="relative scroll-mt-20 bg-cream-100 py-14 sm:py-20 lg:py-24">
      <div className="container-tight">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="section-label">Real Women. Real Results.</span>
            <h2 className="display-headline text-display-lg sm:text-display-xl">
              See what our clients{" "}
              <span className="text-gradient-wine italic">achieve.</span>
            </h2>
            <div className="section-divider mt-6" />
            <p className="body-lede mt-6">
              Women who came to us after the standard route stopped working.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-6 sm:mt-14 sm:grid-cols-2 lg:gap-7">
          {results.map((r, i) => (
            <Reveal key={r.title} delay={i * 0.05}>
              <article className="group h-full overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-premium transition-all duration-500 ease-smooth hover:-translate-y-1 hover:border-gold-200 hover:shadow-premium-lg">
                <div className="relative">
                  <ImagePlaceholder
                    ratio="4/3"
                    rounded="lg"
                    label={r.outcome}
                    hint={r.placeholder}
                    className="rounded-none border-0 border-b border-ink-100"
                  />
                  <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-[11px] font-medium text-gold-700 shadow-premium-sm backdrop-blur sm:left-5 sm:top-5 sm:text-xs">
                    <StarIcon className="text-gold-500" />
                    <span>Verified Outcome</span>
                  </div>
                </div>
                <div className="p-6 sm:p-7">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-400 sm:text-xs">
                    {r.title}
                  </p>
                  <h3 className="mt-2 font-display text-xl font-medium text-ink-800 sm:text-[22px]">
                    {r.outcome}
                  </h3>
                  <p className="mt-1.5 text-[14px] italic text-wine-700 sm:text-[15px]">
                    {r.sub}
                  </p>
                  <p className="mt-3 text-[13px] text-ink-500 sm:text-sm">
                    {r.profile}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {r.tags.map((tag) => (
                      <span key={tag} className="inline-flex items-center rounded-full border border-ink-100 bg-cream-50 px-3 py-1 text-[11px] font-medium text-ink-600 sm:text-[12px]">
                        {tag}
                      </span>
                    ))}
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
