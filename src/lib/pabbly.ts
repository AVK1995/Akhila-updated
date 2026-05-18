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
  // Set when payment succeeded
  paymentId?: string;
  orderId?: string;
  amountInr?: number;
  paidAt?: string;
  // Source page / context
  source?: string;
};

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

export async function sendAbandonedWebhook(
  payload: LeadPayload
): Promise<{ ok: boolean; error?: string }> {
  const env = getServerEnv();
  if (!env.PABBLY_ABANDONED_WEBHOOK_URL) {
    console.warn(
      "[pabbly] PABBLY_ABANDONED_WEBHOOK_URL not set — skipping abandoned webhook"
    );
    return { ok: false, error: "webhook_url_not_configured" };
  }
  try {
    await fire(env.PABBLY_ABANDONED_WEBHOOK_URL, payload);
    return { ok: true };
  } catch (err) {
    const error = err instanceof Error ? err.message : "unknown";
    console.error("[pabbly] abandoned webhook error:", error);
    return { ok: false, error };
  }
}
