"use client";

import { Fragment, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { resolveDeadline, rollDeadline } from "@/lib/urgency";

/**
 * Live urgency countdown, built to the client's reference: a muted
 * "OFFER ENDS IN" label sitting beside a solid red block that holds
 * DAYS · HRS · MIN · SEC, each number stacked over its unit and split by
 * white colons.
 *
 * Cookie-backed (survives refresh, resets on a new session / IP change) and
 * loops so it never sits at 00:00.
 *
 * NOTE: the segment count follows the reference, so DAYS is always rendered.
 * With the current 5-hour window (URGENCY_MINUTES in src/lib/urgency.ts) it
 * reads 00 — widen that constant if the days slot should ever show a number.
 */
export function UrgencyTimer({
  variant = "light",
  className,
}: {
  variant?: "light" | "dark";
  className?: string;
}) {
  const [deadline, setDeadline] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    let active = true;
    resolveDeadline().then((d) => {
      if (!active) return;
      setDeadline(d);
      setRemaining(Math.max(0, d - Date.now()));
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (deadline == null) return;
    let current = deadline;
    const id = setInterval(() => {
      const left = current - Date.now();
      if (left <= 0) {
        current = rollDeadline();
        setDeadline(current);
        setRemaining(Math.max(0, current - Date.now()));
      } else {
        setRemaining(left);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  // Render nothing until the client resolves the deadline — avoids SSR/CSR
  // time mismatch and a 00:00 flash.
  if (deadline == null) return null;

  const totalSec = Math.max(0, Math.floor(remaining / 1000));
  const pad = (n: number) => String(n).padStart(2, "0");
  const segments = [
    { value: Math.floor(totalSec / 86400), label: "Days" },
    { value: Math.floor((totalSec % 86400) / 3600), label: "Hrs" },
    { value: Math.floor((totalSec % 3600) / 60), label: "Min" },
    { value: totalSec % 60, label: "Sec" },
  ];

  const dark = variant === "dark";

  return (
    <div
      role="timer"
      aria-live="off"
      aria-label={`Offer ends in ${segments.map((s) => `${s.value} ${s.label}`).join(", ")}`}
      className={cn("inline-flex items-center gap-2.5 sm:gap-3.5", className)}
    >
      <span
        className={cn(
          "whitespace-nowrap text-[9.5px] font-semibold uppercase tracking-[0.14em] sm:text-[11px]",
          dark ? "text-cream-100/85" : "text-ink-400"
        )}
      >
        Offer ends in
      </span>

      <span
        className={cn(
          "countdown-block inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 sm:gap-2 sm:px-3.5 sm:py-2",
          dark && "countdown-block-dark"
        )}
      >
        {segments.map((s, i) => (
          <Fragment key={s.label}>
            {i > 0 && (
              <span
                aria-hidden="true"
                className="self-start text-[15px] font-semibold leading-none text-white/70 sm:text-[18px]"
              >
                :
              </span>
            )}
            <span className="flex flex-col items-center leading-none">
              <span className="font-display text-[15px] font-semibold tabular-nums leading-none text-white sm:text-[18px]">
                {pad(s.value)}
              </span>
              <span className="mt-1 text-[8px] font-semibold uppercase leading-none tracking-[0.08em] text-white/75 sm:text-[8.5px] sm:tracking-[0.1em]">
                {s.label}
              </span>
            </span>
          </Fragment>
        ))}
      </span>
    </div>
  );
}
