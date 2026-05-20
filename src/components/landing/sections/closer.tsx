"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { animate, useInView, useReducedMotion } from "motion/react";
import { Reveal, CtaLink } from "../shared-client";
import { ArrowRightIcon } from "../icons";
import { publicEnv } from "@/lib/env";

/**
 * StatCounter: animates a numeric value when it scrolls into view.
 * Accepts a display string like "30,000+", "90 Days", "₹97" and animates the
 * numeric portion. Locale-formats numbers that already used commas in the
 * source (so 30,000 stays "30,000", not "30000").
 *
 * The parsed result is memoized — without it, the parsed object would be a
 * fresh reference every render, causing the useEffect to re-trigger and the
 * animation to restart from 0 forever (counter would appear stuck near 0).
 */
function StatCounter({ targetText }: { targetText: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px 0px" });
  const reduce = useReducedMotion();

  const parsed = useMemo(() => {
    const match = targetText.match(/^(\D*)(\d[\d,]*)(\D*)$/);
    if (!match) return null;
    return {
      prefix: match[1],
      target: Number(match[2].replace(/,/g, "")),
      suffix: match[3],
      locale: match[2].includes(","),
    };
  }, [targetText]);

  const target = parsed?.target ?? 0;
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!parsed || !inView) return;
    if (reduce) {
      setCurrent(target);
      return;
    }
    const controls = animate(0, target, {
      duration: 1.6,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setCurrent(v),
    });
    return () => controls.stop();
  }, [inView, target, reduce, parsed]);

  if (!parsed) return <span ref={ref}>{targetText}</span>;

  const n = Math.floor(current);
  const display = parsed.locale ? n.toLocaleString("en-IN") : String(n);
  return (
    <span ref={ref}>
      {parsed.prefix}
      {display}
      {parsed.suffix}
    </span>
  );
}

export function CloserSection() {
  const stats = [
    { value: "30,000+", label: "Patients" },
    { value: "90 Days", label: "Programme" },
    { value: "30 Min", label: "Assessment" },
    { value: publicEnv.assessmentFeeDisplay, label: "To Start" },
  ];
  return (
    <section id="closer" className="relative scroll-mt-20 overflow-hidden bg-wine-gradient py-20 text-cream-50 sm:py-28 lg:py-32">
      <div aria-hidden="true" className="pointer-events-none absolute -left-32 top-0 h-[400px] w-[600px] rounded-full bg-gold-400/15 blur-[120px]" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-32 bottom-0 h-[400px] w-[600px] rounded-full bg-wine-400/30 blur-[120px]" />

      <div className="container-tight relative">
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold-300/40 bg-gold-400/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-200 sm:text-xs">
              The Reality
            </span>
            <h2 className="mt-7 font-display text-display-xl font-medium text-cream-50 sm:text-display-2xl">
              You already <span className="italic text-gold-200">know.</span>
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-cream-100/85 sm:text-lg">
              Every day you wait is another day of insulin resistance
              compounding quietly. The gap does not close on its own.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <figure className="mx-auto mt-12 max-w-2xl text-center sm:mt-14">
            <div className="font-display text-4xl leading-none text-gold-300/50">&ldquo;</div>
            <blockquote className="font-display text-base font-medium italic leading-snug text-cream-50 sm:text-lg lg:text-[21px]">
              The most consistent thing I hear from women who complete this
              programme is: I wish I had done this two years ago.
            </blockquote>
            <figcaption className="mt-5 text-[12px] font-semibold uppercase tracking-[0.18em] text-gold-200 sm:text-[13px]">
              — Dr. Aditya
            </figcaption>
          </figure>
        </Reveal>

        <Reveal delay={0.15}>
          <ul className="mx-auto mt-12 grid max-w-2xl grid-cols-2 gap-3 sm:mt-14 sm:grid-cols-4 sm:gap-4">
            {stats.map((s) => (
              <li key={s.label} className="rounded-2xl border border-cream-50/10 bg-cream-50/5 px-4 py-4 text-center backdrop-blur-sm sm:py-5">
                <p className="font-display text-lg font-medium tabular-nums text-cream-50 sm:text-xl">
                  <StatCounter targetText={s.value} />
                </p>
                <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.15em] text-cream-100/70 sm:text-[11px]">{s.label}</p>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.2}>
          <div className="mt-12 flex flex-col items-center gap-4 sm:mt-14">
            <CtaLink
              href="/checkout"
              variant="primary-inverse-lg"
              label={
                <>
                  Book <span className="hidden sm:inline">My Clinical </span>
                  Assessment<span className="hidden sm:inline"> Call</span>
                  {" · "}
                  {publicEnv.assessmentFeeDisplay}
                </>
              }
              ariaLabel="Book your clinical assessment call now"
              className="[&>span]:whitespace-nowrap [&>span]:leading-tight"
              trailing={
                <ArrowRightIcon
                  className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
                  strokeWidth={2}
                />
              }
            />
            <p className="text-center text-[13px] leading-relaxed text-cream-100/70 sm:text-sm">
              You will not leave the call with Akhila confused. Click above and secure your slot.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
