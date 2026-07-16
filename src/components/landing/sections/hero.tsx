"use client";

import { useCallback, useRef } from "react";
import { motion } from "motion/react";
import { CtaLink, LazyVimeoVideo, type LazyVimeoVideoHandle } from "../shared-client";
import { FloatingOrbs, Pmos } from "../shared-static";
import { ArrowRightIcon, PlayIcon, ShieldIcon } from "../icons";
import { publicEnv } from "@/lib/env";
import { FREE_FUNNEL_MODE } from "@/lib/funnel";
import { UrgencyTimer } from "@/components/urgency-timer";

export function HeroSection() {
  const videoRef = useRef<LazyVimeoVideoHandle>(null);

  /**
   * "Watch the video below." → play the VSL in FULLSCREEN, on every device and
   * OS. Desktop/Android take the iframe fullscreen via the Fullscreen API; iOS
   * hands off to its native fullscreen player (playsinline=0) — the only path
   * to sound there. Fullscreen must be requested inside this tap to stay within
   * the user-activation window, so playback starts here synchronously.
   *
   * We still scroll the player into view first so that when the viewer exits
   * fullscreen the same (still-playing) video is right there in the page.
   */
  const watchVideo = useCallback(() => {
    const target = document.getElementById("hero-video");
    if (target) {
      const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
      target.scrollIntoView({
        behavior: reduce ? "auto" : "smooth",
        block: "center",
      });
    }
    videoRef.current?.play({ fullscreen: true });
  }, []);

  return (
    <section
      id="hero"
      className="hero-mesh relative isolate flex min-h-[calc(100svh-44px)] flex-col overflow-hidden pb-6 pt-5 sm:pt-6 lg:pt-4"
    >
      {/* ── BACKGROUND ATMOSPHERE ───────────── */}
      {/* hero-mesh (globals.css) lays the warm-cream paper base with a
          center spotlight, mesh gradient, and noise texture. FloatingOrbs
          (shared-static) adds the animated aurora layer on top — slow
          drifting low-opacity glows + elongated light streaks for the
          alive / expensive / futuristic-healthcare feel. */}
      <FloatingOrbs />

      {/*
        MOBILE: container is a flex column with `justify-between` and `flex-1`
        so it fills the viewport. ALL FIVE elements (pill, headline, sub, video,
        CTA-group) are direct children of the flex column, so the leftover
        space is split evenly across the 4 gaps between them — no concentration
        of empty space around any single element.

        DESKTOP (sm:): container reverts to a normal block layout. The elements
        stack with their own `sm:mt-*` margins exactly as before.
      */}
      <div className="container-tight relative flex flex-1 flex-col items-center justify-center gap-5 sm:block sm:flex-none sm:items-stretch sm:gap-0 sm:text-center">
        {/* 1. Eyebrow pill */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="glass-pill inline-flex max-w-full items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 text-[9.5px] font-semibold uppercase tracking-[0.08em] text-wine-700 shadow-premium-sm sm:gap-2.5 sm:px-5 sm:py-2 sm:text-[12px] sm:tracking-[0.16em]"
        >
          <span className="live-dot" />
          The <Pmos /> Metabolic Assessment · Only {publicEnv.assessmentFeeDisplay}
        </motion.div>

        {/* 2. Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="display-headline mx-auto max-w-3xl text-center text-[clamp(2rem,5.5vw+0.5rem,3rem)] leading-[1.1] tracking-tight sm:mt-5 sm:leading-[1.05]"
        >
          Fix your <Pmos /> at the{" "}
          <span className="italic text-wine-700">root</span>{" "}
          <span className="text-gradient-wine">before it gets significantly harder to reverse.</span>
        </motion.h1>

        {/* 3. Sub paragraph */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-[36rem] text-pretty text-center text-[15.5px] leading-[1.6] text-ink-500 sm:mt-5 sm:text-[15px] sm:leading-relaxed"
        >
          Watch the video to see how family physician Dr. Aditya, with{" "}
          <span className="font-medium text-ink-700">15 years of clinical experience</span>,
          and clinical nutritionist Akhila help women break the pattern of
          temporary results, returning symptoms, and constant frustration by
          correcting the metabolic root of <Pmos />.
        </motion.p>

        {/* 4. Video caption — glass pill that mirrors the eyebrow pill above,
            with a filled play badge so it reads as a clear "play this" prompt.
            Tapping it scrolls the VSL into view and plays it in place (no
            modal, no new page). Plain copy, no brand jargon. */}
        <motion.button
          type="button"
          onClick={watchVideo}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="glass-pill group/watch inline-flex max-w-full cursor-pointer items-center gap-2 whitespace-nowrap rounded-full py-1.5 pl-1.5 pr-4 font-display text-[13px] font-medium text-ink-800 shadow-premium-sm transition-shadow hover:shadow-premium sm:mt-6 sm:gap-2.5 sm:py-2 sm:pl-2 sm:pr-5 sm:text-[14px]"
        >
          <span
            aria-hidden="true"
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-wine-700 text-cream-50 shadow-wine-glow transition-transform duration-300 group-hover/watch:scale-105 sm:h-7 sm:w-7"
          >
            <PlayIcon className="ml-0.5 h-2.5 w-2.5 sm:h-3 sm:w-3" />
          </span>
          <span className="text-wine-700">Watch the video below.</span>
        </motion.button>

        {/* 5. Hero video */}
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.26, ease: [0.16, 1, 0.3, 1] }}
          id="hero-video"
          className="mx-auto w-full max-w-[34rem] sm:mt-5 sm:max-w-[38rem] lg:mt-7 lg:max-w-[40rem]"
        >
          <div className="group relative isolate">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-[3px] -z-10 rounded-[30px] opacity-70 blur-md transition-opacity duration-700 group-hover:opacity-100"
              style={{
                background:
                  "conic-gradient(from 0deg, rgba(193,150,50,0.45), rgba(115,42,61,0.45), rgba(193,150,50,0.45))",
              }}
            />
            <LazyVimeoVideo
              ref={videoRef}
              videoId="1209856216"
              posterSrc="/images/hero/akhila_hero.jpeg"
              posterAlt="Dr. Aditya & Akhila, why your PCOS keeps coming back"
              aspect="16/9"
              title="Why Your PCOS Keeps Coming Back, with Dr. Aditya & Akhila"
              playSize="md"
            />
          </div>
        </motion.div>

        {/* 5. CTA + refundable note */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.34, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto flex flex-col items-center gap-3 sm:mt-8 sm:gap-3"
        >
          <CtaLink
            href="/checkout"
            variant="primary-lg"
            label={
              <>
                Book Your Metabolic Assessment
                {!FREE_FUNNEL_MODE && <>{" · "}{publicEnv.assessmentFeeDisplay}</>}
              </>
            }
            ariaLabel={
              FREE_FUNNEL_MODE
                ? "Book your metabolic assessment"
                : `Book your metabolic assessment for ${publicEnv.assessmentFeeDisplay}`
            }
            className="max-w-full [&>span]:whitespace-nowrap [&>span]:leading-tight [&>span]:text-[clamp(11px,3.2vw,16px)]"
            trailing={
              <ArrowRightIcon
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
                strokeWidth={2}
              />
            }
          />
          <p className="flex items-center gap-2 whitespace-nowrap text-[10px] font-medium uppercase tracking-[0.1em] text-ink-400 sm:text-[12px] sm:tracking-[0.16em]">
            <ShieldIcon className="h-3 w-3 text-gold-600" />
            <span className="sm:hidden">Call with Akhila · Refundable</span>
            <span className="hidden sm:inline">Refundable · 30-min consultation with Akhila</span>
          </p>
          {FREE_FUNNEL_MODE && <UrgencyTimer className="mt-0.5" />}
        </motion.div>
      </div>
    </section>
  );
}
