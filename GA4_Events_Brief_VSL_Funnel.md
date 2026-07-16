# GA4 Event Implementation Brief — VSL Funnel (Next.js)

> **v2.0** — supersedes v1.0. Two rules changed materially; see **What changed in v2.0** at the bottom before reusing this on a funnel that already shipped v1.0.

## How to use this brief (READ FIRST, MANDATORY)

You are a coding agent working in a Next.js codebase. This document specifies GA4 (Google Analytics 4) event tracking to add to a VSL funnel.

**Do NOT start editing yet.** First, do the following and then STOP:

1. Read this entire brief.
2. Inspect the codebase to locate: the GA4 base tag / `gtag.js` setup, the four funnel pages (landing/VSL, checkout, book-a-call, thank-you), the VSL video component and its play control, the landing-page CTA button(s), the checkout form and its submit/pay button plus its validation logic, and the main button on the book-a-call page.
3. Produce a short written summary back to the user containing: (a) exactly which files you will change, (b) exactly what you will add to each, (c) how you will trigger each event (the specific element/handler), (d) any place where the codebase does not match this brief's assumptions (for example, a missing base tag, a different video library, a booking page with no button of its own), and (e) any decisions you need the user to make.
4. **Wait for the user to explicitly approve.** Only after the user says to proceed may you edit or run anything.

Do not install packages, refactor unrelated code, or change styling. Keep the change surface minimal and additive.

---

## Context

- This is a VSL (video sales letter) funnel with four pages, in order: landing/VSL page → checkout → book-a-call → thank-you.
- GA4 is already set up on the site (a base `gtag.js` tag with a `G-XXXXXXX` Measurement ID). Your job is to add a small set of front-end event calls, not to reconfigure GA4.
- All events are fired natively on the front end via `gtag('event', ...)`. This tracking must be INDEPENDENT of any Meta Pixel / Meta CAPI tracking that may also exist in the code. Do not read from, depend on, or copy values out of any Meta tracking.

## Hard rules

1. **Independent of Meta.** Do not pass any Meta value, Meta event ID, or purchase amount sourced from Meta into these GA4 events. If Meta tracking exists on the same button, leave it untouched and add the GA4 call alongside it.
2. **No monetary values.** Fire every event below with NO `value`, NO `currency`, NO revenue parameters. These GA4 events are pure event counts. (This is deliberate: it keeps GA4 counts independent from Meta's monetary numbers.)
3. **Exact event names.** Use these exact strings, lowercase with underscores, no variations:
   - `video_play`
   - `add_to_cart`
   - `initiate_checkout`
   - `book_call`
4. **No `purchase` event.** This VSL funnel intentionally does NOT fire a `purchase` event in GA4. Do not add one. (Checkout completion is measured separately via the thank-you page view, which GA4 tracks automatically. You do not need to do anything for that.)
5. **ONCE PER BROWSER — all four events.** Every event fires at most once per browser, ever. Enforce with a `localStorage` flag per event (e.g. `<prefix>_ga4_<event>_fired`). These are reach/intent counts, not volume counts: we want "how many people did X", not "how many times". Implementation rules:
   - **Stamp the flag BEFORE calling `gtag`** — a CTA click navigates away immediately after, and an un-stamped flag double-fires.
   - **If `localStorage` throws** (private mode), fire anyway and accept best-effort dedup. An extra count beats a lost one.
   - **Do NOT stamp the flag when GA4 is absent** (see trap #2) — otherwise the event is permanently suppressed for that browser and can never fire on production.
   - Use the funnel's existing storage prefix (`akhila_`, `fm4_`, …). Don't invent a new one.
6. **Additive only.** Do not remove or modify existing analytics. Do not change routing, styling, or business logic.

## The events to add (VSL funnel)

| Event name | Page | Fires when | Trigger detail |
|---|---|---|---|
| `video_play` | Landing / VSL page | The **top VSL video actually starts playing** | Prefer the player's real play event (Vimeo SDK `player.on('play')`, HTML5 `<video onPlay>`) over the thumbnail click — a click that never loads isn't a play. **If the video component is shared with other videos on the site (thank-you video, testimonials), scope this to the hero VSL only** via an opt-in prop; do not fire it from inside the shared component unconditionally. |
| `add_to_cart` | Landing / VSL page | User clicks ANY CTA button that advances toward checkout | Attach to every such CTA (hero, mid-page, pricing card, closing, **sticky bar**). Inventory them all — a sticky/floating bar is easy to miss and often is NOT the same component as the others. Gate on the CTA's destination (e.g. `href === '/checkout'`) so unrelated CTAs don't fire it. Still once per browser overall. |
| `initiate_checkout` | Checkout page | User clicks the pay/submit button for the **first time — regardless of validation** | **Fire at the TOP of the submit handler, BEFORE validation runs.** The signal is "did they attempt to pay". A half-filled form that bounces off validation still counts — they clicked Pay, and the validation errors are their own feedback loop. Do NOT fire on page load. (See **What changed in v2.0** — this reverses v1.0.) |
| `book_call` | Book-a-call page | User schedules a call | If the page has a real booking button of yours, attach to it. **If booking happens inside an embedded iframe (Calendly/Cal.com/etc.), there is no button to attach to** — listen for the embed's postMessage instead. Calendly: `window.addEventListener('message', …)` and match `e.data.event === 'calendly.event_scheduled'`, **origin-checked** (`e.origin.endsWith('calendly.com')`). That fires on an actual booking, which is the signal worth having. |

## Implementation notes

- **Call `gtag('event', …)` directly.** See trap #1 — do not assume an existing "analytics wrapper" reaches GA4.
- Guard it so SSR doesn't break: `if (typeof window !== 'undefined' && typeof window.gtag === 'function') { window.gtag('event', 'add_to_cart'); }`
- The call shape is simply the event name with no params: `gtag('event', 'video_play')`.
- Put the guard + dedup in ONE small helper (e.g. `src/lib/ga4.ts` exporting `trackGa4EventOnce(event)`) and call that everywhere. Don't scatter raw `window.gtag` calls.
- Wrap the `gtag` call in try/catch. Analytics must never throw into a click handler.
- Do not fire duplicate events. A direct synchronous `gtag` call before routing is fine — it does not need to await anything.

## Known traps (found the hard way — check each one)

1. **A `dataLayer.push({event: 'x'})` helper is NOT a GA4 event.** Many funnels have a "vendor-neutral" analytics wrapper that pushes GTM-style objects to `window.dataLayer`. With a raw `gtag.js` install (no GTM container), **gtag.js ignores those pushes entirely** — they reach nothing. `gtag()` pushes an `arguments` object, which is a different shape. So: an existing wrapper is not evidence GA4 events work. Grep for an actual `gtag('event'` call. If there are none, you're adding the first ones.
2. **The GA4 tag may be production-host gated.** Funnels often wrap the GA4 snippet in `if (window.location.hostname !== PROD_HOST) return;` to keep dev/preview traffic out of reports. Then `window.gtag` **does not exist on localhost or preview deploys** and none of these events can be tested there. Report this to the user: DebugView can only be exercised on the live domain after deploy.
3. **`?debug_mode=1` may not work on a plain gtag.js install.** DebugView normally needs `gtag('config', ID, { debug_mode: true })` or the GA Debug browser extension. Don't promise the URL param works without checking the config.
4. **The booking page often has no button** (iframe embed) — see `book_call` above. A visible "Continue" button may be a **dev-only fallback** that renders only when the embed URL env var is unset. Read the branch before attaching to it.
5. **The VSL player component may be reused** for other videos. Scope `video_play` to the hero.

## After approval: verification steps to report back

Once you have made the edits, report to the user how to verify (do not claim success without this):

1. In GA4, open Admin → DebugView.
2. On the site (**the production domain** if the tag is host-gated — see trap #2), enable debug via the GA Debug extension or a `debug_mode: true` config.
3. Walk the funnel: play the VSL video, click a landing CTA, click the checkout Pay button, book a slot.
4. Confirm each of `video_play`, `add_to_cart`, `initiate_checkout`, `book_call` appears in DebugView in real time.
5. **Re-do the walk in the same browser** — nothing should fire a second time (the once-per-browser flags). To re-test, clear the site's `localStorage` (or use a fresh incognito window).

Also tell the user:
- These events do not backfill; they count only from deployment forward.
- Mark `initiate_checkout` and `book_call` as Key Events in GA4 (Admin → Key events) after they've fired at least once.
- Because of the once-per-browser rule, these are **unique-visitor counts**, not raw click counts, and cross-device/incognito/cleared-storage visitors will re-count. Calibrate expectations before anyone compares them to Meta's numbers.

## Deliverable summary you must produce BEFORE editing

Restate: the files you will touch, the exact trigger point for each of the four events, any mismatch between this brief and the actual code, and any decision you need from the user. Then wait for explicit approval.

---

## What changed in v2.0

Two material reversals from v1.0. If a funnel already shipped v1.0, these are behaviour changes, not no-ops:

1. **Once per browser, all four events** (was: no dedup specified — every CTA click fired `add_to_cart`, every play fired `video_play`). Counts will DROP after this change and now represent unique visitors. This is intended.
2. **`initiate_checkout` now fires BEFORE validation, on the first Pay click** (v1.0 said: *"fire this only after form validation passes… do NOT fire on a half-filled form"*). The intent changed: we want to capture Pay-button attempts, including ones that bounce off validation. Counts will RISE relative to v1.0.

Also added: the **Known traps** section, the shared-VSL-component scoping rule for `video_play`, and the iframe/postMessage guidance for `book_call`.

> If a funnel needs the strict v1.0 `initiate_checkout` semantics (validated-only), that is a *different* signal — track it separately under its own name rather than redefining `initiate_checkout`.
