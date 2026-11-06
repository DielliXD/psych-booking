"use client";

import { useEffect, useRef, useState } from "react";

// The hero's breathing figure.
//
// Animation: "[BB] Brick breathing" by dia rt (LottieFiles, Lottie Simple
// License), recoloured to the Shprehu palette and pre-rendered to a short
// looping video (public/animations/breathing.mp4, ~100 KB, 8 s = one calm
// breath: 0–4 s breathe in, 4–8 s breathe out).
//
// Why a video and not the Lottie player: the player had to build and
// redraw an SVG with JavaScript 60 times a second, which kept phones busy
// and slowed the first load. The browser plays a video on the GPU with no
// JavaScript at all.
//
// - The poster (one still frame, ~8 KB) shows instantly, before the video loads.
// - Playback pauses whenever the figure is scrolled out of view.
// - With "reduce motion" on, it stays on the still frame.
// The "Breathe in… / Breathe out…" caption follows the video's own clock.

const BREATH_SECONDS = 8;
type Phase = "in" | "out";

export function BreathingFigure({
  inhaleLabel,
  exhaleLabel,
  ariaLabel,
}: {
  inhaleLabel: string;
  exhaleLabel: string;
  ariaLabel: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [phase, setPhase] = useState<Phase>("in");

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const onTime = () => {
      const next: Phase = video.currentTime % BREATH_SECONDS < BREATH_SECONDS / 2 ? "in" : "out";
      setPhase((prev) => (prev === next ? prev : next));
    };
    video.addEventListener("timeupdate", onTime);

    // Only play while visible (saves battery on phones)
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) video.play().catch(() => undefined);
      else video.pause();
    });
    observer.observe(video);

    return () => {
      observer.disconnect();
      video.removeEventListener("timeupdate", onTime);
    };
  }, []);

  const inhaling = phase === "in";

  return (
    <figure className="relative mx-auto flex w-full max-w-[27rem] flex-col items-center gap-5 sm:gap-6">
      <div className="relative aspect-square w-full">
        {/* Warm glow that swells on the in-breath and settles on the out-breath */}
        <div
          aria-hidden="true"
          className="absolute -inset-[14%] rounded-full bg-[radial-gradient(circle,rgba(240,162,123,0.42)_0%,rgba(240,162,123,0.12)_45%,rgba(240,162,123,0)_70%)] transition-transform duration-[4000ms] ease-in-out"
          style={{ transform: `scale(${inhaling ? 1 : 0.86})` }}
        />
        {/* Light disc keeps the dark-haired figure readable on the dark hero */}
        <div
          role="img"
          aria-label={ariaLabel}
          className="absolute inset-0 overflow-hidden rounded-full bg-linen ring-2 ring-apricot/60 ring-offset-4 ring-offset-night"
        >
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            poster="/animations/breathing-poster.webp"
            muted
            loop
            playsInline
            preload="metadata"
            disablePictureInPicture
            disableRemotePlayback
            aria-hidden="true"
            width={720}
            height={720}
          >
            <source src="/animations/breathing.mp4" type="video/mp4" />
          </video>
        </div>
      </div>

      {/* Caption, cross-fading with the breath. aria-hidden: purely decorative pacing. */}
      <figcaption aria-hidden="true" className="grid h-9 place-items-center font-display text-2xl font-medium tracking-tight text-mist sm:text-[1.65rem]">
        <span className={`col-start-1 row-start-1 transition-opacity duration-700 ${inhaling ? "opacity-100" : "opacity-0"}`}>
          {inhaleLabel}
        </span>
        <span className={`col-start-1 row-start-1 transition-opacity duration-700 ${inhaling ? "opacity-0" : "opacity-100"}`}>
          {exhaleLabel}
        </span>
      </figcaption>
    </figure>
  );
}
