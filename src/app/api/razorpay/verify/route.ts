import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { sendPurchaseWebhook } from "@/lib/pabbly";
import { cancelAbandoned } from "@/lib/abandonedCart";
import { getServerEnv, publicEnv } from "@/lib/env";
import { sendMetaCapiEvent } from "@/lib/meta";
import { shouldFireConversionEvents } from "@/lib/gating";

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

  let webhook: { ok: boolean; error?: string } = {
    ok: false,
    error: "skipped_by_gate",
  };
  if (fireConversions) {
    // Fire the purchase webhook (best-effort — we don't fail the request
    // if Pabbly is down; we just log it).
    webhook = await sendPurchaseWebhook({
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
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      amountInr: env.ASSESSMENT_FEE_INR,
      paidAt: new Date().toISOString(),
      source: "razorpay_verify",
    });
  }

  // ── Meta Conversions API: Purchase + sales ──────────────────────────
  // Single POST to graph.facebook.com — two events sharing event_id so
  // analytics on both rows ties to the same Razorpay payment. Best-effort:
  // a CAPI failure is logged but never blocks the verify response (the
  // user still gets routed to /book-a-call regardless).
  //
  // event_id = razorpay_payment_id. If you later add a browser-side
  // Purchase as an escalation, use the same value as `eventID` so Meta's
  // dedup spec applies.
  //
  // Bypass-coupon orders do NOT reach this route — those go through
  // /api/razorpay/create-order without firing CAPI by design (internal
  // test path, polluting Meta with fake conversions would corrupt
  // optimisation).
  let capi:
    | { ok: true; eventsReceived: number; fbtraceId?: string }
    | { ok: false; error: string } = { ok: false, error: "skipped_by_gate" };
  if (fireConversions) {
    const fbc = req.headers
      .get("cookie")
      ?.split(/;\s*/)
      .find((c) => c.startsWith("_fbc="))
      ?.slice(5);
    const fbp = req.headers
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

    capi = await sendMetaCapiEvent({
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      email: lead.email,
      phone: lead.phone,
      firstName: lead.firstName,
      lastName: lead.lastName,
      city: lead.city ?? "",
      countryCode: lead.phoneCountry,
      eventSourceUrl: resolvedEventSourceUrl,
      fbc: fbc ? decodeURIComponent(fbc) : undefined,
      fbp: fbp ? decodeURIComponent(fbp) : undefined,
      clientIp,
      clientUserAgent,
      valueRupees: env.ASSESSMENT_FEE_INR,
      currency: "INR",
    });
  }

  return NextResponse.json({
    ok: true,
    verified: true,
    fired: fireConversions,
    webhook: webhook.ok
      ? "delivered"
      : webhook.error === "skipped_by_gate"
        ? "skipped"
        : "failed",
    metaCapi: capi.ok
      ? { delivered: true, eventsReceived: capi.eventsReceived }
      : { delivered: false, error: capi.error },
  });
}
