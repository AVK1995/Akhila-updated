/**
 * Meta Conversions API (server-side) — Akhila Funnel
 * ---------------------------------------------------
 * Fires ONE custom `sales` event on every verified Razorpay payment.
 *
 * HEALTH & WELLNESS HARDENING (see META_HW_HARDENING.md):
 *   - We do NOT fire the standard `Purchase` event. Meta blocks standard
 *     events BY NAME for health-categorized datasets, so we never depend on
 *     it; campaigns optimise directly on the custom `sales` event. This
 *     pre-builds the corrective bypass — if the dataset is ever classified,
 *     `sales` keeps flowing and optimising with nothing to lose.
 *   - `custom_data` is kept minimal + PHI-free: `value` + `currency` only.
 *     No payment_id / order_id / UTM / content_name reaches Meta.
 *   - `event_source_url` is reduced to origin (scheme+host) so no path or UTM
 *     query leaks to Meta.
 *   - `user_data` is unchanged (11 hashed/raw match signals) → EMQ stays 9.5+.
 *     Hashed PII is the compliant matching mechanism, not a leak.
 *
 * Browser side fires only `PageView` + hashed MAM (see src/lib/analytics.ts +
 * the inline script in src/app/layout.tsx). No browser-side conversion or
 * video events reach Meta.
 *
 * Bypass-coupon orders do NOT fire CAPI (internal test path; polluting Meta
 * with fake conversions would corrupt the optimisation algorithm).
 */

import crypto from "node:crypto";
import { getServerEnv } from "./env";
import { publicEnv } from "./env";
import { originOnly } from "./utils";

const CAPI_VERSION = "v25.0";
const CUSTOM_EVENT_NAME = "sales";
/**
 * Lead event name (FREE_FUNNEL_MODE). Fired as a CUSTOM event, NOT the Meta
 * standard `Lead` — Meta blocks standard events by name for health-categorized
 * datasets, so a custom event with the same readable name keeps flowing while
 * staying immune to name-based blocking (same posture as `sales`).
 */
const LEAD_EVENT_NAME = "Lead";

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

/**
 * external_id for Meta matching = sha256(normalised email). Exported so the
 * Pabbly purchase payload (verify-payment) and the browser MAM cookie all
 * derive the SAME value for a given user — Meta requires external_id
 * consistency across channels.
 */
export function externalIdFromEmail(email: string): string {
  return sha256(email.trim().toLowerCase());
}

export type MetaCapiParams = {
  /** Razorpay payment id — used as the deterministic event_id for dedup. */
  paymentId: string;
  /**
   * Razorpay order id. Retained on the params for callers/back-compat but
   * intentionally NOT sent to Meta (H&W posture keeps custom_data minimal).
   */
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
    // Origin-only — strips path + UTM query so no health-y context leaks.
    event_source_url: originOnly(params.eventSourceUrl),
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
    // Minimal + PHI-free. `payment_id`/`order_id` are intentionally NOT sent
    // to Meta (event_id already = paymentId for dedup); they live in Pabbly/
    // the CRM sheet instead. No content_name / product / UTM strings here.
    custom_data: {
      currency: params.currency,
      value: params.valueRupees,
    },
  };

  // H&W posture: fire the custom `sales` event ONLY. Standard `Purchase` is
  // restricted by name for health-categorized datasets and is deliberately
  // omitted — campaigns optimise directly on `sales`.
  const events = [{ ...baseEvent, event_name: CUSTOM_EVENT_NAME }];

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

export type MetaLeadParams = {
  /** leadId — deterministic event_id for dedup (browser has no Lead event). */
  eventId: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  /** Free-form location (city). Letters-only lowercased + hashed as `ct`. */
  city: string;
  countryCode: string;
  eventSourceUrl: string;
  fbc: string | undefined;
  fbp: string | undefined;
  clientIp: string | undefined;
  clientUserAgent: string | undefined;
};

/**
 * Fire ONE custom `Lead` event on free-flow form submission. Same user_data
 * matching shape + hashing as the purchase `sales` event (EMQ 9.5+), but with
 * NO custom_data (no value/currency — there is no payment). event_id = leadId.
 *
 * No-ops (`{ ok: true, eventsReceived: 0 }`) when pixel id or access token is
 * missing, so callers don't special-case the disabled state.
 */
export async function sendMetaLeadEvent(
  params: MetaLeadParams
): Promise<MetaCapiResult> {
  const env = getServerEnv();
  const pixelId = publicEnv.metaPixelId;
  const token = env.META_CAPI_ACCESS_TOKEN;

  if (!pixelId || !token) {
    return { ok: true, eventsReceived: 0 };
  }

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

  const events = [
    {
      event_name: LEAD_EVENT_NAME,
      event_time: Math.floor(Date.now() / 1000),
      event_id: params.eventId,
      action_source: "website" as const,
      event_source_url: originOnly(params.eventSourceUrl),
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
    },
  ];

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
      console.error("[meta-capi] lead HTTP", res.status, text);
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
    console.error("[meta-capi] lead fetch error:", message);
    return { ok: false, error: message };
  }
}
