/**
 * Meta Conversions API (server-side) — Akhila PCOS Funnel
 * --------------------------------------------------------
 * Fires the dual Purchase + sales events on every verified Razorpay payment.
 * One HTTP POST, two events in the `data` array, identical user_data and
 * custom_data, only `event_name` differs.
 *
 *   Purchase  ← Meta standard event. Campaign optimization target.
 *               Mature global ML priors. iOS attribution (AEM is automatic
 *               since Oct 2024).
 *   sales     ← Custom event. Internal source-of-truth label that excludes
 *               inferred Purchases or other sources.
 *
 * Browser side fires only `PageView` (see src/lib/analytics.ts + the inline
 * script in src/app/layout.tsx). No browser-side Purchase, InitiateCheckout,
 * Lead, or AddToCart by design — campaign is optimised on the CAPI Purchase
 * (EMQ 9.5+ via this payload). Adding browser-side Purchase would create
 * dedup complexity and inflate the Events Manager dashboard count.
 *
 * Bypass-coupon orders do NOT fire CAPI (internal test path; polluting Meta
 * with fake conversions would corrupt the optimisation algorithm).
 *
 * Restricted-category compliant: includes `event_source_url` on every event,
 * required by Meta for health/PCOS-targeted accounts since Feb 2021.
 */

import crypto from "node:crypto";
import { getServerEnv } from "./env";
import { publicEnv } from "./env";

const CAPI_VERSION = "v25.0";
const CUSTOM_EVENT_NAME = "sales";

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export type MetaCapiParams = {
  /** Razorpay payment id — used as the deterministic event_id for dedup. */
  paymentId: string;
  /** Razorpay order id — surfaced in custom_data for analytics. */
  orderId: string;
  /** Raw, unhashed email. We normalise + hash internally. */
  email: string;
  /** Dial code + national number, raw (e.g. "+919876543210"). Digits-only is hashed. */
  phone: string;
  firstName: string;
  lastName: string;
  city: string;
  /** ISO-2 country (e.g. "IN", "US"). Lowercased + hashed. */
  countryCode: string;
  /**
   * URL the user was on at conversion time — required for restricted
   * categories (health/PCOS). Falls back to `${siteUrl}/checkout` upstream.
   */
  eventSourceUrl: string;
  /** Raw Meta cookie values, NOT hashed. Absent → omit field entirely. */
  fbc: string | undefined;
  fbp: string | undefined;
  clientIp: string | undefined;
  clientUserAgent: string | undefined;
  /** Major units (rupees), NOT paise. */
  valueRupees: number;
  /** ISO 4217 (e.g. "INR"). */
  currency: string;
};

type MetaCapiResult =
  | { ok: true; eventsReceived: number; fbtraceId?: string }
  | { ok: false; error: string };

/**
 * Fire the Purchase + sales CAPI events. Best-effort: caller is expected to
 * `await` this but never let a failure block the user-facing response.
 *
 * No-ops (returns `{ ok: true, eventsReceived: 0 }`) when either the pixel ID
 * or the access token is missing — same shape as a success so callers don't
 * need to special-case the disabled state.
 */
export async function sendMetaCapiEvent(
  params: MetaCapiParams
): Promise<MetaCapiResult> {
  const env = getServerEnv();
  const pixelId = publicEnv.metaPixelId;
  const token = env.META_CAPI_ACCESS_TOKEN;

  if (!pixelId || !token) {
    return { ok: true, eventsReceived: 0 };
  }

  // ── Normalise + hash per Meta's spec ────────────────────────────────────
  // em / ph / fn / ln / ct / country are hashed. external_id is the same
  // hash as em so the browser MAM (which also derives external_id from
  // sha256(normalised email)) lines up cross-channel. fbc / fbp / IP / UA
  // are sent RAW per Meta's spec — hashing them would break matching.
  const normalisedEmail = params.email.trim().toLowerCase();
  const hashedEmail = sha256(normalisedEmail);
  const externalId = sha256(normalisedEmail);

  const digitsPhone = params.phone.replace(/\D/g, "");
  const hashedPhone = digitsPhone ? sha256(digitsPhone) : undefined;

  const fn = params.firstName.trim().toLowerCase();
  const ln = params.lastName.trim().toLowerCase();
  const ct = params.city.trim().toLowerCase().replace(/[^a-z]/g, "");
  const country = params.countryCode.trim().toLowerCase();

  const hashedFn = fn ? sha256(fn) : undefined;
  const hashedLn = ln ? sha256(ln) : undefined;
  const hashedCt = ct ? sha256(ct) : undefined;
  const hashedCountry = country ? sha256(country) : undefined;

  const baseEvent = {
    event_time: Math.floor(Date.now() / 1000),
    event_id: params.paymentId,
    action_source: "website" as const,
    event_source_url: params.eventSourceUrl,
    user_data: {
      em: [hashedEmail],
      ...(hashedPhone && { ph: [hashedPhone] }),
      ...(hashedFn && { fn: [hashedFn] }),
      ...(hashedLn && { ln: [hashedLn] }),
      ...(hashedCt && { ct: [hashedCt] }),
      ...(hashedCountry && { country: [hashedCountry] }),
      external_id: [externalId],
      ...(params.fbc && { fbc: params.fbc }),
      ...(params.fbp && { fbp: params.fbp }),
      ...(params.clientUserAgent && { client_user_agent: params.clientUserAgent }),
      ...(params.clientIp && { client_ip_address: params.clientIp }),
    },
    custom_data: {
      currency: params.currency,
      value: params.valueRupees,
      payment_id: params.paymentId,
      order_id: params.orderId,
    },
  };

  const events = [
    { ...baseEvent, event_name: "Purchase" },
    { ...baseEvent, event_name: CUSTOM_EVENT_NAME },
  ];

  // Optional Test Events routing. When META_CAPI_TEST_EVENT_CODE is set, this
  // payload arrives in Events Manager → Test Events and is EXCLUDED from
  // production reporting. Empty in prod so events count for real attribution.
  const testEventCode = env.META_CAPI_TEST_EVENT_CODE?.trim();
  const body: Record<string, unknown> = { data: events };
  if (testEventCode) body.test_event_code = testEventCode;

  const url = `https://graph.facebook.com/${CAPI_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(token)}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[meta-capi] HTTP", res.status, text);
      return { ok: false, error: `http_${res.status}` };
    }
    const json = (await res.json().catch(() => ({}))) as {
      events_received?: number;
      fbtrace_id?: string;
    };
    return {
      ok: true,
      eventsReceived: json.events_received ?? 0,
      fbtraceId: json.fbtrace_id,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error("[meta-capi] fetch error:", message);
    return { ok: false, error: message };
  }
}
