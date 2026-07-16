"use client";

import Image from "next/image";
import { Reveal } from "../shared-client";
import { withPmos } from "../shared-static";
import { ArrowRightIcon } from "../icons";

/* =============================================================================
 * CASE PATTERNS — before / after testimonial cards
 * =============================================================================
 * Each card: photo → name → case pattern → profession → Before (red) →
 * After (green). Short on purpose; these get skimmed.
 *
 * `name`     — real first name where we have consent (e.g. "Ria"), otherwise
 *              "Anonymous". Never invent a named patient.
 * `imageSrc` — stock/real portrait in /public/images/results/. Until one is
 *              set the card shows a neutral avatar placeholder.
 * =============================================================================
 */

type CaseResult = {
  /** Real first name, or "Anonymous". */
  name: string;
  /** Clinical pattern label. */
  title: string;
  /** Presenting picture — one short line. */
  before: string;
  /** Headline outcome — two or three words. */
  after: string;
  /** One-line qualifier under the outcome. */
  afterSub: string;
  profile: string;
  /** Portrait; falls back to a placeholder when absent. */
  imageSrc?: string;
};

function CaseCard({ r }: { r: CaseResult }) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-premium transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-[3px] hover:border-gold-200 hover:shadow-premium-lg motion-reduce:transform-none">
      {/* Photo */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-cream-100">
        {r.imageSrc ? (
          <Image
            src={r.imageSrc}
            alt={`${r.name} — ${r.profile}`}
            fill
            sizes="(min-width: 640px) 50vw, 100vw"
            className="object-cover object-center transition-transform duration-700 ease-smooth group-hover:scale-[1.04]"
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex h-full w-full items-center justify-center bg-gradient-to-br from-cream-200 via-wine-50 to-gold-50"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/70 font-display text-2xl font-medium text-wine-700 shadow-premium-sm">
              {r.name === "Anonymous" ? "A" : r.name.charAt(0)}
            </span>
          </div>
        )}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-900/20 to-transparent"
        />
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        {/* Identity: name → case → profession */}
        <h3 className="font-display text-[19px] font-medium leading-tight text-ink-800 sm:text-[21px]">
          {r.name}
        </h3>
        <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-wine-700 sm:text-[12px]">
          {withPmos(r.title)}
        </p>
        <p className="mt-1 text-[12.5px] leading-snug text-ink-400 sm:text-[13px]">
          {withPmos(r.profile)}
        </p>

        {/* Before (red) → After (green) */}
        <div className="mt-4 grid flex-1 grid-cols-1 items-stretch gap-2.5 sm:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-2xl border border-red-200/70 bg-red-50/70 px-3.5 py-3">
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-red-700 sm:text-[10px]">
              Before
            </p>
            <p className="mt-1.5 text-[13px] leading-snug text-ink-700 sm:text-[13.5px]">
              {r.before}
            </p>
          </div>

          <div aria-hidden="true" className="flex items-center justify-center self-center">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-ink-800/5 text-ink-500">
              <ArrowRightIcon className="h-3.5 w-3.5 rotate-90 sm:rotate-0" strokeWidth={2.5} />
            </span>
          </div>

          <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/70 px-3.5 py-3">
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-emerald-700 sm:text-[10px]">
              After
            </p>
            <p className="mt-1.5 font-display text-[17px] font-medium leading-tight text-emerald-700 sm:text-[18px]">
              {r.after}
            </p>
            <p className="mt-0.5 text-[11.5px] italic leading-snug text-ink-500 sm:text-[12px]">
              {r.afterSub}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

export function ClientResultsSection() {
  const results: CaseResult[] = [
    {
      name: "Ria",
      title: "The Shift-Worker Pattern",
      before: "Irregular cycles, migraines, weight stalling, exhaustion",
      after: "Cycles Restored",
      afterSub: "Without hormonal suppression",
      profile: "IT Professional · Rotational Night Shifts",
      imageSrc: "/images/results/ria.jpg",
    },
    {
      name: "Anonymous",
      title: "The Lean PCOS Pattern",
      before: "Cystic acne, hair fall, normal weight, dismissed by doctors",
      after: "Skin Cleared",
      afterSub: "Root correction, not cosmetic treatment",
      profile: "Student or Early-20s · No Weight Gain",
      imageSrc: "/images/results/anonymous-1.jpg",
    },
    {
      name: "Anonymous",
      title: "The Metabolic Plateau Pattern",
      before: "Years of clean eating, gym, still no weight movement",
      after: "Weight Moving",
      afterSub: "After years of doing everything right",
      profile: "Working Professional · Insulin-Driven PCOS",
      imageSrc: "/images/results/anonymous-2.jpg",
    },
    {
      name: "Anonymous",
      title: "The Fertility Concern Pattern",
      before: "Anovulatory cycles, AMH skewed, surgery being considered",
      after: "Insulin Corrected",
      afterSub: "Hormonal rhythm restored without surgery",
      profile: "Trying to Conceive · Late 20s to Early 30s",
      imageSrc: "/images/results/anonymous-3.jpg",
    },
  ];

  return (
    <section id="results" className="section-peach relative scroll-mt-20 py-14 sm:py-20 lg:py-24">
      <div className="container-tight">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="section-label">Patterns From The Practice</span>
            <h2 className="display-headline text-display-lg sm:text-display-xl">
              The women behind{" "}
              <span className="text-gradient-wine italic">the patterns.</span>
            </h2>
            <div className="section-divider mt-6" />
            <p className="body-lede mt-6">
              The recurring patterns Akhila sees across the women she works
              with, and how they shift once the metabolic picture is corrected.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:mt-14 sm:grid-cols-2 sm:gap-6 lg:gap-7">
          {results.map((r, i) => (
            <Reveal key={`${r.name}-${r.title}`} delay={i * 0.05} className="h-full">
              <CaseCard r={r} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
