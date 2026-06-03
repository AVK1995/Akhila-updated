import type { Metadata } from "next";
import { publicEnv } from "@/lib/env";

/**
 * Per-route metadata for /checkout. Lives in this tiny layout because
 * page.tsx is a "use client" file (interactive form) and client files
 * can't export `metadata`.
 */
export const metadata: Metadata = {
  title: "Secure Checkout · Book Your Assessment",
  description: `Complete your booking for the 30-minute metabolic assessment call with Akhila. ${publicEnv.assessmentFeeDisplay}, fully refundable.`,
  robots: { index: false, follow: false },
};

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
