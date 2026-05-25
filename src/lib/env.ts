import { z } from "zod";

/**
 * SINGLE SOURCE OF TRUTH for the assessment fee.
 *
 * Set this once in .env / .env.local and it propagates everywhere:
 *   - All frontend price tags (hero, pricing card, FAQ, CTAs, etc.)
 *   - Razorpay order creation (server)
 *   - SEO metadata + JSON-LD schema
 *   - OpenGraph image
 *
 * Use the prefixed `NEXT_PUBLIC_ASSESSMENT_FEE_INR` so the value is available
 * on the client. The server reads the same var (with `ASSESSMENT_FEE_INR` as
 * an optional fallback for back-compat).
 *
 * Note: Next.js inlines `NEXT_PUBLIC_*` at build time, so you must restart
 * `npm run dev` (or rebuild prod) after changing this value.
 */
const RAW_FEE =
  process.env.NEXT_PUBLIC_ASSESSMENT_FEE_INR ??
  process.env.ASSESSMENT_FEE_INR ??
  "97";
const ASSESSMENT_FEE_INR_NUM = Number(RAW_FEE);

const serverSchema = z.object({
  RAZORPAY_KEY_ID: z.string().min(1, "RAZORPAY_KEY_ID required"),
  RAZORPAY_KEY_SECRET: z.string().min(1, "RAZORPAY_KEY_SECRET required"),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional().default(""),
  ASSESSMENT_FEE_INR: z.coerce.number().int().positive().default(ASSESSMENT_FEE_INR_NUM),
  PABBLY_PURCHASE_WEBHOOK_URL: z.string().url().optional().or(z.literal("")),
  // PABBLY_ABANDONED_WEBHOOK_URL disabled — see .env.local. Restore this
  // schema entry (and the fallback below + lib/pabbly.ts read) to re-enable.
  // PABBLY_ABANDONED_WEBHOOK_URL: z.string().url().optional().or(z.literal("")),
  ABANDONED_CART_DELAY_MINUTES: z.coerce.number().int().positive().default(240),
  /**
   * Optional server-side coupon that lets internal testers bypass Razorpay
   * entirely. Compared case-insensitively after trimming whitespace. When
   * matched, the create-order endpoint fires the Pabbly purchase webhook with
   * a synthetic `BYPASS-…` payment id and returns `{ bypass: true }` so the
   * client skips the Razorpay modal and routes straight to /book-a-call.
   * Leave empty to disable bypass.
   */
  BYPASS_COUPON_CODE: z.string().optional().default(""),
  /**
   * Meta Conversions API access token. Server-only secret. Empty disables
   * server-side CAPI firing (Purchase + sales) on verified Razorpay payment;
   * browser-side PageView still works as long as NEXT_PUBLIC_META_PIXEL_ID is
   * set. Generate at Events Manager → Pixel → Settings → Conversions API.
   */
  META_CAPI_ACCESS_TOKEN: z.string().optional().default(""),
  /**
   * Optional Meta Test Events code (e.g. "TEST12345"). When set, every CAPI
   * fire includes `test_event_code: "<value>"` and Meta routes those events
   * to Events Manager → Test Events instead of production reporting. Use
   * during pre-launch validation; leave empty in production so events count
   * toward real attribution.
   */
  META_CAPI_TEST_EVENT_CODE: z.string().optional().default(""),
});

export type ServerEnv = z.infer<typeof serverSchema>;

let _serverEnv: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (_serverEnv) return _serverEnv;
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    // Surface a developer-friendly error but do not crash the entire app
    // for non-Razorpay routes — those routes should validate before use.
    console.error("[env] Invalid server environment:", parsed.error.flatten().fieldErrors);
    // Provide a partial fallback so the dev server still boots
    _serverEnv = {
      RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID ?? "",
      RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET ?? "",
      RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET ?? "",
      ASSESSMENT_FEE_INR: ASSESSMENT_FEE_INR_NUM,
      PABBLY_PURCHASE_WEBHOOK_URL: process.env.PABBLY_PURCHASE_WEBHOOK_URL ?? "",
      // PABBLY_ABANDONED_WEBHOOK_URL: process.env.PABBLY_ABANDONED_WEBHOOK_URL ?? "",
      ABANDONED_CART_DELAY_MINUTES: Number(process.env.ABANDONED_CART_DELAY_MINUTES ?? 240),
      BYPASS_COUPON_CODE: process.env.BYPASS_COUPON_CODE ?? "",
      META_CAPI_ACCESS_TOKEN: process.env.META_CAPI_ACCESS_TOKEN ?? "",
      META_CAPI_TEST_EVENT_CODE: process.env.META_CAPI_TEST_EVENT_CODE ?? "",
    };
    return _serverEnv;
  }
  _serverEnv = parsed.data;
  return _serverEnv;
}

const SITE_URL_RAW =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://akhila.example.com";

/**
 * Hostname extracted from NEXT_PUBLIC_SITE_URL. Used as the single source
 * of truth for the "production domain" gate that suppresses Meta Pixel,
 * Meta CAPI and Pabbly firings on Vercel preview deployments, localhost
 * dev, and any other non-production host.
 */
const PROD_HOSTNAME = (() => {
  try {
    return new URL(SITE_URL_RAW).hostname.toLowerCase();
  } catch {
    return "akhila.example.com";
  }
})();

export const publicEnv = {
  siteUrl: SITE_URL_RAW,
  siteName: process.env.NEXT_PUBLIC_SITE_NAME ?? "Dr. Aditya & Akhila's PCOS Metabolic Programme",
  razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "",
  calendlyUrl: process.env.NEXT_PUBLIC_CALENDLY_URL ?? "",
  assessmentFeeInr: ASSESSMENT_FEE_INR_NUM,
  /** Pre-formatted display string, e.g. "₹97". Use this in JSX. */
  assessmentFeeDisplay: `₹${ASSESSMENT_FEE_INR_NUM}`,
  /**
   * Meta Pixel ID. Not a secret — Meta Pixel Helper exposes it on any site
   * that uses it. Exposed via NEXT_PUBLIC_ so the same literal is readable
   * client-side (for fbq init) and server-side (for the CAPI POST URL).
   * Empty disables all Meta tracking (both browser PageView and server CAPI).
   */
  metaPixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "",
  /**
   * Production hostname derived from NEXT_PUBLIC_SITE_URL. Conversion-event
   * gates (Meta Pixel / Meta CAPI / Pabbly webhooks) require the request
   * host to match this value. Vercel preview deployments and localhost
   * therefore fire ZERO events, keeping Events Manager and Pabbly clean
   * during testing.
   */
  prodHostname: PROD_HOSTNAME,
  /**
   * Funnel identity marker. Stamped into Razorpay order notes at create-order
   * time so the webhook (which fires for EVERY captured payment on a shared
   * Razorpay account, including unrelated businesses) can short-circuit on
   * `order.notes.funnel !== publicEnv.funnelSlug` before touching any of our
   * downstream pipelines. Never env-driven — slug is project identity.
   * See PURCHASE_TRACKING_ARCHITECTURE.md Part 17 for the full rationale.
   */
  funnelSlug: "akhila-pcos",
} as const;
