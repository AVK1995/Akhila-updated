"use client";

import { Reveal } from "../shared-client";

type CaseResult = {
  caseNo: string;
  title: string;
  walksInWith: string;
  outcome: string;
  sub: string;
  profile: string;
  tags: string[];
};

function CaseCard({ r }: { r: CaseResult }) {
  return (
    <article
      className="group relative flex h-full transform-gpu flex-col overflow-hidden rounded-3xl border border-ink-100 bg-white p-7 shadow-premium will-change-transform transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-[3px] hover:border-gold-200 hover:shadow-premium-lg motion-reduce:transform-none motion-reduce:transition-none sm:p-8"
    >
      {/* Top gold hairline accent — appears on hover */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-10 top-0 h-px origin-center scale-x-0 bg-gradient-to-r from-transparent via-gold-400 to-transparent transition-transform duration-300 ease-out group-hover:scale-x-100"
      />
      {/* Decorative case number — paper-watermark style */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-8 -right-2 select-none font-display text-[120px] font-medium leading-none text-gold-100/70 transition-colors duration-300 ease-out group-hover:text-gold-200/80 sm:text-[150px]"
      >
        {r.caseNo}
      </span>

      {/* Header */}
      <div className="relative">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-wine-700 sm:text-[11.5px]">
          Case Pattern · {r.caseNo}
        </p>
        <h3 className="mt-2 font-display text-[20px] font-medium leading-tight text-ink-800 sm:text-[22px]">
          {r.title}
        </h3>
      </div>

      {/* Two-column flow: presenting picture → outcome */}
      <div className="relative mt-6 grid grid-cols-1 gap-5 border-y border-ink-100/80 py-5 sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400 sm:text-[10.5px]">
            Presenting Picture
          </p>
          <p className="mt-2 text-[14px] leading-snug text-ink-600 sm:text-[14.5px]">
            {r.walksInWith}
          </p>
        </div>

        {/* Arrow / separator — gold rule on desktop, hairline on mobile */}
        <div
          aria-hidden="true"
          className="hidden h-px w-10 self-center bg-gradient-to-r from-gold-300/70 via-gold-500 to-gold-300/70 sm:block"
        />
        <div
          aria-hidden="true"
          className="block h-px w-full bg-gradient-to-r from-transparent via-gold-300/60 to-transparent sm:hidden"
        />

        <div className="sm:text-right">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-700 sm:text-[10.5px]">
            After Programme
          </p>
          <p className="mt-1.5 font-display text-[22px] font-medium leading-tight text-wine-700 sm:text-[24px]">
            {r.outcome}
          </p>
          <p className="mt-1 text-[13px] italic leading-snug text-ink-500 sm:text-[13.5px]">
            {r.sub}
          </p>
        </div>
      </div>

      {/* Footer — profile + tags. mt-auto pushes it to the bottom of the
          flex column so card bottoms line up evenly when stretched by the
          grid (especially on desktop's 2-col layout). pt-5 keeps a min gap
          from the section above. */}
      <div className="relative mt-auto pt-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-400 sm:text-[12px]">
          Typical Profile
        </p>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-600 sm:text-[14.5px]">
          {r.profile}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {r.tags.map((tag) => (
            <span key={tag} className="inline-flex items-center rounded-full border border-ink-100 bg-cream-50 px-3 py-1 text-[11px] font-medium text-ink-600 sm:text-[12px]">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

export function ClientResultsSection() {
  const results: CaseResult[] = [
    {
      caseNo: "01",
      title: "The Shift-Worker Pattern",
      walksInWith: "Irregular cycles, migraines, weight stalling, exhaustion",
      outcome: "Cycles Restored",
      sub: "Without hormonal suppression",
      profile: "IT Professional · Rotational Night Shifts",
      tags: ["Energy Restored", "Migraines Gone", "Weight Moving"],
    },
    {
      caseNo: "02",
      title: "The Lean PCOS Pattern",
      walksInWith: "Cystic acne, hair fall, normal weight, dismissed by doctors",
      outcome: "Skin Cleared",
      sub: "Root correction, not cosmetic treatment",
      profile: "Student or Early-20s · No Weight Gain",
      tags: ["Sleep Normalised", "Cycles Predictable", "Acne Resolved"],
    },
    {
      caseNo: "03",
      title: "The Metabolic Plateau Pattern",
      walksInWith: "Years of clean eating, gym, still no weight movement",
      outcome: "Weight Moving",
      sub: "After years of doing everything right",
      profile: "Working Professional · Insulin-Driven PCOS",
      tags: ["Energy Back", "Cravings Managed", "Inches Lost"],
    },
    {
      caseNo: "04",
      title: "The Fertility Concern Pattern",
      walksInWith: "Anovulatory cycles, AMH skewed, surgery being considered",
      outcome: "Insulin Corrected",
      sub: "Hormonal rhythm restored without surgery",
      profile: "Trying to Conceive · Late 20s to Early 30s",
      tags: ["Follicles Developing", "Surgery Avoided", "Cycles Regular"],
    },
  ];
  return (
    <section id="results" className="section-peach relative scroll-mt-20 py-14 sm:py-20 lg:py-24">
      <div className="container-tight">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="section-label">Patterns From The Practice</span>
            <h2 className="display-headline text-display-lg sm:text-display-xl">
              The case patterns we see,{" "}
              <span className="text-gradient-wine italic">again and again.</span>
            </h2>
            <div className="section-divider mt-6" />
            <p className="body-lede mt-6">
              The recurring clinical patterns Akhila has seen across the women
              she works with. The same root issues showing up in different
              bodies, and how they shift once the metabolic picture is
              corrected.
            </p>
          </div>
        </Reveal>

        {/*
          MOBILE: card-deck sticky-stack. Each card sticks at a
          progressively larger top offset, so when the next card slides on
          top, it stops one header-strip below the previous one. Result:
          a fanned deck where you see all the stuck card titles + the
          fully-visible current card.

          Geometry (per card):
            • Base offset    = 16 px (from viewport top)
            • Per-card peek  = 96 px (fits a 2-line title + buffer:
                                       28 padding + 16 eyebrow + 8 mt-2
                                       + ~44 two-line h3 = 96)
            • Card i top     = 16 + i * 96
                Card 0 → 16 px,   Card 1 → 112 px
                Card 2 → 208 px,  Card 3 → 304 px

          Z-index rises with source order so later cards visually paint
          above earlier ones. h-full chain is scoped to sm+ so mobile
          sticky wrappers size to their content (a wrapper with h-full in
          block flow would either collapse or fight sticky).

          DESKTOP (sm+): 2-col grid, sticky disabled (`sm:static`,
          inline `top` is ignored on static). Items stretch to row height
          via the h-full chain so card bottoms line up evenly.
        */}
        <div className="mt-12 space-y-5 sm:mt-14 sm:grid sm:grid-cols-2 sm:items-stretch sm:gap-6 sm:space-y-0 lg:gap-7">
          {results.map((r, i) => (
            <div
              key={r.title}
              className="sticky sm:static sm:h-full"
              style={{ top: `${16 + i * 96}px`, zIndex: i + 1 }}
            >
              <Reveal delay={i * 0.05} className="sm:h-full">
                <CaseCard r={r} />
              </Reveal>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
