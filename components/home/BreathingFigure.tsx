"use client";

import { useEffect, useRef, useState } from "react";

// The hero's breathing figure.
//
// Animation: "[BB] Brick breathing" by dia rt (LottieFiles, Lottie Simple
// License), recoloured to the Shprehu palette → /public/animations/breathing.json.
// The original 4-second loop is played at half speed = one calm 8-second
// breath: frames 0–59 breathe in (eyes close, shoulders rise),
// frames 60–119 breathe out (mouth opens).
//
// Performance:
// - lottie-web's SVG-only "light" build and the JSON are fetched AFTER the
//   page has rendered, so they never delay the first paint.
// - Playback pauses whenever the figure is scrolled out of view.
// - With "reduce motion" on, it shows a single calm frame and doesn't play.
//
// The "Breathe in… / Breathe out…" caption is driven by the animation's own
// frame counter, so text and figure can never drift apart.
const SPEED = 0.5;
const EXHALE_FROM_FRAME = 60;
const STILL_FRAME = 40; // eyes closed, calm

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
  const stageRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>("in");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let observer: IntersectionObserver | undefined;
    let anim: import("lottie-web").AnimationItem | undefined;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    (async () => {
      try {
        const [{ default: lottie }, data] = await Promise.all([
          import("lottie-web/build/player/lottie_light"),
          fetch("/animations/breathing.json").then((r) => r.json()),
        ]);
        if (cancelled || !stageRef.current) return;

        anim = lottie.loadAnimation({
          container: stageRef.current,
          renderer: "svg",
          loop: true,
          autoplay: false,
          animationData: data,
          rendererSettings: { preserveAspectRatio: "xMidYMid slice", progressiveLoad: true },
        });
        anim.setSpeed(SPEED);
        anim.addEventListener("DOMLoaded", () => !cancelled && setReady(true));

        if (reduceMotion) {
          anim.goToAndStop(STILL_FRAME, true);
          return;
        }

        let last: Phase = "in";
        anim.addEventListener("enterFrame", (e: { currentTime: number }) => {
          const next: Phase = e.currentTime < EXHALE_FROM_FRAME ? "in" : "out";
          if (next !== last) {
            last = next;
            setPhase(next);
          }
        });

        // Only animate while visible (saves battery on phones)
        observer = new IntersectionObserver(([entry]) => {
          if (entry.isIntersecting) anim?.play();
          else anim?.pause();
        });
        observer.observe(stageRef.current);
      } catch {
        // If the animation can't load, the calm disc + caption still show.
      }
    })();

    return () => {
      cancelled = true;
      observer?.disconnect();
      anim?.destroy();
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
          <div
            ref={stageRef}
            aria-hidden="true"
            className={`absolute left-1/2 top-[53%] h-[135%] w-[118%] -translate-x-1/2 -translate-y-1/2 transition-opacity duration-700 ${
              ready ? "opacity-100" : "opacity-0"
            }`}
          />
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
