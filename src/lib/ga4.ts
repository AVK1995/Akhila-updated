/**
 * GOOGLE ANALYTICS 4 — funnel event tracking
 * ------------------------------------------
 * Four front-end events, fired natively via `gtag('event', <name>)`:
 *
 *   video_play         landing/VSL  — visitor actually starts the hero VSL
 *   add_to_cart        landing      — visitor clicks any CTA toward /checkout
 *   initiate_checkout  /checkout    — visitor clicks Pay (see note below)
 *   book_call          /book-a-call — visitor schedules a slot in Calendly
 *
 * DELIBERATELY INDEPENDENT OF META. These never read from, depend on, or copy
 * any Meta Pixel / CAPI value. They carry NO `value` and NO `currency` — they
 * are pure event counts, so GA4's numbers stay independent of Meta's monetary
 * reporting. There is intentionally NO `purchase` event: checkout completion is
 * measured by the /thank-you page_view, which GA4 collects automatically.
 *
 * ONCE PER BROWSER. Every event fires at most once per browser, enforced by a
 * localStorage flag (`akhila_ga4_<event>_fired`). The flag is stamped BEFORE
 * the gtag call so a click that navigates away can't double-fire. If storage is
 * unavailable (private mode), dedup degrades to best-effort and the event still
 * fires — an extra count beats a lost one.
 *
 * PRODUCTION-HOST GATED. `window.gtag` is only installed on the production
 * hostname (see the GA4 snippet in src/app/layout.tsx), so on localhost and
 * Vercel previews these calls are no-ops and GA4 reports stay clean. That also
 * means DebugView can only be exercised on the live domain.
 *
 * Note on `initiate_checkout`: it fires on the visitor's FIRST Pay-button
 * click, whether or not the form validates. A half-filled form that bounces off
 * validation still counts — the signal we want is "did they try to pay".
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/** The only event names allowed. Exact strings — GA4 keys reports off these. */
export type Ga4EventName =
  | "video_play"
  | "add_to_cart"
  | "initiate_checkout"
  | "book_call";

const onceKey = (event: Ga4EventName) => `akhila_ga4_${event}_fired`;

/**
 * Fire a GA4 event at most once per browser. No-ops when GA4 isn't loaded
 * (non-production host) or on the server. Never throws into a click handler.
 */
export function trackGa4EventOnce(event: Ga4EventName): void {
  if (typeof window === "undefined") return;
  // GA4 absent → non-production host, or the tag was blocked. Nothing to fire,
  // and we deliberately do NOT stamp the flag so it can still fire on prod.
  if (typeof window.gtag !== "function") return;

  try {
    const key = onceKey(event);
    if (window.localStorage.getItem(key) === "1") return;
    // Stamp first: a CTA click navigates away immediately after this.
    window.localStorage.setItem(key, "1");
  } catch {
    /* storage blocked (private mode) — dedup is best-effort, still fire */
  }

  try {
    window.gtag("event", event);
  } catch {
    /* analytics must never break the user's action */
  }
}
