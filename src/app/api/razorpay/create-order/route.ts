import { NextResponse } from "next/server";
import { z } from "zod";
import { getRazorpay } from "@/lib/razorpay";
import { getServerEnv } from "@/lib/env";
import { sendPurchaseWebhook } from "@/lib/pabbly";
import { cancelAbandoned } from "@/lib/abandonedCart";
import { shouldFireConversionEvents } from "@/lib/gating";

export const runtime = "nodejs";

const schema = z.object({
  leadId: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(7),
  /** Optional fields used only to decide / report the bypass path. */
  phoneCountry: z.string().min(2).max(4).optional(),
  city: z.string().optional(),
  ageRange: z.string().optional(),
  primaryConcern: z.string().optional(),
  couponCode: z.string().optional(),
  utm: z.record(z.string(), z.string()).optional(),
});

/**
 * Creates a Razorpay order for the assessment fee, OR — if the request
 * carries a coupon code matching the server-only BYPASS_COUPON_CODE env var —
 * skips Razorpay entirely, fires the Pabbly purchase webhook with a synthetic
 * `BYPASS-…` id pair, and returns `{ bypass: true, … }` so the client can
 * route straight to /book-a-call.
 *
 * The amount is read server-side from env so the client cannot tamper with it.
 * The bypass coupon is compared case-insensitively after trimming whitespace.
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

  const env = getServerEnv();

  // ───────────────────────── BYPASS PATH ─────────────────────────
  // If a bypass coupon is configured AND the user typed it (case-insensitive,
  // trimmed), we short-circuit Razorpay entirely. The downstream flow is
  // identical to a verified payment — Pabbly webhook fires, abandoned-cart
  // timer is cancelled — except the id pair is synthetic.
  const configuredBypass = env.BYPASS_COUPON_CODE.trim().toLowerCase();
  const submittedCoupon = (parsed.data.couponCode ?? "").trim().toLowerCase();
  const isBypass =
    configuredBypass.length > 0 && submittedCoupon === configuredBypass;

  if (isBypass) {
    const ts = Date.now();
    const orderId = `BYPASS-order-${ts}-${parsed.data.leadId.slice(-8)}`;
    const paymentId = `BYPASS-pay-${ts}-${parsed.data.leadId.slice(-8)}`;

    // Best-effort: cancel abandoned-cart timer + fire purchase webhook.
    cancelAbandoned(parsed.data.leadId);

    // Conversion-event gate: bypass orders have amount = 0, so the
    // `amount > 1` clause naturally blocks Pabbly firing here on both
    // production and previews. This keeps Pabbly clean of test traffic.
    // The user is still routed to /book-a-call exactly as before — only
    // the side-channel notification is suppressed.
    const fireConversions = shouldFireConversionEvents(
      req.headers.get("host"),
      0
    );
    let webhook: { ok: boolean; error?: string } = {
      ok: false,
      error: "skipped_by_gate",
    };
    if (fireConversions) {
      webhook = await sendPurchaseWebhook({
        leadId: parsed.data.leadId,
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        fullName: `${parsed.data.firstName} ${parsed.data.lastName}`.trim(),
        email: parsed.data.email,
        phone: parsed.data.phone,
        phoneCountry: parsed.data.phoneCountry ?? "",
        city: parsed.data.city,
        ageRange: parsed.data.ageRange,
        primaryConcern: parsed.data.primaryConcern,
        couponCode: parsed.data.couponCode,
        utm: parsed.data.utm,
        paymentId,
        orderId,
        amountInr: 0,
        paidAt: new Date().toISOString(),
        source: "bypass_coupon",
      });
    }

    return NextResponse.json({
      bypass: true,
      orderId,
      paymentId,
      amount: 0,
      currency: "INR",
      keyId: env.RAZORPAY_KEY_ID,
      webhook: webhook.ok
        ? "delivered"
        : webhook.error === "skipped_by_gate"
          ? "skipped"
          : "failed",
    });
  }

  // ──────────────────────── NORMAL PATH ──────────────────────────
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    return NextResponse.json(
      { error: "razorpay_not_configured" },
      { status: 500 }
    );
  }

  try {
    const rzp = getRazorpay();
    const order = await rzp.orders.create({
      amount: env.ASSESSMENT_FEE_INR * 100, // paise
      currency: "INR",
      receipt: parsed.data.leadId.slice(0, 40),
      notes: {
        leadId: parsed.data.leadId,
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        fullName: `${parsed.data.firstName} ${parsed.data.lastName}`.trim(),
        email: parsed.data.email,
        phone: parsed.data.phone,
        product: "PCOS Metabolic Assessment",
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error("[razorpay/create-order] error:", message);
    return NextResponse.json(
      { error: "create_order_failed", message },
      { status: 500 }
    );
  }
}
