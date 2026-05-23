"use client";

/**
 * Meta Pixel — browser-side Manual Advanced Matching (MAM) helper
 * ----------------------------------------------------------------
 * Browser side fires only `PageView`. Every PageView ships with whatever
 * matching data we have:
 *   - On cold visits: just fbp / fbc / IP / UA / URL (EMQ ~6)
 *   - After the user fills the checkout form: em, ph, fn, ln, ct, country,
 *     external_id (sha256 each) → EMQ 8+ on every subsequent PageView,
 *     including return visits up to 30 days later via the bw_mam cookie.
 *
 * Hashing happens HERE with Web Crypto so plain PII never touches the
 * cookie. The cookie ("akhila_mam") stores already-hashed values; Meta's
 * fbq detects 64-char hex as already-hashed and forwards verbatim (no
 * double-hashing).
 *
 * external_id = sha256(normalised email) — IDENTICAL to the server CAPI
 * value in src/lib/meta.ts so the browser and server identify the user as
 * the same person cross-channel.
 *
 * No browser-side Purchase event is fired by design. Server CAPI fires
 * Purchase + sales on verified payment with EMQ 9.5+ payload.
 */

import { publicEnv } from "./env";

const MAM_COOKIE_NAME = "akhila_mam";
const MAM_COOKIE_TTL_SECONDS = 30 * 24 * 60 * 60;

/**
 * Production-domain gate for browser-side Meta firings. Mirrors the
 * server-side `isProductionHost` check in src/lib/gating.ts so Vercel
 * preview URLs and localhost dev fire ZERO Meta Pixel events — no
 * PageView, no MAM cookie writes, no init calls. The inline pixel
 * snippet in src/app/layout.tsx applies the same check before fbq init.
 */
function isProductionDomain(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.hostname.toLowerCase() === publicEnv.prodHostname;
}

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/**
 * SHA-256 hex via Web Crypto. Returns the input unchanged in non-browser
 * environments or where SubtleCrypto is unavailable (e.g. http:// without
 * localhost). Safari/Chrome/Firefox all expose this on https + localhost.
 */
async function sha256Hex(value: string): Promise<string> {
  if (typeof crypto === "undefined" || !crypto.subtle) return value;
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value)
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Normalise per Meta's MAM spec, sha256-hash each field, derive external_id
 * from the email hash. Empty inputs → key omitted from the returned object.
 */
async function buildHashedMatching(data: {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  /** ISO-2 country code, e.g. "IN" / "US". Case-insensitive. */
  country?: string;
}): Promise<Record<string, string>> {
  const normalised: Record<string, string | undefined> = {};
  if (data.email) normalised.em = data.email.trim().toLowerCase();
  if (data.phone) {
    const digits = data.phone.replace(/\D/g, "");
    if (digits) normalised.ph = digits;
  }
  if (data.firstName) normalised.fn = data.firstName.trim().toLowerCase();
  if (data.lastName) normalised.ln = data.lastName.trim().toLowerCase();
  if (data.city) {
    const ct = data.city.trim().toLowerCase().replace(/[^a-z]/g, "");
    if (ct) normalised.ct = ct;
  }
  if (data.country) {
    const country = data.country.trim().toLowerCase();
    if (country) normalised.country = country;
  }

  const keys = Object.keys(normalised) as Array<keyof typeof normalised>;
  const hashes = await Promise.all(
    keys.map((k) => sha256Hex(normalised[k] as string))
  );
  const matching: Record<string, string> = {};
  keys.forEach((k, i) => {
    matching[k as string] = hashes[i];
  });

  // external_id = same hash as em so browser MAM and server CAPI agree on a
  // single user-stable identifier across channels. Meta caches the
  // external_id → Facebook user mapping internally.
  if (matching.em) {
    matching.external_id = matching.em;
  }
  return matching;
}

function writeMamCookie(matching: Record<string, string>) {
  if (typeof document === "undefined") return;
  if (Object.keys(matching).length === 0) return;
  const value = encodeURIComponent(JSON.stringify(matching));
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${MAM_COOKIE_NAME}=${value}; Path=/; Max-Age=${MAM_COOKIE_TTL_SECONDS}; SameSite=Lax${secure}`;
}

/**
 * Read the persisted MAM hashes. Returns null if cookie missing or unparseable.
 * Used by the inline pixel script in layout.tsx (mirrored regex there) and by
 * `reapplyMamFromCookie` below.
 */
export function readMamCookie(): Record<string, string> | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${MAM_COOKIE_NAME}=([^;]+)`)
  );
  if (!match) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(match[1]));
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Re-init the Meta Pixel with hashed Advanced Matching, then persist the
 * hashes to the akhila_mam cookie so future PageViews (this tab and return
 * visits up to 30 days) inherit identity.
 *
 * Call sites:
 *   1. Checkout form-fill useEffect (earliest moment we know identity)
 *   2. Payment success handler, before router.push (refresh with latest)
 *   3. /thank-you on mount (safety net) via reapplyMamFromCookie()
 */
export async function setMetaAdvancedMatching(data: {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  country?: string;
}): Promise<void> {
  if (typeof window === "undefined" || !window.fbq) return;
  if (!publicEnv.metaPixelId) return;
  if (!isProductionDomain()) return;
  const matching = await buildHashedMatching(data);
  if (Object.keys(matching).length === 0) return;
  window.fbq("init", publicEnv.metaPixelId, matching);
  writeMamCookie(matching);
}

/**
 * Re-fire MAM init from the persisted cookie. Used on /thank-you mount as a
 * safety net in case the inline pixel script in layout.tsx raced the route
 * change. fbq('init', ...) is idempotent so calling with the same matching
 * is a no-op.
 */
export function reapplyMamFromCookie(): void {
  if (typeof window === "undefined" || !window.fbq) return;
  if (!publicEnv.metaPixelId) return;
  if (!isProductionDomain()) return;
  const matching = readMamCookie();
  if (!matching || Object.keys(matching).length === 0) return;
  window.fbq("init", publicEnv.metaPixelId, matching);
}

/**
 * Fire a PageView. Used by the App Router route-change island so client-side
 * navigation produces a PageView event (Meta's fbevents.js auto-PageView
 * only fires on the initial document load, not on Next's router transitions).
 */
export function trackPageView(): void {
  if (typeof window === "undefined" || !window.fbq) return;
  if (!publicEnv.metaPixelId) return;
  if (!isProductionDomain()) return;
  window.fbq("track", "PageView");
}
