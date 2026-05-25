import { NextResponse } from "next/server";
import { z } from "zod";
import { getRazorpay } from "@/lib/razorpay";
import { getServerEnv, publicEnv } from "@/lib/env";
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
  /**
   * Meta browser cookies + attribution snapshot captured at form submit.
   * fbp comes from the `_fbp` cookie set by fbevents.js; landingUrl + referrer
   * are the first-touch values persisted by the inline UTM script. These get
   * stamped into Razorpay order notes so the webhook fallback path (PATH B)
   * can rebuild a CAPI payload with fbp + reconstructed fbc even though
   * server-to-server webhook requests carry no browser cookies.
   */
  fbp: z.string().max(120).optional(),
  landingUrl: z.string().max(240).optional(),
  referrer: z.string().max(240).optional(),
});

/**
 * Razorpay caps note values at 256 chars. Truncate defensively so any single
 * oversized field (e.g. a campaign URL with many params) can't reject the
 * whole order.
 */
function clip(value: string | undefined, max = 240): string {
  if (!value) return "";
  return value.length > max ? value.slice(0, max) : value;
}

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

    // 15-key notes (Razorpay limit). Order matters for readability only.
    //
    // Slot 1: funnel — Part 17 guardrail. The webhook checks this BEFORE any
    //   fire to filter out captured payments from sibling businesses sharing
    //   this Razorpay account (e.g. an unrelated WooCommerce store).
    //
    // Slots 2-7: identity rebuilt by PATH B into both Pabbly payload + CAPI
    //   user_data when the browser dies before /api/razorpay/verify runs.
    //
    // Slots 8-12: UTM attribution. utm_term is the lowest-yield, so it's the
    //   first to drop if we ever need another slot.
    //
    // Slot 13: fbclid — used in the webhook to RECONSTRUCT fbc as
    //   `fb.1.{order.created_at*1000}.{fbclid}` per Meta's documented format.
    //   We don't pack fbc directly because its cookie value can exceed 256 chars.
    //
    // Slot 14: landingUrl — both Pabbly attribution AND CAPI event_source_url
    //   in webhook-fallback fires (required for restricted-category accounts).
    //
    // Slot 15: fbp — packed verbatim because the cookie value is short (~28
    //   chars) and the webhook needs it unchanged for user_data.fbp.
    //
    // Dropped vs. previous notes layout: leadId (now in order.receipt),
    //   fullName (derived from firstName+lastName), product (single-product
    //   funnel), gclid (no Google Ads CAPI in this project; verify-payment
    //   path still ships gclid in Pabbly payload from the browser, only
    //   webhook-fallback rows lose it). See PURCHASE_TRACKING_ARCHITECTURE.md
    //   Part 17 + Part 18 for the slot-budget rationale.
    const utm = parsed.data.utm ?? {};
    const order = await rzp.orders.create({
      amount: env.ASSESSMENT_FEE_INR * 100, // paise
      currency: "INR",
      receipt: parsed.data.leadId.slice(0, 40),
      notes: {
        funnel: publicEnv.funnelSlug,
        firstName: clip(parsed.data.firstName, 60),
        lastName: clip(parsed.data.lastName, 60),
        email: clip(parsed.data.email),
        phone: clip(parsed.data.phone, 30),
        phoneCountry: clip(parsed.data.phoneCountry, 4),
        city: clip(parsed.data.city, 80),
        utmSource: clip(utm.utm_source),
        utmMedium: clip(utm.utm_medium),
        utmCampaign: clip(utm.utm_campaign),
        utmContent: clip(utm.utm_content),
        utmTerm: clip(utm.utm_term),
        fbclid: clip(utm.fbclid),
        landingUrl: clip(parsed.data.landingUrl ?? utm.landing_url),
        fbp: clip(parsed.data.fbp, 120),
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
