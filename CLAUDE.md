# CLAUDE.md — Akhila PCOS Metabolic Programme Funnel

> **Do not give any output until you are 90% confident yourself.**
> If you are uncertain, read the relevant file end-to-end (or grep the repo) before you answer. This codebase is a live conversion funnel where copy, price, and webhook behaviour are revenue-critical — bad guesses cost real money.

---

## The client in 60 seconds

A premium, mobile-first conversion funnel built for **Dr. Aditya (senior family physician) and Akhila (clinical nutritionist)**. They sell a 90-day physician-led **PCOS Metabolic Programme** targeted at Indian women who have "tried everything" for PCOS and want a root-cause workup (fasting insulin, HOMA-IR, cortisol, gut markers) rather than another oral pill.

The site itself doesn't sell the programme — it sells a low-ticket **PCOS Metabolic Assessment** (price set via `NEXT_PUBLIC_ASSESSMENT_FEE_INR`, currently ₹97). The assessment payment unlocks a Calendly call, and the actual programme is closed on that call. So the funnel's whole job is: **Meta ad → landing → ₹97 paid assessment → Calendly booking**.

Tone is editorial / clinical-premium (Fraunces + Inter, warm peach / wine palette). India-only (INR, Razorpay, Calendly, English).

---

## The funnel at a glance

```
META ADS (utm_*)  →  /  →  /checkout  →  Razorpay  →  /book-a-call  →  /thank-you
                                                              │
                                          /terms · /privacy · /refund  (linked in footer)
```

Data plumbing:

1. **UTM capture** — `src/app/layout.tsx` injects an inline `<script>` that reads `utm_*` / `fbclid` / `gclid` from the URL on every load and persists to `sessionStorage` + a 30-day cookie (`akhila_utm_v1`). Every CTA appends those UTMs to its href via `withUtm()` in [src/lib/utm.ts](src/lib/utm.ts), so attribution survives the whole funnel.
2. **Abandoned-cart timer** — When the user blurs the first checkout field, the client POSTs to `/api/checkout-init`, which calls `scheduleAbandoned(leadId, payload)` in [src/lib/abandonedCart.ts](src/lib/abandonedCart.ts). After `ABANDONED_CART_DELAY_MINUTES` (default 240) the timer fires `PABBLY_ABANDONED_WEBHOOK_URL` — **unless** payment lands first.
3. **Payment** — `POST /api/razorpay/create-order` opens Razorpay Checkout in the browser. On success the client POSTs the signature to `/api/razorpay/verify`, which HMAC-verifies it, calls `cancelAbandoned(leadId)`, and fires `PABBLY_PURCHASE_WEBHOOK_URL`. **The purchase webhook only fires after signature verification — never trust the browser callback alone.**
4. **Bypass coupon** — `BYPASS_COUPON_CODE` env var lets internal testers skip Razorpay entirely. `create-order` fires the purchase webhook with a synthetic `BYPASS-…` payment id and returns `{ bypass: true }` so the client routes straight to `/book-a-call`.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | **Next.js 15** (App Router) + React 19, TypeScript strict |
| Dev / build | Turbopack (`next dev --turbopack`) |
| Styling | Tailwind CSS 3.4 + custom CSS in `src/app/globals.css` |
| Fonts | Fraunces (display) + Inter (body) via `next/font/google` |
| Motion | `motion` (Framer Motion v12), respects `prefers-reduced-motion` |
| Validation | `zod` for env + API request schemas |
| Payments | **Razorpay** Checkout.js (browser) + Razorpay Node SDK (server) |
| Webhooks | **Pabbly** (purchase + abandoned-cart) |
| Booking | Calendly embed on `/book-a-call` |
| Hosting | Long-running Node host (Render/Railway/fly/VPS). **NOT pure serverless** — see warning below. |
| Demo deploy | GitHub Pages static export, gated by `STATIC_EXPORT=true` (no API routes there). |

**Serverless warning.** Abandoned-cart timers use in-memory `setTimeout` + `Map` (HMR-safe via `globalThis`). They evaporate on Vercel/Netlify Functions cold-starts. To deploy serverless, swap `scheduleAbandoned` / `cancelAbandoned` in [src/lib/abandonedCart.ts](src/lib/abandonedCart.ts) for Upstash QStash, Vercel Cron + KV, or Inngest. Keep the `fire()` signature.

---

## File map — where everything lives

```
src/app/
├── layout.tsx               GLOBAL root — fonts, root metadata, JSON-LD, UTM capture <script>
├── globals.css              Brand colors, Tailwind layers, base styles
├── opengraph-image.tsx      Dynamic OG image (1200×630 PNG)
├── sitemap.ts · robots.ts   SEO
├── page.tsx                 LANDING — composes sections from src/components/landing/sections/
│
├── checkout/
│   ├── page.tsx             CHECKOUT (use client) — form, Razorpay handoff, summary
│   └── layout.tsx           5-line metadata stub (client pages can't export metadata)
├── book-a-call/
│   ├── page.tsx             Calendly embed + prep cards (use client)
│   └── layout.tsx           metadata stub
├── thank-you/page.tsx       Confirmation + prep notes
├── terms/page.tsx           Edit clauses inside the `sections` array
├── privacy/page.tsx         Edit clauses inside the `sections` array
├── refund/page.tsx          Edit clauses inside the `sections` array
│
└── api/                     All Node runtime, all server-only
    ├── checkout-init/route.ts          POST — schedule abandoned-cart timer
    ├── razorpay/create-order/route.ts  POST — make Razorpay order (or bypass)
    ├── razorpay/verify/route.ts        POST — HMAC verify + fire purchase webhook
    └── razorpay/webhook/route.ts       Redundant server-to-server webhook from Razorpay

src/components/
├── site-chrome.tsx                  Marquee, StickyCTA, Footer (shared across pages)
└── landing/
    ├── icons.tsx                    All landing SVG icons
    ├── shared-static.tsx            Server-safe shared bits
    ├── shared-client.tsx            Client-only shared bits (animations etc.)
    └── sections/                    One file per landing section
        hero · deliverables · client-results · akshita-testimonial ·
        team · eligibility · investment · guarantee · faq · closer

src/lib/                              Pure logic. No JSX.
├── env.ts             Zod-validated env access. publicEnv + getServerEnv().
├── utm.ts             UTM read/write (URL ↔ sessionStorage ↔ cookie ↔ href)
├── session.ts         Lead state passed across funnel steps
├── utils.ts           cn() + formatINR()
├── razorpay.ts        Razorpay SDK init + HMAC verifiers (server-only)
├── pabbly.ts          sendPurchaseWebhook / sendAbandonedWebhook (server-only)
└── abandonedCart.ts   In-memory setTimeout scheduler (server-only)

public/                               favicon + image assets
.env.example                          Authoritative list of env vars (copy to .env.local)
next.config.ts                        Security headers, image config, STATIC_EXPORT branch
tailwind.config.ts                    Brand palette + design tokens
```

---

## Where to edit what

| I want to change… | Open this file |
|---|---|
| Landing copy / sections / animations | Section file under `src/components/landing/sections/` |
| Landing page composition (order of sections) | `src/app/page.tsx` |
| Marquee / StickyCTA / Footer | `src/components/site-chrome.tsx` |
| Checkout form, validation, summary, pay button | `src/app/checkout/page.tsx` |
| Calendly URL, prep cards | `src/app/book-a-call/page.tsx` + `NEXT_PUBLIC_CALENDLY_URL` |
| Thank-you content | `src/app/thank-you/page.tsx` |
| Terms / Privacy / Refund clauses | `src/app/{terms,privacy,refund}/page.tsx` (the `sections` array) |
| Site-wide `<head>`, JSON-LD, UTM script, fonts | `src/app/layout.tsx` |
| Brand colors / fonts / button styles | `src/app/globals.css` + `tailwind.config.ts` |
| OG share image | `src/app/opengraph-image.tsx` |
| Payment logic | `src/app/api/razorpay/*` + `src/lib/razorpay.ts` |
| Abandoned-cart logic | `src/lib/abandonedCart.ts` + `src/lib/pabbly.ts` |
| Price tag everywhere | `NEXT_PUBLIC_ASSESSMENT_FEE_INR` in `.env.local` (restart dev — Next inlines at build) |
| Webhook URLs, abandoned delay | `.env.local` |

---

## Environment variables (see `.env.example` for the full list)

| Var | Purpose |
|---|---|
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Server-side payment gateway |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Same key id, exposed to browser for Checkout.js |
| `RAZORPAY_WEBHOOK_SECRET` | (Optional) signs `/api/razorpay/webhook` |
| `NEXT_PUBLIC_ASSESSMENT_FEE_INR` | Single source of truth for the price tag (default 97) |
| `PABBLY_PURCHASE_WEBHOOK_URL` | Fires on verified payment success |
| `PABBLY_ABANDONED_WEBHOOK_URL` | Fires after abandoned-cart delay if no payment |
| `ABANDONED_CART_DELAY_MINUTES` | Default 240 (4 hours) |
| `NEXT_PUBLIC_CALENDLY_URL` | Calendly link on `/book-a-call` |
| `BYPASS_COUPON_CODE` | Server-only internal-test coupon |

---

## Dev quick start

```bash
cp .env.example .env.local      # fill in real keys
npm install
npm run dev                     # Turbopack · http://localhost:3000
```

Useful scripts: `npm run build`, `npm start`, `npm run typecheck`, `npm run lint`.
Stale build? `rm -rf .next node_modules/.cache tsconfig.tsbuildinfo && npm run dev`.

---

## Conventions any agent should follow

- **Mobile-first.** Most users land from Meta ads on phones. Test mobile layout before desktop.
- **Don't break attribution.** Any CTA that points to `/checkout`, `/book-a-call`, etc. must go through `withUtm()` from `src/lib/utm.ts`. Raw `<Link href="/checkout">` drops UTMs.
- **Don't fire webhooks from the browser.** Purchase + abandoned webhooks only fire from `src/app/api/*` after server-side validation.
- **`NEXT_PUBLIC_*` is inlined at build time.** Changing the price requires a dev-server restart.
- **Pages with `"use client"` can't export `metadata`.** That's why `/checkout` and `/book-a-call` have a tiny `layout.tsx` next to `page.tsx`.
- **Razorpay signature verification is non-negotiable** — never skip the HMAC check in `verify/route.ts`. The browser-side success callback is suggestive, not authoritative.
- **Reduced motion.** All Framer animations respect `prefers-reduced-motion` — keep it that way.

---

> Reminder: **Do not give any output until you are 90% confident yourself.** When unsure, read the file or grep before you commit to an answer.
