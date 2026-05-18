/**
 * Abandoned-cart tracker
 * ----------------------
 * When a user fills the checkout form but does not complete payment within
 * ABANDONED_CART_DELAY_MINUTES (default 240 = 4 hours), we POST their data
 * to PABBLY_ABANDONED_WEBHOOK_URL for nurture automation.
 *
 * Implementation: in-memory Map + setTimeout, with a hot-module-reload guard.
 * - Works on any long-running Node host (Render, Railway, fly.io, VPS, `next start`).
 * - Cleared when the user successfully pays.
 * - Survives dev HMR via globalThis.
 *
 * SERVERLESS DEPLOYMENT NOTE
 * --------------------------
 * On Vercel/Netlify Functions (cold-start, ephemeral), setTimeout does not
 * survive across invocations. For serverless production, replace this module
 * with a durable scheduler such as:
 *   - Upstash QStash (publish a delayed message that hits /api/abandoned/fire)
 *   - Vercel Cron + Vercel KV / Upstash Redis (poll every minute)
 *   - Inngest delayed step
 * The fire() function is the integration point — keep its signature.
 */

import { getServerEnv } from "./env";
import { sendAbandonedWebhook, type LeadPayload } from "./pabbly";

type PendingRecord = {
  payload: LeadPayload;
  timer: ReturnType<typeof setTimeout>;
  scheduledFor: number; // epoch ms
};

type Store = {
  pending: Map<string, PendingRecord>;
};

// HMR-safe singleton
const g = globalThis as unknown as { __akhila_abandoned__?: Store };
const store: Store =
  g.__akhila_abandoned__ ?? (g.__akhila_abandoned__ = { pending: new Map() });

async function fire(leadId: string): Promise<void> {
  const record = store.pending.get(leadId);
  if (!record) return; // user paid, or already fired
  store.pending.delete(leadId);
  console.log(`[abandoned] firing webhook for ${leadId}`);
  await sendAbandonedWebhook(record.payload);
}

/**
 * Schedule the abandoned-cart webhook for a lead. Idempotent — if a record
 * already exists for the leadId, we cancel the existing timer and re-arm
 * with the latest payload (so form updates carry through).
 */
export function scheduleAbandoned(payload: LeadPayload): {
  scheduledFor: string;
  delayMinutes: number;
} {
  const env = getServerEnv();
  const delayMs = env.ABANDONED_CART_DELAY_MINUTES * 60_000;

  // cancel previous timer if any
  const existing = store.pending.get(payload.leadId);
  if (existing) clearTimeout(existing.timer);

  const scheduledFor = Date.now() + delayMs;
  const timer = setTimeout(() => {
    fire(payload.leadId).catch((err) =>
      console.error("[abandoned] fire error:", err)
    );
  }, delayMs);
  // unref so this timer doesn't block process exit
  if (typeof timer.unref === "function") timer.unref();

  store.pending.set(payload.leadId, { payload, timer, scheduledFor });
  console.log(
    `[abandoned] scheduled ${payload.leadId} for ${new Date(scheduledFor).toISOString()} (in ${env.ABANDONED_CART_DELAY_MINUTES}m)`
  );

  return {
    scheduledFor: new Date(scheduledFor).toISOString(),
    delayMinutes: env.ABANDONED_CART_DELAY_MINUTES,
  };
}

/** Cancel a scheduled abandoned-cart timer (called when payment succeeds). */
export function cancelAbandoned(leadId: string): boolean {
  const record = store.pending.get(leadId);
  if (!record) return false;
  clearTimeout(record.timer);
  store.pending.delete(leadId);
  console.log(`[abandoned] cancelled ${leadId} (payment succeeded)`);
  return true;
}

/** Diagnostic: pending count (used by /api/health if needed) */
export function getPendingCount(): number {
  return store.pending.size;
}
