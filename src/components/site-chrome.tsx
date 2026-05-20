"use client";

/* =============================================================================
 * SITE CHROME — Marquee · StickyCTA · Footer
 * =============================================================================
 * Shared chrome that appears across every page of the funnel so the visual
 * hierarchy is identical (trust strip at top, sticky CTA bar at bottom where
 * appropriate, branded footer). Originally defined inline inside the landing
 * page (src/app/page.tsx) — extracted here so /checkout, /book-a-call,
 * /thank-you and the legal pages can render the same look.
 *
 * Usage:
 *   <Marquee />                              // always at top
 *   <StickyCTA />                            // bottom — landing + legal pages
 *   <Footer hasSticky />                     // pass true if StickyCTA renders
 *
 * Marquee + Footer are static enough to be safe as client components (no
 * effects), but the StickyCTA needs scroll state, so this whole file is
 * "use client" for simplicity.
 * =============================================================================
 */

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { withUtm } from "@/lib/utm";
import { publicEnv } from "@/lib/env";

/* ─────────────────────────────────────────────────────────────────────────────
 * Local icon — only the right-arrow chevron used inside StickyCTA
 * ─────────────────────────────────────────────────────────────────────────────
 */
function ArrowRightIcon({ className, strokeWidth = 2 }: { className?: string; strokeWidth?: number }) {
  return (
    <svg
      className={cn("h-3.5 w-3.5 shrink-0", className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Marquee — infinite-scrolling trust strip pinned to the very top of every
 * page. Replaces a traditional navbar. Wine gradient bg, cream text, gold
 * star separators.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function Marquee() {
  const items = [
    "Physician-Led Programme",
    "30,000+ Patients Treated",
    `${publicEnv.assessmentFeeDisplay} · Refundable Assessment`,
    "Therapeutic IV Infusion Included",
    "Money-Back Guarantee",
    "90-Day Clinical Protocol",
    "15 Years of Clinical Practice",
    "Dr. Aditya & Akhila",
  ];
  const loop = [...items, ...items];
  return (
    <div
      role="region"
      aria-label="Trust signals"
      className="relative z-40 overflow-hidden border-b border-gold-300/20 bg-wine-gradient"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-wine-800 to-transparent sm:w-24" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-wine-800 to-transparent sm:w-24" />
      <div className="flex w-max animate-marquee py-2 sm:py-2.5">
        {loop.map((text, i) => (
          <div
            key={`${text}-${i}`}
            className="flex shrink-0 items-center gap-3 px-5 sm:gap-4 sm:px-7"
          >
            <span aria-hidden="true" className="text-gold-300/90">✦</span>
            <span className="whitespace-nowrap text-[11px] font-medium uppercase tracking-[0.18em] text-cream-100/95 sm:text-[12px]">
              {text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * StickyCTA — full-width dark bar locked to the bottom of the viewport.
 * Slides up after the user scrolls 540px. UTM-preserving link click.
 *
 * Skip on conversion-flow pages (/checkout, /book-a-call, /thank-you) where
 * a CTA to /checkout is redundant or contextually wrong.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function StickyCTA() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 540);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const onClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    if (typeof window === "undefined") return;
    const target = withUtm("/checkout");
    if (target !== "/checkout") {
      e.preventDefault();
      window.location.href = target;
    }
  }, []);

  return (
    <div
      aria-hidden={!visible}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 transition-all duration-500 ease-smooth",
        visible
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none translate-y-full opacity-0"
      )}
    >
      <div
        aria-hidden="true"
        className="h-px w-full bg-gradient-to-r from-transparent via-gold-400/55 to-transparent"
      />
      <div className="relative overflow-hidden border-t border-wine-900/50 bg-gradient-to-r from-ink-900 via-wine-900 to-ink-900 backdrop-blur-xl">
        <div aria-hidden="true" className="pointer-events-none absolute -left-32 top-1/2 h-48 w-72 -translate-y-1/2 rounded-full bg-wine-700/40 blur-[80px]" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-32 top-1/2 h-48 w-72 -translate-y-1/2 rounded-full bg-gold-500/15 blur-[80px]" />

        <div className="container-tight relative flex items-center gap-3 px-4 py-3 sm:gap-6 sm:px-5 sm:py-4">
          <div className="hidden flex-1 items-center gap-3.5 sm:flex">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-pulse-ring-strong rounded-full bg-gold-300/95" />
              <span
                className="relative inline-flex h-2.5 w-2.5 rounded-full bg-gradient-to-br from-gold-300 to-gold-500"
                style={{ boxShadow: "0 0 12px rgba(214, 156, 77, 0.85), 0 0 0 1.5px rgba(255, 249, 245, 0.2)" }}
              />
            </span>
            <div className="flex flex-col leading-tight">
              <p className="font-display text-[15px] font-medium text-cream-50 sm:text-[16px] lg:text-[17px]">
                Ready to address the <span className="italic text-gold-200">root?</span>
              </p>
              <p className="mt-0.5 text-[10.5px] font-medium uppercase tracking-[0.16em] text-cream-100/65 sm:text-[11px]">
                30-min clinical assessment · Refundable · No pressure
              </p>
            </div>
          </div>

          <Link
            href="/checkout"
            onClick={onClick}
            aria-label={`Book your clinical assessment call for ${publicEnv.assessmentFeeDisplay}`}
            className="sticky-cta group flex-1 justify-center sm:flex-initial"
          >
            <span className="whitespace-nowrap leading-tight">
              Book <span className="hidden sm:inline">My Clinical </span>
              Assessment<span className="hidden sm:inline"> Call</span>
              {" · "}
              {publicEnv.assessmentFeeDisplay}
            </span>
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-cream-50/15 transition-transform duration-300 group-hover:translate-x-0.5 sm:h-7 sm:w-7">
              <ArrowRightIcon className="h-3.5 w-3.5" strokeWidth={2} />
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Footer — Policies, brand mark, disclaimer. Identical content across pages.
 *
 * `hasSticky` adds extra bottom padding so the fixed StickyCTA doesn't sit
 * on top of the copyright row when both render on the same page.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function Footer({ hasSticky = false }: { hasSticky?: boolean }) {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-ink-100 bg-cream-100">
      <div
        className={cn(
          "container-tight pt-7 sm:pt-14",
          hasSticky ? "pb-24 sm:pb-32" : "pb-7 sm:pb-14"
        )}
      >
        {/* MOBILE — single compact block: inline policy links + short
            disclaimer. Skips the brand mark + long description (those live
            in the marquee/hero on mobile already) to keep the footer tight. */}
        <div className="sm:hidden">
          <nav
            aria-label="Policies"
            className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[12.5px]"
          >
            <Link href="/terms" className="text-ink-600 transition-colors hover:text-wine-700">Terms</Link>
            <span aria-hidden="true" className="text-ink-300">·</span>
            <Link href="/privacy" className="text-ink-600 transition-colors hover:text-wine-700">Privacy</Link>
            <span aria-hidden="true" className="text-ink-300">·</span>
            <Link href="/refund" className="text-ink-600 transition-colors hover:text-wine-700">Refund</Link>
          </nav>
          <p className="mt-3 px-2 text-center text-[10.5px] leading-relaxed text-ink-400">
            Clinical guidance, not a substitute for emergency medical care.
            Individual results vary.
          </p>
        </div>

        {/* DESKTOP — richer 3-column layout */}
        <div className="hidden gap-10 sm:grid sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-wine-gradient text-xs font-display font-semibold text-cream-50 shadow-premium-sm">
                A
              </span>
              <span className="font-display text-base font-medium tracking-tight text-ink-800">
                Dr. Aditya <span className="text-ink-300">·</span>{" "}
                <span className="text-wine-700">Akhila</span>
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-500">
              A physician-led PCOS metabolic programme. We address the root,
              not the symptom. Fasting insulin, HOMA-IR, cortisol, gut markers
              first. Protocol second.
            </p>
          </div>
          <div>
            <h3 className="font-display text-sm font-medium text-ink-700">Policies</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link href="/terms" className="text-ink-500 transition-colors hover:text-wine-700">Terms of Use</Link></li>
              <li><Link href="/privacy" className="text-ink-500 transition-colors hover:text-wine-700">Privacy Policy</Link></li>
              <li><Link href="/refund" className="text-ink-500 transition-colors hover:text-wine-700">Refund Policy</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-display text-sm font-medium text-ink-700">Disclaimer</h3>
            <p className="mt-4 text-xs leading-relaxed text-ink-400">
              This programme provides clinical guidance and is not a substitute
              for emergency medical care. Individual results vary. Not
              affiliated with any social media platform.
            </p>
          </div>
        </div>

        {/* SHARED BOTTOM ROW — copyright. Tighter on mobile, two-row layout
            with the "Made with care in India" line restored at sm+. */}
        <div className="mt-5 flex flex-col items-center gap-1.5 border-t border-ink-100 pt-4 text-center sm:mt-10 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:pt-6 sm:text-left">
          <p className="text-[10.5px] text-ink-400 sm:text-xs">
            © {year} Dr. Aditya &amp; Akhila Clinical Team. All rights reserved.
          </p>
          <p className="hidden text-xs text-ink-400 sm:block">Made with care in India.</p>
        </div>
      </div>
    </footer>
  );
}
