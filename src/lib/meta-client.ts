/**
 * Meta CAPI — client-side triggers
 * ---------------------------------
 * The browser's ONLY job for `add_to_cart` / `initiate_checkout` is to tell our
 * server "this happened". All hashing and the Graph POST happen server-side in
 * /api/meta/* (see src/lib/meta-events.ts). No `fbq('track', ...)` is added —
 * `PageView` remains the only browser-side Meta event.
 *
 * DEDUP — two layers (neither is sufficient alone):
 *   1. The localStorage flags below → one event per browser lifetime.
 *   2. Meta's own `event_id` dedup (48h) as a server-side safety net.
 * Together: "one per browser + Meta's 48h net". NOT "exactly one forever" —
 * cleared storage, incognito, or a second device will re-fire. That's
 * unavoidable without a database.
 *
 * Neither call may block the user: a failed beacon must not stop navigation,
 * and a failed InitiateCheckout must not stop the payment.
 */

/** Matches the funnel's existing storage convention (akhila_utm_v1, etc.). */
const ATC_FLAG = "akhila_atc_fired";
const IC_FLAG = "akhila_ic_fired";

const ATC_URL = "/api/meta/add-to-cart";
const IC_URL = "/api/meta/initiate-checkout";

/** SHA-256 hex via Web Crypto. Used only to key the IC dedup flag. */
async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Fire the Meta `add_to_cart` CAPI event once per browser, on a landing CTA
 * click. Uses sendBeacon so the request survives the navigation that follows;
 * falls back to keepalive fetch. The flag is set OPTIMISTICALLY (before the
 * beacon) so a tab killed mid-navigation still can't double-fire.
 */
export function fireAddToCartOnce(): void {
  if (typeof window === "undefined") return;

  try {
    if (window.localStorage.getItem(ATC_FLAG) === "1") return;
    window.localStorage.setItem(ATC_FLAG, "1");
  } catch {
    /* storage blocked — dedup best-effort, still fire */
  }

  const body = JSON.stringify({ eventSourceUrl: window.location.href });

  try {
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon(ATC_URL, blob)) return;
    }
  } catch {
    /* fall through to fetch */
  }

  try {
    void fetch(ATC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* never block the click */
  }
}

export type IcCustomer = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  phoneCountry: string;
  city?: string;
};

/**
 * Fire the Meta `initiate_checkout` CAPI event once per unique email per
 * browser, immediately before the Razorpay modal opens.
 *
 * Keyed on sha256(email) rather than a bare flag: a genuinely different email
 * is a different real intent and SHOULD fire again. The flag is only stamped on
 * a successful response, so a transient failure can retry on the next attempt.
 *
 * Awaited by the caller but MUST NOT block payment — every failure path
 * resolves quietly.
 */
export async function fireInitiateCheckoutOnce(
  customer: IcCustomer
): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    const emailHash = await sha256Hex(customer.email.trim().toLowerCase());

    try {
      if (window.localStorage.getItem(IC_FLAG) === emailHash) return;
    } catch {
      /* storage blocked — dedup best-effort, still fire */
    }

    const res = await fetch(IC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer,
        eventSourceUrl: window.location.href,
      }),
    });

    if (res.ok) {
      try {
        window.localStorage.setItem(IC_FLAG, emailHash);
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* payment must proceed regardless */
  }
}
