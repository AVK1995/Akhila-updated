import type { Metadata } from "next";

/**
 * Per-route metadata for /book-a-call. Lives in this tiny layout because
 * page.tsx is a "use client" file (uses useSearchParams) and client files
 * can't export `metadata`.
 */
export const metadata: Metadata = {
  title: "Book Your Assessment Call",
  description:
    "Pick a 30-minute slot for your PCOS clinical assessment call with Akhila.",
  robots: { index: false, follow: false },
};

export default function BookACallLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
