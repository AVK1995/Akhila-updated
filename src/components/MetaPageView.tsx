"use client";

/**
 * MetaPageView
 * ------------
 * Fires `fbq('track', 'PageView')` on App-Router client-side navigations.
 * The inline pixel script in src/app/layout.tsx already fires the FIRST
 * PageView on cold document load (and restores cookie-persisted MAM
 * before that fire), so MAM is inherited automatically here.
 *
 * Dedup vs the inline script: when the inline script fires PageView, it
 * stamps `window.__akhila_last_pv = { pathname, at }`. We skip our own
 * fire if the token shows a fire of the SAME pathname less than 1s ago.
 * Combined with the `firstRender` ref (which skips this effect's initial
 * mount entirely), this prevents the landing-page double-PageView that
 * otherwise happens when inline-script → hydration → effect all run for
 * the same pathname.
 *
 * Rendered once inside the root layout so it lives across every route.
 */

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { reapplyMamFromCookie, trackPageView } from "@/lib/analytics";

declare global {
  interface Window {
    __akhila_last_pv?: { pathname: string; at: number };
  }
}

const SUPPRESS_WINDOW_MS = 1000;

export function MetaPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const firstRender = useRef(true);

  useEffect(() => {
    // The inline script in layout.tsx handled the first PageView for this
    // pathname before React hydrated. Skip our first effect run so we don't
    // double-count the landing page.
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    // Same-pathname dedup. If the inline script (or a previous effect run)
    // fired PageView for this exact pathname less than 1s ago, suppress.
    // 1s is much longer than any plausible double-fire racing condition,
    // and much shorter than any real same-pathname revisit (back button
    // returns to the same path after several seconds at minimum).
    try {
      const last = window.__akhila_last_pv;
      if (
        last &&
        last.pathname === pathname &&
        Date.now() - last.at < SUPPRESS_WINDOW_MS
      ) {
        console.debug("[pixel] suppressed duplicate PageView", pathname);
        return;
      }
    } catch {
      /* window unavailable — ignore */
    }

    reapplyMamFromCookie();
    trackPageView();

    try {
      window.__akhila_last_pv = { pathname, at: Date.now() };
    } catch {
      /* ignore */
    }
    // searchParams included so /checkout?utm_source=fb vs /checkout?utm_source=ig
    // count as separate PageViews. They're different pathnames+search combos,
    // so even with the same pathname the dedup token won't suppress — the
    // 1s window is short enough not to interfere with legitimate UTM-variant
    // landings (which typically arrive at different timestamps).
  }, [pathname, searchParams]);

  return null;
}
