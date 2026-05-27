import { getServerEnv } from "./env";

/**
 * LeadPayload — camelCase shape used ONLY by the (currently disabled)
 * abandoned-cart path (sendAbandonedWebhook + lib/abandonedCart.ts +
 * api/checkout-init). Kept intact so that dormant system keeps
 * type-checking. The live purchase path uses PabblyPurchasePayload below.
 */
export type LeadPayload = {
  leadId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  phoneCountry: string;
  city?: string;
  ageRange?: string;
  primaryConcern?: string;
  couponCode?: string;
  utm?: Record<string, string>;
  paymentId?: string;
  orderId?: string;
  amountInr?: number;
  paidAt?: string;
  source?: string;
};

/**
 * PabblyPurchasePayload — the 23-field snake_case schema that feeds the
 * downstream Google-Sheet CRM (columns A–W). Field names match the sheet
 * header EXACTLY so Pabbly's column mapping is 1:1. The CRM row carries
 * every Meta matching identifier (fbc/fbp/client_ip_address/
 * client_user_agent/external_id) so a downstream Apps Script can fire
 * Schedule / ShowUp / HighTicket CAPI events later at full EMQ.
 *
 * Built entirely from data available in the verify-payment request
 * (request body lead + cookies + headers) — verify-payment is the single
 * firing path; there is no webhook fallback.
 *
 * The 4 trailing fields (full_name, order_id, currency, payment_timestamp)
 * are sensible extras beyond the canonical 23; Pabbly maps them by name
 * only if wanted and ignores them otherwise.
 */
export type PabblyPurchasePayload = {
  // ── Lead identity (sheet cols A–H) ──
  lead_id: string;
  created_at: string;          // ISO-8601, lead/session creation time
  first_name: string;
  last_name: string;
  email: string;
  phone: string;               // includes country code, e.g. "+919876543210"
  city: string;
  country_code: string;        // ISO-2, e.g. "IN"
  // ── Meta matching (sheet cols I–N) — RAW, never hashed except external_id ──
  fbc: string;                 // _fbc cookie, raw
  fbp: string;                 // _fbp cookie, raw
  client_ip_address: string;
  client_user_agent: string;
  external_id: string;         // sha256(lowercased email) — matches CAPI + MAM
  event_source_url: string;
  // ── Purchase data (sheet cols O–Q) ──
  amount: string;              // rupees as string, e.g. "97"
  is_test: string;             // "false" on delivered rows (gate suppresses tests)
  purchase_event_id: string;   // = razorpay_payment_id (the CAPI event_id)
  // ── Attribution (sheet cols R–W) ──
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  utm_term: string;
  fbclid: string;
  // ── Extras beyond the canonical 23 (name-mapped if wanted) ──
  full_name: string;
  order_id: string;
  currency: string;            // "INR"
  payment_timestamp: string;   // ISO-8601 UTC
};

/**
 * Sends a JSON payload to a Pabbly Connect webhook. We resolve the URL lazily
 * so missing env vars don't crash unrelated routes. Returns the response body
 * if reachable, or throws when the webhook URL isn't configured.
 */
async function fire(url: string, payload: object): Promise<unknown> {
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
  payload: PabblyPurchasePayload
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
