/**
 * In-process dedup (Layer 1)
 * ---------------------------
 * Cheap, 0-ms-overhead guard against same-Lambda-instance retries — e.g. a
 * mobile network blip causes the browser to re-fire /api/razorpay/verify
 * twice within the same warm function instance, or the user refreshes
 * /book-a-call which causes the keepalive fetch to be re-sent.
 *
 * IMPORTANT — this is INSTANCE-SCOPED. A second Lambda instance (cold
 * start, different region, route running in a separate function) has its
 * own empty Map and won't see anything this instance claimed. The cross-
 * route dedup story is owned by lib/payment-dedup.ts (persistent markers
 * on Razorpay payment notes). This layer just defends against the cheap,
 * common case where the same instance handles a duplicate within seconds.
 *
 * HMR-safe via a globalThis singleton (the abandoned-cart module uses
 * the same pattern).
 */

type Store = { claimed: Map<string, number> };

const TTL_MS = 5 * 60 * 1000; // entries older than 5min are ejected

const g = globalThis as unknown as { __akhila_dedup__?: Store };
const store: Store = g.__akhila_dedup__ ?? (g.__akhila_dedup__ = { claimed: new Map() });

/**
 * Try to claim `eventId` for this instance. Returns `true` if this is the
 * first claim (caller should proceed to fire), `false` if it was already
 * claimed recently (caller should skip — a previous fire is in-flight or
 * just completed within the same Lambda).
 *
 * The 5-minute TTL is plenty to cover an in-flight fetch's full duration
 * plus retry buffers, and short enough that a true new event with the
 * same id (essentially impossible — paymentIds are unique) wouldn't be
 * blocked beyond reason.
 */
export function claimEventId(eventId: string): boolean {
  if (!eventId) return true;

  // Lazy eviction so the Map doesn't grow unbounded on long-lived hosts.
  const cutoff = Date.now() - TTL_MS;
  for (const [k, t] of store.claimed) {
    if (t < cutoff) store.claimed.delete(k);
  }

  if (store.claimed.has(eventId)) {
    return false;
  }
  store.claimed.set(eventId, Date.now());
  return true;
}
