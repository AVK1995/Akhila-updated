"use client";

import { Reveal } from "../shared-client";
import { CheckIcon, CrossIcon } from "../icons";

export function EligibilitySection() {
  const forYou = [
    "You have been on medication before and things came back when you stopped",
    "You have irregular cycles, hair fall, weight gain, acne, or fatigue despite genuinely trying",
    "You want a physician who looks at the full picture: sleep, stress, gut, insulin, not just your ovaries",
    "You are done guessing and ready for a structured 90-day clinical approach",
    "You are trying to conceive and want to correct the root before taking further steps",
  ];
  const notForYou = [
    "You were recently diagnosed and are still exploring conventional treatment",
    "You want results in two weeks or a guaranteed fertility timeline",
    "You are looking for a cosmetic fix without addressing the metabolic root",
    "You want a second opinion on your current prescription",
    "You are not ready to commit to a structured programme with weekly clinical oversight",
  ];
  return (
    <section id="eligibility" className="relative scroll-mt-20 bg-cream-100 py-14 sm:py-20 lg:py-24">
      <div className="container-tight">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="section-label">Eligibility</span>
            <h2 className="display-headline text-display-lg sm:text-display-xl">
              This is <span className="italic text-wine-700">not</span> for everyone.
            </h2>
            <div className="section-divider mt-6" />
            <p className="body-lede mt-6">
              We are selective about who we work with. Individual clinical
              attention cannot be given to everyone.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-6 sm:mt-14 lg:grid-cols-2">
          <Reveal>
            <div className="card-elevated h-full">
              <div className="flex items-center gap-3">
                <span className="icon-disc icon-disc-gold h-11 w-11 shrink-0 !rounded-full">
                  <CheckIcon className="relative h-5 w-5" strokeWidth={2.2} />
                </span>
                <h3 className="font-display text-lg font-medium text-ink-800 sm:text-xl">
                  This is <span className="text-wine-700">for you</span> if:
                </h3>
              </div>
              <ul className="mt-6 space-y-4">
                {forYou.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-[14px] leading-relaxed text-ink-600 sm:text-[15px]">
                    <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-wine-700/10 text-wine-700">
                      <CheckIcon className="h-3 w-3" strokeWidth={2.5} />
                    </span>
                    <span className="text-pretty">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="card-elevated h-full border-ink-100/80 bg-cream-50">
              <div className="flex items-center gap-3">
                <span className="icon-disc icon-disc-mute h-11 w-11 shrink-0 !rounded-full">
                  <CrossIcon className="relative h-5 w-5" strokeWidth={2.2} />
                </span>
                <h3 className="font-display text-lg font-medium text-ink-800 sm:text-xl">
                  This is <span className="text-ink-500">not for you</span> if:
                </h3>
              </div>
              <ul className="mt-6 space-y-4">
                {notForYou.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-[14px] leading-relaxed text-ink-500 sm:text-[15px]">
                    <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink-100 text-ink-400">
                      <CrossIcon className="h-3 w-3" strokeWidth={2.5} />
                    </span>
                    <span className="text-pretty">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.12}>
          <figure className="mx-auto mt-14 max-w-3xl text-center sm:mt-16">
            <div className="font-display text-3xl text-gold-400 sm:text-4xl">&ldquo;</div>
            <blockquote className="mt-1 font-display text-base font-medium italic leading-snug text-ink-700 sm:text-lg lg:text-[21px]">
              This programme is for women who have been through the standard
              route and come out the other side still stuck. Who have tried the
              medications. Experienced the relapse. And are ready for the
              approach that works at the level where the actual problem lives.
            </blockquote>
            <figcaption className="mt-5 text-[12px] font-semibold uppercase tracking-[0.18em] text-wine-700 sm:text-[13px]">
              — Akhila
            </figcaption>
          </figure>
        </Reveal>
      </div>
    </section>
  );
}
