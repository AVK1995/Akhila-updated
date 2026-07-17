import { NextResponse } from "next/server";
import { verifyWebhookSignature, getRazorpay } from "@/lib/razorpay";
import { sendPurchaseWebhook, type PabblyPurchasePayload } from "@/lib/pabbly";
import { sendMetaCapiEvent, externalIdFromEmail } from "@/lib/meta";
import { getServerEnv, publicEnv } from "@/lib/env";
import { claimEventId, releaseEventId } from "@/lib/dedup";
import { originOnly } from "@/lib/utils";

export const runtime = "nodejs";

/** Must match the sentinel create-order writes onto the order notes. Our
 *  Razorpay account is shared across businesses; only orders tagged with this
 *  value are ours. */
const FUNNEL_KIND = "akhila_funnel";

type RzpNotes = Record<string, string | undefined> | null | undefined;
const parseJson = (s: string | undefined): Record<string, string> => {
  try {
    return s ? (JSON.parse(s) as Record<string, string>) : {};
  } catch {
    return {};
  }
};

/**
 * POST /api/razorpay/webhook — THE sole firer of Pabbly + Meta CAPI `sales`.
 *
 * Razorpay's servers POST `payment.captured` here directly, so the conversion
 * fires whether or not the buyer returns to the tab (fixes UPI app-switch
 * loss). `verify` is now UX-only. Browser signals were captured at create-order
 * and packed into the order notes; we read them back for full-EMQ (9.5+) firing.
 *
 * Pipeline (each step short-circuits): raw-body HMAC → payment.captured →
 * kind gate (ours?) → amount gate (>₹1) → unpack notes → same Pabbly payload +
 * Meta `sales` → confirmation JSON. Every log line carries the paymentId.
 */
export async function POST(req: Request) {
  // 1) Raw-body HMAC — MUST be the raw text, never re-serialized JSON.
  const raw = await req.text();
  const sig = req.headers.get("x-razorpay-signature");
  if (!verifyWebhookSignature(raw, sig)) {
    console.warn("[rzp-webhook] SIGNATURE INVALID — rejected");
    return NextResponse.json({ ok: false, error: "invalid_signature" }, { status: 400 });
  }

  let evt: {
    event?: string;
    payload?: { payment?: { entity?: Record<string, unknown> } };
  };
  try {
    evt = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  // 2) Event filter — ack & ignore anything but a captured payment.
  if (evt.event !== "payment.captured") {
    return NextResponse.json({ ok: true, ignored: true, reason: "event_not_captured", event: evt.event });
  }

  const payment = evt.payload?.payment?.entity;
  if (!payment) {
    return NextResponse.json({ ok: false, error: "no_payment_entity" }, { status: 400 });
  }
  const paymentId = String(payment.id ?? "");
  const orderId = String(payment.order_id ?? "");

  // 3) Kind gate — is this OUR order? Razorpay copies order notes onto the
  //    payment entity; if that copy is ever absent, fall back to fetching the
  //    order so we NEVER drop one of our own real payments.
  let notes = payment.notes as RzpNotes;
  if (notes?.kind !== FUNNEL_KIND && orderId) {
    try {
      const order = await getRazorpay().orders.fetch(orderId);
      notes = order.notes as RzpNotes;
    } catch (err) {
      console.error(`[rzp-webhook] paymentId=${paymentId} order fetch failed:`, err);
    }
  }
  if (notes?.kind !== FUNNEL_KIND) {
    return NextResponse.json({ ok: true, ignored: true, reason: "kind_mismatch", kind: notes?.kind ?? null });
  }
  console.log(`[rzp-webhook] paymentId=${paymentId} kind matched: ${FUNNEL_KIND}`);

  // 4) Amount gate — Razorpay sends paise. >₹1 excludes ₹1 test charges.
  const amountRupees = Math.round(Number(payment.amount ?? 0) / 100);
  if (amountRupees <= 1) {
    console.warn(`[rzp-webhook] paymentId=${paymentId} SKIPPED — amount=₹${amountRupees} (≤1, test)`);
    return NextResponse.json({ ok: true, skipped: "test_mode", amount: amountRupees });
  }

  // 5) Best-effort in-process dedup (guards a rapid duplicate delivery on the
  //    same warm instance). Not cross-instance — Meta's event_id (48h) is the
  //    real backstop; Pabbly may dup on a retry (downstream sheet upserts on
  //    payment_id). See RAZORPAY_WEBHOOK_MIGRATION.md §7.
  if (!claimEventId(paymentId)) {
    console.log(`[rzp-webhook] paymentId=${paymentId} already claimed in-process → skip`);
    return NextResponse.json({ ok: true, deduped: true, paymentId });
  }

  // 6) Unpack notes + payment entity → build the SAME payloads verify built.
  const cust = parseJson(notes.cust);
  const form = parseJson(notes.form);
  const utm = parseJson(notes.utm);

  const email = cust.em || String(payment.email ?? "");
  const phone = cust.ph || String(payment.contact ?? "");
  const nowIso = new Date().toISOString();
  const eventSourceOrigin = originOnly(publicEnv.siteUrl);
  const fbc = notes.fbc || "";
  const fbp = notes.fbp || "";
  const clientIp = notes.ip || "";
  const clientUserAgent = notes.ua || "";

  console.log(
    `[rzp-webhook] paymentId=${paymentId} value=₹${amountRupees} email=${email} → firing { pabbly, capi }`
  );

  // Same 23-field snake_case Pabbly payload as the old verify path.
  const pabblyPayload: PabblyPurchasePayload = {
    lead_id: paymentId,
    created_at: nowIso,
    first_name: cust.fn ?? "",
    last_name: cust.ln ?? "",
    email,
    phone,
    city: cust.ct ?? "",
    country_code: cust.co ?? "",
    fbc,
    fbp,
    client_ip_address: clientIp,
    client_user_agent: clientUserAgent,
    external_id: externalIdFromEmail(email),
    event_source_url: eventSourceOrigin,
    amount: String(amountRupees),
    is_test: "false",
    purchase_event_id: paymentId,
    utm_source: utm.s ?? "",
    utm_medium: utm.m ?? "",
    utm_campaign: utm.c ?? "",
    utm_content: utm.n ?? "",
    utm_term: utm.t ?? "",
    fbclid: notes.clid || "",
    full_name: `${cust.fn ?? ""} ${cust.ln ?? ""}`.trim(),
    order_id: orderId,
    currency: String(payment.currency ?? "INR"),
    payment_timestamp: nowIso,
    age_range: form.ar ?? "",
    primary_concern: form.pc ?? "",
    coupon_code: form.cp ?? "",
    consent: "true", // form requires the consent box to reach payment
  };

  const [pabblyResult, capiResult] = await Promise.allSettled([
    sendPurchaseWebhook(pabblyPayload),
    sendMetaCapiEvent({
      paymentId,
      orderId,
      email,
      phone,
      firstName: cust.fn ?? "",
      lastName: cust.ln ?? "",
      city: cust.ct ?? "",
      countryCode: cust.co ?? "",
      eventSourceUrl: eventSourceOrigin,
      fbc: fbc || undefined,
      fbp: fbp || undefined,
      clientIp: clientIp || undefined,
      clientUserAgent: clientUserAgent || undefined,
      valueRupees: amountRupees,
      currency: String(payment.currency ?? "INR"),
    }),
  ]);

  const pabblyOk = pabblyResult.status === "fulfilled" && pabblyResult.value.ok === true;
  const capiOk = capiResult.status === "fulfilled" && capiResult.value.ok === true;

  console.log(
    `[rzp-webhook] paymentId=${paymentId} RESULT pabbly=${pabblyOk ? "sent" : "error"} capi=${capiOk ? "sent" : "error"}`
  );
  if (!pabblyOk) {
    console.error(
      `[rzp-webhook] paymentId=${paymentId} PABBLY FAILED:`,
      pabblyResult.status === "fulfilled" ? pabblyResult.value.error : pabblyResult.reason
    );
  }
  if (!capiOk) {
    console.error(
      `[rzp-webhook] paymentId=${paymentId} CAPI FAILED:`,
      capiResult.status === "fulfilled" ? capiResult.value : capiResult.reason
    );
  }

  // Retry ONLY when Pabbly (the CRM row) failed — return 5xx so Razorpay
  // retries. A Meta-only failure does NOT trigger a retry (avoids duplicating
  // the Pabbly row for a transient CAPI hiccup; Meta dedups by event_id on any
  // later re-fire). The in-process claim is released so the retry can re-fire.
  if (!pabblyOk) {
    releaseEventId(paymentId); // let Razorpay's retry re-fire, not be deduped
    return NextResponse.json(
      { ok: false, paymentId, kind: FUNNEL_KIND, pabbly: "error", capi: capiOk ? "sent" : "error" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    paymentId,
    kind: FUNNEL_KIND,
    pabbly: "sent",
    capi: capiOk ? "sent" : "error",
  });
}
