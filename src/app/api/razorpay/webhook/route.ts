import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/razorpay";

export const runtime = "nodejs";

/**
 * Optional Razorpay server-to-server webhook endpoint.
 * Configure in Razorpay Dashboard → Webhooks with the URL:
 *   {NEXT_PUBLIC_SITE_URL}/api/razorpay/webhook
 * and the secret matching RAZORPAY_WEBHOOK_SECRET in env.
 *
 * We use it as a redundant safety net: the primary purchase webhook to
 * Pabbly fires from /api/razorpay/verify after the browser confirms success.
 * This webhook covers the rare case where the browser closes before /verify
 * runs but the payment did succeed on Razorpay's side.
 */
export async function POST(req: Request) {
  const signature = req.headers.get("x-razorpay-signature");
  const raw = await req.text();
  if (!signature) {
    return NextResponse.json({ error: "missing_signature" }, { status: 400 });
  }
  const valid = verifyWebhookSignature(raw, signature);
  if (!valid) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  // Acknowledge fast; deeper reconciliation is handled by /verify which fires
  // the Pabbly purchase webhook with the full lead payload (incl. UTMs).
  // If you want this endpoint to also fire Pabbly, you'll need to look up the
  // lead by orderId — that requires a DB which we deliberately keep out of v1.
  try {
    const event = JSON.parse(raw) as { event?: string };
    console.log("[razorpay/webhook] event:", event.event);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
