"use client";

import { Reveal } from "../shared-client";
import { CtaBlock } from "../cta-block";

export function CloserSection() {
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
              You already <span className="title-underline title-underline-dark italic text-gold-200">know.</span>
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
              Dr. Aditya
            </figcaption>
          </figure>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="mt-12 flex flex-col items-center sm:mt-14">
            <CtaBlock variant="dark" className="w-full" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
