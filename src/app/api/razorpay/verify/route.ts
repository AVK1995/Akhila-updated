import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { cancelAbandoned } from "@/lib/abandonedCart";

export const runtime = "nodejs";

const schema = z.object({
  razorpay_order_id: z.string().min(4),
  razorpay_payment_id: z.string().min(4),
  razorpay_signature: z.string().min(8),
  // Everything else the browser still sends (lead, eventSourceUrl) is accepted
  // but no longer used here — only leadId is read, to cancel the timer.
  lead: z.object({ leadId: z.string().optional() }).passthrough().optional(),
});

/**
 * UX-ONLY signature check. As of the Razorpay-webhook migration, this route no
 * longer fires Pabbly or Meta CAPI — /api/razorpay/webhook is the SOLE firer,
 * server-to-server, so conversions land even when the buyer never returns to
 * the tab (UPI app-switch). See RAZORPAY_WEBHOOK_MIGRATION.md.
 *
 * All this does now:
 *   - HMAC-verify the Razorpay Checkout signature (never trust the browser),
 *   - cancel the abandoned-cart timer,
 *   - return `{ verified }` so /book-a-call can show its "payment not verified"
 *     banner on the rare failure. It is fine if the buyer never calls this (the
 *     webhook already recorded the conversion).
 *
 * Deliberately fires NOTHING to Meta / Pabbly → zero double-firing with the
 * webhook.
 */
export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ verified: false, error: "invalid_json" }, { status: 400 });
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { verified: false, error: "invalid_payload" },
      { status: 400 }
    );
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, lead } = parsed.data;

  const valid = verifyPaymentSignature({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
  });

  if (!valid) {
    console.warn(`[verify] SIGNATURE INVALID payment_id=${razorpay_payment_id}`);
    return NextResponse.json({ verified: false, error: "signature_invalid" }, { status: 400 });
  }

  // Best-effort: stop the abandoned-cart timer (system is disabled anyway).
  if (lead?.leadId) cancelAbandoned(lead.leadId);

  console.log(`[verify] OK payment_id=${razorpay_payment_id} (UX-only; webhook is the firer)`);
  return NextResponse.json({ ok: true, verified: true });
}
