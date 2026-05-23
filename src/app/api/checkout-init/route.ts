import { NextResponse } from "next/server";
import { z } from "zod";
import { scheduleAbandoned } from "@/lib/abandonedCart";
import type { LeadPayload } from "@/lib/pabbly";
import { shouldFireFunnelTracking } from "@/lib/gating";

export const runtime = "nodejs";

const schema = z.object({
  leadId: z.string().min(8),
  firstName: z.string().min(1).max(60),
  lastName: z.string().min(1).max(60),
  email: z.string().email(),
  phone: z.string().min(7).max(20),
  phoneCountry: z.string().min(2).max(4),
  city: z.string().max(80).optional(),
  ageRange: z.string().max(20).optional(),
  primaryConcern: z.string().max(120).optional(),
  couponCode: z.string().max(40).optional(),
  utm: z.record(z.string(), z.string()).optional(),
  source: z.string().optional(),
});

/**
 * Called when the user fills the checkout form (before payment).
 * Schedules the abandoned-cart webhook for ABANDONED_CART_DELAY_MINUTES later.
 * If the user later pays, the timer is cancelled.
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

  const payload: LeadPayload = {
    ...parsed.data,
    fullName: `${parsed.data.firstName} ${parsed.data.lastName}`.trim(),
    source: parsed.data.source ?? "checkout",
  };

  // Conversion-event gate: only schedule the abandoned-cart Pabbly
  // webhook when the request hits the production hostname. Vercel
  // previews + localhost dev get a "scheduled: false" response and the
  // timer is never armed, keeping Pabbly clean of test traffic. (There
  // is no amount gate here — abandoned carts by definition have no
  // completed payment.)
  const fireTracking = shouldFireFunnelTracking(req.headers.get("host"));
  if (!fireTracking) {
    return NextResponse.json({
      ok: true,
      leadId: payload.leadId,
      scheduled: false,
      reason: "skipped_by_gate",
    });
  }

  const { scheduledFor, delayMinutes } = scheduleAbandoned(payload);

  return NextResponse.json({
    ok: true,
    leadId: payload.leadId,
    scheduled: true,
    abandonedScheduledFor: scheduledFor,
    delayMinutes,
  });
}
