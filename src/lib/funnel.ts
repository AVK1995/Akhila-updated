/**
 * FUNNEL MODE — one env-driven switch
 * -----------------------------------
 * Controlled by `NEXT_PUBLIC_FREE_FUNNEL_MODE` in the env file:
 *   - `NEXT_PUBLIC_FREE_FUNNEL_MODE=true`  → FREE lead-capture flow
 *   - anything else / unset                → PAID ₹ Razorpay checkout flow
 *
 * The default is PAID: only the literal string "true" turns the free flow on,
 * so a missing or mistyped value can never accidentally ship the free funnel.
 *
 * FREE mode:
 *   - Every "Book Assessment" CTA opens the lead-capture popup instead of
 *     routing to the paid /checkout page.
 *   - The popup posts to /api/lead → fires the Pabbly LEAD webhook + a Meta
 *     CAPI custom "consult" event (no payment), then redirects to /book-a-call.
 *   - All ₹-price / payment / refund UI is HIDDEN (not deleted).
 *
 * PAID mode restores the /checkout page, the Razorpay/Pabbly purchase path,
 * and all price/refund copy — nothing is removed, only gated behind this flag.
 *
 * Next.js inlines `NEXT_PUBLIC_*` at build time, so changing the env value
 * needs a dev-server restart (or a rebuild in prod) to take effect.
 *
 * Isomorphic module (NO "use client"): the constant is read by both server
 * components (metadata, OG image, page composition) and client components
 * (CTAs, modal). `openLeadModal()` only touches `window` when called, so it is
 * safe to import server-side.
 */
export const FREE_FUNNEL_MODE =
  process.env.NEXT_PUBLIC_FREE_FUNNEL_MODE === "true";

/** Custom DOM event that opens the global lead-capture modal. */
export const LEAD_MODAL_EVENT = "akhila:open-lead";

/**
 * Open the global lead-capture modal from anywhere (any CTA, any page). The
 * single <LeadModalHost/> mounted in layout.tsx listens for this event. No-op
 * on the server.
 */
export function openLeadModal(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(LEAD_MODAL_EVENT));
}
