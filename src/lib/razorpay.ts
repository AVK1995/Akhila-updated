import Razorpay from "razorpay";
import crypto from "node:crypto";
import { getServerEnv } from "./env";

let _client: Razorpay | null = null;

export function getRazorpay(): Razorpay {
  if (_client) return _client;
  const env = getServerEnv();
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new Error(
      "Razorpay keys missing. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.local"
    );
  }
  _client = new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
  });
  return _client;
}

/**
 * Verifies the HMAC-SHA256 signature returned by Razorpay Checkout after a
 * successful payment, ensuring the payment was not forged on the client side.
 */
export function verifyPaymentSignature(args: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const env = getServerEnv();
  if (!env.RAZORPAY_KEY_SECRET) return false;
  const expected = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(`${args.orderId}|${args.paymentId}`)
    .digest("hex");
  // timingSafeEqual requires equal-length buffers
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(args.signature, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Verifies a Razorpay **webhook** signature. Razorpay signs each webhook with
 * `HMAC_SHA256(rawBody, RAZORPAY_WEBHOOK_SECRET)` — a SEPARATE secret from the
 * API key, set when you create the webhook in the dashboard.
 *
 * MUST be given the RAW request body (`await req.text()`), never re-serialized
 * JSON — any key reordering or whitespace change breaks the HMAC. Returns false
 * when the secret is unset so an unconfigured deploy fails closed.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string | null | undefined
): boolean {
  const env = getServerEnv();
  if (!env.RAZORPAY_WEBHOOK_SECRET || !signature) return false;
  const expected = crypto
    .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
