"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import { withUtm } from "@/lib/utm";
import { VideoThumbnail } from "./shared-static";

/**
 * Reveal: fade-up children on viewport enter. Respects prefers-reduced-motion.
 */
export function Reveal({
  children,
  delay = 0,
  y = 14,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article" | "header" | "p" | "span";
}) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as] as typeof motion.div;
  return (
    <MotionTag
      initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px 0px -80px 0px" }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </MotionTag>
  );
}

export type CtaVariant =
  | "primary"
  | "primary-lg"
  | "primary-sm"
  | "primary-inverse-lg"
  | "gold"
  | "secondary"
  | "ghost";

/**
 * CtaLink: <Link> that appends stored UTMs at click time.
 */
export function CtaLink({
  href,
  label,
  variant = "primary",
  className,
  ariaLabel,
  trailing,
  preserveUtm = true,
  ...rest
}: {
  href: string;
  label: ReactNode;
  variant?: CtaVariant;
  className?: string;
  ariaLabel?: string;
  trailing?: React.ReactNode;
  preserveUtm?: boolean;
} & Omit<ComponentProps<typeof Link>, "href" | "children">) {
  const onClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (!preserveUtm || typeof window === "undefined") return;
      const target = withUtm(href);
      if (target !== href) {
        e.preventDefault();
        window.location.href = target;
      }
    },
    [href, preserveUtm]
  );

  const classes: Record<CtaVariant, string> = {
    primary: "btn-primary btn-shimmer group",
    "primary-lg": "btn-primary-lg btn-shimmer group",
    "primary-sm":
      "btn btn-shimmer group bg-wine-700 px-4 py-2 text-[13px] text-white shadow-premium-sm hover:bg-wine-800 hover:shadow-wine-glow active:scale-[0.98] sm:px-5 sm:py-2.5 sm:text-sm",
    "primary-inverse-lg": "btn-primary-inverse-lg btn-shimmer group",
    gold: "btn-gold btn-shimmer group",
    secondary: "btn-secondary group",
    ghost: "btn-ghost",
  };

  return (
    <Link
      href={href}
      aria-label={ariaLabel ?? (typeof label === "string" ? label : undefined)}
      onClick={onClick}
      className={cn(classes[variant], className)}
      {...rest}
    >
      <span>{label}</span>
      {trailing}
    </Link>
  );
}

const VUMBNAIL_BASE = "https://vumbnail.com";
function vumbnailUrl(videoId: string, size: "" | "_large" | "_medium" | "_small" = "_large") {
  return `${VUMBNAIL_BASE}/${videoId}${size}.jpg`;
}

/**
 * LazyVimeoVideo — premium thumbnail by default; swaps to real Vimeo iframe on click.
 */
export function LazyVimeoVideo({
  videoId,
  hash,
  aspect = "16/9",
  title,
  posterSrc,
  posterAlt,
  className,
  playSize = "md",
}: {
  videoId: string;
  hash?: string;
  aspect?: "16/9" | "9/16" | "4/3" | "3/4" | "1/1";
  title: string;
  posterSrc?: string;
  posterAlt?: string;
  className?: string;
  playSize?: "sm" | "md" | "lg";
}) {
  const [playing, setPlaying] = useState(false);
  const aspectClass = {
    "16/9": "aspect-[16/9]",
    "9/16": "aspect-[9/16]",
    "4/3": "aspect-[4/3]",
    "3/4": "aspect-[3/4]",
    "1/1": "aspect-square",
  }[aspect];

  const resolvedPoster = posterSrc ?? vumbnailUrl(videoId);

  if (playing) {
    const params = new URLSearchParams({
      autoplay: "1",
      title: "0",
      byline: "0",
      portrait: "0",
      color: "5A1E30",
      ...(hash ? { h: hash } : {}),
    });
    return (
      <div
        className={cn(
          "relative w-full transform-gpu overflow-hidden rounded-[28px] bg-ink-900 shadow-premium-xl ring-1 ring-inset ring-white/35 [backface-visibility:hidden]",
          aspectClass,
          className
        )}
      >
        <iframe
          src={`https://player.vimeo.com/video/${videoId}?${params.toString()}`}
          className="absolute inset-0 h-full w-full"
          frameBorder={0}
          allow="autoplay; fullscreen; picture-in-picture; clipboard-write"
          allowFullScreen
          title={title}
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`Play video: ${title}`}
      className={cn("block w-full cursor-pointer", className)}
    >
      <VideoThumbnail
        aspect={aspect}
        posterSrc={resolvedPoster}
        posterAlt={posterAlt ?? `Sneak peek: ${title}`}
        playSize={playSize}
      />
    </button>
  );
}

/**
 * Imperative handle exposed by LazyMp4Video so an external element (e.g. a
 * "Watch:" caption pill) can start the SAME video instance in fullscreen.
 * Because it drives the one mounted <video>, exiting fullscreen continues the
 * same playback session — no second player, no restart, no double audio.
 */
export type LazyMp4VideoHandle = {
  /** Start playback (mounting the player if needed) and request fullscreen. */
  playFullscreen: () => void;
};

/**
 * LazyMp4Video — premium thumbnail by default; swaps to a native <video>
 * player on click. Same look/feel as LazyVimeoVideo but plays a direct
 * MP4 (e.g. DigitalOcean Spaces CDN) instead of a Vimeo embed.
 *
 * `posterSrc` should be a still extracted from the video itself (frame at
 * ~1s) so the thumbnail matches the footage that plays.
 *
 * Pass a ref to drive it from outside via `playFullscreen()` — the caption
 * pill and the poster's play button then control one shared video element.
 */
export const LazyMp4Video = forwardRef<
  LazyMp4VideoHandle,
  {
    src: string;
    aspect?: "16/9" | "9/16" | "4/3" | "3/4" | "1/1";
    title: string;
    posterSrc: string;
    posterAlt?: string;
    className?: string;
    playSize?: "sm" | "md" | "lg";
  }
>(function LazyMp4Video(
  { src, aspect = "16/9", title, posterSrc, posterAlt, className, playSize = "md" },
  ref
) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  // Set when playback is requested before the <video> has mounted, so we can
  // honor the fullscreen request in the effect right after it mounts.
  const wantFullscreenRef = useRef(false);

  const aspectClass = {
    "16/9": "aspect-[16/9]",
    "9/16": "aspect-[9/16]",
    "4/3": "aspect-[4/3]",
    "3/4": "aspect-[3/4]",
    "1/1": "aspect-square",
  }[aspect];

  const enterFullscreen = useCallback(() => {
    const el = videoRef.current as
      | (HTMLVideoElement & {
          webkitRequestFullscreen?: () => void;
          webkitEnterFullscreen?: () => void;
        })
      | null;
    if (!el) return;
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    } else if (el.webkitRequestFullscreen) {
      el.webkitRequestFullscreen();
    } else if (el.webkitEnterFullscreen) {
      // iOS Safari only supports fullscreen on the <video> element itself.
      el.webkitEnterFullscreen();
    }
  }, []);

  const playCurrent = useCallback(() => {
    const p = videoRef.current?.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  }, []);

  // Once the <video> mounts after a fullscreen request, play it and go
  // fullscreen. The originating click keeps the browser's transient user
  // activation alive long enough for this to be allowed.
  useEffect(() => {
    if (playing && wantFullscreenRef.current) {
      wantFullscreenRef.current = false;
      playCurrent();
      enterFullscreen();
    }
  }, [playing, playCurrent, enterFullscreen]);

  // On phones, a landscape (16:9) video shown in a portrait fullscreen gets
  // cropped. When THIS video enters fullscreen, rotate the screen to landscape
  // so it fills naturally (like YouTube); unlock on exit. Covers both our
  // caption trigger and the native player's own fullscreen button. Silently
  // ignored where orientation lock isn't available (desktop, iOS Safari — iOS
  // rotates its native fullscreen player on its own). Paired with the
  // `video:fullscreen { object-fit: contain }` rule in globals.css so the full
  // frame shows even when rotation isn't possible.
  useEffect(() => {
    const orientation = (typeof screen !== "undefined"
      ? screen.orientation
      : undefined) as
      | { lock?: (o: string) => Promise<void>; unlock?: () => void }
      | undefined;
    const onFsChange = () => {
      const el = videoRef.current;
      if (el && document.fullscreenElement === el) {
        orientation?.lock?.("landscape").catch(() => {});
      } else if (!document.fullscreenElement) {
        try {
          orientation?.unlock?.();
        } catch {
          /* unlock not supported — ignore */
        }
      }
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      playFullscreen: () => {
        if (playing) {
          // Player already mounted: reuse it — same session, no restart.
          playCurrent();
          enterFullscreen();
        } else {
          wantFullscreenRef.current = true;
          setPlaying(true);
        }
      },
    }),
    [playing, playCurrent, enterFullscreen]
  );

  if (playing) {
    return (
      <div
        className={cn(
          "relative w-full transform-gpu overflow-hidden rounded-[28px] bg-ink-900 shadow-premium-xl ring-1 ring-inset ring-white/35 [backface-visibility:hidden]",
          aspectClass,
          className
        )}
      >
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          ref={videoRef}
          src={src}
          poster={posterSrc}
          className="absolute inset-0 h-full w-full object-cover"
          controls
          autoPlay
          playsInline
          preload="auto"
          title={title}
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`Play video: ${title}`}
      className={cn("block w-full cursor-pointer", className)}
    >
      <VideoThumbnail
        aspect={aspect}
        posterSrc={posterSrc}
        posterAlt={posterAlt ?? `Sneak peek: ${title}`}
        playSize={playSize}
      />
    </button>
  );
});
