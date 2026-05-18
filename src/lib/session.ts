/**
 * Funnel session storage — persists user identity + checkout state across
 * landing → checkout → book-a-call → thank-you pages.
 *
 * Stored in sessionStorage (tab-scoped) so each lead's data stays isolated.
 */

export type CheckoutLead = {
  leadId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;          // E.164-ish, e.g. "+919876543210"
  phoneCountry: string;   // ISO-2 country code, e.g. "IN"
  city: string;
  ageRange: string;
  primaryConcern: string;
  couponCode?: string;
  consent: boolean;
  createdAt: string;
  paid?: boolean;
  paymentId?: string;
  orderId?: string;
};

const KEY = "akhila_lead_v1";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function saveLead(lead: CheckoutLead): void {
  if (!isBrowser()) return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(lead));
  } catch {
    /* ignore */
  }
}

export function getLead(): CheckoutLead | null {
  if (!isBrowser()) return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CheckoutLead;
  } catch {
    return null;
  }
}

export function clearLead(): void {
  if (!isBrowser()) return;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function generateLeadId(): string {
  // RFC4122 v4-ish, non-cryptographic but unique enough for lead correlation
  const rnd = () => Math.random().toString(16).slice(2, 10);
  return `lead_${Date.now().toString(36)}_${rnd()}${rnd()}`;
}
