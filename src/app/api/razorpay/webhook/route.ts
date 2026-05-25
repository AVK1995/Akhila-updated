import { NextResponse } from "next/server";
import { getRazorpay, verifyWebhookSignature } from "@/lib/razorpay";
import { getServerEnv, publicEnv } from "@/lib/env";
import { sendPurchaseWebhook, istDateAndTime } from "@/lib/pabbly";
import { sendMetaCapiEvent } from "@/lib/meta";
import { shouldFireConversionEvents } from "@/lib/gating";
import { claimEventId } from "@/lib/dedup";
import { getPaymentDedupState, markFires } from "@/lib/payment-dedup";

export const runtime = "nodejs";

/**
 * /api/razorpay/webhook — PATH B (fallback)
 * ------------------------------------------
 * Razorpay server-to-server webhook configured in Razorpay Dashboard →
 * Webhooks. Fires 5-30s after every captured payment ON THIS RAZORPAY
 * ACCOUNT, including payments from sibling businesses sharing the same
 * account (e.g. an unrelated WooCommerce store). Without filtering,
 * those would pollute our Pabbly + CAPI pipelines.
 *
 * Flow:
 *   1. HMAC-verify x-razorpay-signature (RAZORPAY_WEBHOOK_SECRET).
 *   2. Bail unless event === "payment.captured".
 *   3. Layer 1 dedup via claimEventId.
 *   4. Parallel: orders.fetch(orderId) + getPaymentDedupState(paymentId).
 *   5. **Part 17 guardrail**: bail if order.notes.funnel !== funnelSlug.
 *   6. Production-host + amount-gate.
 *   7. Build payload from order notes: identity, UTM, landingUrl,
 *      reconstructed `fbc = fb.1.{order.created_at*1000}.{notes.fbclid}`,
 *      fbp verbatim from notes.fbp.
 *   8. Promise.allSettled fire only the markers that aren't already set.
 *   9. markFires for whichever succeeded. Always respond 200.
 */
type RazorpayWebhookEvent = {
  event?: string;
  payload?: {
    payment?: { entity?: { id?: string; order_id?: string } };
    order?: { entity?: { id?: string; created_at?: number; notes?: unknown } };
  };
};

function coerceNotes(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v === "string") out[k] = v;
    else if (v != null) out[k] = String(v);
  }
  return out;
}

/**
 * Razorpay's orders.fetch can transiently fail. Try once, then once
 * more after a short delay — that's plenty for our 200 SLA.
 */
async function fetchOrderNotesWithRetry(
  orderId: string
): Promise<{ notes: Record<string, string>; createdAt: number } | null> {
  const rzp = getRazorpay();
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const order = (await rzp.orders.fetch(orderId)) as unknown as {
        notes?: unknown;
        created_at?: number;
      };
      return {
        notes: coerceNotes(order.notes),
        createdAt: typeof order.created_at === "number" ? order.created_at : 0,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (attempt === 0) {
        console.warn(
          `[webhook] orders.fetch(${orderId}) attempt ${attempt + 1} failed, retrying:`,
          message
        );
        await new Promise((r) => setTimeout(r, 250));
        continue;
      }
      console.error(
        `[webhook] orders.fetch(${orderId}) failed twice:`,
        message
      );
      return null;
    }
  }
  return null;
}

export async function POST(req: Request) {
  // 1. HMAC verify -------------------------------------------------------
  const signature = req.headers.get("x-razorpay-signature");
  const raw = await req.text();
  if (!signature) {
    return NextResponse.json({ error: "missing_signature" }, { status: 400 });
  }
  if (!verifyWebhookSignature(raw, signature)) {
    console.warn("[webhook] invalid signature");
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  // 2. Parse + filter event type ----------------------------------------
  let event: RazorpayWebhookEvent;
  try {
    event = JSON.parse(raw) as RazorpayWebhookEvent;
  } catch {
    return NextResponse.json({ ok: true });
  }
  if (event.event !== "payment.captured") {
    // payment.authorized, refund events, etc. — silently 200.
    return NextResponse.json({ ok: true, ignored: "event_type" });
  }

  const paymentId = event.payload?.payment?.entity?.id;
  const orderId =
    event.payload?.payment?.entity?.order_id ??
    event.payload?.order?.entity?.id;
  if (!paymentId || !orderId) {
    console.warn("[webhook] payment.captured missing paymentId/orderId");
    return NextResponse.json({ ok: true, ignored: "missing_ids" });
  }

  console.log(
    `[webhook] received payment.captured for paymentId=${paymentId} orderId=${orderId}`
  );

  // 3. Layer 1 dedup ----------------------------------------------------
  if (!claimEventId(paymentId)) {
    console.log(
      `[webhook] event_id=${paymentId} already claimed in-process → skip`
    );
    return NextResponse.json({ ok: true, ignored: "already_claimed" });
  }

  // 4. Parallel: fetch order notes + dedup state ------------------------
  const [orderInfo, dedupState] = await Promise.all([
    fetchOrderNotesWithRetry(orderId),
    getPaymentDedupState(paymentId),
  ]);

  if (!orderInfo) {
    // Can't safely fire without notes — bail. Backfill script can
    // catch this payment by date range later.
    return NextResponse.json({ ok: true, ignored: "order_fetch_failed" });
  }
  const notes = orderInfo.notes;

  // 5. Part 17 guardrail: drop unrelated-business payments --------------
  // Razorpay webhook subscriptions are account-level, so this URL receives
  // payment.captured for every business on the account. We only process
  // payments stamped with our funnel slug.
  if (notes.funnel !== publicEnv.funnelSlug) {
    console.log(
      `[webhook] ignoring payment ${paymentId} — order ${orderId} is NOT from our funnel ` +
        `(notes.funnel=${notes.funnel ?? "<unset>"}, expected=${publicEnv.funnelSlug})`
    );
    return NextResponse.json({ ok: true, ignored: "not_our_funnel" });
  }

  // 6. Gate -------------------------------------------------------------
  const env = getServerEnv();
  const fireConversions = shouldFireConversionEvents(
    req.headers.get("host"),
    env.ASSESSMENT_FEE_INR
  );
  if (!fireConversions) {
    return NextResponse.json({ ok: true, ignored: "gated" });
  }

  // 7. Skip entirely if both markers already set ------------------------
  if (dedupState.pabblyFired && dedupState.capiFired) {
    console.log(
      `[webhook] payment ${paymentId} already has BOTH fires marked → full skip`
    );
    return NextResponse.json({ ok: true, ignored: "all_fired" });
  }
  const willFirePabbly = !dedupState.pabblyFired;
  const willFireCapi = !dedupState.capiFired;

  console.log(
    `[webhook] event_id=${paymentId} email=${notes.email ?? "<unset>"} → ` +
      `firing { pabbly:${willFirePabbly}, capi:${willFireCapi} }`
  );

  // 8. Reconstruct identity + Meta cookies from notes -------------------
  // fbp: raw cookie value packed verbatim into notes by create-order.
  // fbc: NOT packed (could exceed 256 chars). Reconstruct per Meta's
  //   documented format: `fb.1.{creation_timestamp_ms}.{fbclid}`. We use
  //   order.created_at*1000 as the ms timestamp — this is the closest
  //   we have to "when the click happened" without an extra notes slot.
  const fbpFromNotes = notes.fbp || undefined;
  const fbcReconstructed =
    notes.fbclid && orderInfo.createdAt
      ? `fb.1.${orderInfo.createdAt * 1000}.${notes.fbclid}`
      : undefined;

  // Rebuild a `utm` blob that matches PATH A's nested shape so the
  // Pabbly payload looks identical regardless of which path fired.
  const utmReconstructed: Record<string, string> = {};
  if (notes.utmSource) utmReconstructed.utm_source = notes.utmSource;
  if (notes.utmMedium) utmReconstructed.utm_medium = notes.utmMedium;
  if (notes.utmCampaign) utmReconstructed.utm_campaign = notes.utmCampaign;
  if (notes.utmContent) utmReconstructed.utm_content = notes.utmContent;
  if (notes.utmTerm) utmReconstructed.utm_term = notes.utmTerm;
  if (notes.fbclid) utmReconstructed.fbclid = notes.fbclid;
  if (notes.landingUrl) utmReconstructed.landing_url = notes.landingUrl;

  const paidAt = new Date().toISOString();
  const [paymentDate, paymentTime] = istDateAndTime(paidAt);

  const eventSourceUrl =
    notes.landingUrl || `${publicEnv.siteUrl.replace(/\/+$/, "")}/checkout`;

  // 9. Parallel fire ----------------------------------------------------
  const [pabblyResult, capiResult] = await Promise.allSettled([
    willFirePabbly
      ? sendPurchaseWebhook({
          leadId: orderId, // best-effort; Razorpay order.receipt held leadId originally
          firstName: notes.firstName ?? "",
          lastName: notes.lastName ?? "",
          fullName: `${notes.firstName ?? ""} ${notes.lastName ?? ""}`.trim(),
          email: notes.email ?? "",
          phone: notes.phone ?? "",
          phoneCountry: notes.phoneCountry ?? "",
          city: notes.city,
          utm: utmReconstructed,
          fbclid: notes.fbclid,
          landingUrl: notes.landingUrl,
          paymentId,
          orderId,
          amountInr: env.ASSESSMENT_FEE_INR,
          currency: "INR",
          paidAt,
          paymentDate,
          paymentTime,
          source: "razorpay_webhook",
        })
      : Promise.resolve({ ok: true, error: undefined }),
    willFireCapi
      ? sendMetaCapiEvent({
          paymentId,
          orderId,
          email: notes.email ?? "",
          phone: notes.phone ?? "",
          firstName: notes.firstName ?? "",
          lastName: notes.lastName ?? "",
          city: notes.city ?? "",
          countryCode: notes.phoneCountry ?? "",
          eventSourceUrl,
          fbc: fbcReconstructed,
          fbp: fbpFromNotes,
          // Webhook is server-to-server — there is no browser IP or UA.
          // Meta accepts both as optional; matching quality degrades
          // gracefully without them.
          clientIp: undefined,
          clientUserAgent: undefined,
          valueRupees: env.ASSESSMENT_FEE_INR,
          currency: "INR",
        })
      : Promise.resolve({ ok: true as const, eventsReceived: 0 }),
  ]);

  const pabblySucceeded =
    willFirePabbly &&
    pabblyResult.status === "fulfilled" &&
    pabblyResult.value.ok === true;
  const capiSucceeded =
    willFireCapi &&
    capiResult.status === "fulfilled" &&
    capiResult.value.ok === true;

  // 10. Mark fires ------------------------------------------------------
  await markFires(paymentId, dedupState.existingNotes, {
    pabblySucceeded,
    capiSucceeded,
  });

  console.log(
    `[webhook] complete for event_id=${paymentId} → ` +
      `pabblySucceeded=${pabblySucceeded} capiSucceeded=${capiSucceeded}`
  );

  return NextResponse.json({
    ok: true,
    fired: { pabbly: willFirePabbly, capi: willFireCapi },
    success: { pabbly: pabblySucceeded, capi: capiSucceeded },
  });
}
