import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Returns the caller's IP (best-effort, from proxy headers). Used by the
 * urgency countdown to reset its window when the visitor's IP changes.
 */
export async function GET(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "";
  return NextResponse.json({ ip }, { headers: { "Cache-Control": "no-store" } });
}
