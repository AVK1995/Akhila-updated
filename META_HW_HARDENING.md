# Meta Health & Wellness — Funnel Hardening (events / payload / URL / names)

**What this is.** The events-and-data-side hardening applied to this funnel so
that **even if Meta classifies the dataset under "Health & wellness condition,"
the custom conversion event keeps flowing and optimizing.** It does **not** stop
the classification itself (that is driven by domain + landing copy + ad
creative, which we deliberately left unchanged here) — it makes the
classification **harmless** by pre-building the corrective bypass.

> Honest expectation (per `META_HW_POST_FIX_ROADMAP.md`): the warning, if it
> comes, will likely **not** disappear. Success = the custom `sales` event keeps
> flowing + campaigns keep optimizing. Confidence ~7–7.5/10 over 30 days.

---

## Complete event inventory (post-hardening)

| Event | Surface | Sent to Meta? | Payload |
|---|---|---|---|
| `PageView` | Browser — inline script ([layout.tsx](src/app/layout.tsx)) + [MetaPageView.tsx](src/components/MetaPageView.tsx) | ✅ | auto `fbp/fbc/IP/UA/URL` + hashed MAM (`em,ph,fn,ln,ct,country,external_id`) if `akhila_mam` cookie present. No health params. |
| MAM `init` | Browser — [analytics.ts](src/lib/analytics.ts) `setMetaAdvancedMatching` | ✅ (identity only) | hashed `em,ph,fn,ln,ct,country,external_id` → `akhila_mam` cookie. EMQ engine. |
| `VideoPlayClick/Start/Progress/Complete` | Browser — [analytics.ts](src/lib/analytics.ts) `trackVideoEvent` | ❌ **dataLayer only** | `{video_id, video_title, percent}` to `window.dataLayer`. **Never sent to Meta** (would leak the video title). |
| **`sales`** (custom) | Server CAPI — [meta.ts](src/lib/meta.ts), `event_id = razorpay_payment_id` | ✅ | `user_data` = 11 signals (hashed PII + raw `fbc/fbp/IP/UA`) → EMQ 9.5+. `custom_data` = **`{value, currency}` only**. `event_source_url` = **origin only**. |
| ~~`Purchase`~~ (standard) | — | ❌ **removed** | Standard events are blocked by name for H&W datasets. We never depend on it; ad sets optimize directly on `sales`. |
| `CallBooked` | Apps Script ([appscript/code.gs](appscript/code.gs)) | ✅ | `user_data` (11 signals). `custom_data` = `{}`. origin-only URL. |
| `CallDone` | Apps Script | ✅ | same as CallBooked. |
| `HighTicketClosed` (was `HighTicketPurchase`) | Apps Script | ✅ | `user_data` (11 signals). `custom_data` = `{value, currency}`. origin-only URL. |
| 31-field Pabbly webhook | Server → Pabbly → CRM sheet ([pabbly.ts](src/lib/pabbly.ts)) | ❌ **never to Meta** | Full CRM data (incl. UTM/fbclid/payment_id). `event_source_url` written **origin-only** so col N (which feeds the downstream events) stays clean. |

## PII / PHI rules
- **Hashed PII (kept — this is the compliant matching mechanism):** `em, ph, fn, ln, ct, country, external_id`, SHA-256 on all three surfaces.
- **Raw matching signals (kept, never hashed):** `fbc, fbp, client_ip_address, client_user_agent`.
- **PHI sent to Meta:** none. No `content_name`, condition strings, or `primary_concern` reaches Meta. `primary_concern` lives in Pabbly/the sheet only.

## URL cleaning
- CAPI + Pabbly + downstream `event_source_url` → origin only (`originOnly()` in [utils.ts](src/lib/utils.ts), `originOf_()` in [code.gs](appscript/code.gs)).
- Browser `PageView` auto-captures the full URL (incl. UTM query) until core-setup strips it ⇒ **media-buyer rule: name UTM campaigns/content neutrally** (no `pcos`/`fertility`/`postpartum`).

## Event names
- Funnel: `sales` (neutral; kept). Downstream: `CallBooked`, `CallDone`, `HighTicketClosed`.
- Escalation if Meta ever **scans the custom events** (roadmap Scenario C): code the names harder — `sales → evt_a` / `cu_completed`; `HighTicketClosed → ht_a`. Update [meta.ts](src/lib/meta.ts) / [code.gs](appscript/code.gs) + repoint ad-set optimization.

## Metadata neutralized (invisible to visitors; loudest machine signal)
- `<title>`, meta `description`, OG/Twitter titles → lifestyle/metabolic framing.
- `keywords` array removed; `category: "health"` removed.
- JSON-LD `MedicalBusiness` + `medicalSpecialty` + `Physician` → neutral `Organization` + `Person` founders.
- OG share image text + alt neutralized ([opengraph-image.tsx](src/app/opengraph-image.tsx)).
- **Visible funnel copy (hero, sections, FAQ, etc.) was intentionally left unchanged** — it still names PCOS/insulin/fertility, so the classification *odds* are not materially reduced; this hardening targets survivability, not prevention.

## Media-buyer / Meta-UI actions (not in code)
1. Optimize ad sets on **`sales`** (not Purchase) — re-enters ~7-day learning.
2. Events Manager: **Auto-events OFF**, **Automatic Advanced Matching OFF**, **allow-list prod domain only**, self-categorize to a non-restricted category.
3. Neutral UTM campaign naming.
4. If `HighTicketClosed` is referenced in Ads Manager / a Custom Conversion, update it.
5. Set `NEXT_PUBLIC_SITE_URL=https://www.dradityabapuji.com` + `NEXT_PUBLIC_SITE_NAME` (no "PCOS") in Vercel Production; apex→www 308 redirect. The pixel + gate match on this host exactly.
6. Apps Script Script Property `EVENT_SOURCE_URL_DEFAULT=https://www.dradityabapuji.com`.

## Escalation ladder (if the custom event later degrades)
1. Confirm `sales` registers as **Server** in Test Events.
2. Code event names harder (above).
3. Strip payload further (already `{value,currency}`).
4. Gate/remove the browser pixel (currently kept for retargeting).
5. Move to a clean **separate root domain** (heavy; last resort).
