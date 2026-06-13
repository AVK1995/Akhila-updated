"use client";

/* =============================================================================
 * PhoneField — country flag/dial dropdown + national-number input.
 * Self-contained, branded (wine/cream), searchable country list. Used by the
 * lead-capture modal. Stores the ISO country + national digits separately;
 * compose E.164 with getCountry(iso).dial + the digits at submit time.
 * =============================================================================
 */

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { COUNTRIES, getCountry } from "@/lib/countries";

export function PhoneField({
  id = "phone",
  label,
  required,
  country,
  value,
  error,
  onCountryChange,
  onChange,
}: {
  id?: string;
  label: string;
  required?: boolean;
  country: string;
  value: string;
  error?: string;
  onCountryChange: (iso: string) => void;
  onChange: (v: string) => void;
}) {
  const c = getCountry(country);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  const filtered = query
    ? COUNTRIES.filter((o) => {
        const q = query.trim().toLowerCase();
        return (
          o.name.toLowerCase().includes(q) ||
          o.dial.includes(q) ||
          o.iso.toLowerCase().includes(q)
        );
      })
    : COUNTRIES;

  return (
    <div>
      <label htmlFor={id} className="label-premium">
        {label}
        {required && <span className="ml-1 text-wine-600">*</span>}
      </label>
      <div
        ref={rootRef}
        className={cn(
          "relative flex w-full overflow-visible rounded-xl border border-ink-200 bg-white transition-all duration-200 focus-within:border-wine-400 focus-within:ring-4 focus-within:ring-wine-100",
          error && "border-red-400 focus-within:border-red-500 focus-within:ring-red-100"
        )}
      >
        {/* country trigger */}
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label="Country code"
          onClick={() => setOpen((v) => !v)}
          className="flex shrink-0 items-center gap-1.5 rounded-l-xl border-r border-ink-200 bg-cream-50/60 px-3 py-3 text-[14px] text-ink-700 transition-colors hover:bg-cream-100 sm:text-[15px]"
        >
          <span aria-hidden="true" className="text-base leading-none">{c.flag}</span>
          <span className="font-medium tabular-nums">{c.dial}</span>
          <svg
            aria-hidden="true"
            className={cn("h-3 w-3 text-ink-400 transition-transform", open && "rotate-180")}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
            strokeLinecap="round" strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {/* number input */}
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
          aria-invalid={error ? "true" : "false"}
          className="block w-full rounded-r-xl bg-transparent px-4 py-3 text-[15px] text-ink-800 placeholder:text-ink-300 focus:outline-none sm:text-base"
        />

        {/* dropdown */}
        {open && (
          <div
            role="listbox"
            className="absolute left-0 top-full z-50 mt-1.5 max-h-72 w-full min-w-[16rem] overflow-hidden rounded-xl border border-ink-100 bg-white shadow-premium-lg ring-1 ring-wine-50"
          >
            <div className="border-b border-ink-100 bg-cream-50/60 px-3 py-2">
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search country…"
                className="w-full bg-transparent text-[13px] text-ink-700 placeholder:text-ink-400 focus:outline-none sm:text-sm"
              />
            </div>
            <ul className="max-h-60 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <li className="px-3 py-2 text-[13px] text-ink-400">No matches</li>
              ) : (
                filtered.map((o) => {
                  const isActive = o.iso === country;
                  return (
                    <li key={o.iso} role="option" aria-selected={isActive}>
                      <button
                        type="button"
                        onClick={() => {
                          onCountryChange(o.iso);
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
                        <span aria-hidden="true" className="text-base leading-none">{o.flag}</span>
                        <span className="min-w-0 flex-1 truncate">{o.name}</span>
                        <span className="shrink-0 tabular-nums text-ink-400">{o.dial}</span>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-[12px] text-red-600">{error}</p>}
    </div>
  );
}
