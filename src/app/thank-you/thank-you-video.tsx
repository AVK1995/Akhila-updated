"use client";

import { useRef } from "react";
import { LazyMp4Video, type LazyMp4VideoHandle } from "@/components/landing/shared-client";

/**
 * Thank-you page video block: the "Watch this before your call" label and the
 * player share one video instance. Clicking the label starts it in fullscreen;
 * exiting fullscreen continues the same session (no restart, no double play).
 * Lives in its own client component because the parent page is server-rendered.
 */
export function ThankYouVideo() {
  const videoRef = useRef<LazyMp4VideoHandle>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => videoRef.current?.playFullscreen()}
        className="mt-10 inline-block cursor-pointer border-b-2 border-wine-600/70 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-wine-700 transition-colors hover:text-wine-800 sm:mt-12 sm:text-xs"
      >
        Watch this before your call
      </button>

      <div className="mx-auto mt-5 w-full max-w-[34rem] sm:mt-6">
        <div className="group relative isolate">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-[3px] -z-10 rounded-[30px] opacity-70 blur-md transition-opacity duration-700 group-hover:opacity-100"
            style={{
              background:
                "conic-gradient(from 0deg, rgba(193,150,50,0.45), rgba(115,42,61,0.45), rgba(193,150,50,0.45))",
            }}
          />
          <LazyMp4Video
            ref={videoRef}
            src="https://tgox-production-bucket.nyc3.cdn.digitaloceanspaces.com/client_funnel_videos/Akhila/aditya_thankyou_video.mp4%20(1080p).mp4"
            posterSrc="/images/thank-you/aditya-poster.jpg"
            posterAlt="A message from Dr. Aditya"
            aspect="16/9"
            title="A message from Dr. Aditya"
            playSize="md"
          />
        </div>
      </div>
    </>
  );
}
