import { NextResponse } from "next/server";
import { z } from "zod";
import { getRazorpay } from "@/lib/razorpay";
import { getServerEnv } from "@/lib/env";
import { cancelAbandoned } from "@/lib/abandonedCart";

export const runtime = "nodejs";

/**
 * Order-notes sentinel. The Razorpay account is SHARED across multiple
 * businesses, so the webhook receives `payment.captured` for every funnel on
 * the account. It only acts on orders tagged with THIS value — so the sentinel
 * must be funnel-specific (not the generic "client_funnel", which would collide
 * with sibling funnels on the same account).
 */
const FUNNEL_KIND = "akhila_funnel";

/** Razorpay caps each note value at 256 chars; defensively truncate so a long
 *  UA / fbclid / campaign name can never make `orders.create` throw. */
const cut = (v: unknown, n = 256) => String(v ?? "").slice(0, n);

const schema = z.object({
  leadId: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(7), // E.164, e.g. +919876543210
  phoneCountry: z.string().min(2).max(4).optional(), // ISO-2, e.g. IN
  city: z.string().optional(),
  ageRange: z.string().optional(),
  primaryConcern: z.string().optional(),
  couponCode: z.string().optional(),
  utm: z.record(z.string(), z.string()).optional(),
});

/**
 * Creates a Razorpay order for the assessment fee, OR — if the request carries
 * a coupon matching BYPASS_COUPON_CODE — skips Razorpay and returns
 * `{ bypass: true }` so the client routes straight to /book-a-call.
 *
 * WEBHOOK ARCHITECTURE: the browser context (customer form + `_fbc`/`_fbp`
 * cookies + IP + UA) is captured HERE — the last server step that still runs in
 * the buyer's request — and packed into the Razorpay order `notes`, tagged
 * `kind: FUNNEL_KIND`. Razorpay copies order notes onto the payment entity, so
 * /api/razorpay/webhook reads them back and fires Pabbly + Meta CAPI
 * server-to-server, at full EMQ, even if the buyer never returns to the tab
 * (UPI app-switch). See RAZORPAY_WEBHOOK_MIGRATION.md.
 *
 * The bypass branch fires nothing (QA shortcut; below the amount gate anyway).
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

  // ── Browser signals — captured HERE (still the buyer's request) ─────
  const d = parsed.data;
  const utm = d.utm ?? {};
  const cookieHeader = req.headers.get("cookie");
  const readCookie = (name: string) => {
    const raw = cookieHeader
      ?.split(/;\s*/)
      .find((c) => c.startsWith(`${name}=`))
      ?.slice(name.length + 1);
    return raw ? decodeURIComponent(raw) : "";
  };
  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "";

  // ── Notes packed for the webhook (≤15 keys, ≤256 chars each) ────────
  // JSON blobs keep the key count low; every value is truncated so a long
  // UA / campaign name can never make orders.create throw. The webhook
  // (src/app/api/razorpay/webhook/route.ts) reads these back.
  const notes: Record<string, string> = {
    kind: FUNNEL_KIND,
    cust: JSON.stringify({
      fn: cut(d.firstName, 40),
      ln: cut(d.lastName, 40),
      em: cut(d.email, 80),
      ph: cut(d.phone, 20),
      ct: cut(d.city, 40),
      co: cut(d.phoneCountry, 4),
    }),
    form: JSON.stringify({
      ar: cut(d.ageRange, 24),
      pc: cut(d.primaryConcern, 60),
      cp: cut(d.couponCode, 40),
    }),
    utm: JSON.stringify({
      s: cut(utm.utm_source, 40),
      m: cut(utm.utm_medium, 40),
      c: cut(utm.utm_campaign, 40),
      n: cut(utm.utm_content, 40),
      t: cut(utm.utm_term, 40),
    }),
    clid: cut(utm.fbclid),
    fbc: cut(readCookie("_fbc")),
    fbp: cut(readCookie("_fbp")),
    ip: cut(clientIp, 45),
    ua: cut(req.headers.get("user-agent")),
  };

  try {
    const rzp = getRazorpay();
    const order = await rzp.orders.create({
      amount: env.ASSESSMENT_FEE_INR * 100, // paise
      currency: "INR",
      receipt: d.leadId.slice(0, 40),
      notes,
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
