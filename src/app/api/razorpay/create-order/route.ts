import { NextResponse } from "next/server";
import { z } from "zod";
import { getRazorpay } from "@/lib/razorpay";
import { getServerEnv } from "@/lib/env";
import { cancelAbandoned } from "@/lib/abandonedCart";

export const runtime = "nodejs";

const schema = z.object({
  leadId: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(7),
  // Optional context. Not packed into notes anymore (verify-payment builds
  // the full Pabbly payload from its own request body + cookies); kept only
  // so the bypass branch can short-circuit and so a couple of debug notes
  // land in the Razorpay dashboard.
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
 * skips Razorpay entirely and returns `{ bypass: true, … }` so the client can
 * route straight to /book-a-call.
 *
 * No order notes carry tracking data and no webhook exists — verify-payment
 * is the single firing path and rebuilds everything it needs from its own
 * request. The bypass branch fires nothing (synthetic ₹0 order is always
 * below the amount gate); it's a pure UI shortcut for internal testers.
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
  // Internal-tester shortcut: skip Razorpay entirely and route to
  // /book-a-call. Fires NO Pabbly / CAPI (the synthetic ₹0 order is below
  // the amount gate, and verify-payment — the only firing path — is never
  // reached). Coupon compared case-insensitively after trimming.
  const configuredBypass = env.BYPASS_COUPON_CODE.trim().toLowerCase();
  const submittedCoupon = (parsed.data.couponCode ?? "").trim().toLowerCase();
  const isBypass =
    configuredBypass.length > 0 && submittedCoupon === configuredBypass;

  if (isBypass) {
    const ts = Date.now();
    const orderId = `BYPASS-order-${ts}-${parsed.data.leadId.slice(-8)}`;
    const paymentId = `BYPASS-pay-${ts}-${parsed.data.leadId.slice(-8)}`;
    cancelAbandoned(parsed.data.leadId);
    return NextResponse.json({
      bypass: true,
      orderId,
      paymentId,
      amount: 0,
      currency: "INR",
      keyId: env.RAZORPAY_KEY_ID,
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
      // Minimal debug notes for the Razorpay dashboard only. NOT read by any
      // code — verify-payment rebuilds the full Pabbly + CAPI payload from
      // its own request body + cookies.
      notes: {
        leadId: parsed.data.leadId,
        email: parsed.data.email,
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
