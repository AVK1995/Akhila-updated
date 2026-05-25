import { getServerEnv } from "./env";

export type LeadPayload = {
  leadId: string;
  firstName: string;
  lastName: string;
  fullName: string;       // derived: `${firstName} ${lastName}` — kept for downstream
                          // automations / CRMs that still expect a single name field.
  email: string;
  phone: string;          // includes country code, e.g. "+919876543210"
  phoneCountry: string;   // ISO-2 country, e.g. "IN"
  city?: string;
  ageRange?: string;
  primaryConcern?: string;
  couponCode?: string;
  utm?: Record<string, string>;
  // ── Attribution fields surfaced as top-level for Pabbly column mapping ──
  // Mirrors of values that ALSO live inside `utm` (keep `utm` for backward
  // compat with existing workflows mapped against `utm.fbclid` etc.).
  // Top-level copies make new workflow setup easier and survive even if
  // the utm object is empty (e.g. webhook-fallback PATH B rebuilds these
  // from Razorpay order notes where the utm object isn't reconstructed).
  fbclid?: string;
  gclid?: string;
  landingUrl?: string;
  referrer?: string;
  // ── Payment fields (set when payment succeeded) ──
  paymentId?: string;
  orderId?: string;
  amountInr?: number;
  currency?: string;      // "INR" — explicit so Pabbly mappings don't have to assume
  paidAt?: string;        // ISO-8601 UTC, e.g. "2026-05-26T18:10:26.123Z"
  paymentDate?: string;   // IST YYYY-MM-DD, derived from paidAt
  paymentTime?: string;   // IST HH:MM:SS (24h), derived from paidAt
  // Source page / context
  source?: string;
};

/**
 * Format an ISO timestamp into IST YYYY-MM-DD + HH:MM:SS strings using
 * Intl.DateTimeFormat (no extra deps). Returns ["", ""] for invalid input.
 */
export function istDateAndTime(iso: string | undefined): [string, string] {
  if (!iso) return ["", ""];
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return ["", ""];
  // en-CA gives YYYY-MM-DD; en-GB gives DD/MM/YYYY hh:mm:ss — we want en-CA
  // for the date and a manual format for the time.
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(d);
  return [date, time];
}

/**
 * Sends a JSON payload to a Pabbly Connect webhook. We resolve the URL lazily
 * so missing env vars don't crash unrelated routes. Returns the response body
 * if reachable, or throws when the webhook URL isn't configured.
 */
async function fire(url: string, payload: LeadPayload): Promise<unknown> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    // Don't cache; Pabbly webhooks are idempotent on their side
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Pabbly webhook failed: ${res.status} ${text}`);
  }
  return res.json().catch(() => ({}));
}

export async function sendPurchaseWebhook(
  payload: LeadPayload
): Promise<{ ok: boolean; error?: string }> {
  const env = getServerEnv();
  if (!env.PABBLY_PURCHASE_WEBHOOK_URL) {
    console.warn(
      "[pabbly] PABBLY_PURCHASE_WEBHOOK_URL not set — skipping purchase webhook"
    );
    return { ok: false, error: "webhook_url_not_configured" };
  }
  try {
    await fire(env.PABBLY_PURCHASE_WEBHOOK_URL, payload);
    return { ok: true };
  } catch (err) {
    const error = err instanceof Error ? err.message : "unknown";
    console.error("[pabbly] purchase webhook error:", error);
    return { ok: false, error };
  }
}

/**
 * sendAbandonedWebhook — DISABLED.
 *
 * Body retained as a comment (not deleted) so re-enabling is a single revert:
 * uncomment the body below + restore the PABBLY_ABANDONED_WEBHOOK_URL schema
 * entry and fallback in src/lib/env.ts + uncomment the env var in .env.local.
 * The function is kept as a no-op so existing callers in lib/abandonedCart.ts
 * keep type-checking and harmlessly do nothing when the abandoned timer fires.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function sendAbandonedWebhook(
  _payload: LeadPayload
): Promise<{ ok: boolean; error?: string }> {
  return { ok: false, error: "abandoned_webhook_disabled" };
  // const env = getServerEnv();
  // if (!env.PABBLY_ABANDONED_WEBHOOK_URL) {
  //   console.warn(
  //     "[pabbly] PABBLY_ABANDONED_WEBHOOK_URL not set — skipping abandoned webhook"
  //   );
  //   return { ok: false, error: "webhook_url_not_configured" };
  // }
  // try {
  //   await fire(env.PABBLY_ABANDONED_WEBHOOK_URL, payload);
  //   return { ok: true };
  // } catch (err) {
  //   const error = err instanceof Error ? err.message : "unknown";
  //   console.error("[pabbly] abandoned webhook error:", error);
  //   return { ok: false, error };
  // }
}
