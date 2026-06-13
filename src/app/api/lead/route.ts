import { NextResponse } from "next/server";
import { z } from "zod";
import { sendLeadWebhook, type PabblyLeadPayload } from "@/lib/pabbly";
import { getServerEnv, publicEnv } from "@/lib/env";
import { sendMetaLeadEvent, externalIdFromEmail } from "@/lib/meta";
import { shouldFireFunnelTracking } from "@/lib/gating";
import { claimEventId } from "@/lib/dedup";
import { originOnly } from "@/lib/utils";

export const runtime = "nodejs";

const schema = z.object({
  leadId: z.string().min(8),
  createdAt: z.string().optional(),
  name: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().optional().default(""),
  email: z.string().email(),
  phone: z.string().min(4),
  phoneCountry: z.string().min(2).max(4).optional().default("IN"),
  location: z.string().min(1),
  challenge: z.string().min(1),
  willingToInvest: z.string().optional().default(""),
  utm: z.record(z.string(), z.string()).optional(),
  eventSourceUrl: z.string().url().optional(),
});

/**
 * FREE_FUNNEL_MODE firing path.
 *
 * Validates a lead-capture submission, then fires:
 *   - the Pabbly LEAD webhook (snake_case lead row, reuses the purchase URL)
 *   - a Meta CAPI custom `Lead` event (event_id = leadId)
 *
 * No payment, no signature. Called by the browser via a keepalive fetch right
 * before it redirects to /book-a-call. Gated on the production hostname only
 * (no amount) so localhost / previews fire nothing. Both downstream calls are
 * wrapped so neither failure can block the response.
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

  const lead = parsed.data;

  // ── In-process dedup — guards a duplicate keepalive POST on a warm Lambda ──
  if (!claimEventId(lead.leadId)) {
    return NextResponse.json({
      ok: true,
      fired: false,
      webhook: "skipped",
      metaCapi: { delivered: false, error: "skipped_by_in_process_dedup" },
    });
  }

  // ── Funnel-tracking gate — production hostname only (no amount) ──
  if (!shouldFireFunnelTracking(req.headers.get("host"))) {
    return NextResponse.json({
      ok: true,
      fired: false,
      webhook: "skipped",
      metaCapi: { delivered: false, error: "skipped_by_gate" },
    });
  }

  // ── Gather the real browser context (cookies + IP + UA) for full EMQ ──
  const nowIso = new Date().toISOString();
  const utmMap = lead.utm ?? {};

  const fbcCookie = req.headers
    .get("cookie")
    ?.split(/;\s*/)
    .find((c) => c.startsWith("_fbc="))
    ?.slice(5);
  const fbpCookie = req.headers
    .get("cookie")
    ?.split(/;\s*/)
    .find((c) => c.startsWith("_fbp="))
    ?.slice(5);
  const fbc = fbcCookie ? decodeURIComponent(fbcCookie) : "";
  const fbp = fbpCookie ? decodeURIComponent(fbpCookie) : "";
  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "";
  const clientUserAgent = req.headers.get("user-agent") ?? "";
  const resolvedEventSourceUrl =
    lead.eventSourceUrl ?? `${publicEnv.siteUrl.replace(/\/+$/, "")}/`;
  const eventSourceOrigin = originOnly(resolvedEventSourceUrl);
  const externalId = externalIdFromEmail(lead.email);

  console.log(
    `[lead] lead_id=${lead.leadId} email=${lead.email} → firing { pabbly:true, capi:true }`
  );

  const pabblyPayload: PabblyLeadPayload = {
    event: "lead",
    lead_id: lead.leadId,
    created_at: lead.createdAt ?? nowIso,
    first_name: lead.firstName,
    last_name: lead.lastName ?? "",
    full_name: lead.name,
    email: lead.email,
    phone: lead.phone,
    location: lead.location,
    greatest_challenge: lead.challenge,
    willing_to_invest: lead.willingToInvest ?? "",
    fbc,
    fbp,
    client_ip_address: clientIp,
    client_user_agent: clientUserAgent,
    external_id: externalId,
    event_source_url: eventSourceOrigin,
    utm_source: utmMap.utm_source ?? "",
    utm_medium: utmMap.utm_medium ?? "",
    utm_campaign: utmMap.utm_campaign ?? "",
    utm_content: utmMap.utm_content ?? "",
    utm_term: utmMap.utm_term ?? "",
    fbclid: utmMap.fbclid ?? "",
    lead_event_id: lead.leadId,
    is_test: "false",
  };

  const [pabblyResult, capiResult] = await Promise.allSettled([
    sendLeadWebhook(pabblyPayload),
    sendMetaLeadEvent({
      eventId: lead.leadId,
      email: lead.email,
      phone: lead.phone,
      firstName: lead.firstName,
      lastName: lead.lastName ?? "",
      city: lead.location,
      countryCode: lead.phoneCountry ?? "IN",
      eventSourceUrl: eventSourceOrigin,
      fbc: fbc || undefined,
      fbp: fbp || undefined,
      clientIp: clientIp || undefined,
      clientUserAgent: clientUserAgent || undefined,
    }),
  ]);

  const pabblySucceeded =
    pabblyResult.status === "fulfilled" && pabblyResult.value.ok === true;
  const capiSucceeded =
    capiResult.status === "fulfilled" && capiResult.value.ok === true;

  return NextResponse.json({
    ok: true,
    fired: true,
    webhook: pabblySucceeded ? "delivered" : "failed",
    metaCapi: capiSucceeded
      ? {
          delivered: true,
          eventsReceived:
            capiResult.status === "fulfilled" &&
            "eventsReceived" in capiResult.value
              ? capiResult.value.eventsReceived
              : 0,
        }
      : { delivered: false, error: "fire_failed" },
  });
}
