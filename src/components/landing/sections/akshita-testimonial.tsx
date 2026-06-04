"use client";

import { Reveal, LazyVimeoVideo } from "../shared-client";
import { CheckIcon, StarIcon } from "../icons";

export function AkshitaTestimonialSection() {
  const beats = [
    {
      title: "Diagnosed in 2018, dismissed it",
      body: "Her cycles were regular, so she assumed PCOS didn't apply to her.",
    },
    {
      title: "Stuck for years despite eating salads",
      body: "Workouts, diets, willpower. Nothing moved the weight. Energy crashed too.",
    },
    {
      title: "Insulin resistance was the actual story",
      body: "Dr. Aditya ran the markers, explained why PCOS doesn't manifest the same in every woman.",
    },
    {
      title: "Diet she could actually live with",
      body: "Akhila built a plan where every craving had a healthier version. No deprivation, no restart.",
    },
  ];
  const tags = [
    "Conceived in 90 Days",
    "PCOS Pattern Identified",
    "Insulin Resistance Understood",
    "Weight Finally Moving",
    "Now a Mom",
  ];
  return (
    <section
      id="akshita-story"
      className="relative scroll-mt-20 overflow-hidden py-14 sm:py-20 lg:py-24"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-20 -z-10 h-[420px] w-[420px] rounded-full bg-wine-100/40 blur-[110px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 bottom-10 -z-10 h-[420px] w-[420px] rounded-full bg-gold-100/40 blur-[110px]"
      />

      <div className="container-tight">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="section-label">Watch a Real Journey</span>
            <h2 className="display-headline text-display-lg sm:text-display-xl">
              Three months later,{" "}
              <span className="italic text-wine-700">she was pregnant.</span>
            </h2>
            <div className="section-divider mt-6" />
            <p className="body-lede mt-6">
              Akshaya, 32, diagnosed with PCOS in 2018 but told it was a
              misdiagnosis because her cycles were regular. Then the weight
              stopped moving, the fertility window narrowed, and she found us
              in 2025. Hear her tell it in her own words.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-14 grid gap-10 sm:mt-16 lg:grid-cols-2 lg:items-start lg:gap-14">
            <div className="mx-auto w-full max-w-[320px] sm:max-w-[340px] lg:max-w-[360px]">
              <div className="relative">
                <div
                  aria-hidden="true"
                  className="absolute -inset-[3px] -z-10 rounded-[28px] opacity-65 blur-[10px]"
                  style={{
                    background:
                      "conic-gradient(from 0deg, rgba(193,150,50,0.5), rgba(115,42,61,0.5), rgba(193,150,50,0.5))",
                  }}
                />
                <LazyVimeoVideo
                  videoId="1192533748"
                  hash="abc123def"
                  aspect="9/16"
                  title="Akshaya's PCOS journey with Dr. Aditya & Akhila"
                  playSize="md"
                  posterSrc="https://i.vimeocdn.com/video/2157834620-afa34ac910e913b246067789c2d03feb8bac3eb6d65fc8ae618ca76aba684463-d_640"
                />
              </div>
              <div className="mt-4 flex items-center gap-3 rounded-2xl border border-ink-100/80 bg-white/70 px-4 py-3 shadow-premium-sm backdrop-blur-sm">
                <span className="icon-disc icon-disc-wine h-9 w-9 shrink-0 !rounded-full">
                  <StarIcon className="relative text-cream-50" />
                </span>
                <div className="min-w-0 text-[12px] leading-tight text-ink-600 sm:text-[13px]">
                  <p className="font-display text-[14px] font-medium text-ink-800 sm:text-[15px]">
                    Akshaya · Age 32
                  </p>
                  <p className="text-[11.5px] text-ink-500 sm:text-[12px]">
                    Mom of a baby girl · Verified outcome
                  </p>
                </div>
              </div>
            </div>

            <div>
              <div className="font-display text-[2.6rem] leading-none text-gold-300/80 sm:text-5xl">
                &ldquo;
              </div>
              <blockquote className="-mt-1 font-display text-[1.15rem] font-medium italic leading-snug text-ink-800 sm:text-[1.15rem] lg:text-[1.25rem]">
                Within three months of getting my life back on track with{" "}
                <span className="text-gradient-wine">Dr. Aditya and Akhila&apos;s guidance</span>
                , I managed to conceive. Today I am the mom of a really
                beautiful baby girl.
              </blockquote>

              <div className="mt-5 flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1.5 rounded-full border border-gold-200/70 bg-gold-50/70 px-2.5 py-1 text-[11px] font-medium text-gold-800 backdrop-blur-sm sm:text-[11.5px]"
                  >
                    <StarIcon className="h-2.5 w-2.5 text-gold-500" />
                    {t}
                  </span>
                ))}
              </div>

              <div className="mt-7">
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold-300/60 to-transparent" />
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-gold-700 sm:text-[11px]">
                    Her journey, in four beats
                  </p>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent via-gold-300/60 to-transparent" />
                </div>
                <ul className="mt-4 space-y-2.5 sm:space-y-2.5">
                  {beats.map((b) => (
                    <li
                      key={b.title}
                      className="flex items-start gap-3 rounded-xl border border-ink-100/80 bg-white/70 px-3.5 py-3 shadow-premium-sm backdrop-blur-sm transition-all duration-500 ease-smooth hover:-translate-y-0.5 hover:border-gold-200/80 hover:shadow-premium"
                    >
                      <span className="icon-disc icon-disc-gold h-7 w-7 shrink-0 !rounded-full">
                        <CheckIcon className="relative h-3 w-3" strokeWidth={2.5} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[13.5px] font-medium leading-snug text-ink-800 sm:text-[13.5px]">
                          {b.title}
                        </p>
                        <p className="mt-1 text-[12.5px] leading-relaxed text-ink-500 sm:text-[12.5px]">
                          {b.body}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
