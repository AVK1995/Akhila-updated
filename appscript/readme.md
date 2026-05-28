# Akhila CRM — Apps Script Downstream Meta CAPI Engine

Apps Script bound to the **`CRM`** tab of the Akhila / PCOS Reset CRM Google
Sheet. Fires three downstream Meta Conversions API events whenever a
sales-team dropdown is set to `TRUE`:

| Dropdown set to TRUE | Meta CAPI event fired | Carries value? |
|---|---|---|
| `call_booked` (col X) | `CallBooked` | no |
| `call_showed` (col AB) | `CallDone` | no |
| `sale_closed` (col AF) | `HighTicketPurchase` | yes — `contracted_value` from col AG |

The tripwire `Purchase` + `sales` events for the ₹97 payment are fired
separately by the Next.js backend at payment-verify time. This script handles
only the three downstream events. The two systems share the same Meta pixel ID
+ access token but never talk directly — the Sheet is the only link.

`event_id` per event is deterministic: `{lead_id}_schedule|showup|htsale`,
where `lead_id` (col A) == the Razorpay `payment_id`. So a downstream event
always traces back to its tripwire purchase, and Meta dedupes retries within
48h.

---

## Files

- **`code.gs`** — paste into the Apps Script editor (replaces the default file)
- **`appscript.json`** — paste into the manifest. ⚠️ In the Apps Script editor the manifest file is named **`appsscript.json`** (double-s, Google's required name) — paste this file's *contents* there.
- **`sheet-header.tsv`** — the exact 36-column header row (A→AJ) for the `CRM` tab
- **`readme.md`** — this file

These are a template. Nothing auto-deploys — you copy-paste into the Sheet's
Apps Script editor.

---

## 1. Build the `CRM` Sheet

### 1a. Header row (A1:AJ1)
Open `sheet-header.tsv`, copy the single tab-separated line, and paste it into
cell **A1** of a tab named exactly **`CRM`** (Google will split it across A→AJ).
36 columns:

```
A lead_id · B created_at · C first_name · D last_name · E email · F phone ·
G city · H country_code · I fbc · J fbp · K client_ip_address ·
L client_user_agent · M external_id · N event_source_url · O amount ·
P is_test · Q purchase_event_id · R utm_source · S utm_medium ·
T utm_campaign · U utm_content · V utm_term · W fbclid ·
X call_booked · Y booking_time · Z schedule_capi_event_id ·
AA schedule_capi_sent · AB call_showed · AC showup_time ·
AD showup_capi_event_id · AE showup_capi_sent · AF sale_closed ·
AG contracted_value · AH sales_time · AI htsale_capi_event_id ·
AJ htsale_capi_sent
```

Columns A→W are auto-filled by your Pabbly workflow. Columns X→AJ are the
lifecycle (sales team + this script).

### 1b. Column formatting (do this exactly)

| Column(s) | Format | How |
|---|---|---|
| **X, AB, AF** (`call_booked`, `call_showed`, `sale_closed`) | **Dropdown** with values `TRUE` and `FALSE` (exact uppercase), **blank by default** | Select the column → Insert → Dropdown → add items `TRUE`, `FALSE`. **Do NOT use a checkbox** — a checkbox renders new Pabbly rows as `FALSE`, which is indistinguishable from "explicitly marked FALSE". A blank dropdown stays blank until a human picks a value. |
| **Y, AC, AH** (`booking_time`, `showup_time`, `sales_time`) | **Date time** | Select → Format → Number → Date time. Format `yyyy-mm-dd hh:mm`. Fill these **before** flipping the matching dropdown to TRUE (the script uses them as `event_time`). |
| **AG** (`contracted_value`) | **Plain number** | Format → Number → Number (0 decimals, no thousands separator, no currency symbol). e.g. `60000`. Fill **before** flipping `sale_closed`. |
| **Z, AA, AD, AE, AI, AJ** | leave to the script | The script writes the event_id (text) and the `_sent` flag (`TRUE`). You can also make AA/AE/AJ a `TRUE`/`FALSE` dropdown for visual consistency, but it's optional. |

### 1c. Hidden `_Errors` tab
Create a second tab named **`_Errors`** with this header in row 1:

```
timestamp	row_number	event_type	http_status	response_body	retry_count
```

Right-click the tab → Hide. Non-200 responses from Meta land here, retry-able.

### 1d. Spreadsheet timezone
File → Settings → Timezone → **(GMT+05:30) Asia/Kolkata**. The script reads the
date columns as Date objects; the timezone decides what they resolve to.

---

## 2. Deploy the Apps Script

1. In the CRM Sheet → **Extensions → Apps Script**.
2. Delete the default `Code.gs` contents → paste all of `code.gs` → save.
3. Project Settings (gear) → check **"Show appsscript.json manifest file in editor"** → open `appsscript.json` → replace contents with this folder's `appscript.json` → save.
4. Project Settings → **Script Properties** → add:

   | Property | Value |
   |---|---|
   | `META_PIXEL_ID` | Akhila's pixel ID (same value as Vercel `NEXT_PUBLIC_META_PIXEL_ID`) |
   | `META_CAPI_ACCESS_TOKEN` | Akhila's CAPI token (same value as Vercel `META_CAPI_ACCESS_TOKEN`) — **secret** |
   | `EVENT_SOURCE_URL_DEFAULT` | `https://www.pcosreset.in/book-a-call` |

   Optional: `META_CAPI_TEST_EVENT_CODE` (set to your Test Events code while validating, **delete for production**), `MAIN_SHEET_NAME` (defaults to `CRM`), `META_GRAPH_API_VERSION` (defaults to `v25.0`).

5. Function dropdown → select **`setupTriggers`** → Run → authorize (the
   "Google hasn't verified this app" warning is expected for an unpublished
   script → Advanced → Go to project → allow). You should see
   `setupTriggers OK — removed 0 old, installed 1 new onSheetEdit trigger`.

---

## 3. Smoke test (against Meta Test Events)

1. Meta Events Manager → your dataset → **Test Events** → copy the test code →
   set it as `META_CAPI_TEST_EVENT_CODE` in Script Properties (temporarily).
2. Paste a dummy row into row 2 (a real `external_id` = `sha256(lowercase email)`).
   Minimum populated for high EMQ: `lead_id, email, phone, first_name,
   last_name, city, country_code, fbc, fbp, client_ip_address,
   client_user_agent, external_id`.
3. **CallBooked**: set col X dropdown → `TRUE`. Within ~10s: col Z = `{lead_id}_schedule`, col AA = `TRUE`, and `CallBooked` appears in Test Events (Source: Server, EMQ 8-9+).
4. **CallDone**: fill col AC (showup_time), set col AB → `TRUE`. Expect col AD/AE filled + `CallDone` in Test Events.
5. **HighTicketPurchase**: fill col AG (`60000`) + col AH (sales_time), set col AF → `TRUE`. Expect col AI/AJ filled + `HighTicketPurchase` with `value: 60000, currency: INR`.
6. **Delete `META_CAPI_TEST_EVENT_CODE`** when done so real events count for production.

---

## 4. Operations

- **Logs**: Apps Script editor → Executions (success) and the `_Errors` tab (failures).
- **A dropdown is TRUE but nothing fired**: confirm the trigger is installed (Triggers tab, clock icon → one `onSheetEdit`). If a programmatic write set it, toggle the dropdown blank → TRUE again (installable onEdit is unreliable for non-human edits; manual selection always fires).
- **Force a re-fire**: clear the `_sent` flag (AA / AE / AJ) → set the trigger dropdown blank → TRUE again. Meta dedupes within 48h via the deterministic event_id, so a re-fire usually doesn't double-count.
- **Bulk replay** after an outage: Apps Script editor → run `replayPendingEvents` (fires every row that has a TRUE trigger but no `_sent` flag, paced 500ms).
- **Low EMQ (5-6 instead of 9+)**: a row is missing identifier columns. Check `fbc/fbp/client_ip_address/client_user_agent/external_id/email/phone` are populated (these come from the backend's Pabbly payload).
- **Rotate the token**: update `META_CAPI_ACCESS_TOKEN` in Script Properties. No redeploy needed.

---

## How a fire builds `user_data`

Hashed (SHA-256, Meta-normalised): `em`, `ph` (digits only), `fn`, `ln`,
`ct` (a-z only), `country` (ISO-2), `external_id` (= sha256 of email, same as
`em`). Raw (never hashed): `fbc`, `fbp`, `client_ip_address`,
`client_user_agent`. That's the same 11-signal shape the backend tripwire
events send → EMQ 9+ when all columns are populated.
