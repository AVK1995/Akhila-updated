import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerEnv, publicEnv } from "@/lib/env";
import { shouldFireConversionEvents } from "@/lib/gating";
import { sendAddToCartEvent } from "@/lib/meta-events";

export const runtime = "nodejs";

const schema = z.object({
  /** URL the visitor clicked the CTA on. Reduced to origin before Meta sees it. */
  eventSourceUrl: z.string().url().optional(),
});

/**
 * POST /api/meta/add-to-cart
 *
 * Fires the custom Meta CAPI `add_to_cart` event when a visitor clicks any
 * landing CTA that advances toward /checkout. Triggered by the browser via
 * navigator.sendBeacon (see src/lib/meta-client.ts) — the client is a trigger
 * only; all hashing + the Graph POST happen here.
 *
 * No PII is available at CTA click time, so the event carries only the raw
 * non-PII signals read from THIS request: `_fbc`/`_fbp` cookies (same-origin,
 * so they attach automatically) plus client IP + user-agent headers.
 *
 * Gated exactly like the `sales` conversion — production hostname AND fee > ₹1
 * — so previews, localhost and ₹1 test configs fire nothing.
 *
 * Never surfaces an error: a failed beacon must not affect the visitor's click.
 */
export async function POST(req: Request) {
  let json: unknown = {};
  try {
    json = await req.json();
  } catch {
    json = {};
  }
  const parsed = schema.safeParse(json ?? {});
  const eventSourceUrl =
    (parsed.success ? parsed.data.eventSourceUrl : undefined) ??
    `${publicEnv.siteUrl.replace(/\/+$/, "")}/`;

  const env = getServerEnv();
  const host = req.headers.get("host");

  // ── Conversion-event gate — production hostname AND fee > ₹1 ──────────
  if (!shouldFireConversionEvents(host, env.ASSESSMENT_FEE_INR)) {
    console.warn(
      `[atc] SKIPPED BY GATE — request host="${host}" vs ` +
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

  console.log(
    `[atc] firing — fbp=${fbp ? "yes" : "no"} fbc=${fbc ? "yes" : "no"} ` +
      `value=${env.ASSESSMENT_FEE_INR}`
  );

  const result = await sendAddToCartEvent({
    fbc: fbc || undefined,
    fbp: fbp || undefined,
    clientIp: clientIp || undefined,
    clientUserAgent: clientUserAgent || undefined,
    eventSourceUrl,
    valueRupees: env.ASSESSMENT_FEE_INR,
    currency: "INR",
  });

  if (result.ok) {
    console.log(`[atc] DELIVERED events_received=${result.eventsReceived}`);
    return NextResponse.json({ ok: true, capi: "sent" });
  }
  console.error(`[atc] FAILED: ${result.error}`);
  return NextResponse.json({ ok: true, capi: "error" });
}
