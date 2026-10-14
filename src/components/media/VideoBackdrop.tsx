"use client";

import { useEffect, useRef, useState } from "react";

const FADE_MS = 1200;

type Props = {
  /** Clip names in /public/videos: `<name>-720.mp4`, `<name>-360.mp4`, `<name>.webp` (poster). */
  clips: string[];
  className?: string;
  videoClassName?: string;
  /** Only play on large screens (e.g. the site-wide ambient layer). */
  desktopOnly?: boolean;
  /** Render the still poster under the video (off for the ambient layer). */
  showPoster?: boolean;
};

/**
 * Smooth background video: shows a tiny poster instantly (good LCP), then — after the page is idle —
 * plays the clips, crossfading between two stacked <video> elements so there is never a hard cut.
 * Pauses when off-screen or the tab is hidden; skipped for prefers-reduced-motion and Save-Data users.
 */
export function VideoBackdrop({ clips, className = "", videoClassName = "", desktopOnly = false, showPoster = true }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const vids = [useRef<HTMLVideoElement>(null), useRef<HTMLVideoElement>(null)];
  const [enabled, setEnabled] = useState(false);
  const [quality, setQuality] = useState<"720" | "360">("720");
  const [front, setFront] = useState(0); // which <video> is visible
  const [srcs, setSrcs] = useState<[string | null, string | null]>([null, null]);
  const idx = useRef(0);
  const fading = useRef(false);
  const visible = useRef(true);

  // Decide whether to play at all, and at what quality.
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    if (reduce || conn?.saveData || (desktopOnly && window.innerWidth < 1024)) return;
    setQuality(window.innerWidth < 768 || /2g|3g/.test(conn?.effectiveType ?? "") ? "360" : "720");
    const start = () => setEnabled(true);
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    const id = w.requestIdleCallback ? w.requestIdleCallback(start, { timeout: 2500 }) : window.setTimeout(start, 1200);
    return () => {
      if (!w.requestIdleCallback) clearTimeout(id);
    };
  }, [desktopOnly]);

  const url = (name: string) => `/videos/${name}-${quality}.mp4`;

  useEffect(() => {
    if (enabled) setSrcs([url(clips[0]), clips.length > 1 ? url(clips[1 % clips.length]) : null]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, quality]);

  // Play the front video when its source is ready.
  useEffect(() => {
    const v = vids[front].current;
    if (!enabled || !v || !srcs[front] || !visible.current) return;
    v.play().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, srcs, front]);

  // Pause when off-screen or tab hidden.
  useEffect(() => {
    if (!enabled || !wrap.current) return;
    const setPlaying = (on: boolean) => {
      const v = vids[front].current;
      if (!v) return;
      if (on) v.play().catch(() => {});
      else v.pause();
    };
    const io = new IntersectionObserver(([e]) => {
      visible.current = e.isIntersecting;
      setPlaying(e.isIntersecting && !document.hidden);
    });
    io.observe(wrap.current);
    const onVis = () => setPlaying(!document.hidden && visible.current);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, front]);

  // Crossfade to the next clip shortly before the current one ends.
  const onTime = (i: number) => {
    const v = vids[i].current;
    if (clips.length < 2 || i !== front || fading.current || !v || !v.duration) return;
    if (v.duration - v.currentTime > FADE_MS / 1000) return;
    fading.current = true;
    const back = 1 - i;
    const b = vids[back].current;
    if (!b) return;
    b.currentTime = 0;
    b.play().catch(() => {});
    setFront(back);
    window.setTimeout(() => {
      // Preload the clip after next into the now-hidden element.
      idx.current = (idx.current + 1) % clips.length;
      const upcoming = clips[(idx.current + 1) % clips.length];
      setSrcs((s) => {
        const n: [string | null, string | null] = [...s];
        n[i] = url(upcoming);
        return n;
      });
      v.pause();
      fading.current = false;
    }, FADE_MS + 50);
  };

  return (
    <div ref={wrap} className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      {/* Poster: shown instantly, stays underneath as a fallback */}
      {showPoster && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`/videos/${clips[0]}.webp`} alt="" className={`absolute inset-0 h-full w-full object-cover ${videoClassName}`} decoding="async" />
      )}
      {enabled &&
        [0, 1].map((i) => (
          <video
            key={i}
            ref={vids[i]}
            src={srcs[i] ?? undefined}
            muted
            playsInline
            loop={clips.length === 1}
            preload={i === front ? "auto" : "metadata"}
            onTimeUpdate={() => onTime(i)}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity ease-in-out ${videoClassName}`}
            style={{ opacity: i === front ? 1 : 0, transitionDuration: `${FADE_MS}ms` }}
          />
        ))}
    </div>
  );
}
