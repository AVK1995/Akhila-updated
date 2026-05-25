import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { sendPurchaseWebhook, istDateAndTime } from "@/lib/pabbly";
import { cancelAbandoned } from "@/lib/abandonedCart";
import { getServerEnv, publicEnv } from "@/lib/env";
import { sendMetaCapiEvent } from "@/lib/meta";
import { shouldFireConversionEvents } from "@/lib/gating";
import { claimEventId } from "@/lib/dedup";
import { getPaymentDedupState, markFires } from "@/lib/payment-dedup";

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
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(7),
    phoneCountry: z.string().min(2).max(4),
    city: z.string().optional(),
    ageRange: z.string().optional(),
    primaryConcern: z.string().optional(),
    couponCode: z.string().optional(),
    utm: z.record(z.string(), z.string()).optional(),
  }),
});

/**
 * Verifies a Razorpay payment signature, cancels the abandoned-cart timer,
 * and fires the Pabbly purchase webhook with the user's data + UTMs.
 *
 * The Pabbly webhook fires ONLY here, on verified payment success — never
 * on order creation.
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
    return NextResponse.json(
      { error: "signature_invalid" },
      { status: 400 }
    );
  }

  const env = getServerEnv();

  // Cancel the abandoned-cart timer (best-effort)
  cancelAbandoned(lead.leadId);

  // ── Layer 1 dedup: same-instance claim ──────────────────────────────
  // Defends against browser retries / refresh in the same warm Lambda.
  // Returns the response as `verified: true` either way — the caller
  // already knows the signature was good; only side-effects are skipped.
  const claimed = claimEventId(razorpay_payment_id);
  if (!claimed) {
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
  // All downstream firings (Pabbly purchase webhook + Meta CAPI) are
  // suppressed unless the request is served from the production hostname
  // AND the order amount exceeds the test threshold (>1 INR). This lets
  // us run ₹1 verification charges on Vercel preview or production
  // without polluting Events Manager / Pabbly. Real ₹97 charges on the
  // production domain fire normally. The signature is still verified and
  // the user still routes to /book-a-call regardless of this gate — only
  // the side-channel notifications are suppressed.
  const hostHeader = req.headers.get("host");
  const fireConversions = shouldFireConversionEvents(
    hostHeader,
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

  // ── Layer 2 dedup: persistent markers on Razorpay payment notes ─────
  // If PATH B (webhook) has already fired one of these in a previous
  // request (e.g. user retries verify after a payment 5s ago), skip
  // that fire here. Both routes use this same check so we converge on
  // exactly one Pabbly row + one CAPI event_id per real payment.
  const dedupState = await getPaymentDedupState(razorpay_payment_id);
  const willFirePabbly = !dedupState.pabblyFired;
  const willFireCapi = !dedupState.capiFired;

  console.log(
    `[verify-payment] event_id=${razorpay_payment_id} ` +
      `value=${env.ASSESSMENT_FEE_INR} email=${lead.email} → ` +
      `firing { pabbly:${willFirePabbly}, capi:${willFireCapi} }`
  );

  // Pre-build shared timestamps so PATH A and PATH B produce identical
  // paidAt/paymentDate/paymentTime values for the same payment.
  const paidAt = new Date().toISOString();
  const [paymentDate, paymentTime] = istDateAndTime(paidAt);
  const utmMap = lead.utm ?? {};

  // Extract Meta cookies + request context for CAPI.
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
  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    undefined;
  const clientUserAgent = req.headers.get("user-agent") ?? undefined;
  const resolvedEventSourceUrl =
    eventSourceUrl ?? `${publicEnv.siteUrl.replace(/\/+$/, "")}/checkout`;

  // ── Parallel fire: Pabbly + Meta CAPI ───────────────────────────────
  // Promise.allSettled so a failure in one doesn't block the other. We
  // mark each fire's success independently below; only the ones that
  // returned ok get a marker, so the fallback path can retry only the
  // failed side.
  const [pabblyResult, capiResult] = await Promise.allSettled([
    willFirePabbly
      ? sendPurchaseWebhook({
          leadId: lead.leadId,
          firstName: lead.firstName,
          lastName: lead.lastName,
          fullName: `${lead.firstName} ${lead.lastName}`.trim(),
          email: lead.email,
          phone: lead.phone,
          phoneCountry: lead.phoneCountry,
          city: lead.city,
          ageRange: lead.ageRange,
          primaryConcern: lead.primaryConcern,
          couponCode: lead.couponCode,
          utm: lead.utm,
          fbclid: utmMap.fbclid,
          gclid: utmMap.gclid,
          landingUrl: utmMap.landing_url,
          referrer: utmMap.referrer,
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
          amountInr: env.ASSESSMENT_FEE_INR,
          currency: "INR",
          paidAt,
          paymentDate,
          paymentTime,
          source: "razorpay_verify",
        })
      : Promise.resolve({ ok: true, error: undefined }),
    willFireCapi
      ? sendMetaCapiEvent({
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
          email: lead.email,
          phone: lead.phone,
          firstName: lead.firstName,
          lastName: lead.lastName,
          city: lead.city ?? "",
          countryCode: lead.phoneCountry,
          eventSourceUrl: resolvedEventSourceUrl,
          fbc: fbcCookie ? decodeURIComponent(fbcCookie) : undefined,
          fbp: fbpCookie ? decodeURIComponent(fbpCookie) : undefined,
          clientIp,
          clientUserAgent,
          valueRupees: env.ASSESSMENT_FEE_INR,
          currency: "INR",
        })
      : Promise.resolve({ ok: true as const, eventsReceived: 0 }),
  ]);

  const pabblySucceeded =
    willFirePabbly &&
    pabblyResult.status === "fulfilled" &&
    pabblyResult.value.ok === true;
  const capiSucceeded =
    willFireCapi &&
    capiResult.status === "fulfilled" &&
    capiResult.value.ok === true;

  // ── Mark only the markers that succeeded ────────────────────────────
  // If Pabbly succeeded but CAPI failed (or vice versa), only the
  // succeeded marker is written — so the webhook fallback retries
  // exactly the missing side, never the one that already landed.
  await markFires(razorpay_payment_id, dedupState.existingNotes, {
    pabblySucceeded,
    capiSucceeded,
  });

  return NextResponse.json({
    ok: true,
    verified: true,
    fired: true,
    webhook: willFirePabbly
      ? pabblySucceeded
        ? "delivered"
        : "failed"
      : "already_fired",
    metaCapi: willFireCapi
      ? capiSucceeded
        ? {
            delivered: true,
            eventsReceived:
              capiResult.status === "fulfilled" &&
              "eventsReceived" in capiResult.value
                ? capiResult.value.eventsReceived
                : 0,
          }
        : { delivered: false, error: "fire_failed" }
      : { delivered: false, error: "already_fired" },
  });
}
