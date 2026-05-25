/**
 * Persistent dedup via Razorpay payment notes
 * --------------------------------------------
 * Layer 2 of the dedup architecture (Part 3 of PURCHASE_TRACKING_ARCHITECTURE.md).
 * Layer 1 is the in-process Map in lib/dedup.ts — it dies with each Lambda
 * instance, so it cannot tell PATH A (/api/razorpay/verify) and PATH B
 * (/api/razorpay/webhook) about each other's fires.
 *
 * This module writes TWO INDEPENDENT MARKERS onto the Razorpay payment's
 * notes object via `payments.edit()`:
 *
 *   pabblyFired = "<ms-timestamp>"   ← set after sendPurchaseWebhook returns ok
 *   capiFired   = "<ms-timestamp>"   ← set after sendMetaCapiEvent returns ok
 *
 * Both routes read these markers BEFORE firing. If one is already set, that
 * fire is skipped; only the unset one runs. This means:
 *   - If PATH A succeeds at both, PATH B sees both markers + full skip.
 *   - If PATH A fails only at Pabbly (e.g. Pabbly down 5s), capiFired is set
 *     but pabblyFired isn't → PATH B retries just Pabbly.
 *   - If the browser dies before PATH A even runs, no markers exist → PATH B
 *     fires both (and marks both on success).
 *
 * Visible in Razorpay Dashboard → Orders → click order → Payments tab →
 * click payment → Notes section. Useful for ops verification: any captured
 * payment without these markers means our code didn't fire for it (run the
 * backfill script).
 */

import { getRazorpay } from "./razorpay";

export type PaymentDedupState = {
  pabblyFired: boolean;
  capiFired: boolean;
  /**
   * The full existing notes blob on the payment, returned verbatim so the
   * caller can pass it back to `markFires()` without re-fetching. Razorpay
   * `payments.edit()` REPLACES the entire notes object — any keys not in
   * the edit payload are erased — so we must preserve existing keys.
   */
  existingNotes: Record<string, string>;
};

/**
 * Razorpay's TypeScript types for payment notes are loose (`unknown` / any).
 * Coerce to a flat string-keyed record defensively.
 */
function coerceNotes(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object") return {};
  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v === "string") result[k] = v;
    else if (v != null) result[k] = String(v);
  }
  return result;
}

/**
 * Fetch the current `pabblyFired` / `capiFired` markers from the payment's
 * notes. Returns `existingNotes` so the caller can pass it to `markFires`
 * without a second fetch. Network errors and non-existent payments both
 * return `{ pabblyFired: false, capiFired: false, existingNotes: {} }` —
 * meaning the caller will (re-)fire. Erring on the side of firing is the
 * right default since Meta will dedupe via event_id anyway.
 */
export async function getPaymentDedupState(
  paymentId: string
): Promise<PaymentDedupState> {
  try {
    const rzp = getRazorpay();
    const payment = (await rzp.payments.fetch(paymentId)) as unknown as {
      notes?: unknown;
    };
    const notes = coerceNotes(payment.notes);
    return {
      pabblyFired: Boolean(notes.pabblyFired),
      capiFired: Boolean(notes.capiFired),
      existingNotes: notes,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(
      `[payment-dedup] payments.fetch(${paymentId}) failed — assuming nothing fired yet:`,
      message
    );
    return { pabblyFired: false, capiFired: false, existingNotes: {} };
  }
}

/**
 * Stamp the markers for whichever fires succeeded onto the payment's notes.
 * Preserves all existing notes (Razorpay replaces the whole object on edit).
 * No-op when neither fire succeeded.
 */
export async function markFires(
  paymentId: string,
  existingNotes: Record<string, string>,
  result: { pabblySucceeded: boolean; capiSucceeded: boolean }
): Promise<void> {
  if (!result.pabblySucceeded && !result.capiSucceeded) return;

  const ts = String(Date.now());
  const merged: Record<string, string> = { ...existingNotes };
  if (result.pabblySucceeded && !merged.pabblyFired) merged.pabblyFired = ts;
  if (result.capiSucceeded && !merged.capiFired) merged.capiFired = ts;

  try {
    const rzp = getRazorpay();
    await rzp.payments.edit(paymentId, { notes: merged });
    console.log(
      `[payment-dedup] marked payment ${paymentId}:` +
        (result.pabblySucceeded ? ` pabblyFired=${ts}` : "") +
        (result.capiSucceeded ? ` capiFired=${ts}` : "")
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // Non-fatal: missing the marker means the OTHER path may re-fire,
    // which Meta dedupes via event_id and Pabbly tolerates (extra row).
    // We log loudly so ops can detect persistent Razorpay API issues.
    console.error(
      `[payment-dedup] payments.edit(${paymentId}) failed — markers not written:`,
      message
    );
  }
}
