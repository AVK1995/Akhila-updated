"use client";

import { Reveal, CtaLink } from "../shared-client";
import { ArrowRightIcon, CheckIcon, LockIcon, ShieldIcon } from "../icons";
import { publicEnv } from "@/lib/env";

export function InvestmentSection() {
  const bullets = [
    "Years of gynaecologist visits and prescriptions that keep relapsing",
    "Dermatologist bills for acne that returns while hormones stay unaddressed",
    "Supplements and diet programmes that worked for three weeks then stopped",
    "A single IV infusion at a metro wellness clinic costs ₹10,000 to ₹15,000. The full programme includes a personalised IV protocol across 90 days",
    "For women planning to conceive: a narrowing window and increasingly expensive interventions with every month of delay",
  ];
  const features = [
    "30-minute clinical assessment call with Akhila",
    "Full review of your PCOS history, symptoms, and lifestyle",
    "Clear understanding of what is driving your specific pattern",
    "Honest assessment of whether the programme is the right fit for you",
    "If you enrol, your assessment becomes the foundation of your entire programme",
  ];
  return (
    <section id="investment" className="relative scroll-mt-20 py-14 sm:py-20 lg:py-24">
      <div className="container-tight">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-start lg:gap-16">
          <Reveal>
            <div className="text-center lg:text-left">
              <span className="section-label">Investment</span>
              <h2 className="display-headline text-display-lg sm:text-display-xl">
                A small investment.{" "}
                <span className="block text-gradient-wine">A serious commitment.</span>
              </h2>
              <p className="mt-6 text-[15px] italic leading-relaxed text-ink-500 sm:text-base">
                Before you look at the number, calculate what you have already spent.
              </p>
              <ul className="mt-8 inline-block space-y-4 text-left lg:block">
                {bullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-3 text-[14px] leading-relaxed text-ink-600 sm:text-[15px]">
                    <span className="mt-1.5 inline-flex h-1.5 w-1.5 shrink-0 rounded-full bg-wine-600" />
                    <span className="text-pretty">{b}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-8 rounded-2xl border border-gold-200 bg-gold-50/60 px-5 py-4 text-center text-[14px] italic leading-relaxed text-ink-700 sm:text-[15px] lg:text-left">
                We are not the budget option. We are the option that addresses
                the problem at the level where it actually lives.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="relative lg:sticky lg:top-24">
              <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-wine-100/50 via-gold-100/40 to-wine-100/50 blur-3xl" />
              <div className="rounded-3xl border border-wine-200/50 bg-white p-7 shadow-premium-xl sm:p-9">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-wine-700 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-cream-50 shadow-wine-glow sm:text-[12px]">
                    Start Here
                  </span>
                  <span className="inline-flex items-center gap-2 text-[12px] font-medium text-gold-700">
                    <span className="icon-disc icon-disc-gold h-6 w-6 shrink-0 !rounded-full">
                      <ShieldIcon className="relative h-3 w-3" strokeWidth={2} />
                    </span>
                    Refundable
                  </span>
                </div>

                <div className="mt-7 flex items-baseline gap-2">
                  <span className="font-display text-4xl font-medium tracking-tight text-ink-800 sm:text-5xl">
                    {publicEnv.assessmentFeeDisplay}
                  </span>
                  <span className="text-sm text-ink-400">Call with Akhila · Refundable</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">
                  This is not a generic consultation. It is a structured
                  clinical conversation to understand your specific situation
                  before anything is recommended.
                </p>

                <ul className="mt-7 space-y-3">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-[14px] leading-relaxed text-ink-700 sm:text-[15px]">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-wine-700/10 text-wine-700">
                        <CheckIcon className="h-3 w-3" strokeWidth={2.5} />
                      </span>
                      <span className="text-pretty">{f}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8 flex flex-col gap-3">
                  <CtaLink
                    href="/checkout"
                    variant="primary-lg"
                    label={
                      <>
                        Book <span className="hidden lg:inline">My </span>
                        Assessment<span className="hidden lg:inline"> Call</span>
                        {" · "}
                        {publicEnv.assessmentFeeDisplay}
                      </>
                    }
                    ariaLabel="Book your clinical assessment call now"
                    className="w-full [&>span]:whitespace-nowrap [&>span]:leading-tight [&>span]:text-[15px] sm:[&>span]:text-base"
                    trailing={
                      <ArrowRightIcon
                        className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
                        strokeWidth={2}
                      />
                    }
                  />
                  <p className="flex items-center justify-center gap-2 text-[12px] text-ink-400 sm:text-[13px]">
                    <LockIcon className="h-3 w-3" />
                    Secure checkout · Razorpay · Cards, UPI, Wallets
                  </p>
                </div>

                <p className="mt-6 border-t border-ink-100 pt-5 text-center text-[13px] leading-relaxed text-ink-500 sm:text-sm">
                  Fully refunded if you gain no clarity from the call with
                  Akhila. No questions asked.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
