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
import { trackGa4EventOnce } from "@/lib/ga4";
import { fireAddToCartOnce } from "@/lib/meta-client";
import { FREE_FUNNEL_MODE, openLeadModal } from "@/lib/funnel";
import { Pmos } from "./landing/shared-static";
import { CheckIcon, ShieldIcon, StarIcon } from "./landing/icons";

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
  // Static (no scroll) so both signals are always readable, and sized to fit
  // one line from 320px up.
  // Each entry splits into a highlighted figure + the rest, so the numbers can
  // carry a brand accent that stays legible on the wine gradient.
  const items = [
    { figure: "15+ Years", rest: "Of Clinical Experience" },
    { figure: "30,000+", rest: "Patients Treated" },
  ];
  return (
    <div
      role="region"
      aria-label="Trust signals"
      className="relative z-40 border-b border-gold-300/20 bg-wine-gradient"
    >
      <div className="container-tight flex items-center justify-center gap-3 py-2 max-[359px]:px-2 sm:gap-6 sm:py-2.5">
        {/* Mobile: no star glyphs, both signals joined into one plain line.
            The clamp keeps that single line intact from 320px up. */}
        <span className="whitespace-nowrap text-[clamp(8px,2.5vw,12px)] font-medium uppercase tracking-[0.06em] text-cream-100/95 max-[359px]:tracking-[0.02em] sm:hidden">
          <span className="font-bold text-gold-200">{items[0].figure}</span> {items[0].rest}{" "}
          &amp; <span className="font-bold text-gold-200">{items[1].figure}</span>{" "}
          {items[1].rest}
        </span>

        {/* Desktop keeps the gold star separators. */}
        {items.map((item) => (
          <div key={item.figure} className="hidden min-w-0 items-center gap-3 sm:flex">
            <span aria-hidden="true" className="shrink-0 text-[12px] text-gold-300/90">
              ✦
            </span>
            <span className="whitespace-nowrap text-[12px] font-medium uppercase tracking-[0.16em] text-cream-100/95">
              <span className="font-bold text-gold-200">{item.figure}</span> {item.rest}
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
    // ── Intent tracking — this bar is a checkout CTA like any other ──────
    // GA4 `add_to_cart` (once per browser) + Meta CAPI `add_to_cart` (once per
    // browser). Same pair fired by <CtaLink>; neither blocks the click.
    trackGa4EventOnce("add_to_cart");
    fireAddToCartOnce();
    // Free mode: open the lead-capture modal instead of routing to /checkout.
    if (FREE_FUNNEL_MODE) {
      e.preventDefault();
      openLeadModal();
      return;
    }
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

        {/* Mobile: CTA stacked over its trust row.
            Desktop (lg): the three trust signals stacked on the left, the CTA
            on the right. No countdown in this bar — the sections carry it. */}
        <div className="container-tight relative flex flex-col items-stretch gap-2 px-4 py-2.5 sm:px-5 sm:py-3 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
          <Link
            href="/checkout"
            onClick={onClick}
            aria-label="Get your personalised diagnosis and PCOS recovery plan"
            className="sticky-cta btn-shimmer group order-1 w-full justify-center max-[359px]:gap-1.5 max-[359px]:px-3 lg:order-2 lg:w-auto lg:shrink-0"
          >
            {/* Two lines up to lg, one line from lg. Sized in vw, NOT cqw: this
                button is shrink-to-fit at lg, and container-type would stop its
                width depending on its contents and collapse it. The bar spans
                the viewport, so vw tracks the available width here anyway. */}
            <span className="text-center text-[clamp(10px,3.2vw,14px)] leading-[1.3] lg:whitespace-nowrap lg:text-[14px]">
              <span className="whitespace-nowrap">Click Here To Get Your Personalised Diagnosis</span>
              <br className="lg:hidden" />{" "}
              <span className="whitespace-nowrap">&amp; PCOS Recovery Plan</span>
            </span>
            <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cream-50/15 transition-transform duration-300 group-hover:translate-x-0.5 sm:h-7 sm:w-7">
              <ArrowRightIcon className="h-3.5 w-3.5" strokeWidth={2} />
            </span>
          </Link>

          {/* Mobile: 2-then-1 under the CTA, sized so the longest label holds
              one line. Desktop: a left-hand stack of three, one per row. */}
          <ul className="order-2 grid w-full grid-cols-2 justify-items-center gap-x-2.5 gap-y-1 text-[clamp(7px,1.92vw,10.5px)] font-medium uppercase leading-snug tracking-[0.05em] text-cream-100/70 sm:gap-x-4 lg:order-1 lg:flex lg:w-auto lg:flex-col lg:items-start lg:gap-y-1 lg:text-[11px] lg:tracking-[0.08em] [&>li:last-child]:col-span-2">
            <li className="flex items-start gap-1.5 lg:whitespace-nowrap">
              <StarIcon className="mt-[1px] h-3 w-3 shrink-0 text-gold-300" />
              <span className="min-w-0">100% Customer Satisfaction</span>
            </li>
            <li className="flex items-start gap-1.5 lg:whitespace-nowrap">
              <ShieldIcon className="mt-[1px] h-3 w-3 shrink-0 text-gold-300" />
              <span className="min-w-0">15+ Years Of Clinical Experience</span>
            </li>
            <li className="flex items-start gap-1.5 lg:whitespace-nowrap">
              <CheckIcon className="mt-[1px] h-3 w-3 shrink-0 text-gold-300" strokeWidth={2.5} />
              <span className="min-w-0">Trusted By Career-Driven Women</span>
            </li>
          </ul>
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
            {!FREE_FUNNEL_MODE && (
              <>
                <span aria-hidden="true" className="text-ink-300">·</span>
                <Link href="/refund" className="text-ink-600 transition-colors hover:text-wine-700">Refund</Link>
              </>
            )}
          </nav>
          <p className="mt-3 px-2 text-center text-[10.5px] leading-relaxed text-ink-400">
            For educational and informational purposes only; not medical advice.
            Individual results vary and are not typical or guaranteed. This
            website is not affiliated with or endorsed by Meta. FACEBOOK and
            INSTAGRAM are trademarks of Meta Platforms, Inc.
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
              A physician-led <Pmos /> metabolic programme. We treat the root
              cause, not just the symptoms. Every plan begins with understanding
              your body&rsquo;s unique imbalances&mdash;then we build a
              personalised protocol around them.
            </p>
          </div>
          <div>
            <h3 className="font-display text-sm font-medium text-ink-700">Policies</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link href="/terms" className="text-ink-500 transition-colors hover:text-wine-700">Terms of Use</Link></li>
              <li><Link href="/privacy" className="text-ink-500 transition-colors hover:text-wine-700">Privacy Policy</Link></li>
              {!FREE_FUNNEL_MODE && (
                <li><Link href="/refund" className="text-ink-500 transition-colors hover:text-wine-700">Refund Policy</Link></li>
              )}
            </ul>
          </div>
          <div>
            <h3 className="font-display text-sm font-medium text-ink-700">Disclaimer</h3>
            <p className="mt-4 text-xs leading-relaxed text-ink-400">
              All content and coaching services provided by Dr. Aditya and
              Akhila are for educational and informational purposes only and do
              not guarantee specific results. This is not medical advice. Always
              consult a qualified healthcare professional before making changes
              to your diet, exercise or lifestyle. Individual results vary and
              are not typical or guaranteed. This website is not affiliated with
              or endorsed by Meta. FACEBOOK and INSTAGRAM are trademarks of Meta
              Platforms, Inc.
            </p>
          </div>
        </div>

        {/* SHARED BOTTOM ROW — copyright. Tighter on mobile, two-row layout
            with the "Made with care in India" line restored at sm+. */}
        <div className="mt-5 flex flex-col items-center gap-1.5 border-t border-ink-100 pt-4 text-center sm:mt-10 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:pt-6 sm:text-left">
          <p className="text-[10.5px] text-ink-400 sm:text-xs">
            © {year} Dr. Aditya &amp; Akhila. All rights reserved.
          </p>
          <p className="hidden text-xs text-ink-400 sm:block">Made with care in India.</p>
        </div>
      </div>
    </footer>
  );
}
