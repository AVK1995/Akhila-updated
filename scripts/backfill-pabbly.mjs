#!/usr/bin/env node
/**
 * Backfill Pabbly for captured Razorpay payments in a date range.
 *
 * Layer 3 of the reliability architecture: if both PATH A (verify) and
 * PATH B (webhook) failed for a payment — e.g. Pabbly was down for 30
 * minutes during which the user's webhook also dropped — this script
 * replays the payment into Pabbly the next day.
 *
 * Usage:
 *   node scripts/backfill-pabbly.mjs <from-iso-date> <to-iso-date> [--send]
 *
 * Examples (dry-run by default):
 *   node scripts/backfill-pabbly.mjs 2026-05-25 2026-05-26
 *   node scripts/backfill-pabbly.mjs 2026-05-25 2026-05-26 --send
 *   node scripts/backfill-pabbly.mjs 2026-05-25 2026-05-26 --send --skip pay_X,pay_Y
 *
 * Behaviour:
 *   - Lists all CAPTURED payments in the range via Razorpay payments API
 *   - For each payment, fetches the order to read notes (funnel guardrail
 *     + identity + UTM + landing_url)
 *   - **Part 17 guardrail**: skips payments where notes.funnel !==
 *     "akhila-pcos" (cross-business payments on shared Razorpay account)
 *   - Skips payments where notes.pabblyFired is already set (don't double-fire)
 *   - Skips payments listed in --skip
 *   - Sends a Pabbly payload identical in shape to PATH A / PATH B
 *   - Without --send, prints what it WOULD send (dry-run)
 *   - With --send, fires + writes notes.pabblyFired marker on success
 *
 * Reads env from .env.local — same vars as the running app. No deps.
 */

import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const FUNNEL_SLUG = "akhila-pcos"; // must match publicEnv.funnelSlug in src/lib/env.ts

// ── env loader ──────────────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "..", ".env.local");
const env = {};
try {
  const raw = await readFile(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    if (line.trim().startsWith("#")) continue;
    let value = m[2];
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[m[1]] = value;
  }
} catch (err) {
  console.error(`Could not read ${envPath}:`, err.message);
  process.exit(1);
}

const RZP_KEY = env.RAZORPAY_KEY_ID;
const RZP_SECRET = env.RAZORPAY_KEY_SECRET;
const PABBLY_URL = env.PABBLY_PURCHASE_WEBHOOK_URL;
const ASSESSMENT_FEE_INR = Number(
  env.NEXT_PUBLIC_ASSESSMENT_FEE_INR ?? env.ASSESSMENT_FEE_INR ?? 97
);

if (!RZP_KEY || !RZP_SECRET) {
  console.error("Missing RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET in .env.local");
  process.exit(1);
}
if (!PABBLY_URL) {
  console.error("Missing PABBLY_PURCHASE_WEBHOOK_URL in .env.local");
  process.exit(1);
}

// ── args ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const SEND = args.includes("--send");
const skipIdx = args.indexOf("--skip");
const SKIP_SET = new Set(
  skipIdx >= 0 && args[skipIdx + 1]
    ? args[skipIdx + 1].split(",").map((s) => s.trim())
    : []
);
const dateArgs = args.filter(
  (a, i) => a !== "--send" && a !== "--skip" && args[i - 1] !== "--skip"
);
if (dateArgs.length !== 2) {
  console.error(
    "Usage: node scripts/backfill-pabbly.mjs <from-iso-date> <to-iso-date> [--send] [--skip pay_X,pay_Y]"
  );
  process.exit(1);
}
const fromDate = new Date(dateArgs[0]);
const toDate = new Date(dateArgs[1]);
if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
  console.error("Invalid date arg. Use ISO format e.g. 2026-05-26");
  process.exit(1);
}
const fromUnix = Math.floor(fromDate.getTime() / 1000);
const toUnix = Math.floor(toDate.getTime() / 1000) + 86400; // inclusive end-of-day

// ── razorpay HTTP helpers ───────────────────────────────────────────────
const authHeader =
  "Basic " + Buffer.from(`${RZP_KEY}:${RZP_SECRET}`).toString("base64");

async function rzpGet(path) {
  const res = await fetch(`https://api.razorpay.com${path}`, {
    headers: { Authorization: authHeader, "Content-Type": "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Razorpay ${path} → ${res.status} ${await res.text()}`);
  }
  return res.json();
}

async function rzpPatch(path, body) {
  const res = await fetch(`https://api.razorpay.com${path}`, {
    method: "PATCH",
    headers: { Authorization: authHeader, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Razorpay ${path} PATCH → ${res.status} ${await res.text()}`);
  }
  return res.json();
}

function istDateAndTime(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return ["", ""];
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(d);
  return [date, time];
}

// ── main ────────────────────────────────────────────────────────────────
console.log(
  `Backfill Pabbly — range ${dateArgs[0]} → ${dateArgs[1]}, ` +
    `mode=${SEND ? "SEND" : "dry-run"}, funnel=${FUNNEL_SLUG}`
);

const counters = {
  totalCaptured: 0,
  skippedNotOurs: 0,
  skippedAlreadyFired: 0,
  skippedExplicit: 0,
  ourFunnelCandidates: 0,
  sent: 0,
  failed: 0,
};

let skip = 0;
const PAGE = 100;

while (true) {
  const url = `/v1/payments?count=${PAGE}&skip=${skip}&from=${fromUnix}&to=${toUnix}`;
  let page;
  try {
    page = await rzpGet(url);
  } catch (err) {
    console.error("Page fetch failed:", err.message);
    break;
  }
  const items = page.items ?? [];
  if (items.length === 0) break;

  for (const p of items) {
    if (p.status !== "captured") continue;
    counters.totalCaptured++;
    const paymentId = p.id;

    if (SKIP_SET.has(paymentId)) {
      console.log(`SKIP-EXPLICIT ${paymentId}`);
      counters.skippedExplicit++;
      continue;
    }

    // Fetch order notes for funnel + identity + UTM
    let order;
    try {
      order = await rzpGet(`/v1/orders/${p.order_id}`);
    } catch (err) {
      console.error(`  ${paymentId} orders.fetch failed:`, err.message);
      counters.failed++;
      continue;
    }
    const notes = order.notes ?? {};

    if (notes.funnel !== FUNNEL_SLUG) {
      console.log(
        `SKIP-NOT-OURS ${paymentId}  notes.funnel=${notes.funnel ?? "<unset>"}  amount=${p.amount}`
      );
      counters.skippedNotOurs++;
      continue;
    }

    // Re-fetch payment notes to check pabblyFired (the payment object on
    // /payments listing may have stale notes if a recent edit happened).
    let payment;
    try {
      payment = await rzpGet(`/v1/payments/${paymentId}`);
    } catch (err) {
      console.error(`  ${paymentId} payments.fetch failed:`, err.message);
      counters.failed++;
      continue;
    }
    const paymentNotes = payment.notes ?? {};
    if (paymentNotes.pabblyFired) {
      console.log(
        `SKIP-ALREADY-FIRED ${paymentId}  pabblyFired=${paymentNotes.pabblyFired}`
      );
      counters.skippedAlreadyFired++;
      continue;
    }

    counters.ourFunnelCandidates++;

    const paidAt = new Date((p.created_at || Date.now() / 1000) * 1000).toISOString();
    const [paymentDate, paymentTime] = istDateAndTime(paidAt);
    const utmReconstructed = {};
    if (notes.utmSource) utmReconstructed.utm_source = notes.utmSource;
    if (notes.utmMedium) utmReconstructed.utm_medium = notes.utmMedium;
    if (notes.utmCampaign) utmReconstructed.utm_campaign = notes.utmCampaign;
    if (notes.utmContent) utmReconstructed.utm_content = notes.utmContent;
    if (notes.utmTerm) utmReconstructed.utm_term = notes.utmTerm;
    if (notes.fbclid) utmReconstructed.fbclid = notes.fbclid;
    if (notes.landingUrl) utmReconstructed.landing_url = notes.landingUrl;

    const payload = {
      leadId: order.receipt ?? order.id,
      firstName: notes.firstName ?? "",
      lastName: notes.lastName ?? "",
      fullName: `${notes.firstName ?? ""} ${notes.lastName ?? ""}`.trim(),
      email: notes.email ?? "",
      phone: notes.phone ?? "",
      phoneCountry: notes.phoneCountry ?? "",
      city: notes.city ?? "",
      utm: utmReconstructed,
      fbclid: notes.fbclid,
      landingUrl: notes.landingUrl,
      paymentId,
      orderId: order.id,
      amountInr: ASSESSMENT_FEE_INR,
      currency: "INR",
      paidAt,
      paymentDate,
      paymentTime,
      source: "backfill",
    };

    if (!SEND) {
      console.log(
        `[DRY-RUN] ${paymentId}  (${payload.email}): ${JSON.stringify(payload).slice(0, 200)}…`
      );
      continue;
    }

    try {
      const res = await fetch(PABBLY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Pabbly ${res.status} ${await res.text()}`);
      console.log(`OK ${paymentId}  (${payload.email})`);
      counters.sent++;
      // Stamp marker so a subsequent backfill / webhook won't re-fire.
      try {
        await rzpPatch(`/v1/payments/${paymentId}`, {
          notes: {
            ...paymentNotes,
            pabblyFired: String(Date.now()),
          },
        });
      } catch (err) {
        console.warn(
          `  ${paymentId} marker write failed (Pabbly was sent though):`,
          err.message
        );
      }
    } catch (err) {
      console.error(`FAIL ${paymentId}:`, err.message);
      counters.failed++;
    }
  }

  if (items.length < PAGE) break;
  skip += PAGE;
}

console.log("\n--- Summary ---");
console.log(`Total captured payments in range:  ${counters.totalCaptured}`);
console.log(`Our-funnel candidates:             ${counters.ourFunnelCandidates}`);
console.log(`Skipped (not our funnel):          ${counters.skippedNotOurs}`);
console.log(`Skipped (already pabblyFired):     ${counters.skippedAlreadyFired}`);
console.log(`Skipped (explicit --skip):         ${counters.skippedExplicit}`);
if (SEND) {
  console.log(`Sent OK:                           ${counters.sent}`);
  console.log(`Failed:                            ${counters.failed}`);
} else {
  console.log("Dry-run — re-run with --send to actually fire Pabbly.");
}
