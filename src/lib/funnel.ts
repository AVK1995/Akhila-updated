/**
 * FUNNEL MODE — single reversible switch
 * --------------------------------------
 * `FREE_FUNNEL_MODE = true` runs the funnel as a FREE lead-capture flow:
 *   - Every "Book Assessment" CTA opens the lead-capture popup instead of
 *     routing to the paid /checkout page.
 *   - The popup posts to /api/lead → fires the Pabbly LEAD webhook + a Meta
 *     CAPI custom "Lead" event (no payment), then redirects to /book-a-call.
 *   - All ₹-price / payment / refund UI is HIDDEN (not deleted) and free-flow
 *     copy is shown in its place.
 *
 * Flip to `false` to instantly restore the paid ₹97 Razorpay checkout flow:
 * the /checkout page, Razorpay/Pabbly purchase path, and all price/refund copy
 * are still in the codebase — nothing was removed, only gated behind this flag.
 *
 * Isomorphic module (NO "use client"): the constant is read by both server
 * components (metadata, OG image, page composition) and client components
 * (CTAs, modal). `openLeadModal()` only touches `window` when called, so it is
 * safe to import server-side.
 */
export const FREE_FUNNEL_MODE = true;

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
