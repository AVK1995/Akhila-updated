import { cn } from "@/lib/utils";
import { PlayIcon } from "./icons";

/**
 * ImagePlaceholder: neutral block shown while client-supplied images
 * haven't been uploaded yet.
 */
export function ImagePlaceholder({
  ratio = "16/9",
  label = "Image placeholder",
  hint,
  className,
  rounded = "2xl",
}: {
  ratio?: "16/9" | "4/3" | "3/4" | "1/1" | "9/16";
  label?: string;
  hint?: string;
  className?: string;
  rounded?: "lg" | "xl" | "2xl" | "3xl";
}) {
  const aspect = {
    "16/9": "aspect-[16/9]",
    "4/3": "aspect-[4/3]",
    "3/4": "aspect-[3/4]",
    "1/1": "aspect-square",
    "9/16": "aspect-[9/16]",
  }[ratio];
  const radius = {
    lg: "rounded-lg",
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
    "3xl": "rounded-3xl",
  }[rounded];
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden border border-ink-100 bg-cream-100",
        aspect,
        radius,
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-cream-200/50 via-wine-50/30 to-gold-50/40" />
      <div className="absolute inset-0 bg-grain opacity-60" />
      <div className="relative flex h-full w-full flex-col items-center justify-center px-6 text-center">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-wine-200 bg-white/80 text-wine-600 shadow-premium-sm">
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-5-5L5 21" />
          </svg>
        </div>
        <p className="mt-3 font-display text-sm font-medium text-ink-700 sm:text-base">
          {label}
        </p>
        {hint && (
          <p className="mt-1 max-w-[26ch] text-xs text-ink-400 sm:text-[13px]">
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * PlayButton3D — premium brand-coloured 3D play button.
 */
export function PlayButton3D({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: "h-12 w-12 sm:h-14 sm:w-14",
    md: "h-16 w-16 sm:h-20 sm:w-20",
    lg: "h-20 w-20 sm:h-24 sm:w-24",
  };
  const playSize = {
    sm: "h-4 w-4 sm:h-5 sm:w-5",
    md: "h-5 w-5 sm:h-6 sm:w-6",
    lg: "h-7 w-7 sm:h-8 sm:w-8",
  };
  return (
    <span className={cn("relative inline-flex items-center justify-center", sizes[size])}>
      <span aria-hidden="true" className="absolute inset-0 animate-pulse-ring-strong rounded-full bg-wine-500/40" />
      <span aria-hidden="true" className="absolute inset-0 animate-pulse-ring rounded-full bg-gold-400/30" />
      <span
        className="relative flex h-full w-full items-center justify-center rounded-full text-cream-50 transition-transform duration-300 ease-smooth group-hover/play:scale-110 group-hover:scale-110"
        style={{
          background:
            "linear-gradient(135deg, hsl(var(--wine-300)) 0%, hsl(var(--wine-400)) 30%, hsl(var(--wine-500)) 60%, hsl(var(--wine-700)) 100%)",
          boxShadow:
            "0 14px 36px -6px hsl(var(--wine-600) / 0.65), 0 0 80px -10px rgba(229, 203, 110, 0.5), inset 0 3px 0 rgba(255, 255, 255, 0.45), inset 0 -8px 16px -6px rgba(45, 14, 24, 0.55), inset 0 0 0 1px rgba(255, 255, 255, 0.12)",
        }}
      >
        <PlayIcon className={cn("ml-0.5 drop-shadow-[0_2px_4px_rgba(45,14,24,0.4)]", playSize[size])} />
      </span>
    </span>
  );
}

/**
 * VideoThumbnail — premium thumbnail frame.
 */
export function VideoThumbnail({
  aspect = "16/9",
  label,
  hint,
  posterSrc,
  posterAlt,
  className,
  playSize = "md",
}: {
  aspect?: "16/9" | "9/16" | "4/3" | "3/4" | "1/1";
  label?: string;
  hint?: string;
  posterSrc?: string;
  posterAlt?: string;
  className?: string;
  playSize?: "sm" | "md" | "lg";
}) {
  const aspectClass = {
    "16/9": "aspect-[16/9]",
    "9/16": "aspect-[9/16]",
    "4/3": "aspect-[4/3]",
    "3/4": "aspect-[3/4]",
    "1/1": "aspect-square",
  }[aspect];

  return (
    <div
      className={cn(
        "group relative w-full transform-gpu overflow-hidden rounded-[28px] shadow-premium-xl ring-1 ring-inset ring-white/35 [backface-visibility:hidden]",
        aspectClass,
        className
      )}
    >
      {posterSrc ? (
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-ink-900" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={posterSrc}
            alt={posterAlt ?? ""}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
            style={{ filter: "blur(0.6px) saturate(1.04)" }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-ink-900/15 via-transparent to-ink-900/35" />
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 50% 50%, rgba(45,14,24,0.28) 0%, rgba(45,14,24,0.08) 28%, transparent 55%)",
            }}
          />
        </div>
      ) : (
        <div aria-hidden="true" className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-cream-200 via-cream-100 to-wine-50" />
          <div className="absolute -left-[18%] -top-[18%] h-[80%] w-[80%] rounded-full bg-wine-300/55 blur-3xl" />
          <div className="absolute -right-[18%] top-[20%] h-[75%] w-[75%] rounded-full bg-gold-300/50 blur-3xl" />
          <div className="absolute -bottom-[20%] left-[18%] h-[65%] w-[65%] rounded-full bg-wine-200/55 blur-3xl" />
          <div className="absolute left-[35%] top-[35%] h-[35%] w-[35%] rounded-full bg-gold-200/40 blur-2xl" />
          <div className="absolute inset-0 bg-grain opacity-30 mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-900/35 via-transparent to-ink-900/10" />
        </div>
      )}

      <div className="group/play absolute inset-0 z-10 flex cursor-pointer items-center justify-center">
        <PlayButton3D size={playSize} />
      </div>

      {(label || hint) && (
        <div className="absolute inset-x-0 bottom-0 z-[5] flex flex-col items-center gap-1 bg-gradient-to-t from-ink-900/85 via-ink-900/40 to-transparent px-5 pb-4 pt-12 text-center">
          {label && (
            <p className="font-display text-[15px] font-medium leading-snug text-cream-50 sm:text-base">
              {label}
            </p>
          )}
          {hint && (
            <p className="max-w-[34ch] text-[11px] text-cream-100/65 sm:text-[12px]">
              {hint}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * FloatingOrbs — aurora-style backdrop. Pure CSS animation, no JS.
 */
export function FloatingOrbs() {
  const orbs: Array<{
    pos: string;
    size: string;
    bg: string;
    blur: string;
    duration: string;
    delay: string;
  }> = [
    {
      pos: "left-[6%] top-[8%]",
      size: "h-[320px] w-[320px] sm:h-[420px] sm:w-[420px]",
      bg: "bg-wine-200/55",
      blur: "blur-[90px]",
      duration: "16s",
      delay: "0s",
    },
    {
      pos: "right-[8%] top-[20%]",
      size: "h-[280px] w-[280px] sm:h-[380px] sm:w-[380px]",
      bg: "bg-gold-200/55",
      blur: "blur-[110px]",
      duration: "20s",
      delay: "-4s",
    },
    {
      pos: "left-[28%] bottom-[6%]",
      size: "h-[300px] w-[300px] sm:h-[400px] sm:w-[400px]",
      bg: "bg-wine-100/55",
      blur: "blur-[100px]",
      duration: "18s",
      delay: "-8s",
    },
    {
      pos: "right-[30%] bottom-[14%]",
      size: "h-[240px] w-[240px] sm:h-[320px] sm:w-[320px]",
      bg: "bg-gold-100/65",
      blur: "blur-[80px]",
      duration: "22s",
      delay: "-12s",
    },
  ];

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {orbs.map((o, i) => (
        <span
          key={i}
          className={cn(
            "absolute rounded-full mix-blend-multiply animate-float-soft",
            o.pos,
            o.size,
            o.bg,
            o.blur
          )}
          style={{
            animationDuration: o.duration,
            animationDelay: o.delay,
          }}
        />
      ))}
    </div>
  );
}

/**
 * OrganicBlob — amorphous gradient shape for atmosphere.
 */
export function OrganicBlob({
  className,
  from = "hsl(var(--wine-600) / 0.18)",
  to = "rgba(189, 127, 53, 0.12)",
}: {
  className?: string;
  from?: string;
  to?: string;
}) {
  const id = `blob-${from.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 600 600"
      className={cn("pointer-events-none absolute animate-float-soft", className)}
    >
      <defs>
        <radialGradient id={id} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} stopOpacity="0" />
        </radialGradient>
      </defs>
      <path
        fill={`url(#${id})`}
        d="M421,313Q412,376,361,418Q310,460,247,449Q184,438,135,395Q86,352,89,287Q92,222,135,176Q178,130,243,118Q308,106,367,143Q426,180,431,240Q436,300,421,313Z"
      />
    </svg>
  );
}
