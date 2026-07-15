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
import { flushSync } from "react-dom";
import { cn } from "@/lib/utils";
import { withUtm } from "@/lib/utm";
import { trackVideoEvent } from "@/lib/analytics";
import { FREE_FUNNEL_MODE, openLeadModal } from "@/lib/funnel";
import { PlayButton3D, VideoThumbnail } from "./shared-static";

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
      if (typeof window === "undefined") return;
      // Free mode: every checkout CTA opens the lead-capture modal instead of
      // routing to the paid /checkout page.
      if (FREE_FUNNEL_MODE && href === "/checkout") {
        e.preventDefault();
        openLeadModal();
        return;
      }
      if (!preserveUtm) return;
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

/** Imperative handle so an outside element (e.g. a "Watch" caption) can start
 *  playback. `fullscreen: true` opens it fullscreen WITH sound. */
export type LazyVimeoVideoHandle = {
  play: (opts?: { fullscreen?: boolean }) => void;
};

type LazyVimeoVideoProps = {
  /** Vimeo numeric id. Empty string → renders the placeholder frame. */
  videoId: string;
  /** Privacy hash for unlisted videos (the `h=` param). Public videos omit it. */
  hash?: string;
  aspect?: "16/9" | "9/16" | "4/3" | "3/4" | "1/1";
  title: string;
  posterSrc?: string;
  posterAlt?: string;
  className?: string;
  playSize?: "sm" | "md" | "lg";
};

/**
 * LazyVimeoVideo — premium thumbnail by default; swaps to the real Vimeo iframe
 * on click and plays inline WITH sound. An external trigger can call the
 * exposed `play({ fullscreen: true })` handle to open it fullscreen instead.
 */
export const LazyVimeoVideo = forwardRef<LazyVimeoVideoHandle, LazyVimeoVideoProps>(
  function LazyVimeoVideo(
    {
      videoId,
      hash,
      aspect = "16/9",
      title,
      posterSrc,
      posterAlt,
      className,
      playSize = "md",
    },
    ref
  ) {
  const [playing, setPlaying] = useState(false);
  // Whether the current playback was started in fullscreen mode. Drives
  // playsinline (iPhone native-fullscreen handoff = the only path to iOS audio).
  const [fullscreen, setFullscreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const aspectClass = {
    "16/9": "aspect-[16/9]",
    "9/16": "aspect-[9/16]",
    "4/3": "aspect-[4/3]",
    "3/4": "aspect-[3/4]",
    "1/1": "aspect-square",
  }[aspect];

  const resolvedPoster = posterSrc ?? vumbnailUrl(videoId);

  // Attach the Vimeo Player SDK to the live iframe once it mounts so real
  // playback — not just the click — is tracked: start, 25/50/75 % milestones,
  // and completion. The SDK is dynamically imported so it ships zero bytes
  // until a visitor actually plays the video.
  useEffect(() => {
    if (!playing) return;
    const iframe = iframeRef.current;
    if (!iframe) return;

    let player: import("@vimeo/player").default | null = null;
    let cancelled = false;
    const base = { video_id: videoId, video_title: title };
    let started = false;
    const milestones = [25, 50, 75];
    const fired = new Set<number>();

    import("@vimeo/player").then(({ default: Player }) => {
      if (cancelled) return;
      player = new Player(iframe);

      // Guarantee sound: some browsers (notably iOS Safari) ignore muted=0 and
      // start muted to satisfy autoplay. Force unmute + full volume once the
      // player is ready. iPhone playback is already in native fullscreen here
      // (playsinline=0), so audio is permitted.
      player.ready().then(() => {
        player?.setMuted(false).catch(() => {});
        player?.setVolume(1).catch(() => {});
      });

      player.on("play", () => {
        if (started) return;
        started = true;
        trackVideoEvent("VideoPlayStart", base);
      });

      player.on("timeupdate", (data: { percent: number }) => {
        const pct = Math.floor(data.percent * 100);
        for (const m of milestones) {
          if (pct >= m && !fired.has(m)) {
            fired.add(m);
            trackVideoEvent("VideoProgress", { ...base, percent: m });
          }
        }
      });

      player.on("ended", () => {
        trackVideoEvent("VideoComplete", { ...base, percent: 100 });
      });
    });

    return () => {
      cancelled = true;
      // unload() detaches all listeners and tears down the SDK bridge.
      player?.unload().catch(() => {});
    };
  }, [playing, videoId, title]);

  // Start playback. `fs` = open fullscreen (used by the "Watch" caption click);
  // the plain thumbnail click plays inline. flushSync mounts the iframe before
  // the fullscreen request so that call stays inside the user-gesture window
  // (desktop/Android requirement).
  const startPlayback = useCallback(
    (fs: boolean) => {
      // Already playing → the "Watch" caption is purely a fullscreen trigger:
      // fullscreen the SAME iframe without remounting (no restart, same Vimeo
      // player, same analytics events). Touching state here would reload the
      // iframe (playsinline param) and restart the video.
      if (playing) {
        if (fs) safeFullscreen(iframeRef.current);
        return;
      }
      trackVideoEvent("VideoPlayClick", { video_id: videoId, video_title: title });
      flushSync(() => {
        setFullscreen(fs);
        setPlaying(true);
      });
      if (fs) {
        // Desktop/Android: take the iframe fullscreen. iPhone has no
        // Element.requestFullscreen, so this is a no-op there — it's already
        // handing off to the native player via playsinline=0.
        safeFullscreen(iframeRef.current);
      }
    },
    [playing, videoId, title]
  );

  useImperativeHandle(
    ref,
    () => ({ play: (opts) => startPlayback(opts?.fullscreen ?? false) }),
    [startPlayback]
  );

  // No video id wired yet → branded placeholder frame that mirrors the live
  // player (play badge, no text). Drop the real Vimeo id into `videoId` later
  // and the full thumbnail → unmuted click-to-play → analytics flow lights up
  // with no other change.
  if (!videoId) {
    return (
      <VideoThumbnail
        aspect={aspect}
        playSize={playSize}
        className={className}
      />
    );
  }

  if (playing) {
    const params = new URLSearchParams({
      autoplay: "1",
      // Click is a user gesture, so the browser allows playback WITH sound.
      muted: "0",
      // Fullscreen play uses playsinline=0 so iPhone hands off to its native
      // fullscreen player (the only path to audio on iOS). Inline play keeps
      // it in-frame (=1).
      playsinline: fullscreen ? "0" : "1",
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
          ref={iframeRef}
          src={`https://player.vimeo.com/video/${videoId}?${params.toString()}`}
          className="absolute inset-0 h-full w-full"
          frameBorder={0}
          allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
          allowFullScreen
          title={title}
        />
      </div>
    );
  }

  // Plain thumbnail click → play inline (in-frame) with sound. Fullscreen is
  // reserved for the external "Watch" caption via the imperative handle.
  return (
    <button
      type="button"
      onClick={() => startPlayback(false)}
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
});

/**
 * Take an element fullscreen without EVER throwing into React.
 *
 * iOS is the reason this exists. iPhone Safari has no Element.requestFullscreen,
 * and `webkitEnterFullscreen()` throws InvalidStateError when the media isn't
 * ready yet. Either one escaping (we call this from a click handler and an
 * effect) surfaces as Next.js's "a client-side exception has occurred" white
 * screen. Every failure mode here is non-fatal: worst case we just don't go
 * fullscreen and the video still plays.
 */
function safeFullscreen(
  el:
    | (Element & {
        webkitRequestFullscreen?: () => void;
        webkitEnterFullscreen?: () => void;
      })
    | null
) {
  if (!el) return;
  try {
    if (typeof el.requestFullscreen === "function") {
      const p = el.requestFullscreen();
      if (p && typeof p.catch === "function") p.catch(() => {});
    } else if (typeof el.webkitRequestFullscreen === "function") {
      el.webkitRequestFullscreen();
    } else if (typeof el.webkitEnterFullscreen === "function") {
      // iOS Safari: only the <video> element itself can go fullscreen.
      el.webkitEnterFullscreen();
    }
  } catch {
    /* unsupported or media not ready (iOS) — never break the page */
  }
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
    /** Stable analytics key for this video, so the native-MP4 player emits the
     *  same dataLayer events as the Vimeo path. */
    videoId?: string;
    aspect?: "16/9" | "9/16" | "4/3" | "3/4" | "1/1";
    title: string;
    posterSrc: string;
    posterAlt?: string;
    className?: string;
    playSize?: "sm" | "md" | "lg";
  }
>(function LazyMp4Video(
  { src, videoId = "", aspect = "16/9", title, posterSrc, posterAlt, className, playSize = "md" },
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
    safeFullscreen(videoRef.current);
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

  // Track real playback (not just the click) on the native player: start,
  // 25/50/75 % milestones, and completion — the same dataLayer events the
  // Vimeo path fires, so both players report identically.
  useEffect(() => {
    if (!playing) return;
    const el = videoRef.current;
    if (!el) return;

    const base = { video_id: videoId, video_title: title };
    let started = false;
    const milestones = [25, 50, 75];
    const fired = new Set<number>();

    const onPlay = () => {
      if (started) return;
      started = true;
      trackVideoEvent("VideoPlayStart", base);
    };
    const onTimeUpdate = () => {
      const duration = el.duration;
      if (!duration || !Number.isFinite(duration)) return;
      const pct = Math.floor((el.currentTime / duration) * 100);
      for (const m of milestones) {
        if (pct >= m && !fired.has(m)) {
          fired.add(m);
          trackVideoEvent("VideoProgress", { ...base, percent: m });
        }
      }
    };
    const onEnded = () => trackVideoEvent("VideoComplete", { ...base, percent: 100 });

    el.addEventListener("play", onPlay);
    el.addEventListener("timeupdate", onTimeUpdate);
    el.addEventListener("ended", onEnded);
    return () => {
      el.removeEventListener("play", onPlay);
      el.removeEventListener("timeupdate", onTimeUpdate);
      el.removeEventListener("ended", onEnded);
    };
  }, [playing, videoId, title]);

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
      try {
        const el = videoRef.current;
        if (el && document.fullscreenElement === el) {
          const p = orientation?.lock?.("landscape");
          if (p && typeof p.catch === "function") p.catch(() => {});
        } else if (!document.fullscreenElement) {
          orientation?.unlock?.();
        }
      } catch {
        /* orientation lock unsupported (iOS/desktop) — ignore */
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
          trackVideoEvent("VideoPlayClick", { video_id: videoId, video_title: title });
          wantFullscreenRef.current = true;
          setPlaying(true);
        }
      },
    }),
    [playing, playCurrent, enterFullscreen, videoId, title]
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
      onClick={() => {
        trackVideoEvent("VideoPlayClick", { video_id: videoId, video_title: title });
        setPlaying(true);
      }}
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
