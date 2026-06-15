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
  /** Vimeo numeric id. Empty string → renders the placeholder frame. Still
   *  passed when `mp4Src` is set so analytics keep a stable key across the
   *  Vimeo → CDN switch. */
  videoId: string;
  hash?: string;
  /**
   * Direct .mp4 URL (e.g. a DigitalOcean Spaces CDN endpoint). When set, the
   * component plays this through a native <video> instead of the Vimeo iframe —
   * used while Vimeo is unavailable. Same thumbnail → click-to-play → fullscreen
   * UX, and it fires the SAME dataLayer video events as the Vimeo path.
   */
  mp4Src?: string;
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
const LazyVimeoVideoVimeo = forwardRef<LazyVimeoVideoHandle, LazyVimeoVideoProps>(
  function LazyVimeoVideoVimeo(
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
        if (fs) iframeRef.current?.requestFullscreen?.().catch(() => {});
        return;
      }
      trackVideoEvent("VideoPlayClick", { video_id: videoId, video_title: title });
      flushSync(() => {
        setFullscreen(fs);
        setPlaying(true);
      });
      if (fs) {
        // Desktop/Android: take the iframe fullscreen. iPhone rejects this but
        // is already going fullscreen natively via playsinline=0.
        iframeRef.current?.requestFullscreen?.().catch(() => {});
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

/** Take a native <video> fullscreen. iOS Safari only supports fullscreen on the
 *  <video> element itself (webkitEnterFullscreen) — not the standard API. */
function requestVideoFullscreen(el: HTMLVideoElement) {
  const ios = el as HTMLVideoElement & { webkitEnterFullscreen?: () => void };
  if (typeof el.requestFullscreen === "function") {
    el.requestFullscreen().catch(() => {});
  } else if (typeof ios.webkitEnterFullscreen === "function") {
    ios.webkitEnterFullscreen();
  }
}

/**
 * LazyVimeoVideoMp4 — same premium thumbnail → unmuted click-to-play →
 * fullscreen UX as the Vimeo player, but the source is a direct .mp4 (served
 * from the DigitalOcean Spaces CDN) played through a native <video>. Used while
 * Vimeo is down. Fires the SAME dataLayer video events as the Vimeo path
 * (VideoPlayClick / PlayStart / Progress 25·50·75 / Complete) so analytics stay
 * unbroken — keyed on the original `videoId` when present.
 */
const LazyVimeoVideoMp4 = forwardRef<LazyVimeoVideoHandle, LazyVimeoVideoProps>(
  function LazyVimeoVideoMp4(
    {
      videoId,
      mp4Src,
      aspect = "16/9",
      title,
      posterSrc,
      className,
      playSize = "md",
    },
    ref
  ) {
    const [playing, setPlaying] = useState(false);
    const [fullscreen, setFullscreen] = useState(false);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    // Reuse the old Vimeo id as the analytics key when present (stable across
    // the Vimeo → CDN switch); otherwise fall back to the title.
    const analyticsId = videoId || title;
    const startedRef = useRef(false);
    const firedRef = useRef<Set<number>>(new Set());

    const aspectClass = {
      "16/9": "aspect-[16/9]",
      "9/16": "aspect-[9/16]",
      "4/3": "aspect-[4/3]",
      "3/4": "aspect-[3/4]",
      "1/1": "aspect-square",
    }[aspect];

    // Idle thumbnail = the real frame at ~1s. Seek there once metadata loads,
    // before playback begins — no external thumbnail service / Vimeo poster
    // needed, and the thumbnail always matches the actual video.
    const onLoadedMetadata = useCallback(
      (e: React.SyntheticEvent<HTMLVideoElement>) => {
        if (startedRef.current) return;
        const el = e.currentTarget;
        const dur = Number.isFinite(el.duration) ? el.duration : 0;
        const target = dur > 1 ? 1 : Math.max(0, dur - 0.05);
        try {
          el.currentTime = target;
        } catch {
          /* a pre-buffer seek can be rejected; falls back to frame 0 */
        }
      },
      []
    );

    // Native <video> analytics — mirrors the Vimeo SDK wiring above.
    const onPlay = useCallback(() => {
      if (startedRef.current) return;
      startedRef.current = true;
      trackVideoEvent("VideoPlayStart", { video_id: analyticsId, video_title: title });
    }, [analyticsId, title]);

    const onTimeUpdate = useCallback(
      (e: React.SyntheticEvent<HTMLVideoElement>) => {
        // Ignore the timeupdate produced by the idle poster-frame seek — only
        // count watch progress once real playback has begun.
        if (!startedRef.current) return;
        const el = e.currentTarget;
        if (!el.duration || !Number.isFinite(el.duration)) return;
        const pct = Math.floor((el.currentTime / el.duration) * 100);
        for (const m of [25, 50, 75]) {
          if (pct >= m && !firedRef.current.has(m)) {
            firedRef.current.add(m);
            trackVideoEvent("VideoProgress", {
              video_id: analyticsId,
              video_title: title,
              percent: m,
            });
          }
        }
      },
      [analyticsId, title]
    );

    const onEnded = useCallback(() => {
      trackVideoEvent("VideoComplete", {
        video_id: analyticsId,
        video_title: title,
        percent: 100,
      });
    }, [analyticsId, title]);

    // Start playback. `fs` = open fullscreen (the "Watch" caption); the plain
    // thumbnail click plays inline. The <video> is already mounted (it renders
    // the poster frame), so flushSync just flips controls/muted inside the
    // user-gesture window before we call play()/fullscreen.
    const startPlayback = useCallback(
      (fs: boolean) => {
        if (playing) {
          // Already playing → caption is purely a fullscreen trigger.
          if (fs && videoRef.current) requestVideoFullscreen(videoRef.current);
          return;
        }
        trackVideoEvent("VideoPlayClick", { video_id: analyticsId, video_title: title });
        flushSync(() => {
          setFullscreen(fs);
          setPlaying(true);
        });
        const v = videoRef.current;
        if (v) {
          // Click is a user gesture → unmuted playback is permitted. Rewind
          // from the ~1s poster frame so playback starts at the beginning.
          v.muted = false;
          v.volume = 1;
          try {
            v.currentTime = 0;
          } catch {
            /* ignore */
          }
          const p = v.play();
          if (p && typeof p.catch === "function") p.catch(() => {});
          if (fs) requestVideoFullscreen(v);
        }
      },
      [playing, analyticsId, title]
    );

    useImperativeHandle(
      ref,
      () => ({ play: (opts) => startPlayback(opts?.fullscreen ?? false) }),
      [startPlayback]
    );

    // One persistent <video>: muted + seeked to ~1s as the idle poster frame,
    // then unmuted + played on click. object-contain mirrors Vimeo's
    // letterboxing so a source whose aspect doesn't match the frame is never
    // cropped. The play badge overlays the frame until playback starts.
    return (
      <div
        className={cn(
          "relative w-full transform-gpu overflow-hidden rounded-[28px] bg-ink-900 shadow-premium-xl ring-1 ring-inset ring-white/35 [backface-visibility:hidden]",
          aspectClass,
          className
        )}
      >
        <video
          ref={videoRef}
          src={mp4Src}
          poster={posterSrc}
          className="absolute inset-0 h-full w-full bg-ink-900 object-contain"
          preload="metadata"
          muted={!playing}
          controls={playing}
          playsInline={!fullscreen}
          onLoadedMetadata={onLoadedMetadata}
          onPlay={onPlay}
          onTimeUpdate={onTimeUpdate}
          onEnded={onEnded}
          title={title}
        />
        {!playing && (
          <button
            type="button"
            onClick={() => startPlayback(false)}
            aria-label={`Play video: ${title}`}
            className="group/play absolute inset-0 z-10 flex cursor-pointer items-center justify-center"
          >
            <span
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-b from-ink-900/15 via-transparent to-ink-900/35"
            />
            <PlayButton3D size={playSize} />
          </button>
        )}
      </div>
    );
  }
);

/**
 * LazyVimeoVideo — public entry. Delegates to the native-<video> player when an
 * `mp4Src` is supplied (Vimeo currently down), otherwise to the Vimeo iframe
 * player. The wrapper itself holds no hooks, so the branch is rules-of-hooks
 * safe even though `mp4Src` decides which implementation mounts.
 */
export const LazyVimeoVideo = forwardRef<LazyVimeoVideoHandle, LazyVimeoVideoProps>(
  function LazyVimeoVideo(props, ref) {
    if (props.mp4Src) return <LazyVimeoVideoMp4 ref={ref} {...props} />;
    return <LazyVimeoVideoVimeo ref={ref} {...props} />;
  }
);
