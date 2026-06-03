import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { sendPurchaseWebhook, type PabblyPurchasePayload } from "@/lib/pabbly";
import { cancelAbandoned } from "@/lib/abandonedCart";
import { getServerEnv, publicEnv } from "@/lib/env";
import { sendMetaCapiEvent, externalIdFromEmail } from "@/lib/meta";
import { shouldFireConversionEvents } from "@/lib/gating";
import { claimEventId } from "@/lib/dedup";
import { originOnly } from "@/lib/utils";

export const runtime = "nodejs";

const schema = z.object({
  razorpay_order_id: z.string().min(4),
  razorpay_payment_id: z.string().min(4),
  razorpay_signature: z.string().min(8),
  /**
   * URL the user was on at conversion time. Required by Meta CAPI for
   * restricted categories (PCOS = health). Falls back server-side to
   * `${publicEnv.siteUrl}/checkout` if absent.
   */
  eventSourceUrl: z.string().url().optional(),
  lead: z.object({
    leadId: z.string().min(8),
    createdAt: z.string().optional(), // session lead creation time → created_at
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(7),
    phoneCountry: z.string().min(2).max(4),
    city: z.string().optional(),
    ageRange: z.string().optional(),
    primaryConcern: z.string().optional(),
    couponCode: z.string().optional(),
    consent: z.boolean().optional(),
    utm: z.record(z.string(), z.string()).optional(),
  }),
});

/**
 * THE single firing path for the funnel.
 *
 * Verifies the Razorpay payment signature, then fires both:
 *   - Pabbly purchase webhook (23-field snake_case CRM row)
 *   - Meta CAPI (Purchase + sales, shared event_id = payment_id)
 *
 * There is NO Razorpay server-to-server webhook (PATH B was removed — it
 * caused unreliable firing + cross-business pollution on the shared
 * account). This route is only ever called by our own funnel's browser via
 * a keepalive fetch, so foreign payments can never reach it. That's also
 * why no funnel guardrail is needed here.
 *
 * Dedup: claimEventId (in-process) guards against a double keepalive POST
 * on the same warm Lambda. Meta dedupes CAPI by event_id (48h) as backstop.
 *
 * Both downstream calls are awaited but wrapped so neither failure blocks
 * the response — the user has already been redirected to /book-a-call.
 */
export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    eventSourceUrl,
    lead,
  } = parsed.data;

  const valid = verifyPaymentSignature({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
  });

  if (!valid) {
    return NextResponse.json({ error: "signature_invalid" }, { status: 400 });
  }

  const env = getServerEnv();

  // Cancel the abandoned-cart timer (best-effort; system is disabled anyway).
  cancelAbandoned(lead.leadId);

  // ── In-process dedup ────────────────────────────────────────────────
  // Guards against a duplicate keepalive POST (network retry / refresh)
  // landing on the same warm Lambda → protects Pabbly from a duplicate row.
  if (!claimEventId(razorpay_payment_id)) {
    console.log(
      `[verify-payment] event_id=${razorpay_payment_id} already claimed in-process → skip`
    );
    return NextResponse.json({
      ok: true,
      verified: true,
      fired: false,
      webhook: "skipped",
      metaCapi: { delivered: false, error: "skipped_by_in_process_dedup" },
    });
  }

  // ── Conversion-event gate ───────────────────────────────────────────
  // Pabbly + CAPI fire only on the production hostname AND amount > ₹1.
  // ₹1 test charges / preview deploys fire nothing — keeps Events Manager
  // and the Pabbly sheet clean. Signature is still verified and the user
  // still routes to /book-a-call regardless.
  const fireConversions = shouldFireConversionEvents(
    req.headers.get("host"),
    env.ASSESSMENT_FEE_INR
  );
  if (!fireConversions) {
    return NextResponse.json({
      ok: true,
      verified: true,
      fired: false,
      webhook: "skipped",
      metaCapi: { delivered: false, error: "skipped_by_gate" },
    });
  }

  // ── Gather everything from THIS request ─────────────────────────────
  // verify-payment has the real browser context (cookies + IP + UA), so
  // every CAPI fire and every Pabbly row is full-EMQ.
  const nowIso = new Date().toISOString();
  const utmMap = lead.utm ?? {};

  const fbcCookie = req.headers
    .get("cookie")
    ?.split(/;\s*/)
    .find((c) => c.startsWith("_fbc="))
    ?.slice(5);
  const fbpCookie = req.headers
    .get("cookie")
    ?.split(/;\s*/)
    .find((c) => c.startsWith("_fbp="))
    ?.slice(5);
  const fbc = fbcCookie ? decodeURIComponent(fbcCookie) : "";
  const fbp = fbpCookie ? decodeURIComponent(fbpCookie) : "";
  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "";
  const clientUserAgent = req.headers.get("user-agent") ?? "";
  const resolvedEventSourceUrl =
    eventSourceUrl ?? `${publicEnv.siteUrl.replace(/\/+$/, "")}/checkout`;
  // H&W hygiene: reduce to origin (scheme+host) before it reaches Meta OR the
  // CRM sheet, so no path / UTM query leaks. UTMs are still captured in their
  // own Pabbly + sheet columns, so reporting loses nothing.
  const eventSourceOrigin = originOnly(resolvedEventSourceUrl);
  const externalId = externalIdFromEmail(lead.email);

  console.log(
    `[verify-payment] event_id=${razorpay_payment_id} ` +
      `value=${env.ASSESSMENT_FEE_INR} email=${lead.email} → firing { pabbly:true, capi:true }`
  );

  // ── 23-field snake_case Pabbly payload (+ 4 generic extras + 4 form extras) ──
  // Cols 1-23 map 1:1 to the CRM sheet A–W. lead_id == purchase_event_id ==
  // razorpay_payment_id so the downstream Apps Script builds
  // `{payment_id}_schedule|showup|htsale` event ids. The 8 trailing fields
  // are NOT in the CRM sheet; they're sent for a separate sheet/automation.
  const pabblyPayload: PabblyPurchasePayload = {
    lead_id: razorpay_payment_id,
    created_at: nowIso, // payment time
    first_name: lead.firstName,
    last_name: lead.lastName,
    email: lead.email,
    phone: lead.phone,
    city: lead.city ?? "",
    country_code: lead.phoneCountry,
    fbc,
    fbp,
    client_ip_address: clientIp,
    client_user_agent: clientUserAgent,
    external_id: externalId,
    event_source_url: eventSourceOrigin,
    amount: String(env.ASSESSMENT_FEE_INR),
    is_test: "false", // gate guarantees only real (amount>1, prod-host) rows reach here
    purchase_event_id: razorpay_payment_id,
    utm_source: utmMap.utm_source ?? "",
    utm_medium: utmMap.utm_medium ?? "",
    utm_campaign: utmMap.utm_campaign ?? "",
    utm_content: utmMap.utm_content ?? "",
    utm_term: utmMap.utm_term ?? "",
    fbclid: utmMap.fbclid ?? "",
    // generic extras
    full_name: `${lead.firstName} ${lead.lastName}`.trim(),
    order_id: razorpay_order_id,
    currency: "INR",
    payment_timestamp: nowIso,
    // form extras (separate sheet, not the CRM A–W schema)
    age_range: lead.ageRange ?? "",
    primary_concern: lead.primaryConcern ?? "",
    coupon_code: lead.couponCode ?? "",
    consent: lead.consent ? "true" : "false",
  };

  // ── Parallel fire: Pabbly + Meta CAPI ───────────────────────────────
  // Promise.allSettled so one failure can't block the other or the
  // response. event_id = razorpay_payment_id is shared by Purchase + sales.
  const [pabblyResult, capiResult] = await Promise.allSettled([
    sendPurchaseWebhook(pabblyPayload),
    sendMetaCapiEvent({
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      email: lead.email,
      phone: lead.phone,
      firstName: lead.firstName,
      lastName: lead.lastName,
      city: lead.city ?? "",
      countryCode: lead.phoneCountry,
      eventSourceUrl: eventSourceOrigin,
      fbc: fbc || undefined,
      fbp: fbp || undefined,
      clientIp: clientIp || undefined,
      clientUserAgent: clientUserAgent || undefined,
      valueRupees: env.ASSESSMENT_FEE_INR,
      currency: "INR",
    }),
  ]);

  const pabblySucceeded =
    pabblyResult.status === "fulfilled" && pabblyResult.value.ok === true;
  const capiSucceeded =
    capiResult.status === "fulfilled" && capiResult.value.ok === true;

  return NextResponse.json({
    ok: true,
    verified: true,
    fired: true,
    webhook: pabblySucceeded ? "delivered" : "failed",
    metaCapi: capiSucceeded
      ? {
          delivered: true,
          eventsReceived:
            capiResult.status === "fulfilled" &&
            "eventsReceived" in capiResult.value
              ? capiResult.value.eventsReceived
              : 0,
        }
      : { delivered: false, error: "fire_failed" },
  });
}
