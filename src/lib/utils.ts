import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Reduce a URL to its origin (scheme + host), dropping path, query and hash.
 * Used to strip health-y path segments + the UTM query string from
 * `event_source_url` before it reaches Meta (CAPI) or the CRM sheet, per the
 * Health & Wellness hardening posture (see META_HW_HARDENING.md). Returns the
 * input unchanged if it can't be parsed as a URL.
 */
export function originOnly(url: string): string {
  try {
    return new URL(url).origin;
  } catch {
    return url;
  }
}
