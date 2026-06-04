"use client";

import { Reveal } from "../shared-client";
import { CheckIcon, ShieldIcon } from "../icons";
import { publicEnv } from "@/lib/env";

export function GuaranteeSection() {
  const conditions = [
    {
      title: "You attend the full 30-minute call.",
      body: "Show up on time and stay for the whole conversation. We do not refund no-shows.",
    },
    {
      title: "You share what you have already tried.",
      body: "Past medications, supplements, diet attempts, cycle pattern, lifestyle. The clearer the picture, the deeper we can go.",
    },
    {
      title: "You answer Akhila's questions honestly.",
      body: "We work from your actual history (sleep, stress, work, gut), not a sanitised version. Honest input is what makes clinical clarity possible.",
    },
  ];
  return (
    <section
      id="guarantee"
      className="relative scroll-mt-20 py-14 sm:py-20 lg:py-24"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[460px] w-[860px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-100/40 blur-[120px]"
      />

      <div className="container-tight">
        <Reveal>
          <div className="relative mx-auto max-w-4xl">
            <div
              aria-hidden="true"
              className="absolute inset-x-12 top-0 h-[2px] rounded-full bg-gradient-to-r from-transparent via-gold-400 to-transparent shadow-[0_0_20px_rgba(212,178,71,0.6)]"
            />
            <div className="relative overflow-hidden rounded-[28px] border border-gold-300/15 bg-gradient-to-br from-ink-800 via-wine-900 to-ink-900 px-6 py-12 shadow-premium-xl sm:px-10 sm:py-16 lg:px-14 lg:py-20">
              <div aria-hidden="true" className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-wine-700/40 blur-[110px]" />
              <div aria-hidden="true" className="pointer-events-none absolute -right-32 -bottom-32 h-80 w-80 rounded-full bg-gold-500/25 blur-[120px]" />
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-grain opacity-[0.06]" />

              <div className="relative flex flex-col items-center text-center">
                <span className="icon-disc icon-disc-glass-hero h-20 w-20 sm:h-[88px] sm:w-[88px]">
                  <ShieldIcon className="relative h-9 w-9 sm:h-10 sm:w-10" strokeWidth={1.8} />
                </span>

                <span className="mt-7 inline-flex items-center gap-2 rounded-full border border-gold-300/35 bg-gold-400/10 px-4 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-gold-200 backdrop-blur-sm sm:text-[11.5px]">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-pulse-ring-strong rounded-full bg-gold-300" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-gold-300 shadow-[0_0_8px_rgba(229,203,110,0.9)]" />
                  </span>
                  100% Money-Back Guarantee
                </span>

                <h2 className="mt-5 font-display text-[clamp(1.55rem,2.6vw+0.8rem,2.4rem)] font-medium leading-[1.08] tracking-tight text-cream-50">
                  100%{" "}
                  <span className="bg-gradient-to-r from-gold-200 via-gold-300 to-gold-200 bg-clip-text text-transparent">
                    Refund If No Clarity.
                  </span>
                </h2>

                <p className="mt-5 max-w-2xl text-[14.5px] leading-relaxed text-cream-100/80 sm:text-base">
                  If you finish the{" "}
                  <span className="font-medium text-gold-200">
                    30-minute assessment call with Akhila
                  </span>{" "}
                  and feel{" "}
                  <span className="font-medium text-gold-200">
                    no clarity was gained on your specific case
                  </span>
                  , we refund every rupee. No friction, no chasing, no
                  cooling-off period.
                </p>

                <div className="mt-10 w-full max-w-2xl rounded-2xl border border-gold-300/15 bg-ink-900/50 p-5 backdrop-blur-sm sm:p-7">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-gold-300/90 sm:text-[11.5px]">
                    What we ask in return
                  </p>
                  <ul className="mt-5 space-y-4 text-left">
                    {conditions.map((c) => (
                      <li key={c.title} className="flex items-start gap-3.5">
                        <span className="icon-disc icon-disc-gold mt-0.5 h-6 w-6 shrink-0 !rounded-full">
                          <CheckIcon className="relative h-3.5 w-3.5" strokeWidth={2.5} />
                        </span>
                        <div>
                          <p className="text-[14px] font-medium leading-snug text-cream-50 sm:text-[15px]">
                            {c.title}
                          </p>
                          <p className="mt-1 text-[13px] leading-relaxed text-cream-100/70 sm:text-[14px]">
                            {c.body}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="mt-8 max-w-xl text-[12.5px] italic leading-relaxed text-cream-100/55 sm:text-[13.5px]">
                  The {publicEnv.assessmentFeeDisplay} assessment fee is also fully refundable if{" "}
                  <em className="not-italic font-medium text-gold-200/90">you</em>{" "}
                  decide on the call that we are not the right fit for your
                  case. Refund processed within 7 working days to your original
                  payment method.
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
