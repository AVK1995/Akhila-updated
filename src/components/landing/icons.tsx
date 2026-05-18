import { cn } from "@/lib/utils";

const baseIconProps = (className?: string, strokeWidth = 1.6) => ({
  className: cn("h-4 w-4 shrink-0", className),
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
});

export const CheckIcon = ({ className, strokeWidth }: { className?: string; strokeWidth?: number }) => (
  <svg {...baseIconProps(className, strokeWidth)}><path d="M20 6 9 17l-5-5" /></svg>
);
export const CrossIcon = ({ className, strokeWidth }: { className?: string; strokeWidth?: number }) => (
  <svg {...baseIconProps(className, strokeWidth)}><path d="M18 6 6 18M6 6l12 12" /></svg>
);
export const ArrowRightIcon = ({ className, strokeWidth }: { className?: string; strokeWidth?: number }) => (
  <svg {...baseIconProps(className, strokeWidth)}><path d="M5 12h14M13 5l7 7-7 7" /></svg>
);
export const PlayIcon = ({ className }: { className?: string }) => (
  <svg className={cn("h-5 w-5 shrink-0", className)} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M8 5.14v13.72a1 1 0 0 0 1.55.83l10.6-6.86a1 1 0 0 0 0-1.66L9.55 4.31A1 1 0 0 0 8 5.14z" />
  </svg>
);
export const ShieldIcon = ({ className, strokeWidth }: { className?: string; strokeWidth?: number }) => (
  <svg {...baseIconProps(className, strokeWidth)}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);
export const StethoscopeIcon = ({ className, strokeWidth }: { className?: string; strokeWidth?: number }) => (
  <svg {...baseIconProps(className, strokeWidth)}>
    <path d="M4.8 2.3A.3.3 0 1 1 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 0 0 .2.3" />
    <path d="M8 15v3a4 4 0 0 0 8 0v-3" />
    <circle cx="20" cy="10" r="2" />
  </svg>
);
export const DropletIcon = ({ className, strokeWidth }: { className?: string; strokeWidth?: number }) => (
  <svg {...baseIconProps(className, strokeWidth)}><path d="M12 2.5s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z" /></svg>
);
export const StarIcon = ({ className }: { className?: string }) => (
  <svg className={cn("h-3.5 w-3.5", className)} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2 14.9 8.6 22 9.3l-5.5 4.8 1.7 7L12 17.7 5.8 21.1l1.7-7L2 9.3l7.1-.7L12 2Z" />
  </svg>
);
export const CalendarIcon = ({ className, strokeWidth }: { className?: string; strokeWidth?: number }) => (
  <svg {...baseIconProps(className, strokeWidth)}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M8 3v4M16 3v4M3 11h18" />
  </svg>
);
export const ClockIcon = ({ className, strokeWidth }: { className?: string; strokeWidth?: number }) => (
  <svg {...baseIconProps(className, strokeWidth)}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);
export const FlaskIcon = ({ className, strokeWidth }: { className?: string; strokeWidth?: number }) => (
  <svg {...baseIconProps(className, strokeWidth)}>
    <path d="M9 3h6M10 3v6.5L4 19a2 2 0 0 0 1.7 3h12.6A2 2 0 0 0 20 19l-6-9.5V3" />
    <path d="M7 14h10" />
  </svg>
);
export const LockIcon = ({ className, strokeWidth }: { className?: string; strokeWidth?: number }) => (
  <svg {...baseIconProps(className, strokeWidth)}>
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);
