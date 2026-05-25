/**
 * UTM tracking — captures Meta/Google ad parameters when user lands and
 * persists them across the funnel (landing → checkout → book-a-call → thank-you).
 *
 * Storage strategy: sessionStorage (per-tab, survives page nav, dies on tab close)
 * plus a 30-day cookie fallback for users who re-enter through a different surface.
 */

export const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
  "fbclid",
  "gclid",
  "wbraid",
  "gbraid",
  "ttclid",
  "msclkid",
  "ref",
  // First-touch attribution: the full URL of the first page in the session
  // and the document.referrer at that moment. Captured by the inline script
  // in layout.tsx and never overwritten by subsequent navigations.
  "landing_url",
  "referrer",
] as const;

export type UtmKey = (typeof UTM_KEYS)[number];
export type UtmParams = Partial<Record<UtmKey, string>>;

const STORAGE_KEY = "akhila_utm_v1";
const COOKIE_KEY = "akhila_utm_v1";
const COOKIE_DAYS = 30;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readCookie(name: string): string | null {
  if (!isBrowser()) return null;
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string, days: number): void {
  if (!isBrowser()) return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  const sameSite = "Lax";
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Expires=${expires}; Path=/; SameSite=${sameSite}${secure}`;
}

/** Read UTM params from the current URL */
export function readUtmFromUrl(): UtmParams {
  if (!isBrowser()) return {};
  const params = new URLSearchParams(window.location.search);
  const result: UtmParams = {};
  for (const key of UTM_KEYS) {
    const value = params.get(key);
    if (value) result[key] = value;
  }
  return result;
}

/** Merge new params over existing stored params (new wins for non-empty keys) */
function merge(existing: UtmParams, incoming: UtmParams): UtmParams {
  const merged: UtmParams = { ...existing };
  for (const key of UTM_KEYS) {
    const v = incoming[key];
    if (v && v.length > 0) merged[key] = v;
  }
  return merged;
}

/** Persist UTM params from the URL on first landing. Safe to call repeatedly. */
export function captureUtmFromUrl(): UtmParams {
  if (!isBrowser()) return {};
  const fresh = readUtmFromUrl();
  const existing = getStoredUtm();
  const merged = merge(existing, fresh);
  if (Object.keys(merged).length > 0) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    } catch {
      // sessionStorage may be blocked (Safari private mode); cookie still works
    }
    writeCookie(COOKIE_KEY, JSON.stringify(merged), COOKIE_DAYS);
  }
  return merged;
}

/** Read stored UTM params (session → cookie fallback) */
export function getStoredUtm(): UtmParams {
  if (!isBrowser()) return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as UtmParams;
  } catch {
    // fall through to cookie
  }
  const cookie = readCookie(COOKIE_KEY);
  if (cookie) {
    try {
      return JSON.parse(cookie) as UtmParams;
    } catch {
      return {};
    }
  }
  return {};
}

/** Stringify UTM params for analytics/webhook payload */
export function utmToObject(utm: UtmParams): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of UTM_KEYS) {
    if (utm[key]) out[key] = utm[key]!;
  }
  return out;
}

/** Build a URL with UTM params appended (preserves UTMs when navigating to next funnel step) */
export function withUtm(path: string, utm?: UtmParams): string {
  const params = utm ?? getStoredUtm();
  const keys = Object.keys(params);
  if (keys.length === 0) return path;
  const url = new URL(path, isBrowser() ? window.location.origin : "https://placeholder.local");
  for (const key of UTM_KEYS) {
    if (params[key]) url.searchParams.set(key, params[key]!);
  }
  return url.pathname + url.search + url.hash;
}
