"use client";

/* =============================================================================
 * CHECKOUT PAGE — Akhila PCOS Metabolic Programme
 * =============================================================================
 * Everything for the /checkout step lives here:
 *   - Minimal header (no full navbar, no footer per spec)
 *   - Lead form (full name, email, phone, city, age, primary concern)
 *   - Consent block linking to /terms /privacy /refund (above Pay button)
 *   - Order summary card with refund badge
 *   - Razorpay Checkout.js integration
 *   - Abandoned-cart kick (POST /api/checkout-init on blur)
 *
 * Page metadata (noindex) lives in ./layout.tsx because this file is "use client".
 *
 * Global concerns (NOT in this file):
 *   - Brand CSS / fonts: src/app/globals.css + tailwind.config.ts
 *   - UTM capture: src/app/layout.tsx (inline script in <head>)
 *   - Razorpay/Pabbly server logic: src/lib/* + src/app/api/*
 * =============================================================================
 */

import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { cn, formatINR } from "@/lib/utils";
import { getStoredUtm, utmToObject } from "@/lib/utm";
import {
  generateLeadId,
  getLead,
  saveLead,
  type CheckoutLead,
} from "@/lib/session";
import { publicEnv } from "@/lib/env";
import { Marquee, Footer } from "@/components/site-chrome";

/* ─────────────────────────────────────────────────────────────────────────────
 * INLINE ICONS — only the ones this page uses
 * ─────────────────────────────────────────────────────────────────────────────
 */
const baseIconProps = (className?: string, strokeWidth = 1.6) => ({
  className: cn("h-4 w-4 shrink-0", className),
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
});
const CheckIcon = ({ className, strokeWidth }: { className?: string; strokeWidth?: number }) => (
  <svg {...baseIconProps(className, strokeWidth)}><path d="M20 6 9 17l-5-5" /></svg>
);
const LockIcon = ({ className, strokeWidth }: { className?: string; strokeWidth?: number }) => (
  <svg {...baseIconProps(className, strokeWidth)}>
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);
const ShieldIcon = ({ className, strokeWidth }: { className?: string; strokeWidth?: number }) => (
  <svg {...baseIconProps(className, strokeWidth)}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);
const StethoscopeIcon = ({ className, strokeWidth }: { className?: string; strokeWidth?: number }) => (
  <svg {...baseIconProps(className, strokeWidth)}>
    <path d="M4.8 2.3A.3.3 0 1 1 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 0 0 .2.3" />
    <path d="M8 15v3a4 4 0 0 0 8 0v-3" />
    <circle cx="20" cy="10" r="2" />
  </svg>
);

/* ─────────────────────────────────────────────────────────────────────────────
 * RAZORPAY GLOBAL TYPES
 * ─────────────────────────────────────────────────────────────────────────────
 */
declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}
type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: { name: string; email: string; contact: string };
  notes: Record<string, string>;
  theme: { color: string };
  modal: { ondismiss: () => void };
  handler: (response: RazorpayResponse) => void;
};
type RazorpayInstance = { open: () => void };
type RazorpayResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

/* ─────────────────────────────────────────────────────────────────────────────
 * COUNTRIES — comprehensive list for the phone selector.
 * `minLen`/`maxLen` = expected subscriber-digit count (excluding dial code).
 * The list is sorted with India first (default market), then alphabetically.
 * For countries without a strict ITU spec, sane defaults of 7–15 are used.
 * ─────────────────────────────────────────────────────────────────────────────
 */
type Country = {
  iso: string;
  name: string;
  dial: string;
  flag: string;
  minLen: number;
  maxLen: number;
  placeholder: string;
};
const COUNTRIES: Country[] = [
  { iso: "IN", name: "India",                dial: "+91",  flag: "🇮🇳", minLen: 10, maxLen: 10, placeholder: "98765 43210" },
  { iso: "AF", name: "Afghanistan",          dial: "+93",  flag: "🇦🇫", minLen: 9,  maxLen: 9,  placeholder: "70 123 4567" },
  { iso: "AL", name: "Albania",              dial: "+355", flag: "🇦🇱", minLen: 8,  maxLen: 9,  placeholder: "66 123 4567" },
  { iso: "DZ", name: "Algeria",              dial: "+213", flag: "🇩🇿", minLen: 9,  maxLen: 9,  placeholder: "551 23 45 67" },
  { iso: "AR", name: "Argentina",            dial: "+54",  flag: "🇦🇷", minLen: 10, maxLen: 11, placeholder: "11 1234 5678" },
  { iso: "AM", name: "Armenia",              dial: "+374", flag: "🇦🇲", minLen: 8,  maxLen: 8,  placeholder: "77 123456" },
  { iso: "AU", name: "Australia",            dial: "+61",  flag: "🇦🇺", minLen: 9,  maxLen: 9,  placeholder: "412 345 678" },
  { iso: "AT", name: "Austria",              dial: "+43",  flag: "🇦🇹", minLen: 10, maxLen: 11, placeholder: "664 1234567" },
  { iso: "AZ", name: "Azerbaijan",           dial: "+994", flag: "🇦🇿", minLen: 9,  maxLen: 9,  placeholder: "40 123 45 67" },
  { iso: "BH", name: "Bahrain",              dial: "+973", flag: "🇧🇭", minLen: 8,  maxLen: 8,  placeholder: "3600 1234" },
  { iso: "BD", name: "Bangladesh",           dial: "+880", flag: "🇧🇩", minLen: 10, maxLen: 10, placeholder: "1812-345678" },
  { iso: "BE", name: "Belgium",              dial: "+32",  flag: "🇧🇪", minLen: 8,  maxLen: 9,  placeholder: "470 12 34 56" },
  { iso: "BR", name: "Brazil",               dial: "+55",  flag: "🇧🇷", minLen: 10, maxLen: 11, placeholder: "11 91234-5678" },
  { iso: "BG", name: "Bulgaria",             dial: "+359", flag: "🇧🇬", minLen: 8,  maxLen: 9,  placeholder: "87 123 4567" },
  { iso: "KH", name: "Cambodia",             dial: "+855", flag: "🇰🇭", minLen: 8,  maxLen: 9,  placeholder: "91 234 567" },
  { iso: "CA", name: "Canada",               dial: "+1",   flag: "🇨🇦", minLen: 10, maxLen: 10, placeholder: "(416) 555-0123" },
  { iso: "CL", name: "Chile",                dial: "+56",  flag: "🇨🇱", minLen: 8,  maxLen: 9,  placeholder: "2 2123 4567" },
  { iso: "CN", name: "China",                dial: "+86",  flag: "🇨🇳", minLen: 11, maxLen: 11, placeholder: "131 2345 6789" },
  { iso: "CO", name: "Colombia",             dial: "+57",  flag: "🇨🇴", minLen: 10, maxLen: 10, placeholder: "321 1234567" },
  { iso: "CR", name: "Costa Rica",           dial: "+506", flag: "🇨🇷", minLen: 8,  maxLen: 8,  placeholder: "8312 3456" },
  { iso: "HR", name: "Croatia",              dial: "+385", flag: "🇭🇷", minLen: 8,  maxLen: 9,  placeholder: "91 234 5678" },
  { iso: "CY", name: "Cyprus",               dial: "+357", flag: "🇨🇾", minLen: 8,  maxLen: 8,  placeholder: "96 123456" },
  { iso: "CZ", name: "Czech Republic",       dial: "+420", flag: "🇨🇿", minLen: 9,  maxLen: 9,  placeholder: "601 123 456" },
  { iso: "DK", name: "Denmark",              dial: "+45",  flag: "🇩🇰", minLen: 8,  maxLen: 8,  placeholder: "20 12 34 56" },
  { iso: "DO", name: "Dominican Republic",   dial: "+1",   flag: "🇩🇴", minLen: 10, maxLen: 10, placeholder: "809 234 5678" },
  { iso: "EC", name: "Ecuador",              dial: "+593", flag: "🇪🇨", minLen: 8,  maxLen: 9,  placeholder: "99 123 4567" },
  { iso: "EG", name: "Egypt",                dial: "+20",  flag: "🇪🇬", minLen: 10, maxLen: 10, placeholder: "100 123 4567" },
  { iso: "EE", name: "Estonia",              dial: "+372", flag: "🇪🇪", minLen: 7,  maxLen: 8,  placeholder: "5123 4567" },
  { iso: "ET", name: "Ethiopia",             dial: "+251", flag: "🇪🇹", minLen: 9,  maxLen: 9,  placeholder: "91 123 4567" },
  { iso: "FI", name: "Finland",              dial: "+358", flag: "🇫🇮", minLen: 9,  maxLen: 10, placeholder: "41 234 5678" },
  { iso: "FR", name: "France",               dial: "+33",  flag: "🇫🇷", minLen: 9,  maxLen: 9,  placeholder: "6 12 34 56 78" },
  { iso: "GE", name: "Georgia",              dial: "+995", flag: "🇬🇪", minLen: 9,  maxLen: 9,  placeholder: "555 12 34 56" },
  { iso: "DE", name: "Germany",              dial: "+49",  flag: "🇩🇪", minLen: 10, maxLen: 11, placeholder: "151 23456789" },
  { iso: "GH", name: "Ghana",                dial: "+233", flag: "🇬🇭", minLen: 9,  maxLen: 9,  placeholder: "24 123 4567" },
  { iso: "GR", name: "Greece",               dial: "+30",  flag: "🇬🇷", minLen: 10, maxLen: 10, placeholder: "691 234 5678" },
  { iso: "HK", name: "Hong Kong",            dial: "+852", flag: "🇭🇰", minLen: 8,  maxLen: 8,  placeholder: "5123 4567" },
  { iso: "HU", name: "Hungary",              dial: "+36",  flag: "🇭🇺", minLen: 8,  maxLen: 9,  placeholder: "20 123 4567" },
  { iso: "IS", name: "Iceland",              dial: "+354", flag: "🇮🇸", minLen: 7,  maxLen: 7,  placeholder: "611 1234" },
  { iso: "ID", name: "Indonesia",            dial: "+62",  flag: "🇮🇩", minLen: 9,  maxLen: 12, placeholder: "812-3456-7890" },
  { iso: "IR", name: "Iran",                 dial: "+98",  flag: "🇮🇷", minLen: 10, maxLen: 10, placeholder: "912 345 6789" },
  { iso: "IQ", name: "Iraq",                 dial: "+964", flag: "🇮🇶", minLen: 10, maxLen: 10, placeholder: "791 234 5678" },
  { iso: "IE", name: "Ireland",              dial: "+353", flag: "🇮🇪", minLen: 9,  maxLen: 9,  placeholder: "85 123 4567" },
  { iso: "IL", name: "Israel",               dial: "+972", flag: "🇮🇱", minLen: 9,  maxLen: 9,  placeholder: "50 123 4567" },
  { iso: "IT", name: "Italy",                dial: "+39",  flag: "🇮🇹", minLen: 9,  maxLen: 11, placeholder: "312 345 6789" },
  { iso: "JP", name: "Japan",                dial: "+81",  flag: "🇯🇵", minLen: 10, maxLen: 11, placeholder: "90-1234-5678" },
  { iso: "JO", name: "Jordan",               dial: "+962", flag: "🇯🇴", minLen: 9,  maxLen: 9,  placeholder: "7 9012 3456" },
  { iso: "KZ", name: "Kazakhstan",           dial: "+7",   flag: "🇰🇿", minLen: 10, maxLen: 10, placeholder: "771 234 5678" },
  { iso: "KE", name: "Kenya",                dial: "+254", flag: "🇰🇪", minLen: 9,  maxLen: 9,  placeholder: "712 123456" },
  { iso: "KW", name: "Kuwait",               dial: "+965", flag: "🇰🇼", minLen: 8,  maxLen: 8,  placeholder: "500 12345" },
  { iso: "LV", name: "Latvia",               dial: "+371", flag: "🇱🇻", minLen: 8,  maxLen: 8,  placeholder: "2 123 4567" },
  { iso: "LB", name: "Lebanon",              dial: "+961", flag: "🇱🇧", minLen: 7,  maxLen: 8,  placeholder: "71 123 456" },
  { iso: "LT", name: "Lithuania",            dial: "+370", flag: "🇱🇹", minLen: 8,  maxLen: 8,  placeholder: "612 34567" },
  { iso: "LU", name: "Luxembourg",           dial: "+352", flag: "🇱🇺", minLen: 8,  maxLen: 9,  placeholder: "628 123 456" },
  { iso: "MY", name: "Malaysia",             dial: "+60",  flag: "🇲🇾", minLen: 9,  maxLen: 10, placeholder: "12-345 6789" },
  { iso: "MV", name: "Maldives",             dial: "+960", flag: "🇲🇻", minLen: 7,  maxLen: 7,  placeholder: "771 2345" },
  { iso: "MT", name: "Malta",                dial: "+356", flag: "🇲🇹", minLen: 8,  maxLen: 8,  placeholder: "9696 1234" },
  { iso: "MX", name: "Mexico",               dial: "+52",  flag: "🇲🇽", minLen: 10, maxLen: 10, placeholder: "55 1234 5678" },
  { iso: "MA", name: "Morocco",              dial: "+212", flag: "🇲🇦", minLen: 9,  maxLen: 9,  placeholder: "650-123456" },
  { iso: "NP", name: "Nepal",                dial: "+977", flag: "🇳🇵", minLen: 10, maxLen: 10, placeholder: "984-1234567" },
  { iso: "NL", name: "Netherlands",          dial: "+31",  flag: "🇳🇱", minLen: 9,  maxLen: 9,  placeholder: "6 12345678" },
  { iso: "NZ", name: "New Zealand",          dial: "+64",  flag: "🇳🇿", minLen: 9,  maxLen: 10, placeholder: "21 123 4567" },
  { iso: "NG", name: "Nigeria",              dial: "+234", flag: "🇳🇬", minLen: 10, maxLen: 10, placeholder: "802 123 4567" },
  { iso: "NO", name: "Norway",               dial: "+47",  flag: "🇳🇴", minLen: 8,  maxLen: 8,  placeholder: "406 12 345" },
  { iso: "OM", name: "Oman",                 dial: "+968", flag: "🇴🇲", minLen: 8,  maxLen: 8,  placeholder: "9212 3456" },
  { iso: "PK", name: "Pakistan",             dial: "+92",  flag: "🇵🇰", minLen: 10, maxLen: 10, placeholder: "301 2345678" },
  { iso: "PA", name: "Panama",               dial: "+507", flag: "🇵🇦", minLen: 7,  maxLen: 8,  placeholder: "6123-4567" },
  { iso: "PE", name: "Peru",                 dial: "+51",  flag: "🇵🇪", minLen: 9,  maxLen: 9,  placeholder: "912 345 678" },
  { iso: "PH", name: "Philippines",          dial: "+63",  flag: "🇵🇭", minLen: 10, maxLen: 10, placeholder: "905 123 4567" },
  { iso: "PL", name: "Poland",               dial: "+48",  flag: "🇵🇱", minLen: 9,  maxLen: 9,  placeholder: "501 234 567" },
  { iso: "PT", name: "Portugal",             dial: "+351", flag: "🇵🇹", minLen: 9,  maxLen: 9,  placeholder: "912 345 678" },
  { iso: "QA", name: "Qatar",                dial: "+974", flag: "🇶🇦", minLen: 8,  maxLen: 8,  placeholder: "3312 3456" },
  { iso: "RO", name: "Romania",              dial: "+40",  flag: "🇷🇴", minLen: 9,  maxLen: 9,  placeholder: "712 034 567" },
  { iso: "RU", name: "Russia",               dial: "+7",   flag: "🇷🇺", minLen: 10, maxLen: 10, placeholder: "912 345-67-89" },
  { iso: "SA", name: "Saudi Arabia",         dial: "+966", flag: "🇸🇦", minLen: 9,  maxLen: 9,  placeholder: "51 234 5678" },
  { iso: "RS", name: "Serbia",               dial: "+381", flag: "🇷🇸", minLen: 8,  maxLen: 9,  placeholder: "60 1234567" },
  { iso: "SG", name: "Singapore",            dial: "+65",  flag: "🇸🇬", minLen: 8,  maxLen: 8,  placeholder: "8123 4567" },
  { iso: "SK", name: "Slovakia",             dial: "+421", flag: "🇸🇰", minLen: 9,  maxLen: 9,  placeholder: "912 123 456" },
  { iso: "SI", name: "Slovenia",             dial: "+386", flag: "🇸🇮", minLen: 8,  maxLen: 8,  placeholder: "31 234 567" },
  { iso: "ZA", name: "South Africa",         dial: "+27",  flag: "🇿🇦", minLen: 9,  maxLen: 9,  placeholder: "71 123 4567" },
  { iso: "KR", name: "South Korea",          dial: "+82",  flag: "🇰🇷", minLen: 9,  maxLen: 10, placeholder: "10-1234-5678" },
  { iso: "ES", name: "Spain",                dial: "+34",  flag: "🇪🇸", minLen: 9,  maxLen: 9,  placeholder: "612 34 56 78" },
  { iso: "LK", name: "Sri Lanka",            dial: "+94",  flag: "🇱🇰", minLen: 9,  maxLen: 9,  placeholder: "71 234 5678" },
  { iso: "SE", name: "Sweden",               dial: "+46",  flag: "🇸🇪", minLen: 9,  maxLen: 9,  placeholder: "70 123 45 67" },
  { iso: "CH", name: "Switzerland",          dial: "+41",  flag: "🇨🇭", minLen: 9,  maxLen: 9,  placeholder: "78 123 45 67" },
  { iso: "TW", name: "Taiwan",               dial: "+886", flag: "🇹🇼", minLen: 9,  maxLen: 9,  placeholder: "912 345 678" },
  { iso: "TZ", name: "Tanzania",             dial: "+255", flag: "🇹🇿", minLen: 9,  maxLen: 9,  placeholder: "621 234 567" },
  { iso: "TH", name: "Thailand",             dial: "+66",  flag: "🇹🇭", minLen: 9,  maxLen: 9,  placeholder: "812 345 678" },
  { iso: "TR", name: "Turkey",               dial: "+90",  flag: "🇹🇷", minLen: 10, maxLen: 10, placeholder: "532 123 4567" },
  { iso: "UG", name: "Uganda",               dial: "+256", flag: "🇺🇬", minLen: 9,  maxLen: 9,  placeholder: "712 345 678" },
  { iso: "UA", name: "Ukraine",              dial: "+380", flag: "🇺🇦", minLen: 9,  maxLen: 9,  placeholder: "50 123 4567" },
  { iso: "AE", name: "UAE",                  dial: "+971", flag: "🇦🇪", minLen: 8,  maxLen: 9,  placeholder: "50 123 4567" },
  { iso: "GB", name: "United Kingdom",       dial: "+44",  flag: "🇬🇧", minLen: 10, maxLen: 10, placeholder: "7700 900000" },
  { iso: "US", name: "United States",        dial: "+1",   flag: "🇺🇸", minLen: 10, maxLen: 10, placeholder: "(415) 555-0123" },
  { iso: "UY", name: "Uruguay",              dial: "+598", flag: "🇺🇾", minLen: 8,  maxLen: 8,  placeholder: "94 231 234" },
  { iso: "UZ", name: "Uzbekistan",           dial: "+998", flag: "🇺🇿", minLen: 9,  maxLen: 9,  placeholder: "91 123 45 67" },
  { iso: "VE", name: "Venezuela",            dial: "+58",  flag: "🇻🇪", minLen: 10, maxLen: 10, placeholder: "412 1234567" },
  { iso: "VN", name: "Vietnam",              dial: "+84",  flag: "🇻🇳", minLen: 9,  maxLen: 10, placeholder: "91 234 56 78" },
  { iso: "YE", name: "Yemen",                dial: "+967", flag: "🇾🇪", minLen: 9,  maxLen: 9,  placeholder: "712 345 678" },
  { iso: "ZM", name: "Zambia",               dial: "+260", flag: "🇿🇲", minLen: 9,  maxLen: 9,  placeholder: "955 123 456" },
];
const DEFAULT_COUNTRY = "IN";
function getCountry(iso: string): Country {
  return COUNTRIES.find((c) => c.iso === iso) ?? COUNTRIES[0];
}
function digitsOnly(s: string): string {
  return s.replace(/\D+/g, "");
}

/* ─────────────────────────────────────────────────────────────────────────────
 * FORM SCHEMA + TYPES
 * ─────────────────────────────────────────────────────────────────────────────
 */
const schema = z
  .object({
    firstName: z.string().min(1, "Please enter your first name").max(60),
    lastName:  z.string().min(1, "Please enter your last name").max(60),
    email:     z.string().email("Enter a valid email"),
    city:      z.string().min(1, "Please enter your city").max(60),
    phoneCountry: z.string().min(2).max(4),
    phone: z
      .string()
      .min(4, "Enter your phone number")
      .max(20)
      .regex(/^[\d\s\-()]+$/, "Only digits, spaces and dashes are allowed"),
    ageRange:       z.string().min(1, "Please select your age range").max(20),
    primaryConcern: z.string().min(1, "Please select your primary concern").max(120),
    couponCode:     z.string().max(40).optional().or(z.literal("")),
    consent: z.literal(true, {
      errorMap: () => ({
        message: "You must agree to the Terms, Privacy & Refund policies",
      }),
    }),
  })
  // Phone digit-count validation depends on the selected country — runs after
  // the field-level regex so the message is precise.
  .superRefine((data, ctx) => {
    const country = getCountry(data.phoneCountry);
    const len = digitsOnly(data.phone).length;
    if (len < country.minLen || len > country.maxLen) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["phone"],
        message:
          country.minLen === country.maxLen
            ? `${country.name} numbers are ${country.minLen} digits`
            : `${country.name} numbers are ${country.minLen}–${country.maxLen} digits`,
      });
    }
  });
type FormValues = z.infer<typeof schema>;
type FieldErrors = Partial<Record<keyof FormValues, string>>;

const FEE_INR = publicEnv.assessmentFeeInr;

/* ─────────────────────────────────────────────────────────────────────────────
 * FORM PRIMITIVES — Field · SelectField · Spinner
 * ─────────────────────────────────────────────────────────────────────────────
 */
function Field({
  id,
  label,
  type,
  required,
  autoComplete,
  inputMode,
  value,
  error,
  onChange,
  onBlur,
}: {
  id: string;
  label: string;
  type: "text" | "email" | "tel";
  required?: boolean;
  autoComplete?: string;
  inputMode?: "email" | "tel";
  value: string;
  error?: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="label-premium">
        {label}
        {required && <span className="ml-1 text-wine-600">*</span>}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        required={required}
        autoComplete={autoComplete}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn("input-premium", error && "input-error")}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-[12px] text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * BrandedSelect — branded dropdown that replaces native <select> so the open
 * menu picks up the site theme (wine/cream/gold) instead of the OS default.
 *
 *  - Click-outside + Escape to close
 *  - Optional `searchable` for long lists (e.g. ~100 countries)
 *  - Custom `renderTrigger` / `renderOption` for icon + label layouts
 *  - Keyboard nav (Arrow/Enter) via the search input when searchable; click
 *    selection otherwise — that's enough for our funnel needs without
 *    re-implementing full ARIA combobox semantics.
 */
type DropdownOption<T extends string> = {
  value: T;
  label: string;
  searchText?: string;
  meta?: React.ReactNode;
};
function BrandedSelect<T extends string>({
  id,
  options,
  value,
  onChange,
  placeholder = "Select…",
  searchable = false,
  ariaLabel,
  error,
  triggerClassName,
  renderTrigger,
  renderOption,
  align = "left",
}: {
  id?: string;
  options: DropdownOption<T>[];
  value: T | "";
  onChange: (v: T) => void;
  placeholder?: string;
  searchable?: boolean;
  ariaLabel?: string;
  error?: boolean;
  triggerClassName?: string;
  renderTrigger?: (selected: DropdownOption<T> | undefined) => React.ReactNode;
  renderOption?: (opt: DropdownOption<T>, isActive: boolean) => React.ReactNode;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const filtered = searchable && query
    ? options.filter((o) => {
        const q = query.trim().toLowerCase();
        return (
          o.label.toLowerCase().includes(q) ||
          (o.searchText ?? "").toLowerCase().includes(q)
        );
      })
    : options;

  return (
    <div ref={rootRef} className="relative">
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "input-premium flex w-full items-center justify-between gap-2 text-left",
          error && "input-error",
          triggerClassName
        )}
      >
        <span className={cn("flex min-w-0 flex-1 items-center gap-2", !selected && "text-ink-300")}>
          {renderTrigger
            ? renderTrigger(selected)
            : selected
              ? <span className="truncate">{selected.label}</span>
              : <span className="truncate">{placeholder}</span>}
        </span>
        <svg
          aria-hidden="true"
          className={cn("h-3.5 w-3.5 shrink-0 text-ink-400 transition-transform duration-200", open && "rotate-180")}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
          strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          className={cn(
            "absolute z-50 mt-1.5 max-h-72 w-full min-w-[16rem] overflow-hidden rounded-xl border border-ink-100 bg-white shadow-premium-lg ring-1 ring-wine-50",
            align === "right" && "right-0"
          )}
        >
          {searchable && (
            <div className="border-b border-ink-100 bg-cream-50/60 px-3 py-2">
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search…"
                className="w-full bg-transparent text-[13px] text-ink-700 placeholder:text-ink-400 focus:outline-none sm:text-sm"
              />
            </div>
          )}
          <ul className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-[13px] text-ink-400">No matches</li>
            ) : (
              filtered.map((o) => {
                const isActive = o.value === value;
                return (
                  <li key={o.value} role="option" aria-selected={isActive}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(o.value);
                        setOpen(false);
                        setQuery("");
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] transition-colors sm:text-sm",
                        isActive
                          ? "bg-wine-50 text-wine-800"
                          : "text-ink-700 hover:bg-cream-50 hover:text-wine-700"
                      )}
                    >
                      {renderOption ? renderOption(o, isActive) : <span className="truncate">{o.label}</span>}
                      {isActive && (
                        <svg
                          aria-hidden="true"
                          className="ml-auto h-3.5 w-3.5 shrink-0 text-wine-600"
                          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
                          strokeLinecap="round" strokeLinejoin="round"
                        >
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      )}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * SelectField — label + branded dropdown. Drop-in replacement for the prior
 * native-<select> SelectField; keeps the same prop signature so the form JSX
 * doesn't have to change.
 */
function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  error?: string;
}) {
  // Strip the leading empty/placeholder option so the dropdown's placeholder
  // role is handled by BrandedSelect itself rather than a no-op row.
  const placeholder = options.find((o) => o.value === "")?.label ?? "Select…";
  const real = options.filter((o) => o.value !== "");
  return (
    <div>
      <label htmlFor={id} className="label-premium">
        {label}
      </label>
      <BrandedSelect<string>
        id={id}
        options={real.map((o) => ({ value: o.value, label: o.label }))}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        error={Boolean(error)}
      />
      {error && (
        <p className="mt-1.5 text-[12px] text-red-600">{error}</p>
      )}
    </div>
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

/**
 * PhoneField — country selector + number input as one unit.
 * - Selector shows `🇮🇳 +91` and a wider native <select> for the country list.
 * - Placeholder and input validation come from the selected country.
 * - Stores the digits in `value` and the ISO-2 country in `country`.
 */
function PhoneField({
  id,
  label,
  required,
  country,
  value,
  error,
  onCountryChange,
  onChange,
  onBlur,
}: {
  id: string;
  label: string;
  required?: boolean;
  country: string;
  value: string;
  error?: string;
  onCountryChange: (iso: string) => void;
  onChange: (v: string) => void;
  onBlur?: () => void;
}) {
  const c = getCountry(country);
  // Adapt COUNTRIES to the BrandedSelect option shape; `searchText` lets the
  // search input match on dial code too (e.g. typing "+44" finds UK).
  const countryOptions = COUNTRIES.map((opt) => ({
    value: opt.iso,
    label: `${opt.name} (${opt.dial})`,
    searchText: `${opt.iso} ${opt.dial}`,
    meta: opt.flag,
  }));
  return (
    <div>
      <label htmlFor={id} className="label-premium">
        {label}
        {required && <span className="ml-1 text-wine-600">*</span>}
      </label>
      <div
        className={cn(
          "flex w-full overflow-visible rounded-xl border border-ink-200 bg-white transition-all duration-200 focus-within:border-wine-400 focus-within:ring-4 focus-within:ring-wine-100",
          error && "border-red-400 focus-within:border-red-500 focus-within:ring-red-100"
        )}
      >
        <div className="relative shrink-0 border-r border-ink-200">
          <BrandedSelect<string>
            options={countryOptions}
            value={country}
            onChange={onCountryChange}
            searchable
            ariaLabel="Country code"
            triggerClassName="!rounded-none !border-0 !bg-cream-50/60 !ring-0 focus:!ring-0 !px-3 !py-3.5 !shadow-none"
            renderTrigger={(sel) => (
              <span className="flex items-center gap-1.5 text-[14px] text-ink-700 sm:text-[15px]">
                <span aria-hidden="true" className="text-base leading-none">{(sel?.meta as string) ?? c.flag}</span>
                <span className="font-medium tabular-nums">
                  {sel ? COUNTRIES.find((co) => co.iso === sel.value)?.dial : c.dial}
                </span>
              </span>
            )}
            renderOption={(o) => (
              <span className="flex min-w-0 items-center gap-2">
                <span aria-hidden="true" className="text-base leading-none">{o.meta as string}</span>
                <span className="truncate">{o.label}</span>
              </span>
            )}
          />
        </div>
        <input
          id={id}
          name={id}
          type="tel"
          required={required}
          inputMode="tel"
          autoComplete="tel-national"
          placeholder={c.placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? `${id}-error` : undefined}
          className="block w-full bg-transparent px-4 py-3.5 text-[15px] text-ink-800 placeholder:text-ink-300 focus:outline-none sm:text-base"
        />
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-[12px] text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * PAGE EXPORT
 * ─────────────────────────────────────────────────────────────────────────────
 */
export default function CheckoutPage() {
  const router = useRouter();
  const razorpayKeyId = publicEnv.razorpayKeyId;

  const [values, setValues] = useState<Partial<FormValues>>({
    firstName: "",
    lastName: "",
    email: "",
    phoneCountry: DEFAULT_COUNTRY,
    phone: "",
    city: "",
    ageRange: "",
    primaryConcern: "",
    couponCode: "",
    consent: undefined,
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [rzpReady, setRzpReady] = useState(false);
  /**
   * Coupon-applied UX state. We don't validate codes against a server
   * discount table (none exists yet); the Apply button just confirms
   * visually that the typed code is registered into the form. If the
   * code matches the server-side BYPASS_COUPON_CODE, the actual bypass
   * still happens at Pay time in /api/razorpay/create-order — no
   * client-side reveal of the test code. If the user edits the input
   * after applying, the applied state resets so they re-confirm.
   */
  const [appliedCoupon, setAppliedCoupon] = useState<string>("");
  const leadIdRef = useRef<string | null>(null);
  const initFiredRef = useRef(false);

  // Hydrate from session on mount (returning user)
  useEffect(() => {
    const existing = getLead();
    if (existing) {
      leadIdRef.current = existing.leadId;
      // Re-derive the local digits from the stored E.164 number by stripping
      // the country dial code. We never store the dial code in `phone` state.
      const storedCountry = existing.phoneCountry || DEFAULT_COUNTRY;
      const c = getCountry(storedCountry);
      const localDigits = existing.phone.startsWith(c.dial)
        ? existing.phone.slice(c.dial.length).trim()
        : existing.phone;
      setValues({
        firstName: existing.firstName,
        lastName: existing.lastName,
        email: existing.email,
        phoneCountry: storedCountry,
        phone: localDigits,
        city: existing.city,
        ageRange: existing.ageRange,
        primaryConcern: existing.primaryConcern,
        couponCode: existing.couponCode ?? "",
        consent: existing.consent ? true : undefined,
      });
    } else {
      leadIdRef.current = generateLeadId();
    }
  }, []);

  const utm = useMemo(() => utmToObject(getStoredUtm()), []);

  function setField<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  /**
   * Schedule the abandoned-cart webhook once the form has a valid email + phone.
   * Server-side `scheduleAbandoned` is idempotent — re-arms with latest data.
   */
  async function fireInitIfReady(next: Partial<FormValues>) {
    const candidate = { ...values, ...next };
    if (
      !candidate.firstName ||
      !candidate.lastName ||
      !candidate.email ||
      !candidate.phone
    )
      return;
    const emailValid = z.string().email().safeParse(candidate.email).success;
    if (!emailValid) return;
    if (
      initFiredRef.current &&
      !next.firstName &&
      !next.lastName &&
      !next.email &&
      !next.phone
    ) {
      return;
    }
    initFiredRef.current = true;
    const country = getCountry(candidate.phoneCountry ?? DEFAULT_COUNTRY);
    const e164 = `${country.dial}${digitsOnly(candidate.phone)}`;
    try {
      await fetch("/api/checkout-init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: leadIdRef.current,
          firstName: candidate.firstName,
          lastName: candidate.lastName,
          email: candidate.email,
          phone: e164,
          phoneCountry: country.iso,
          city: candidate.city || undefined,
          ageRange: candidate.ageRange || undefined,
          primaryConcern: candidate.primaryConcern || undefined,
          couponCode: candidate.couponCode || undefined,
          utm,
          source: "checkout_form_blur",
        }),
      });
    } catch {
      // non-fatal
    }
  }

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as keyof FormValues;
        if (!fieldErrors[k]) fieldErrors[k] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    if (!rzpReady || !window.Razorpay) {
      setSubmitError("Payment gateway is still loading. Please retry in a moment.");
      return;
    }

    const leadId = leadIdRef.current ?? generateLeadId();
    leadIdRef.current = leadId;
    const country = getCountry(parsed.data.phoneCountry);
    const e164 = `${country.dial}${digitsOnly(parsed.data.phone)}`;
    const lead: CheckoutLead = {
      leadId,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      email: parsed.data.email,
      phone: e164,
      phoneCountry: country.iso,
      city: parsed.data.city,
      ageRange: parsed.data.ageRange,
      primaryConcern: parsed.data.primaryConcern,
      couponCode: parsed.data.couponCode || undefined,
      consent: true,
      createdAt: new Date().toISOString(),
    };
    saveLead(lead);

    setSubmitting(true);
    try {
      const orderRes = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.leadId,
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
          phone: lead.phone,
          // Forwarded so the server-side bypass branch can fire the Pabbly
          // purchase webhook with the full lead picture instead of just
          // the minimum identity fields.
          phoneCountry: lead.phoneCountry,
          city: lead.city,
          ageRange: lead.ageRange,
          primaryConcern: lead.primaryConcern,
          couponCode: lead.couponCode,
          utm,
        }),
      });
      if (!orderRes.ok) {
        const j = await orderRes.json().catch(() => ({}));
        throw new Error(j.error ?? "create_order_failed");
      }
      const order = (await orderRes.json()) as {
        orderId: string;
        amount: number;
        currency: string;
        keyId: string;
        bypass?: boolean;
        paymentId?: string;
      };

      // ───────── Bypass branch — coupon matched on the server ─────────
      // Server already fired the Pabbly purchase webhook and cancelled the
      // abandoned-cart timer. We mirror the Razorpay success handler: save
      // the lead with paid=true + synthetic ids, then route to /book-a-call.
      if (order.bypass && order.paymentId) {
        saveLead({
          ...lead,
          paid: true,
          paymentId: order.paymentId,
          orderId: order.orderId,
        });
        const params = new URLSearchParams();
        for (const [k, v] of Object.entries(utm)) params.set(k, v);
        params.set("pid", order.paymentId);
        params.set("bypass", "1");
        router.push(`/book-a-call?${params.toString()}`);
        return;
      }

      const rzp = new window.Razorpay({
        key: order.keyId || razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
        name: "PCOS Metabolic Assessment",
        description: "Akhila · 30-minute clinical assessment call",
        order_id: order.orderId,
        prefill: {
          name: `${lead.firstName} ${lead.lastName}`.trim(),
          email: lead.email,
          contact: lead.phone,
        },
        notes: { leadId: lead.leadId },
        theme: { color: "#D26C3C" },
        modal: { ondismiss: () => setSubmitting(false) },
        handler: async (response: RazorpayResponse) => {
          try {
            const verifyRes = await fetch("/api/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...response, lead: { ...lead, utm } }),
            });
            const j = (await verifyRes.json()) as {
              ok?: boolean;
              verified?: boolean;
              error?: string;
            };
            if (!verifyRes.ok || !j.verified) {
              setSubmitError(
                "Payment received but verification failed. Please contact us with your payment ID."
              );
              setSubmitting(false);
              return;
            }
            saveLead({
              ...lead,
              paid: true,
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
            });
            // Preserve UTMs into the next step
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(utm)) params.set(k, v);
            params.set("pid", response.razorpay_payment_id);
            router.push(`/book-a-call?${params.toString()}`);
          } catch (err) {
            const m = err instanceof Error ? err.message : "unknown_error";
            setSubmitError(`Verification error: ${m}`);
            setSubmitting(false);
          }
        },
      });
      rzp.open();
    } catch (err) {
      const m = err instanceof Error ? err.message : "Failed to start payment";
      setSubmitError(m);
      setSubmitting(false);
    }
  }

  const benefits = [
    "30-minute clinical assessment call with Akhila",
    "Full review of your PCOS history, symptoms & lifestyle",
    "Clear understanding of what is driving your specific pattern",
    "Honest assessment of whether the programme is the right fit",
    "If you enrol, this becomes the foundation of your programme",
  ];

  return (
    <>
      <Marquee />
      <main className="min-h-screen bg-cream-50">
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="afterInteractive"
          onLoad={() => setRzpReady(true)}
          onReady={() => setRzpReady(true)}
        />

        <section className="pb-20 pt-8 sm:pt-10 lg:pt-12">
        <div className="container-tight">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
            {/* LEFT: form */}
            <form onSubmit={handlePay} noValidate>
              <h1 className="font-display text-xl font-medium leading-tight text-ink-800 sm:text-[26px] lg:text-[28px]">
                Book your PCOS metabolic assessment
              </h1>
              <p className="mt-3 text-[14px] leading-relaxed text-ink-500 sm:text-[15px]">
                Fill in your details to secure your 30-minute clinical
                assessment call with Akhila.
              </p>

              <div className="mt-6 space-y-3.5 sm:mt-7">
                <div className="grid gap-3.5 sm:grid-cols-2">
                  <Field
                    id="firstName"
                    label="First name"
                    type="text"
                    required
                    autoComplete="given-name"
                    value={values.firstName ?? ""}
                    error={errors.firstName}
                    onChange={(v) => setField("firstName", v)}
                    onBlur={() => fireInitIfReady({})}
                  />
                  <Field
                    id="lastName"
                    label="Last name"
                    type="text"
                    required
                    autoComplete="family-name"
                    value={values.lastName ?? ""}
                    error={errors.lastName}
                    onChange={(v) => setField("lastName", v)}
                    onBlur={() => fireInitIfReady({})}
                  />
                </div>
                <Field
                  id="email"
                  label="Email address"
                  type="email"
                  required
                  autoComplete="email"
                  inputMode="email"
                  value={values.email ?? ""}
                  error={errors.email}
                  onChange={(v) => setField("email", v)}
                  onBlur={() => fireInitIfReady({})}
                />
                <div className="grid gap-3.5 sm:grid-cols-2">
                  <Field
                    id="city"
                    label="City"
                    type="text"
                    required
                    autoComplete="address-level2"
                    value={values.city ?? ""}
                    error={errors.city}
                    onChange={(v) => setField("city", v)}
                  />
                  <PhoneField
                    id="phone"
                    label="Phone (WhatsApp preferred)"
                    required
                    country={values.phoneCountry ?? DEFAULT_COUNTRY}
                    value={values.phone ?? ""}
                    error={errors.phone}
                    onCountryChange={(iso) => setField("phoneCountry", iso)}
                    onChange={(v) => setField("phone", v)}
                    onBlur={() => fireInitIfReady({})}
                  />
                </div>
                <div className="grid gap-3.5 sm:grid-cols-2">
                  <SelectField
                    id="ageRange"
                    label="Age range *"
                    value={values.ageRange ?? ""}
                    error={errors.ageRange}
                    onChange={(v) => setField("ageRange", v)}
                    options={[
                      { value: "", label: "Select…" },
                      { value: "Under 21", label: "Under 21" },
                      { value: "21–25", label: "21–25" },
                      { value: "26–30", label: "26–30" },
                      { value: "31–35", label: "31–35" },
                      { value: "36–40", label: "36–40" },
                      { value: "Over 40", label: "Over 40" },
                    ]}
                  />
                  <SelectField
                    id="primaryConcern"
                    label="Primary concern *"
                    value={values.primaryConcern ?? ""}
                    error={errors.primaryConcern}
                    onChange={(v) => setField("primaryConcern", v)}
                    options={[
                      { value: "", label: "Select…" },
                      { value: "Irregular cycles", label: "Irregular cycles" },
                      { value: "Weight that won't move", label: "Weight that won't move" },
                      { value: "Acne / hair fall / skin", label: "Acne / hair fall / skin" },
                      { value: "Fatigue / energy", label: "Fatigue / energy" },
                      { value: "Trying to conceive", label: "Trying to conceive" },
                      { value: "Insulin resistance", label: "Insulin resistance" },
                      { value: "Other", label: "Other" },
                    ]}
                  />
                </div>
              </div>

              {/* Consent + policy validation (above pay button per spec) */}
              <div className="mt-7 rounded-2xl border border-ink-100 bg-cream-100/60 p-4 sm:p-5">
                <label className="flex cursor-pointer items-start gap-3 text-[13px] leading-relaxed text-ink-600 sm:text-[14px]">
                  <input
                    type="checkbox"
                    checked={values.consent === true}
                    onChange={(e) =>
                      setField(
                        "consent",
                        e.target.checked ? (true as const) : (undefined as never)
                      )
                    }
                    className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-ink-300 text-wine-700 focus:ring-wine-300"
                    aria-invalid={errors.consent ? "true" : "false"}
                    aria-describedby={errors.consent ? "consent-error" : undefined}
                  />
                  <span>
                    I agree to the{" "}
                    <Link href="/terms" target="_blank" className="font-medium text-wine-700 underline-offset-4 hover:underline">
                      Terms of Use
                    </Link>
                    ,{" "}
                    <Link href="/privacy" target="_blank" className="font-medium text-wine-700 underline-offset-4 hover:underline">
                      Privacy Policy
                    </Link>{" "}
                    and{" "}
                    <Link href="/refund" target="_blank" className="font-medium text-wine-700 underline-offset-4 hover:underline">
                      Refund Policy
                    </Link>
                    . I understand the assessment fee is fully refundable if I gain
                    no clarity from the call with Akhila.
                  </span>
                </label>
                {errors.consent && (
                  <p id="consent-error" className="mt-2 text-[12px] text-red-600">
                    {errors.consent}
                  </p>
                )}
              </div>

              {submitError && (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700 sm:text-sm">
                  {submitError}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className={cn("btn-primary-lg mt-6 w-full sm:mt-7", submitting && "cursor-wait")}
              >
                {submitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner /> Processing…
                  </span>
                ) : (
                  <>
                    <LockIcon className="h-4 w-4" strokeWidth={2} />
                    <span>Pay {formatINR(FEE_INR)} · Secure slot</span>
                  </>
                )}
              </button>

              <p className="mt-4 flex items-center justify-center gap-2 text-[12px] text-ink-400 sm:text-[13px]">
                <LockIcon className="h-3 w-3" />
                256-bit SSL · Razorpay · Cards · UPI · Wallets · Netbanking
              </p>
            </form>

            {/* RIGHT: order summary */}
            <aside>
              <div className="lg:sticky lg:top-6">
                <div className="rounded-3xl border border-wine-200/40 bg-white p-6 shadow-premium-lg sm:p-7">
                  <div className="flex items-center gap-3">
                    <span className="icon-disc icon-disc-wine h-10 w-10 shrink-0 !rounded-full">
                      <StethoscopeIcon className="relative h-4 w-4" />
                    </span>
                    <p className="font-display text-base font-medium text-ink-800 sm:text-lg">
                      PCOS Metabolic Assessment
                    </p>
                  </div>
                  <p className="mt-3 text-[13px] leading-relaxed text-ink-500 sm:text-sm">
                    30 minutes with Akhila. A structured clinical conversation
                    to understand your specific situation. Refundable.
                  </p>

                  <ul className="mt-5 space-y-2.5">
                    {benefits.map((b) => (
                      <li key={b} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-ink-600 sm:text-[14px]">
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-wine-700/10 text-wine-700">
                          <CheckIcon className="h-2.5 w-2.5" strokeWidth={2.5} />
                        </span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Coupon code — captured into the lead. The bypass branch
                      (server-side BYPASS_COUPON_CODE) kicks in at Pay time,
                      not here, so this Apply button only confirms visually
                      that the typed code is registered. */}
                  {(() => {
                    const couponValue = (values.couponCode ?? "").trim();
                    const isApplied = appliedCoupon.length > 0 && couponValue === appliedCoupon;
                    return (
                      <>
                        <div
                          className={cn(
                            "mt-6 flex items-stretch gap-2 rounded-xl border bg-cream-50/70 px-3 py-2 transition-colors duration-200",
                            isApplied
                              ? "border-gold-300/70 bg-gold-50/50"
                              : "border-ink-100"
                          )}
                        >
                          <input
                            id="couponCode"
                            type="text"
                            autoComplete="off"
                            placeholder="Have a coupon code?"
                            value={values.couponCode ?? ""}
                            onChange={(e) => {
                              setField("couponCode", e.target.value);
                              if (appliedCoupon && e.target.value.trim() !== appliedCoupon) {
                                setAppliedCoupon("");
                              }
                            }}
                            aria-label="Coupon code"
                            className="flex-1 bg-transparent text-[13px] text-ink-700 placeholder:text-ink-400 focus:outline-none sm:text-[14px]"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (couponValue.length === 0) return;
                              setAppliedCoupon(couponValue);
                            }}
                            disabled={couponValue.length === 0 || isApplied}
                            className={cn(
                              "inline-flex shrink-0 items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors sm:text-[12px]",
                              isApplied
                                ? "text-gold-700"
                                : couponValue.length === 0
                                  ? "cursor-not-allowed text-ink-300"
                                  : "text-wine-700/80 hover:text-wine-800"
                            )}
                          >
                            {isApplied ? (
                              <>
                                <CheckIcon className="h-3 w-3" strokeWidth={2.5} />
                                Applied
                              </>
                            ) : (
                              "Apply"
                            )}
                          </button>
                        </div>
                        {isApplied && (
                          <p className="mt-2 flex items-center gap-1.5 text-[11.5px] leading-snug text-gold-700 sm:text-[12px]">
                            <CheckIcon className="h-3 w-3" strokeWidth={2.5} />
                            Code <span className="font-medium uppercase">{appliedCoupon}</span> registered. It will be applied at payment.
                          </p>
                        )}
                      </>
                    );
                  })()}

                  <div className="mt-6 flex items-baseline justify-between border-t border-ink-100 pt-5">
                    <span className="text-sm text-ink-500">Total today</span>
                    <span className="font-display text-[26px] font-medium text-ink-800 sm:text-[32px]">
                      {formatINR(FEE_INR)}
                    </span>
                  </div>
                  <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gold-50 px-3 py-1 text-[11px] font-medium text-gold-700 sm:text-[12px]">
                    <ShieldIcon className="h-3 w-3" />
                    Fully refundable if no clarity from Akhila's call
                  </p>
                </div>

                <p className="mt-4 text-center text-[12px] leading-relaxed text-ink-400 sm:text-[13px]">
                  By proceeding you confirm the details above are accurate.
                  Confirmation lands in your inbox immediately after payment.
                </p>
              </div>
            </aside>
          </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
