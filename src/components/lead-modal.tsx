"use client";

/* =============================================================================
 * LEAD-CAPTURE MODAL — Akhila PCOS Funnel (FREE_FUNNEL_MODE)
 * =============================================================================
 * Mounted once globally (<LeadModalHost/> in layout.tsx). Any CTA opens it via
 * openLeadModal() (src/lib/funnel.ts).
 *
 * Layout: a premium two-panel LANDSCAPE card on desktop (brand panel + form)
 * and a single-column bottom-sheet on mobile. The form panel uses an
 * auto-hiding scrollbar (visible only while scrolling).
 *
 * On submit it saves the lead, fires browser Meta MAM, POSTs /api/lead with
 * keepalive (server fires Pabbly LEAD webhook + Meta CAPI custom "Lead"), then
 * redirects to /book-a-call — the mobile-safe keepalive-then-redirect pattern.
 * =============================================================================
 */

import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { getStoredUtm, utmToObject } from "@/lib/utm";
import { generateLeadId, saveLead } from "@/lib/session";
import { setMetaAdvancedMatching } from "@/lib/analytics";
import { LEAD_MODAL_EVENT } from "@/lib/funnel";
import { DEFAULT_COUNTRY, digitsOnly, getCountry } from "@/lib/countries";
import { PhoneField } from "@/components/phone-field";

/* ── validation (non-phone; phone is validated per-country below) ─────────── */
const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80),
  email: z.string().trim().email("Enter a valid email"),
  location: z.string().trim().min(2, "Please enter your location").max(80),
  challenge: z
    .string()
    .trim()
    .min(3, "Tell us a little about your challenge")
    .max(500),
  willingToInvest: z.enum(["Yes", "No"], {
    errorMap: () => ({ message: "Please choose Yes or No" }),
  }),
});
type Values = {
  name: string;
  phoneCountry: string;
  phone: string;
  email: string;
  location: string;
  challenge: string;
  willingToInvest: "" | "Yes" | "No";
};
type Errors = Partial<Record<keyof Values, string>>;

const EMPTY: Values = {
  name: "",
  phoneCountry: DEFAULT_COUNTRY,
  phone: "",
  email: "",
  location: "",
  challenge: "",
  willingToInvest: "",
};

function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") };
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("h-4 w-4", className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
function TickIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("h-3.5 w-3.5", className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

const TRUST = [
  "30-minute 1:1 call with Akhila",
  "Root-cause metabolic approach",
  "30,000+ women already helped",
  "100% free — no card, no payment",
];

export function LeadModalHost() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const firstFieldRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolling, setScrolling] = useState(false);
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoOpenedRef = useRef(false);
  // Drives the entrance animation: bottom-sheet slide on mobile, scale/fade on
  // desktop. Set at open time so the first frame uses the correct variant.
  const [isMobile, setIsMobile] = useState(false);

  // Open on the global event; close on Escape; lock body scroll while open.
  useEffect(() => {
    function onOpen() {
      setErrors({});
      setIsMobile(window.matchMedia("(max-width: 639px)").matches);
      setOpen(true);
    }
    window.addEventListener(LEAD_MODAL_EVENT, onOpen);
    return () => window.removeEventListener(LEAD_MODAL_EVENT, onOpen);
  }, []);

  // Auto-open ONCE per page load when the visitor scrolls ~45% down the LANDING
  // page. The in-memory ref resets on a full refresh, so a fresh load + scroll
  // re-triggers it.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.pathname !== "/") return;
    function onScroll() {
      if (autoOpenedRef.current) return;
      const scrollable =
        document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      if (window.scrollY / scrollable >= 0.45) {
        autoOpenedRef.current = true;
        setErrors({});
        setIsMobile(window.matchMedia("(max-width: 639px)").matches);
        setOpen(true);
        window.removeEventListener("scroll", onScroll);
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    const t = setTimeout(() => firstFieldRef.current?.focus(), 80);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
      clearTimeout(t);
    };
  }, [open]);

  function onScroll() {
    setScrolling(true);
    if (scrollTimer.current) clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(() => setScrolling(false), 700);
  }

  function setField<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsed = schema.safeParse(values);
    const fieldErrors: Errors = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as keyof Values;
        if (!fieldErrors[k]) fieldErrors[k] = issue.message;
      }
    }
    // per-country phone validation
    const country = getCountry(values.phoneCountry);
    const digits = digitsOnly(values.phone);
    if (digits.length < country.minLen || digits.length > country.maxLen) {
      fieldErrors.phone =
        country.minLen === country.maxLen
          ? `${country.name} numbers are ${country.minLen} digits`
          : `${country.name} numbers are ${country.minLen}–${country.maxLen} digits`;
    }
    if (Object.keys(fieldErrors).length > 0 || !parsed.success) {
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);

    const data = parsed.data;
    const utm = utmToObject(getStoredUtm());
    const leadId = generateLeadId();
    const createdAt = new Date().toISOString();
    const { firstName, lastName } = splitName(data.name);
    const phone = `${country.dial}${digits}`;

    saveLead({
      leadId,
      firstName,
      lastName,
      email: data.email,
      phone,
      phoneCountry: country.iso,
      city: data.location,
      ageRange: "",
      primaryConcern: data.challenge,
      consent: true,
      createdAt,
      location: data.location,
      greatestChallenge: data.challenge,
      willingToInvest: data.willingToInvest,
    });

    void setMetaAdvancedMatching({
      email: data.email,
      phone,
      firstName,
      lastName,
      city: data.location,
      country: country.iso,
    });

    const eventSourceUrl =
      typeof window !== "undefined" ? window.location.href : undefined;
    try {
      void fetch("/api/lead", {
        method: "POST",
        keepalive: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId,
          createdAt,
          name: data.name,
          firstName,
          lastName,
          email: data.email,
          phone,
          phoneCountry: country.iso,
          location: data.location,
          challenge: data.challenge,
          willingToInvest: data.willingToInvest,
          utm,
          eventSourceUrl,
        }),
      }).catch(() => {});
    } catch {
      /* never block the redirect */
    }

    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(utm)) params.set(k, v);
    const qs = params.toString();
    router.push(qs ? `/book-a-call?${qs}` : "/book-a-call");

    // The modal lives in the PERSISTENT root layout, so it does NOT unmount on
    // navigation — close + reset it ourselves, otherwise it stays stuck on
    // "Submitting…" over /book-a-call.
    setOpen(false);
    setSubmitting(false);
    setValues(EMPTY);
  }

  const freePill = (
    <span className="inline-flex items-center gap-2 rounded-full bg-wine-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-wine-700 sm:bg-cream-50/15 sm:text-gold-200">
      <span className="live-dot" />
      Free · No payment
    </span>
  );

  // Mobile = bottom-sheet drawer that slides up from off-screen (visible,
  // smooth spring). Desktop = gentle scale/fade. Reduced motion = fade only.
  const cardAnim = isMobile
    ? {
        initial: reduce ? { opacity: 1 } : { y: "100%" },
        animate: { y: 0, opacity: 1 },
        exit: reduce ? { opacity: 1 } : { y: "100%" },
        transition: { type: "spring" as const, damping: 34, stiffness: 320 },
      }
    : {
        initial: reduce ? { opacity: 1 } : { y: 24, opacity: 0, scale: 0.985 },
        animate: { y: 0, opacity: 1, scale: 1 },
        exit: reduce ? { opacity: 1 } : { y: 24, opacity: 0, scale: 0.985 },
        transition: {
          duration: 0.3,
          ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
        },
      };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4"
          initial={reduce ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduce ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="absolute inset-0 cursor-default bg-ink-900/65 backdrop-blur-sm"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Book your free consultation"
            initial={cardAnim.initial}
            animate={cardAnim.animate}
            exit={cardAnim.exit}
            transition={cardAnim.transition}
            className="relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-cream-50 shadow-premium-xl ring-1 ring-ink-900/5 sm:max-h-[88vh] sm:w-auto sm:max-w-4xl sm:flex-row sm:rounded-[28px]"
          >
            {/* Close — steady on the card, never scrolls with the form. */}
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute right-3.5 top-3.5 z-20 inline-flex h-8 w-8 items-center justify-center rounded-full text-ink-400 transition-colors hover:bg-ink-100/70 hover:text-ink-700"
            >
              <CloseIcon />
            </button>

            {/* ── LEFT brand panel (desktop only) ───────────────────────── */}
            <aside className="relative hidden w-[42%] shrink-0 flex-col justify-between overflow-hidden bg-wine-gradient p-8 text-cream-50 sm:flex">
              <div aria-hidden="true" className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-wine-500/40 blur-[90px]" />
              <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 -right-20 h-64 w-64 rounded-full bg-gold-500/25 blur-[100px]" />
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-grain opacity-[0.07]" />

              <div className="relative">
                {freePill}
                <h2 className="mt-6 font-display text-[28px] font-medium leading-[1.1] text-cream-50">
                  Book your{" "}
                  <span className="italic text-gold-200">free</span>{" "}
                  consultation
                </h2>
                <p className="mt-3 text-[14px] leading-relaxed text-cream-100/75">
                  A 30-minute clinical conversation with Akhila about your
                  specific PCOS pattern. No payment, no pressure.
                </p>
              </div>

              <ul className="relative mt-8 space-y-3">
                {TRUST.map((t) => (
                  <li key={t} className="flex items-start gap-2.5 text-[13.5px] leading-snug text-cream-100/90">
                    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold-400/20 text-gold-200">
                      <TickIcon />
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </aside>

            {/* ── MOBILE steady header — stays put while the form scrolls ── */}
            <div className="relative shrink-0 border-b border-ink-100/70 bg-cream-50 px-5 pb-3.5 pt-5 sm:hidden">
              {freePill}
              <h2 className="mt-3 font-display text-[21px] font-medium leading-tight text-ink-800">
                Book your free consultation
              </h2>
              <p className="mt-1.5 pr-8 text-[13px] leading-relaxed text-ink-500">
                Tell us a little about you and we&rsquo;ll get you straight to
                booking your call with Akhila.
              </p>
            </div>

            {/* ── FORM panel (scrollable, auto-hiding scrollbar) ─────────── */}
            <div
              ref={scrollRef}
              onScroll={onScroll}
              className={cn(
                "auto-scrollbar relative flex-1 overflow-y-auto px-5 py-5 sm:max-h-[88vh] sm:p-7",
                scrolling && "is-scrolling"
              )}
            >
              <p className="hidden text-[13px] font-semibold uppercase tracking-[0.16em] text-wine-700 sm:block">
                Your details
              </p>

              <form onSubmit={handleSubmit} noValidate className="space-y-3.5 sm:mt-5">
                <div>
                  <label htmlFor="lm-name" className="label-premium">
                    Name <span className="text-wine-600">*</span>
                  </label>
                  <input
                    ref={firstFieldRef}
                    id="lm-name"
                    type="text"
                    autoComplete="name"
                    value={values.name}
                    onChange={(e) => setField("name", e.target.value)}
                    className={cn("input-premium", errors.name && "input-error")}
                  />
                  {errors.name && <p className="mt-1 text-[12px] text-red-600">{errors.name}</p>}
                </div>

                <PhoneField
                  id="lm-phone"
                  label="Phone number"
                  required
                  country={values.phoneCountry}
                  value={values.phone}
                  error={errors.phone}
                  onCountryChange={(iso) => setField("phoneCountry", iso)}
                  onChange={(v) => setField("phone", v)}
                />

                <div className="grid gap-3.5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="lm-email" className="label-premium">
                      Email <span className="text-wine-600">*</span>
                    </label>
                    <input
                      id="lm-email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      value={values.email}
                      onChange={(e) => setField("email", e.target.value)}
                      className={cn("input-premium", errors.email && "input-error")}
                    />
                    {errors.email && <p className="mt-1 text-[12px] text-red-600">{errors.email}</p>}
                  </div>
                  <div>
                    <label htmlFor="lm-location" className="label-premium">
                      Location <span className="text-wine-600">*</span>
                    </label>
                    <input
                      id="lm-location"
                      type="text"
                      autoComplete="address-level2"
                      placeholder="City"
                      value={values.location}
                      onChange={(e) => setField("location", e.target.value)}
                      className={cn("input-premium", errors.location && "input-error")}
                    />
                    {errors.location && <p className="mt-1 text-[12px] text-red-600">{errors.location}</p>}
                  </div>
                </div>

                <div>
                  <label htmlFor="lm-challenge" className="label-premium">
                    What is the greatest challenge you are facing? <span className="text-wine-600">*</span>
                  </label>
                  <textarea
                    id="lm-challenge"
                    rows={3}
                    value={values.challenge}
                    onChange={(e) => setField("challenge", e.target.value)}
                    className={cn("input-premium resize-none", errors.challenge && "input-error")}
                  />
                  {errors.challenge && <p className="mt-1 text-[12px] text-red-600">{errors.challenge}</p>}
                </div>

                <div>
                  <span className="label-premium">
                    If the results are guaranteed, are you willing to invest in your health? <span className="text-wine-600">*</span>
                  </span>
                  <div className="mt-1.5 grid grid-cols-2 gap-2.5">
                    {(["Yes", "No"] as const).map((opt) => {
                      const active = values.willingToInvest === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setField("willingToInvest", opt)}
                          aria-pressed={active}
                          className={cn(
                            "rounded-xl border px-4 py-2.5 text-[14px] font-medium transition-all duration-200",
                            active
                              ? "border-wine-500 bg-wine-50 text-wine-800 shadow-premium-sm"
                              : "border-ink-200 bg-white text-ink-600 hover:border-wine-300 hover:text-wine-700"
                          )}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  {errors.willingToInvest && (
                    <p className="mt-1 text-[12px] text-red-600">{errors.willingToInvest}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className={cn("btn-primary-lg mt-1 w-full", submitting && "cursor-wait")}
                >
                  {submitting ? (
                    <span className="inline-flex items-center gap-2">
                      <Spinner /> Submitting…
                    </span>
                  ) : (
                    <span>Submit &amp; Book My Call</span>
                  )}
                </button>

                <p className="text-center text-[11.5px] leading-relaxed text-ink-400">
                  By submitting you agree to our{" "}
                  <Link href="/terms" target="_blank" className="text-wine-600 underline-offset-2 hover:underline">
                    Terms
                  </Link>{" "}
                  &amp;{" "}
                  <Link href="/privacy" target="_blank" className="text-wine-600 underline-offset-2 hover:underline">
                    Privacy
                  </Link>
                  .
                </p>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
