# Akhila — PCOS Metabolic Programme Funnel

A premium, mobile-first conversion funnel built in Next.js 15 + React 19 + Tailwind for Dr. Aditya & Akhila.

```
META ADS (utm_*)  →  /  →  /checkout  →  /book-a-call  →  /thank-you
                                ▲
                                └─ /terms · /privacy · /refund (linked in footer + checkout consent)
```

## File structure — one file per page

Each page is **self-contained**. All UI, icons, navbar, footer, sections, forms — everything that renders that page — lives in its single `page.tsx`. Open the file, edit what you want, done. No hunting through component folders.

```
src/app/
├── layout.tsx              GLOBAL: fonts, root metadata, JSON-LD, UTM capture script
├── globals.css             GLOBAL: brand colors, Tailwind components, base styles
├── opengraph-image.tsx     GLOBAL: dynamic OG image (1200×630 PNG)
├── sitemap.ts              GLOBAL: sitemap.xml
├── robots.ts               GLOBAL: robots.txt
│
├── page.tsx                ◄── LANDING — all 7 sections + Navbar + Footer + icons
├── checkout/
│   ├── page.tsx            ◄── CHECKOUT — form + summary + Razorpay + minimal header
│   └── layout.tsx          (5-line metadata stub — checkout is "use client")
├── book-a-call/
│   ├── page.tsx            ◄── BOOK A CALL — Calendly embed + instructions + footer
│   └── layout.tsx          (5-line metadata stub — book-a-call is "use client")
├── thank-you/page.tsx      ◄── THANK YOU — confirmation + prep notes + footer
├── terms/page.tsx          ◄── TERMS — sections array, edit clauses inline
├── privacy/page.tsx        ◄── PRIVACY — sections array, edit clauses inline
├── refund/page.tsx         ◄── REFUND — sections array, edit clauses inline
│
└── api/                    Server-side payment + webhook routes
    ├── checkout-init/
    ├── razorpay/
    │   ├── create-order/
    │   ├── verify/
    │   └── webhook/
    └── ...

src/lib/                    GLOBAL utilities (pure logic, no UI)
├── env.ts                  Validated env access
├── utm.ts                  UTM read/write (URL ↔ sessionStorage ↔ cookie)
├── session.ts              Lead state across funnel steps
├── utils.ts                cn() + formatINR()
├── razorpay.ts             Razorpay client + HMAC verifiers (server)
├── pabbly.ts               Webhook senders (server)
└── abandonedCart.ts        In-memory scheduler with setTimeout (server)
```

**Why two files for /checkout and /book-a-call?** Those pages are interactive (forms, Razorpay, useSearchParams), which forces `"use client"`. Next.js does not allow `export const metadata` from client files, so a 5-line server-side `layout.tsx` lives alongside the page just to declare the title + noindex. Edit the visible page content in `page.tsx` — only touch `layout.tsx` to change the tab title.

## Quick start

```bash
cd akhila-funnel
cp .env.example .env.local      # fill in real keys (see below)
npm install
npm run dev                     # Turbopack dev server · http://localhost:3000
```

Production:
```bash
npm run build
npm start                       # long-running Node — required for abandoned-cart timers
```

### npm scripts at a glance

| Script | What it runs |
|---|---|
| `npm run dev` | Turbopack dev server · http://localhost:3000 |
| `npm run build` | Production build |
| `npm start` | Start the production server |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | Next ESLint |

If dev ever feels stale, nuke the build cache and restart:

```bash
rm -rf .next node_modules/.cache tsconfig.tsbuildinfo
npm run dev
```

## Environment variables

| Variable | Purpose |
|---|---|
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Server-side payment gateway |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Same key id, exposed to browser for Checkout.js |
| `RAZORPAY_WEBHOOK_SECRET` | (Optional) For the redundant `/api/razorpay/webhook` endpoint |
| `ASSESSMENT_FEE_INR` | Amount charged. Default `497`. |
| `PABBLY_PURCHASE_WEBHOOK_URL` | Fired on **verified** payment success |
| `PABBLY_ABANDONED_WEBHOOK_URL` | Fired after `ABANDONED_CART_DELAY_MINUTES` if form filled but no payment |
| `ABANDONED_CART_DELAY_MINUTES` | Default `240` (4 hours). Configurable. |
| `NEXT_PUBLIC_CALENDLY_URL` | Calendly link embedded on `/book-a-call` |

## The funnel brain — how data flows

```
1. User lands on `/`  ──────────►  Inline <script> in layout.tsx reads utm_*/fbclid/gclid
                                   from URL → sessionStorage + 30-day cookie.
2. User clicks "Book Assessment" ─►  CtaLink reads stored UTMs at click time, appends
                                     them to /checkout URL.
3. User types name/email/phone on `/checkout`:
       onBlur ──► POST /api/checkout-init
                  └► scheduleAbandoned(leadId, payload)
                     └► timer fires after ABANDONED_CART_DELAY_MINUTES
                        └► POST PABBLY_ABANDONED_WEBHOOK_URL (only if no payment)
4. User clicks Pay ─► POST /api/razorpay/create-order ─► Razorpay Checkout opens
5. Payment succeeds ─► handler() POSTs /api/razorpay/verify
                       ├─ HMAC-verifies the signature
                       ├─ cancelAbandoned(leadId)              ◄── kills the abandoned timer
                       └─ POST PABBLY_PURCHASE_WEBHOOK_URL     ◄── ONLY fires on verified success
6. Redirect to /book-a-call (UTMs preserved)
7. Calendly embed → /thank-you (UTMs still preserved)
```

### Sample purchase webhook payload (POST → `PABBLY_PURCHASE_WEBHOOK_URL`)

```json
{
  "leadId": "lead_abc_xyz",
  "fullName": "Priya R",
  "email": "priya@example.com",
  "phone": "+91 9XXXXXXXXX",
  "city": "Mumbai",
  "ageRange": "26–30",
  "primaryConcern": "Irregular cycles",
  "utm": {
    "utm_source": "facebook",
    "utm_medium": "paid_social",
    "utm_campaign": "pcos_meta_q2",
    "fbclid": "IwAR..."
  },
  "paymentId": "pay_PXXXXXXXX",
  "orderId":   "order_OXXXXXXXX",
  "amountInr": 497,
  "paidAt":    "2026-05-15T10:23:14.000Z",
  "source":    "razorpay_verify"
}
```

The abandoned webhook payload is identical minus `paymentId` / `orderId` / `paidAt`.

## Where to edit what

| I want to change… | Open this file |
|---|---|
| Landing copy, sections, animations | `src/app/page.tsx` |
| Checkout form fields, validation, summary, pay button | `src/app/checkout/page.tsx` |
| Calendly URL, instruction cards | `src/app/book-a-call/page.tsx` |
| Thank-you content, prep notes | `src/app/thank-you/page.tsx` |
| Terms / Privacy / Refund clauses | `src/app/{terms,privacy,refund}/page.tsx` (edit the `sections` array) |
| Page tab title (checkout / book-a-call) | `src/app/{checkout,book-a-call}/layout.tsx` |
| Tab title for static pages | `metadata` export inside `page.tsx` |
| Site-wide metadata, JSON-LD, UTM tracker, fonts | `src/app/layout.tsx` |
| Brand colors, fonts, base CSS, button styles | `src/app/globals.css` + `tailwind.config.ts` |
| OG image (social share preview) | `src/app/opengraph-image.tsx` |
| Razorpay/Pabbly webhook URLs, abandoned delay | `.env.local` |
| Payment gateway logic | `src/app/api/razorpay/*` + `src/lib/razorpay.ts` |
| Abandoned-cart timer logic | `src/lib/abandonedCart.ts` |
| Webhook payload shape | `src/lib/pabbly.ts` |

## Serverless deployment note

The current abandoned-cart implementation uses an in-memory `Map` + `setTimeout`. This works on:
- VPS, Render, Railway, fly.io
- Any container/long-running Node host
- `next start` on a managed server

It **does not work** on pure-serverless platforms (Vercel/Netlify Functions). For those, swap to Upstash QStash, Vercel Cron + KV, or Inngest. The integration surface is `scheduleAbandoned` / `cancelAbandoned` in `src/lib/abandonedCart.ts`.

## Adding real images & video

See [public/images/README.md](public/images/README.md) for expected paths and snippets for swapping each `<ImagePlaceholder>` with a real `<Image>` / `<video>`.

## Design system at a glance

- **Heading font:** Fraunces (editorial premium serif)
- **Body font:** Inter (clean, modern sans)
- **Brand palette:** wine `#5A1E30`, gold `#C19632`, cream `#FDFBF7`, ink `#1A1412`
- **Spacing:** mobile-first, generous; container max-width 68rem
- **Motion:** Framer Motion with `prefers-reduced-motion` respect
- **Animations:** subtle fade-up on scroll, pulse-ring on play button, hover lift on cards
