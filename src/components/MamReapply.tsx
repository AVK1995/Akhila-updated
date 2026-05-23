"use client";

/**
 * MamReapply
 * ----------
 * Backup safety net for the Meta Pixel's Manual Advanced Matching on the
 * /thank-you page. Re-applies the persisted akhila_mam cookie on mount, in
 * case the inline pixel script in layout.tsx raced the route change OR the
 * form-fill MAM call in /checkout didn't complete before the redirect.
 *
 * `fbq('init', ...)` with the same matching is a no-op, so calling this when
 * MAM is already applied is harmless.
 */

import { useEffect } from "react";
import { reapplyMamFromCookie } from "@/lib/analytics";

export function MamReapply() {
  useEffect(() => {
    reapplyMamFromCookie();
  }, []);
  return null;
}
