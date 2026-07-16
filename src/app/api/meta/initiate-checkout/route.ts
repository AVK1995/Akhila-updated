import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerEnv, publicEnv } from "@/lib/env";
import { shouldFireConversionEvents } from "@/lib/gating";
import { sendInitiateCheckoutEvent } from "@/lib/meta-events";

export const runtime = "nodejs";

const schema = z.object({
  customer: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(7),
    phoneCountry: z.string().min(2).max(4),
    city: z.string().optional(),
  }),
  /** URL the visitor clicked Pay on. Reduced to origin before Meta sees it. */
  eventSourceUrl: z.string().url().optional(),
});

/**
 * POST /api/meta/initiate-checkout
 *
 * Fires the custom Meta CAPI `initiate_checkout` event at the moment the
 * visitor has filled a VALID form, clicked Pay, and the Razorpay modal is about
 * to open. Called from the checkout submit handler AFTER /api/razorpay/
 * create-order succeeds and the bypass-coupon branch is ruled out, so QA bypass
 * orders never fire it.
 *
 * The full customer body is available here, so the event carries the same
 * hashed match signals as `sales` (EMQ 9+), with `external_id` derived
 * identically — one stable identity across every event we send to Meta.
 *
 * Gated exactly like the `sales` conversion — production hostname AND fee > ₹1.
 *
 * Never blocks payment: the caller ignores failures and continues to Razorpay.
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
  const { customer, eventSourceUrl } = parsed.data;

  const env = getServerEnv();
  const host = req.headers.get("host");

  // ── Conversion-event gate — production hostname AND fee > ₹1 ──────────
  if (!shouldFireConversionEvents(host, env.ASSESSMENT_FEE_INR)) {
    console.warn(
      `[ic] SKIPPED BY GATE — request host="${host}" vs ` +
        `prodHostname="${publicEnv.prodHostname}" (must match exactly), ` +
        `fee=${env.ASSESSMENT_FEE_INR} (must be > 1). Nothing fired.`
    );
    return NextResponse.json({ ok: true, skipped: "test_mode" });
  }

  const cookieHeader = req.headers.get("cookie");
  const readCookie = (name: string) => {
    const raw = cookieHeader
      ?.split(/;\s*/)
      .find((c) => c.startsWith(`${name}=`))
      ?.slice(name.length + 1);
    return raw ? decodeURIComponent(raw) : "";
  };
  const fbc = readCookie("_fbc");
  const fbp = readCookie("_fbp");
  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "";
  const clientUserAgent = req.headers.get("user-agent") ?? "";
  const resolvedEventSourceUrl =
    eventSourceUrl ?? `${publicEnv.siteUrl.replace(/\/+$/, "")}/checkout`;

  console.log(
    `[ic] firing — email=${customer.email} value=${env.ASSESSMENT_FEE_INR}`
  );

  const result = await sendInitiateCheckoutEvent({
    email: customer.email,
    phone: customer.phone,
    firstName: customer.firstName,
    lastName: customer.lastName,
    city: customer.city ?? "",
    countryCode: customer.phoneCountry,
    fbc: fbc || undefined,
    fbp: fbp || undefined,
    clientIp: clientIp || undefined,
    clientUserAgent: clientUserAgent || undefined,
    eventSourceUrl: resolvedEventSourceUrl,
    valueRupees: env.ASSESSMENT_FEE_INR,
    currency: "INR",
  });

  if (result.ok) {
    console.log(`[ic] DELIVERED events_received=${result.eventsReceived}`);
    return NextResponse.json({ ok: true, capi: "sent" });
  }
  console.error(`[ic] FAILED: ${result.error}`);
  return NextResponse.json({ ok: true, capi: "error" });
}
