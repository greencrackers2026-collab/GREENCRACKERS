"use client";

import { useEffect, useRef } from "react";

type Particle = { x: number; y: number; vx: number; vy: number; life: number; max: number; hue: number; size: number };

/**
 * Lightweight canvas fireworks for the hero. Starts after the page is idle,
 * pauses when off-screen or the tab is hidden, and is skipped entirely for prefers-reduced-motion.
 */
export function Fireworks() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let running = false;
    let visible = true;
    let particles: Particle[] = [];
    let lastBurst = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const maxParticles = window.innerWidth < 640 ? 260 : 520;

    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const burst = () => {
      const { width, height } = canvas.getBoundingClientRect();
      const x = width * (0.15 + Math.random() * 0.7);
      const y = height * (0.12 + Math.random() * 0.4);
      const hue = [40, 28, 15, 330, 50, 280][Math.floor(Math.random() * 6)];
      const n = 50 + Math.floor(Math.random() * 30);
      for (let i = 0; i < n && particles.length < maxParticles; i++) {
        const a = (i / n) * Math.PI * 2;
        const sp = 1.2 + Math.random() * 2.4;
        particles.push({
          x,
          y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp,
          life: 0,
          max: 55 + Math.random() * 35,
          hue: hue + Math.random() * 20,
          size: 1.2 + Math.random() * 1.4,
        });
      }
    };

    const tick = (t: number) => {
      if (!running) return;
      const { width, height } = canvas.getBoundingClientRect();
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0,0,0,0.22)";
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter";
      if (t - lastBurst > 900 + Math.random() * 900) {
        burst();
        lastBurst = t;
      }
      particles = particles.filter((p) => p.life < p.max);
      for (const p of particles) {
        p.life++;
        p.vx *= 0.985;
        p.vy = p.vy * 0.985 + 0.035;
        p.x += p.vx;
        p.y += p.vy;
        const alpha = 1 - p.life / p.max;
        ctx.fillStyle = `hsla(${p.hue}, 100%, 65%, ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (running || !visible || document.hidden) return;
      running = true;
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(canvas);
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("resize", resize);

    // Defer start so it never competes with LCP / hydration.
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
    const timer = idle ? idle(start) : window.setTimeout(start, 1200);

    return () => {
      stop();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("resize", resize);
      if (!idle) clearTimeout(timer as number);
    };
  }, []);

  return <canvas ref={ref} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true" />;
}
