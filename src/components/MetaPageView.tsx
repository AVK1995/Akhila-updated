"use client";

/**
 * MetaPageView
 * ------------
 * Fires `fbq('track', 'PageView')` on every Next.js App Router client-side
 * navigation. The inline pixel script in src/app/layout.tsx already fires
 * the first PageView on cold document load AND restores cookie-persisted
 * MAM before that first PageView, so MAM is inherited automatically here.
 *
 * Why this component exists: Next.js App Router uses soft client-side
 * routing — there's no full document reload between /, /checkout,
 * /book-a-call, /thank-you, /terms, /privacy, /refund. Meta's fbevents.js
 * doesn't observe those transitions on its own, so without this component
 * only the first page in the session would log a PageView.
 *
 * Rendered once inside the root layout (so it lives across every route).
 */

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { reapplyMamFromCookie, trackPageView } from "@/lib/analytics";

export function MetaPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Idempotent: re-applies the persisted MAM cookie before the PageView
    // ships, in case the user landed on a deep link whose pre-hydration
    // pixel script raced this navigation. fbq('init', ...) with the same
    // matching object is a no-op for Meta's runtime.
    reapplyMamFromCookie();
    trackPageView();
    // searchParams is part of the dep array so /checkout?utm_source=fb and
    // /checkout?utm_source=ig count as separate PageViews — useful for
    // attributing campaign-level traffic to landing variants.
  }, [pathname, searchParams]);

  return null;
}
