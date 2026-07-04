/**
 * Conversion-event firing gate
 * -----------------------------
 * Single source of truth for "should this event fire?" decisions across the
 * funnel. Used by:
 *   - Meta Pixel browser snippet (src/app/layout.tsx)
 *   - Meta Pixel client helpers (src/lib/analytics.ts)
 *   - Meta CAPI route (src/app/api/razorpay/verify/route.ts)
 *   - Pabbly purchase webhook (verify + create-order bypass)
 *   - Pabbly abandoned-cart timer (src/app/api/checkout-init/route.ts)
 *
 * Two gates, applied together for purchase-class events and separately for
 * tracking-class events:
 *
 *   1. PRODUCTION HOSTNAME — the request must be served from the hostname
 *      derived from NEXT_PUBLIC_SITE_URL. This blocks Vercel preview URLs
 *      (akhila-funnel-git-xyz.vercel.app), localhost, ngrok, etc.
 *
 *   2. NON-TEST AMOUNT — the order amount must be > 1 INR. This blocks
 *      one-rupee verification charges on production so that test flows do
 *      not pollute Events Manager or Pabbly with synthetic conversions.
 *
 * Browser PageView / MAM cookie writes use the hostname gate only (no
 * amount applies). Abandoned-cart firing uses the hostname gate only —
 * by definition there is no completed payment to size against.
 */

import { publicEnv } from "./env";

/**
 * Normalise an HTTP `Host` header (which may include a port, e.g.
 * "akhila.example.com:443") to a bare lowercased hostname comparable to
 * the value derived from NEXT_PUBLIC_SITE_URL.
 */
function normaliseHost(hostHeader: string | null | undefined): string {
  if (!hostHeader) return "";
  return hostHeader.split(":")[0].trim().toLowerCase();
}

/**
 * True when the request is served from the configured production hostname.
 * Pass `req.headers.get("host")` on the server. Returns false for any
 * other host — including localhost, Vercel previews, and unset/empty
 * headers — so callers fail closed (never accidentally fire on staging).
 */
export function isProductionHost(
  hostHeader: string | null | undefined
): boolean {
  const host = normaliseHost(hostHeader);
  if (!host) return false;
  return host === publicEnv.prodHostname;
}

/**
 * Should this paid conversion event be sent to Meta CAPI / Pabbly purchase
 * webhook? Both gates must pass:
 *   - request host matches production
 *   - amount > 1 INR (excludes test-charge orders and bypass coupon)
 */
export function shouldFireConversionEvents(
  hostHeader: string | null | undefined,
  amountInr: number
): boolean {
  return isProductionHost(hostHeader) && amountInr > 1;
}

/**
 * Should funnel-tracking events (abandoned-cart Pabbly webhook, future
 * Meta Lead/InitiateCheckout-style server events) fire? Hostname gate
 * only — no amount required because these events fire before any
 * payment exists.
 */
export function shouldFireFunnelTracking(
  hostHeader: string | null | undefined
): boolean {
  return isProductionHost(hostHeader);
}
