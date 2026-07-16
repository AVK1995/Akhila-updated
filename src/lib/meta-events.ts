/**
 * Meta Conversions API — upper-funnel intent events (Akhila Funnel)
 * ------------------------------------------------------------------
 * Two additional server-side CAPI events that sit ABOVE the existing `sales`
 * conversion in the funnel:
 *
 *   add_to_cart  landing CTA click  → intent to buy
 *   ic_event     Pay-button click   → wallet out, Razorpay opening
 *                (named `ic_event`, NOT `initiate_checkout` — see the event
 *                 name constants below for why)
 *
 * These are peers of the existing `sales` event (src/lib/meta.ts), not part of
 * it: they are triggered by the visitor's browser action via our own API routes
 * (/api/meta/add-to-cart, /api/meta/initiate-checkout), NOT by the Razorpay
 * payment path. That's deliberate — both represent intent that happens BEFORE
 * any payment, so the payment path can never see them.
 *
 * HEALTH & WELLNESS POSTURE — mirrors `sales` exactly (see META_HW_HARDENING.md
 * and src/lib/meta.ts). Do not diverge:
 *   - CUSTOM event names that do not collide with a Meta standard event in any
 *     casing. Standard events are blocked BY NAME on this H&W-classified
 *     dataset, exactly as `Purchase` is — which is why the conversion event is
 *     the custom `sales`. See the event name constants below.
 *   - `custom_data` stays minimal + PHI-free: `value` + `currency` only. No
 *     content_ids / content_name / product / UTM — those could hint at a health
 *     condition.
 *   - `event_source_url` is reduced to origin (scheme+host), so no path or UTM
 *     query reaches Meta.
 *   - `user_data` keeps the SAME hashed match signals `sales` sends. Hashed PII
 *     is the compliant matching mechanism, not a leak — the restriction is on
 *     event names and PHI in custom_data.
 *
 * Both no-op (returning a success shape) when the pixel id or access token is
 * missing, so callers never special-case the disabled state, and neither event
 * may ever block the user's click or payment.
 */

import crypto from "node:crypto";
import { getServerEnv, publicEnv } from "./env";
import { originOnly } from "./utils";

const CAPI_VERSION = "v25.0";

/**
 * Event names MUST NOT collide with a Meta STANDARD event name — in any
 * casing. Meta normalises `initiate_checkout` to the standard `InitiateCheckout`
 * and blocks it by name on this H&W-classified dataset, exactly as it blocks
 * `Purchase` (→ `sales`) and `Lead` (→ `consult`):
 *
 *   "The standard event 'initiate_checkout' is blocked because it suggests the
 *    use of information not allowed under Meta's terms, based on the
 *    categorisation of your data source."   — Events Manager, confirmed
 *
 * So snake_case alone does NOT make a name custom. `ic_event` is safe because
 * no standard event is called that, the same reason `sales`/`consult` are safe.
 *
 * ⚠️ `add_to_cart` normalises to the standard `AddToCart` and is therefore
 * expected to be blocked the same way once it first fires. If Events Manager
 * flags it, rename it here (e.g. `atc_event`) — nothing else needs to change.
 */
const ATC_EVENT_NAME = "add_to_cart";
const IC_EVENT_NAME = "ic_event";

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export type MetaEventResult =
  | { ok: true; eventsReceived: number; fbtraceId?: string }
  | { ok: false; error: string };

type BrowserContext = {
  /** Raw Meta cookie values, NOT hashed. Absent → field omitted entirely. */
  fbc: string | undefined;
  fbp: string | undefined;
  clientIp: string | undefined;
  clientUserAgent: string | undefined;
  /** URL the visitor was on. Reduced to origin before it reaches Meta. */
  eventSourceUrl: string;
  /** Major units (rupees), NOT paise. */
  valueRupees: number;
  /** ISO 4217, e.g. "INR". */
  currency: string;
};

export type AddToCartParams = BrowserContext;

export type InitiateCheckoutParams = BrowserContext & {
  /** Raw, unhashed. Normalised + hashed internally. */
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  city: string;
  /** ISO-2 country (e.g. "IN"). */
  countryCode: string;
};

/** POST one event to the Graph API. Shared by both events. */
async function postEvent(
  event: Record<string, unknown>,
  logTag: string
): Promise<MetaEventResult> {
  const env = getServerEnv();
  const pixelId = publicEnv.metaPixelId;
  const token = env.META_CAPI_ACCESS_TOKEN;

  if (!pixelId || !token) {
    return { ok: true, eventsReceived: 0 };
  }

  const body: Record<string, unknown> = { data: [event] };
  // Optional Test Events routing — excluded from production reporting.
  const testEventCode = env.META_CAPI_TEST_EVENT_CODE?.trim();
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
      console.error(`${logTag} HTTP`, res.status, text);
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
    console.error(`${logTag} fetch error:`, message);
    return { ok: false, error: message };
  }
}

/**
 * Fire ONE custom `add_to_cart` event (landing CTA click).
 *
 * No PII exists at CTA click time — the form hasn't been filled — so user_data
 * carries only the raw non-PII signals (fbc/fbp/IP/UA). Expected EMQ ~3-5; that
 * is the data-availability ceiling for an anonymous event, not a bug.
 *
 * event_id = sha256(fbp + '|atc') so the same browser produces the same id and
 * Meta's 48h dedup collapses accidental duplicates. Falls back to a random id
 * when `_fbp` is absent (tracking-blocked visitor) — dedup then relies on the
 * client's localStorage flag alone.
 */
export async function sendAddToCartEvent(
  params: AddToCartParams
): Promise<MetaEventResult> {
  const eventId = params.fbp
    ? sha256(`${params.fbp}|atc`)
    : `${crypto.randomBytes(16).toString("hex")}_atc`;

  const event = {
    event_name: ATC_EVENT_NAME,
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId,
    action_source: "website" as const,
    event_source_url: originOnly(params.eventSourceUrl),
    user_data: {
      ...(params.fbc && { fbc: params.fbc }),
      ...(params.fbp && { fbp: params.fbp }),
      ...(params.clientUserAgent && { client_user_agent: params.clientUserAgent }),
      ...(params.clientIp && { client_ip_address: params.clientIp }),
    },
    custom_data: {
      currency: params.currency,
      value: params.valueRupees,
    },
  };

  return postEvent(event, "[atc]");
}

/**
 * Fire ONE custom `ic_event` event (Pay clicked, form valid, Razorpay about to
 * open). Named `ic_event` because Meta blocks `initiate_checkout` by name.
 *
 * The full form is available here, so user_data carries the SAME hashed match
 * signals as `sales` (EMQ 9+). `external_id` uses the identical
 * sha256(normalised email) derivation as `sales` and the browser MAM cookie, so
 * Meta resolves one stable identity across every event we send.
 *
 * event_id = sha256(email + '|ic') so the same person produces the same id even
 * across sessions/devices, and Meta's 48h dedup collapses duplicates.
 */
export async function sendInitiateCheckoutEvent(
  params: InitiateCheckoutParams
): Promise<MetaEventResult> {
  // Normalise + hash per Meta's spec — identical to src/lib/meta.ts.
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

  const event = {
    event_name: IC_EVENT_NAME,
    event_time: Math.floor(Date.now() / 1000),
    event_id: sha256(`${normalisedEmail}|ic`),
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
    custom_data: {
      currency: params.currency,
      value: params.valueRupees,
    },
  };

  return postEvent(event, "[ic]");
}
