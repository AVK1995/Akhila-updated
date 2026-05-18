import { NextResponse } from "next/server";
import { z } from "zod";
import { getRazorpay } from "@/lib/razorpay";
import { getServerEnv } from "@/lib/env";

export const runtime = "nodejs";

const schema = z.object({
  leadId: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(7),
});

/**
 * Creates a Razorpay order for the assessment fee. The amount is read
 * server-side from env (NEXT_PUBLIC_ASSESSMENT_FEE_INR) so the client cannot
 * tamper with it.
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
