/**
 * Urgency countdown deadline — shared across all <UrgencyTimer/> instances.
 *
 * Behaviour:
 *   - Persisted in a SESSION cookie (no Max-Age) so it SURVIVES refreshes but
 *     RESETS when the browser session is completely new (browser fully closed).
 *   - RESETS when the client IP changes (compared against /api/whoami).
 *   - Never sticks at 00:00 — when it expires it rolls forward another window
 *     (rollDeadline), so it always shows a live countdown.
 *
 * resolveDeadline() is memoized at module scope so multiple timer instances
 * (hero, closer, …) share ONE /api/whoami call and ONE cookie write and stay
 * perfectly in sync. The singleton resets on a full page reload (module
 * re-evaluates), which is the correct moment to re-check the IP.
 */

export const URGENCY_MINUTES = 15;
const WINDOW_MS = URGENCY_MINUTES * 60 * 1000;
const COOKIE = "akhila_urgency_v1";

type State = { deadline: number; ip: string };

function readCookie(): State | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`));
  if (!m) return null;
  try {
    const o = JSON.parse(decodeURIComponent(m[1]));
    if (o && typeof o.deadline === "number") {
      return { deadline: o.deadline, ip: typeof o.ip === "string" ? o.ip : "" };
    }
  } catch {
    /* malformed cookie → treat as absent */
  }
  return null;
}

function writeCookie(state: State): void {
  if (typeof document === "undefined") return;
  // SESSION cookie — no Max-Age/Expires → cleared when the browser session ends.
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE}=${encodeURIComponent(
    JSON.stringify(state)
  )}; Path=/; SameSite=Lax${secure}`;
}

async function fetchIp(): Promise<string> {
  try {
    const res = await fetch("/api/whoami", { cache: "no-store" });
    const j = (await res.json()) as { ip?: string };
    return typeof j.ip === "string" ? j.ip : "";
  } catch {
    return "";
  }
}

let _promise: Promise<number> | null = null;

/** Resolve the shared countdown deadline (ms epoch). Memoized per page load. */
export function resolveDeadline(): Promise<number> {
  if (_promise) return _promise;
  _promise = (async () => {
    const ip = await fetchIp();
    const existing = readCookie();
    const now = Date.now();
    // Reuse the running deadline only if same IP and still in the future.
    if (existing && existing.ip === ip && existing.deadline > now) {
      return existing.deadline;
    }
    // New session / IP change / expired → start a fresh window.
    const deadline = now + WINDOW_MS;
    writeCookie({ deadline, ip });
    return deadline;
  })();
  return _promise;
}

/**
 * Roll the deadline forward one window when it hits zero. Idempotent within a
 * window: if another timer instance already rolled (cookie deadline still in
 * the future), reuse that so every timer stays in sync.
 */
export function rollDeadline(): number {
  const existing = readCookie();
  const now = Date.now();
  if (existing && existing.deadline > now + 1000) return existing.deadline;
  const deadline = now + WINDOW_MS;
  writeCookie({ deadline, ip: existing?.ip ?? "" });
  return deadline;
}
