import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { sendPurchaseWebhook } from "@/lib/pabbly";
import { cancelAbandoned } from "@/lib/abandonedCart";
import { getServerEnv } from "@/lib/env";

export const runtime = "nodejs";

const schema = z.object({
  razorpay_order_id: z.string().min(4),
  razorpay_payment_id: z.string().min(4),
  razorpay_signature: z.string().min(8),
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

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, lead } =
    parsed.data;

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

  // Fire the purchase webhook (best-effort — we don't fail the request if
  // Pabbly is down; we just log it)
  const webhook = await sendPurchaseWebhook({
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

  return NextResponse.json({
    ok: true,
    verified: true,
    webhook: webhook.ok ? "delivered" : "failed",
  });
}
