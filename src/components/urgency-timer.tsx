"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { resolveDeadline, rollDeadline } from "@/lib/urgency";

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("h-3.5 w-3.5", className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

/**
 * Live urgency countdown pill. Cookie-backed (survives refresh, resets on new
 * session / IP change) and loops so it never sits at 00:00. Two visual
 * variants for light (cream) vs dark (wine) backgrounds.
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
  const mm = String(Math.floor(totalSec / 60)).padStart(2, "0");
  const ss = String(totalSec % 60).padStart(2, "0");

  const dark = variant === "dark";

  return (
    <div
      role="timer"
      aria-live="off"
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] shadow-premium-sm sm:text-[12px]",
        dark
          ? "border-gold-300/40 bg-gold-400/10 text-gold-100"
          : "border-wine-200/70 bg-wine-50/80 text-wine-700",
        className
      )}
    >
      <span className="relative flex h-2 w-2">
        <span className={cn("absolute inline-flex h-full w-full animate-pulse-ring-strong rounded-full", dark ? "bg-gold-300/90" : "bg-wine-500/70")} />
        <span className={cn("relative inline-flex h-2 w-2 rounded-full", dark ? "bg-gold-300" : "bg-wine-600")} />
      </span>
      <ClockIcon className={dark ? "text-gold-200" : "text-wine-600"} />
      <span className="whitespace-nowrap">
        Free slots closing in{" "}
        <span className={cn("font-bold tabular-nums tracking-normal", dark ? "text-gold-50" : "text-wine-800")}>
          {mm}:{ss}
        </span>
      </span>
    </div>
  );
}
