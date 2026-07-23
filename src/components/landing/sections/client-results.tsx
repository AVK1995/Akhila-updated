"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Reveal } from "../shared-client";
import { Pmos } from "../shared-static";

/* =============================================================================
 * CLIENT RESULTS — case-study carousel
 * =============================================================================
 * One slide per woman: her name + condition tag, a drawn avatar with her
 * age and role, a BEFORE (red) vs AFTER (green)
 * comparison, then a collapsible "story in detail" panel.
 *
 * Carousel on every breakpoint (mobile and desktop), driven by native
 * scroll-snap rather than a library: the track is a horizontally scrollable
 * flex row, each slide snaps to centre, and the dots/arrows just scroll it.
 * That keeps swipe, trackpad, keyboard and screen-reader behaviour native and
 * costs no extra JS beyond the active-index bookkeeping.
 *
 * NOTE: the portraits were removed on the client's instruction — the identity
 * block uses a drawn avatar so no photo (or AI-generated likeness) is implied.
 * =============================================================================
 */

type CaseStudy = {
  name: string;
  age: string;
  role: string;
  before: string[];
  after: string[];
  happening: string;
  approach: string[];
  outcome: string;
};

const CASES: CaseStudy[] = [
  {
    name: "Rhea",
    age: "26 Years",
    role: "IT Professional",
    before: [
      "Period delayed by 17+ days",
      "Weight gain around the abdomen",
      "Brain fog & fatigue",
      "Migraines after OCPs",
      "Irregular cycles",
    ],
    after: [
      "Cycles became regular",
      "Weight stabilised",
      "Better energy & mental clarity",
      "Migraines significantly reduced",
      "Improved without hormonal suppression",
    ],
    happening:
      "Night shifts, poor sleep and chronic stress disrupted her circadian rhythm and insulin sensitivity, contributing to hormonal imbalance and PCOS symptoms.",
    approach: [
      "Sleep correction despite shift work",
      "Blood sugar stabilisation",
      "Metabolic conditioning",
      "Stress regulation",
      "Lifestyle education",
    ],
    outcome:
      "Her energy improved, migraines reduced, weight stabilised and her cycles became regular naturally.",
  },
  {
    name: "Kirti",
    age: "29 Years",
    role: "Social Media Influencer",
    before: [
      "No periods for 3 months",
      "Acne & weight gain",
      "Blood sugar crashes",
      "Fatigue & mood swings",
      "Gained 11 kg after OCPs",
    ],
    after: [
      "Energy restored",
      "Weight started improving",
      "Clearer skin",
      "Cycles returned naturally",
      "Better blood sugar stability",
    ],
    happening:
      "Chronic stress, poor sleep and insulin instability kept her body in survival mode, contributing to worsening PCOS symptoms.",
    approach: [
      "Restorative strength training",
      "Structured sleep routine",
      "Blood sugar regulation",
      "Stress management",
      "Lifestyle correction",
    ],
    outcome:
      "As her nervous system recovered, her hormones followed. Energy improved, skin cleared and her cycles returned naturally.",
  },
  {
    name: "Saloni",
    age: "21 Years",
    role: "Law Student",
    before: [
      "Persistent acne",
      "Facial hair growth",
      "Insomnia",
      "Painful delayed periods",
      "Cosmetic treatments only",
    ],
    after: [
      "Better sleep",
      "Regular cycles",
      "Reduced menstrual pain",
      "Clearer skin",
      "Hormonal balance restored",
    ],
    happening:
      "Her acne and facial hair were early hormonal warning signs. Treating only the skin allowed the underlying hormonal imbalance to progress.",
    approach: [
      "Insulin regulation",
      "Structured nutrition",
      "Sleep restoration",
      "Stress management",
      "Hormonal education",
    ],
    outcome:
      "Sleep normalised, cycles became predictable and her skin improved by addressing the root cause.",
  },
  {
    name: "Ananya",
    age: "34 Years",
    role: "HR Professional",
    before: [
      "Irregular ovulation",
      "Weight gain",
      "Three unsuccessful IVF cycles",
      "Persistent stress & anxiety",
      "Nine years of infertility",
    ],
    after: [
      "Regular menstrual cycles",
      "Better metabolic health",
      "Improved sleep",
      "Natural conception",
      "Restored hormonal balance",
    ],
    happening:
      "Years of chronic stress affected cortisol, insulin sensitivity and ovulation. Supporting her nervous system became just as important as supporting her reproductive system.",
    approach: [
      "Stress regulation",
      "Lifestyle correction",
      "Sleep optimisation",
      "Blood sugar management",
      "Metabolic recovery",
    ],
    outcome:
      "As her stress chemistry improved, her hormonal rhythm recovered and she conceived naturally.",
  },
];

/* ─────────────────────────────────────────────────────────────────────────────
 * ICONS — drawn, not photographic. The avatar deliberately depicts nobody.
 * ─────────────────────────────────────────────────────────────────────────────
 */
const strokeProps = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function FemaleAvatarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} {...strokeProps}>
      {/* shoulders */}
      <path d="M11.5 42c0-6.4 5.6-10.8 12.5-10.8S36.5 35.6 36.5 42" />
      {/* neck */}
      <path d="M20.6 27.4v3.6M27.4 27.4v3.6" />
      {/* face */}
      <circle cx="24" cy="19.5" r="7.4" />
      {/* hair — crown and the two lengths framing the face */}
      <path d="M15.6 19.5c0-6 3.6-10.2 8.4-10.2s8.4 4.2 8.4 10.2" />
      <path d="M15.6 19.5c-.7 5 .1 8.6 1.4 11M32.4 19.5c.7 5-.1 8.6-1.4 11" />
    </svg>
  );
}
function TargetIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...strokeProps}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.4" />
    </svg>
  );
}
function StethoscopeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...strokeProps}>
      <path d="M6 3v5a4.5 4.5 0 0 0 9 0V3" />
      <path d="M4.5 3h3M13.5 3h3" />
      <path d="M10.5 12.5v2a5 5 0 0 0 10 0v-1.2" />
      <circle cx="20.5" cy="11" r="2" />
    </svg>
  );
}
function StarOutlineIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...strokeProps}>
      <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9L12 3.5Z" />
    </svg>
  );
}
function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...strokeProps} strokeWidth={2}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
function ArrowRightSmall({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...strokeProps} strokeWidth={2}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
function PcosTagIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...strokeProps}>
      <path d="M12 21s-6.5-4.6-6.5-9.6A6.5 6.5 0 0 1 12 5a6.5 6.5 0 0 1 6.5 6.4C18.5 16.4 12 21 12 21Z" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * CARD
 * ─────────────────────────────────────────────────────────────────────────────
 */
function CaseCard({
  c,
  open,
  onToggle,
}: {
  c: CaseStudy;
  /** Shared across every slide, so swiping never lands on a card whose story
   *  is in a different state from the one just left. */
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <article className="flex h-full flex-col rounded-3xl border border-ink-100 bg-white p-4 shadow-premium sm:p-6">
      {/* Identity — her name IS the label (no "case study N"), a drawn avatar
          rather than a photograph, and the condition tag on the right. */}
      <div className="flex items-center gap-3.5 sm:gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-wine-50 text-wine-600 sm:h-16 sm:w-16">
          <FemaleAvatarIcon className="h-9 w-9 sm:h-10 sm:w-10" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-[21px] font-medium leading-tight text-ink-800 sm:text-[25px]">
            {c.name}
          </h3>
          <p className="mt-1 text-[12.5px] font-medium text-ink-500 sm:text-[13.5px]">
            {c.age} &bull; {c.role}
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border border-ink-100 bg-cream-50 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-500 sm:px-3 sm:text-[11px]">
          <PcosTagIcon className="h-3 w-3 shrink-0 text-wine-600" />
          <Pmos />
        </span>
      </div>

      {/* BEFORE → AFTER */}
      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-1.5 sm:gap-3">
        <div className="h-full rounded-2xl border border-red-200/70 bg-red-50/60 p-2.5 sm:p-4">
          <p className="text-[9.5px] font-bold uppercase tracking-[0.16em] text-red-700 sm:text-[11px]">
            Before
          </p>
          <ul className="mt-2 space-y-1.5">
            {c.before.map((b) => (
              <li
                key={b}
                className="flex items-start gap-1.5 text-[11px] leading-snug text-ink-600 sm:text-[13px]"
              >
                <span aria-hidden="true" className="mt-[1px] shrink-0 font-semibold text-red-500">
                  ✕
                </span>
                <span className="min-w-0">{b}</span>
              </li>
            ))}
          </ul>
        </div>

        <span
          aria-hidden="true"
          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-ink-100 bg-white text-wine-600 shadow-premium-sm sm:h-8 sm:w-8"
        >
          <ArrowRightSmall className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
        </span>

        <div className="h-full rounded-2xl border border-emerald-200/70 bg-emerald-50/60 p-2.5 sm:p-4">
          <p className="text-[9.5px] font-bold uppercase tracking-[0.16em] text-emerald-700 sm:text-[11px]">
            After
          </p>
          <ul className="mt-2 space-y-1.5">
            {c.after.map((a) => (
              <li
                key={a}
                className="flex items-start gap-1.5 text-[11px] leading-snug text-ink-700 sm:text-[13px]"
              >
                <span aria-hidden="true" className="mt-[1px] shrink-0 font-semibold text-emerald-600">
                  ✓
                </span>
                <span className="min-w-0">{a}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Story — collapsed by default. mt-auto pins the toggle to the bottom
          of the card: slides are equal height (tallest wins), so without it
          the shorter cards trail dead space under the button instead of
          absorbing it above.

          A controlled button rather than <details>, because the open state is
          owned by the carousel and shared by all four cards. */}
      <div className="mt-auto pt-3">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-wine-200 px-4 py-2.5 text-[12.5px] font-medium text-wine-700 transition-colors duration-300 hover:bg-wine-50 sm:text-[13.5px]"
        >
          <ChevronDownIcon
            className={cn(
              "h-3.5 w-3.5 shrink-0 transition-transform duration-300",
              open && "rotate-180"
            )}
          />
          Tap to Read {c.name}&rsquo;s Story
        </button>

        <div hidden={!open} className="mt-3 rounded-2xl bg-cream-50/80 p-4 sm:p-5">
          <p className="text-[9.5px] font-bold uppercase tracking-[0.16em] text-wine-700 sm:text-[10.5px]">
            The Story In Detail
          </p>

          <div className="mt-3 divide-y divide-ink-100/70">
            <div className="flex items-start gap-3 pb-3">
              <TargetIcon className="mt-0.5 h-5 w-5 shrink-0 text-wine-600" />
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-ink-800 sm:text-[14px]">
                  What Was Happening
                </p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-ink-600 sm:text-[13.5px]">
                  {c.happening}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 py-3">
              <StethoscopeIcon className="mt-0.5 h-5 w-5 shrink-0 text-wine-600" />
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-ink-800 sm:text-[14px]">
                  Our Approach
                </p>
                {/* Kept as a real list — these are five distinct interventions,
                    not a sentence. */}
                <ul className="mt-1.5 space-y-1">
                  {c.approach.map((a) => (
                    <li
                      key={a}
                      className="flex items-start gap-2 text-[12.5px] leading-relaxed text-ink-600 sm:text-[13.5px]"
                    >
                      <span
                        aria-hidden="true"
                        className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-wine-600"
                      />
                      <span className="min-w-0">{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-3">
              <StarOutlineIcon className="mt-0.5 h-5 w-5 shrink-0 text-wine-600" />
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-ink-800 sm:text-[14px]">
                  Outcome
                </p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-ink-600 sm:text-[13.5px]">
                  {c.outcome}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * CAROUSEL — native scroll-snap, no library
 * ─────────────────────────────────────────────────────────────────────────────
 */
function CaseCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  /** ONE open flag for all four slides. Each card is driven by it, so the
   *  story is either expanded on every slide or collapsed on every slide —
   *  swiping can never reveal a card in the opposite state. */
  const [storyOpen, setStoryOpen] = useState(false);

  /** Scroll a slide to the start of the track. offsetLeft is measured against
   *  the track because it is the scroll container (position: relative). */
  const goTo = useCallback((i: number) => {
    const track = trackRef.current;
    const slide = track?.children[i] as HTMLElement | undefined;
    if (!track || !slide) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    track.scrollTo({
      left: slide.offsetLeft - track.offsetLeft,
      behavior: reduce ? "auto" : "smooth",
    });
  }, []);

  // Derive the active dot from scroll position — whichever slide centre is
  // closest to the track centre wins. rAF-throttled so it stays cheap on a
  // momentum scroll.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let raf = 0;
    const read = () => {
      const mid = track.scrollLeft + track.clientWidth / 2;
      let best = 0;
      let bestDist = Infinity;
      Array.from(track.children).forEach((el, i) => {
        const s = el as HTMLElement;
        const centre = s.offsetLeft - track.offsetLeft + s.clientWidth / 2;
        const dist = Math.abs(centre - mid);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });
      setActive(best);
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(read);
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    read();
    return () => {
      track.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // No autoplay — the carousel only moves when the viewer moves it.
  const atStart = active === 0;
  const atEnd = active === CASES.length - 1;

  return (
    <div
      className="relative mx-auto mt-10 max-w-3xl sm:mt-12"
      role="group"
      aria-roledescription="carousel"
      aria-label="Client case studies"
    >
      {/* Arrows sit outside the card on desktop, where there is gutter for
          them; on mobile the swipe gesture and the dots are enough. */}
      <button
        type="button"
        onClick={() => goTo(active - 1)}
        disabled={atStart}
        aria-label="Previous case study"
        className="absolute -left-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-ink-100 bg-white text-wine-700 shadow-premium transition-opacity duration-300 hover:bg-wine-50 disabled:pointer-events-none disabled:opacity-0 lg:-left-14 lg:flex"
      >
        <ArrowRightSmall className="h-4 w-4 rotate-180" />
      </button>
      <button
        type="button"
        onClick={() => goTo(active + 1)}
        disabled={atEnd}
        aria-label="Next case study"
        className="absolute -right-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-ink-100 bg-white text-wine-700 shadow-premium transition-opacity duration-300 hover:bg-wine-50 disabled:pointer-events-none disabled:opacity-0 lg:-right-14 lg:flex"
      >
        <ArrowRightSmall className="h-4 w-4" />
      </button>

      <div
        ref={trackRef}
        className="scrollbar-none flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-1"
      >
        {CASES.map((c, i) => (
          <div
            key={c.name}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${CASES.length}`}
            className="w-full shrink-0 snap-center"
          >
            {/* Every card reads and writes the same open flag. */}
            <CaseCard c={c} open={storyOpen} onToggle={() => setStoryOpen((v) => !v)} />
          </div>
        ))}
      </div>

      {/* Dots */}
      <div className="mt-5 flex items-center justify-center gap-2">
        {CASES.map((c, i) => (
          <button
            key={c.name}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Go to case study ${i + 1}`}
            aria-current={i === active}
            className={
              i === active
                ? "h-2 w-2 rounded-full bg-wine-700 transition-all duration-300"
                : "h-2 w-2 rounded-full bg-wine-200 transition-all duration-300 hover:bg-wine-300"
            }
          />
        ))}
      </div>
    </div>
  );
}

export function ClientResultsSection() {
  return (
    <section id="results" className="section-peach relative scroll-mt-20 py-14 sm:py-20 lg:py-24">
      <div className="container-tight">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="section-label">Real Women. Real Lives. Real Recovery.</span>
            <h2 className="display-headline text-display-lg sm:text-display-xl">
              Career-Driven Women Who{" "}
              <span className="title-underline text-gradient-wine italic">Fixed <Pmos /> At The Root</span>
            </h2>
            <p className="body-lede mt-6">
              From IT professionals and HR leaders to entrepreneurs, these are
              women who transformed their hormonal health through a
              personalised, root-cause approach.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <CaseCarousel />
        </Reveal>
      </div>
    </section>
  );
}
