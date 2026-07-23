"use client";

import { CtaLink } from "./shared-client";
import { ArrowRightIcon, CheckIcon, ShieldIcon, StarIcon } from "./icons";
import { UrgencyTimer } from "@/components/urgency-timer";
import { cn } from "@/lib/utils";

/**
 * The repeating conversion unit: primary CTA → trust row → offer countdown.
 * The revised landing copy repeats this exact block after the hero, after the
 * eligibility list, and at the close, so it lives in one place.
 *
 * CTA line behaviour, by breakpoint:
 *   - Desktop (sm+): ONE line. `whitespace-nowrap` plus a vw-clamped font size
 *     so it auto-fits every desktop width without wrapping.
 *   - Mobile (<sm): exactly TWO lines, split after "Diagnosis" via a
 *     breakpoint-hidden <br> (display:none removes the break on desktop, which
 *     `whitespace-nowrap` alone would not do). The clamped size keeps the
 *     longer first line inside the button on phones down to 320px.
 */
export function CtaBlock({
  variant = "light",
  /** Force the two-line split at every width — used inside narrow cards (the
   *  pricing panel) where a single 64-character line would look cramped. */
  twoLine = false,
  className,
}: {
  variant?: "light" | "dark";
  twoLine?: boolean;
  className?: string;
}) {
  const dark = variant === "dark";
  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <CtaLink
        href="/checkout"
        variant={dark ? "primary-inverse-lg" : "primary-lg"}
        label={
          <>
            {/* Each half is nowrap so the mobile split is exactly these two
                lines — never three. The <br> is display:none from sm, which is
                what lets the desktop rule collapse it to a single line. */}
            <span className="whitespace-nowrap">Click Here To Get Your Personalised Diagnosis</span>
            <br className={twoLine ? undefined : "sm:hidden"} />{" "}
            <span className="whitespace-nowrap">&amp; PCOS Recovery Plan</span>
          </>
        }
        ariaLabel="Get your personalised diagnosis and PCOS recovery plan"
        className={cn(
          // btn-primary-lg ships px-8. Inside the narrow pricing card that
          // 64px of padding pushes the nowrap line past the grid track, so
          // mobile gets a tighter inset and min-w-0 lets the button shrink
          // with its container instead of forcing it wider.
          // cqw (not vw) so the label scales to THIS button's width — see
          // .cta-fit in globals.css. 3.75cqw is the largest coefficient that
          // still clears the arrow disc in the narrowest instance (the pricing
          // card at 320px), measured rather than guessed.
          // max-w-2xl on desktop, not xl: the single 66-character line needs
          // ~570px of inner width to reach a readable 16px, which max-w-xl
          // (576px total, minus padding and the arrow) cannot give.
          "cta-fit w-full min-w-0 max-w-xl gap-1.5 px-2.5 sm:max-w-2xl sm:gap-2.5 sm:px-10 [&>span]:min-w-0 [&>span]:text-center [&>span]:text-[clamp(8.8px,3.75cqw,15px)] [&>span]:leading-[1.35]",
          twoLine
            // Desktop sizes are cqw too. A vw-based size ignores the button's
            // own width, which is what let the single desktop line run under
            // the arrow disc.
            ? "sm:[&>span]:text-[clamp(11px,3cqw,15px)]"
            : "sm:[&>span]:whitespace-nowrap sm:[&>span]:text-[clamp(11px,2.38cqw,16px)]"
        )}
        trailing={
          // Circled arrow, matching the reference: disc sits inside the button
          // on a translucent wash of the button's own foreground colour.
          <span
            className={cn(
              "inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full transition-transform duration-300 group-hover:translate-x-0.5 sm:h-7 sm:w-7",
              // On the cream (inverse) button a translucent wash disappears —
              // it needs a solid tint to read as a disc.
              dark ? "bg-wine-100 ring-1 ring-wine-200" : "bg-cream-50/20"
            )}
          >
            <ArrowRightIcon className="h-3.5 w-3.5" strokeWidth={2} />
          </span>
        }
      />

      {/* Trust row — brand icons rather than raw emoji so it sits inside the
          editorial/clinical look while carrying the same three signals.
          Fixed 2-then-1 layout at every width: the two-column grid holds the
          first pair on one row and the last item spans both columns.

          The container-type lives on this WRAPPER, not the <ul>: cqw resolves
          against the nearest container ANCESTOR, so putting it on the same
          element that reads cqw silently falls back to viewport units — which
          is what let this row keep its wide-viewport size inside the narrow
          pricing card and spill out of it.

          Sized so the longest label ("15+ Years Of Clinical Experience") holds
          ONE line in every container, including the narrow pricing card. The
          icon, gaps and tracking are all trimmed to buy that width back rather
          than shrinking the type further than necessary. */}
      <div className="cta-fit w-full max-w-xl">
        <ul
          className={cn(
            // 2.15cqw: measured (not estimated) as the largest coefficient at
            // which the longest label still holds one line in the tightest
            // container — the pricing card, which is only ~345px wide at lg.
            // Wide containers hit the 12px cap and are unaffected.
            "grid grid-cols-2 justify-items-center gap-x-2 gap-y-1.5 text-[clamp(6px,2.15cqw,12px)] font-medium uppercase leading-snug tracking-[0.03em] sm:gap-x-4 sm:tracking-[0.05em] [&>li:last-child]:col-span-2",
            dark ? "text-cream-100/75" : "text-ink-500"
          )}
        >
          <li className="flex items-start gap-1">
            <StarIcon className={cn("mt-[1px] h-2.5 w-2.5 shrink-0 sm:h-3 sm:w-3", dark ? "text-gold-300" : "text-gold-600")} />
            <span className="min-w-0">100% Customer Satisfaction</span>
          </li>
          <li className="flex items-start gap-1">
            <ShieldIcon className={cn("mt-[1px] h-2.5 w-2.5 shrink-0 sm:h-3 sm:w-3", dark ? "text-gold-300" : "text-gold-600")} />
            <span className="min-w-0">15+ Years Of Clinical Experience</span>
          </li>
          <li className="flex items-start gap-1">
            <CheckIcon
              className={cn("mt-[1px] h-2.5 w-2.5 shrink-0 sm:h-3 sm:w-3", dark ? "text-gold-300" : "text-gold-600")}
              strokeWidth={2.5}
            />
            <span className="min-w-0">Trusted By Career-Driven Women</span>
          </li>
        </ul>
      </div>

      <UrgencyTimer variant={variant} />
    </div>
  );
}
