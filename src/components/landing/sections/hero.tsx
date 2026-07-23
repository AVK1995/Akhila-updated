"use client";

import { useCallback, useRef } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { LazyVimeoVideo, type LazyVimeoVideoHandle } from "../shared-client";
import { FloatingOrbs, Pmos } from "../shared-static";
import { PlayIcon } from "../icons";
import { CtaBlock } from "../cta-block";
import { publicEnv } from "@/lib/env";
import { trackGa4EventOnce } from "@/lib/ga4";

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
        {/* 0. Social proof — client faces + rating, mirroring the reference's
            photos + ★★★★★ trust row. */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="sm:mb-4"
        >
          <RatingRow />
        </motion.div>

        {/* 1. Eyebrow pill — who this is for */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="glass-pill inline-flex max-w-full items-center gap-2 rounded-full px-3 py-1.5 text-center text-[9.5px] font-semibold uppercase tracking-[0.08em] text-wine-700 shadow-premium-sm sm:gap-2.5 sm:px-5 sm:py-2 sm:text-[12px] sm:tracking-[0.14em]"
        >
          <span className="live-dot shrink-0" />
          For Women Balancing Career, Deadlines &amp; The Daily Struggle Of <Pmos />
        </motion.div>

        {/* 2. Headline — the three outcomes */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="display-headline mx-auto max-w-3xl text-center text-[clamp(2rem,5.5vw+0.5rem,3rem)] leading-[1.1] tracking-tight sm:mt-5 sm:leading-[1.05]"
        >
          Lose 5-15 Kilos, Reverse Your <Pmos />,{" "}
          <span className="text-gradient-wine">&amp; Conceive Naturally</span>
        </motion.h1>

        {/* 3. Sub paragraph */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-[38rem] text-pretty text-center text-[15.5px] leading-[1.6] text-ink-600 sm:mt-5 sm:text-[16px] sm:leading-relaxed"
        >
          Through a personalised, <span className="font-medium text-ink-800">doctor-led root-cause approach</span>{" "}
          designed to help women reverse <Pmos /> and create results that last.
        </motion.p>

        {/* 4. Symptom chips — what actually improves */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-[42rem] sm:mt-6"
        >
          {/* Same size as the sub-paragraph above it, per the client note. */}
          <p className="text-center text-[15.5px] leading-[1.6] text-ink-500 sm:text-[16px] sm:leading-relaxed">
            {/* Two emphasis levels: the audience is coloured, the outcome gets
                a filled chip so it carries more weight than the colour alone. */}
            <span className="font-semibold text-wine-700">1000s of career-driven women</span>{" "}
            have used our root-cause approach to{" "}
            <span className="rounded-md bg-gold-100 px-1.5 py-0.5 font-semibold text-wine-800 ring-1 ring-gold-300/60">
              lose 5-15 kilos
            </span>{" "}
            while improving common <Pmos /> challenges such as:
          </p>
          {/* Fixed 3x2 grid on every breakpoint (was a wrapping flex row that
              broke 5+1 on desktop). Raised/3D pills with a live themed dot. */}
          <ul className="mx-auto mt-3 grid max-w-[34rem] grid-cols-3 gap-1.5 sm:mt-4 sm:gap-2.5">
            {[
              "Irregular Periods",
              "Weight Gain",
              "Acne & Facial Hair",
              "Insulin Resistance",
              "Hair Fall",
              "Difficulty Conceiving",
            ].map((s) => (
              <li key={s} className="symptom-pill">
                <span className="live-dot live-dot-gold" />
                <span className="min-w-0 text-pretty">{s}</span>
              </li>
            ))}
          </ul>
        </motion.div>

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
          /* One line from 360px up (every current phone). On the old 320px
             iPhone SE/5, nowrap would clip the text inside the pill, so allow
             it to wrap there instead. */
          className="glass-pill group/watch inline-flex max-w-full cursor-pointer items-center gap-2 whitespace-nowrap rounded-full py-1.5 pl-1.5 pr-4 font-display text-[13px] font-medium text-ink-800 shadow-premium-sm transition-shadow hover:shadow-premium max-[359px]:whitespace-normal max-[359px]:text-center sm:mt-6 sm:gap-2.5 sm:py-2 sm:pl-2 sm:pr-5 sm:text-[14px]"
        >
          <span
            aria-hidden="true"
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-wine-700 text-cream-50 shadow-wine-glow transition-transform duration-300 group-hover/watch:scale-105 sm:h-7 sm:w-7"
          >
            <PlayIcon className="ml-0.5 h-2.5 w-2.5 sm:h-3 sm:w-3" />
          </span>
          <span className="text-wine-700">Watch The Short Video Below</span>
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
              // GA4 `video_play` (once per browser). Only the hero VSL reports
              // it — the thank-you video uses the same component and must not.
              onPlay={() => trackGa4EventOnce("video_play")}
              videoId="1209856216"
              posterSrc="/images/hero/akhila-vsl-thumb.jpg"
              posterAlt="Dr. Aditya & Akhila, why your PCOS keeps coming back"
              aspect="16/9"
              title="Why Your PCOS Keeps Coming Back, with Dr. Aditya & Akhila"
              playSize="md"
            />
          </div>
        </motion.div>

        {/* 6. CTA + trust row + offer countdown */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.34, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto w-full sm:mt-8"
        >
          <CtaBlock />
        </motion.div>

        {/* 7. Credibility stat bar */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto w-full max-w-3xl sm:mt-10"
        >
          <StatBar />
        </motion.div>
      </div>
    </section>
  );
}

/**
 * Client faces + star rating. The case-study photos are before|after
 * side-by-sides, so each avatar frames the RIGHT ("after") face only, zoomed
 * in — at avatar size a plain crop still caught the "before" panel.
 *
 * Positioned by explicit focal point rather than object-position: with
 * object-cover on a square box, a 16:9 source can only ever centre up to ~72%
 * of its width, and these faces sit at 74-83%, so they got pinned to the right
 * edge. Instead the image is laid out at `w`x the avatar width and translated
 * by its own focal percentages, which lands (fx, fy) exactly on the centre of
 * the circle for any focal point and any zoom.
 */
function RatingRow() {
  const faces = [
    // fx/fy = face centre as a % of the FULL image; w = image width in avatars.
    { src: "/images/results/ria.jpg", fx: 76.5, fy: 43, w: 4, alt: "Rhea" },
    { src: "/images/results/anonymous-1.jpg", fx: 74.5, fy: 38, w: 4, alt: "Client" },
    { src: "/images/results/anonymous-2.jpg", fx: 82.5, fy: 32, w: 4, alt: "Client" },
    { src: "/images/results/anonymous-3.jpg", fx: 76, fy: 33.5, w: 4, alt: "Client" },
    // Akshaya's is a single portrait frame, not a side-by-side.
    { src: "/images/results/akshaya-poster.jpg", fx: 49, fy: 50, w: 1.8, alt: "Akshaya" },
  ];
  return (
    <div className="flex flex-col items-center gap-1.5 sm:gap-2">
      {/* Row 1: faces + stars + rating, always together on one line. */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        <ul className="flex items-center -space-x-2.5">
          {faces.map((f) => (
            <li
              key={f.src}
              className="relative h-8 w-8 overflow-hidden rounded-full shadow-premium-sm ring-2 ring-cream-50 sm:h-9 sm:w-9"
            >
              <Image
                src={f.src}
                alt={f.alt}
                width={400}
                height={400}
                /* Far larger than the 36px box on purpose: only ~a quarter of
                   the source width survives the zoomed crop, so a 36px-wide
                   candidate would leave ~9px of real detail to stretch. */
                sizes="200px"
                className="absolute max-w-none"
                style={{
                  left: "50%",
                  top: "50%",
                  width: `${f.w * 100}%`,
                  height: "auto",
                  transform: `translate(-${f.fx}%, -${f.fy}%)`,
                }}
              />
            </li>
          ))}
        </ul>
        <span aria-hidden="true" className="text-[12px] leading-none tracking-[0.06em] text-gold-500 sm:text-[15px]">
          ★★★★★
        </span>
        <span className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-600 sm:text-[12px]">
          5.0 Review
        </span>
      </div>

      {/* Row 2: satisfaction badge with its own themed seal icon. */}
      <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-200/70 bg-gold-50/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-gold-800 backdrop-blur-sm sm:text-[11px]">
        <SatisfactionSeal className="h-3.5 w-3.5 shrink-0 text-gold-600 sm:h-4 sm:w-4" />
        100% Customer Satisfaction
      </span>
    </div>
  );
}

/** Rosette/seal mark for the satisfaction badge — drawn to match the brand's
 *  thin-stroke icon set rather than pulling in an emoji. */
function SatisfactionSeal({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="9" r="6" />
      <path d="m9 14.5-1.5 6L12 18l4.5 2.5L15 14.5" />
      <path d="m9.9 9.2 1.5 1.5 2.9-2.9" />
    </svg>
  );
}

/**
 * Four-up credibility bar under the hero. Mirrors the reference layout
 * (2-up on phones, 4-up from sm) using the brand's card + gold accent.
 */
function StatBar() {
  const stats = [
    { value: "30,000+", label: "Patients Treated" },
    { value: "15 Yrs", label: "Clinical Experience" },
    { value: "5.0 ★", label: "Client Rating" },
    { value: publicEnv.assessmentFeeDisplay, label: "To Start" },
  ];
  return (
    <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
      {stats.map((s) => (
        <li
          key={s.label}
          className="rounded-2xl border border-ink-100/80 bg-white/70 px-3 py-3.5 text-center shadow-premium-sm backdrop-blur-sm sm:py-4"
        >
          <p className="font-display text-[19px] font-medium leading-none tabular-nums text-wine-700 sm:text-[22px]">
            {s.value}
          </p>
          <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-500 sm:text-[11px]">
            {s.label}
          </p>
        </li>
      ))}
    </ul>
  );
}
