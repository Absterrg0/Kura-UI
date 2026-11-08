"use client";

import * as React from "react";
import { useReducedMotion } from "../../hooks/use-reduced-motion";
import { cn } from "../../lib/cn";
import { mergeRefs } from "../../lib/merge-refs";

export type ParticleFieldShape = "ring" | "point";

export interface ParticleFieldProps extends React.ComponentProps<"div"> {
  /** Number of particles. Default: scales with the area (about one per 8,000 px², 24–120). */
  count?: number;
  /** Max distance in px at which two particles are linked by a line. Default 100. */
  linkDistance?: number;
  /** Drift speed multiplier. Default 1. */
  speed?: number;
  /** Particles gently part around the pointer and link to it. Default true. */
  interactive?: boolean;
  /** Gather the particles into `shape` — the “generating” signal. Release to let them drift. Default false. */
  converge?: boolean;
  /** What the particles gather into while converging. Default "ring". */
  shape?: ParticleFieldShape;
  /** Freeze the field. Default false. */
  paused?: boolean;
  /** Device-pixel-ratio cap. Default 2. */
  maxDpr?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  seed: number;
}

function rand(seed: number) {
  const s = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
}

/** Resolve a CSS colour (tokens included) to a string a canvas accepts. */
function cssColor(host: Element, value: string): string {
  const probe = document.createElement("span");
  probe.style.cssText = "position:absolute;width:0;height:0;visibility:hidden;";
  probe.style.color = value;
  host.appendChild(probe);
  const c = getComputedStyle(probe).color;
  probe.remove();
  return c || "gray";
}

/**
 * A quiet, drifting constellation: fine points wander, link to near neighbours with hairlines and part
 * around the pointer. Set `converge` and they gather into a slowly turning ring (or a point) in
 * the accent colour — a calm “generating” signal. Canvas 2D, DPR-capped, paused offscreen, a
 * single still frame under reduced motion. Particles use the root's text colour.
 */
export function ParticleField({
  count,
  linkDistance = 100,
  speed = 1,
  interactive = true,
  converge = false,
  shape = "ring",
  paused = false,
  maxDpr = 2,
  className,
  children,
  ref,
  ...props
}: ParticleFieldProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const reducedMotion = useReducedMotion();
  const [failed, setFailed] = React.useState(false);
  const live = React.useRef({ count, linkDistance, speed, interactive, converge, shape, paused });
  live.current = { count, linkDistance, speed, interactive, converge, shape, paused };
  const kick = React.useRef<() => void>(() => {});

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setFailed(true);
      return;
    }
    setFailed(false);

    let w = 0;
    let h = 0;
    let dpr = 1;
    const particles: Particle[] = [];
    let fg = "gray";
    let accent = "gray";
    let amount = live.current.converge ? 1 : 0; // eased converge 0–1
    let spin = 0;
    let raf = 0;
    let last = 0;
    let visible = true;
    const pointer = { x: -1e4, y: -1e4, on: false };

    const readColors = () => {
      fg = getComputedStyle(root).color || "gray";
      accent = cssColor(root, "var(--kura-accent)");
    };
    readColors();

    // Density is area-based so small cards stay airy and heroes stay full.
    const seedParticles = () => {
      const target = live.current.count ?? Math.round(Math.min(120, Math.max(24, (w * h) / 8000)));
      while (particles.length < target) {
        const i = particles.length;
        const a = rand(i + 0.1) * Math.PI * 2;
        particles.push({
          x: rand(i + 0.3) * w,
          y: rand(i + 0.7) * h,
          vx: Math.cos(a) * 0.25,
          vy: Math.sin(a) * 0.25,
          r: 0.7 + rand(i + 0.9) * 0.8,
          seed: rand(i + 1.3),
        });
      }
      particles.length = target;
    };

    const resize = () => {
      const rect = root.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      w = Math.max(1, rect.width);
      h = Math.max(1, rect.height);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      seedParticles();
    };
    resize();

    const targetOf = (p: Particle, i: number) => {
      const cx = w / 2;
      const cy = h / 2;
      const n = particles.length;
      if (live.current.shape === "point") {
        const a = p.seed * Math.PI * 2 + spin * (1.5 + p.seed);
        const rad = 4 + (i % 9) * 2.2;
        return { x: cx + Math.cos(a) * rad, y: cy + Math.sin(a) * rad };
      }
      const R = Math.min(w, h) * 0.24;
      const a = (i / n) * Math.PI * 2 + spin;
      const wob = 1 + 0.06 * Math.sin(i * 1.7 + spin * 3);
      return { x: cx + Math.cos(a) * R * wob, y: cy + Math.sin(a) * R * wob };
    };

    const step = (dt: number) => {
      const { speed: s, interactive: inter, converge: conv } = live.current;
      amount += ((conv ? 1 : 0) - amount) * (1 - Math.exp(-dt * 2.2));
      spin += dt * 0.35 * s;
      const k = dt * 60;
      particles.forEach((p, i) => {
        if (amount > 0.001) {
          const t = targetOf(p, i);
          const pull = 0.02 * amount;
          p.vx += (t.x - p.x) * pull * k;
          p.vy += (t.y - p.y) * pull * k;
          p.vx *= 1 - 0.12 * amount;
          p.vy *= 1 - 0.12 * amount;
        }
        // Wander: a slow, per-particle turning drift.
        const ang = p.seed * 20 + spin * (0.6 + p.seed);
        p.vx += Math.cos(ang) * 0.004 * k * (1 - amount);
        p.vy += Math.sin(ang) * 0.004 * k * (1 - amount);
        if (inter && pointer.on) {
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 120 * 120 && d2 > 1) {
            const f = (1 - Math.sqrt(d2) / 120) * 0.12 * (1 - amount * 0.7);
            p.vx += (dx / Math.sqrt(d2)) * f * k;
            p.vy += (dy / Math.sqrt(d2)) * f * k;
          }
        }
        const v = Math.hypot(p.vx, p.vy);
        const max = (0.26 + amount * 3) * s;
        if (v > max) {
          p.vx = (p.vx / v) * max;
          p.vy = (p.vy / v) * max;
        }
        p.x += p.vx * k * s;
        p.y += p.vy * k * s;
        if (amount < 0.5) {
          if (p.x < -10) p.x = w + 10;
          if (p.x > w + 10) p.x = -10;
          if (p.y < -10) p.y = h + 10;
          if (p.y > h + 10) p.y = -10;
        }
      });
    };

    const draw = () => {
      const link = live.current.linkDistance;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = Math.max(0.5, 1 / dpr);
      const n = particles.length;
      for (let pass = 0; pass < 2; pass++) {
        const weight = pass === 0 ? 1 - amount : amount;
        if (weight < 0.01) continue;
        ctx.strokeStyle = pass === 0 ? fg : accent;
        for (let i = 0; i < n; i++) {
          const a = particles[i]!;
          for (let j = i + 1; j < n; j++) {
            const b = particles[j]!;
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const d2 = dx * dx + dy * dy;
            if (d2 > link * link) continue;
            const t = 1 - Math.sqrt(d2) / link;
            ctx.globalAlpha = t * t * 0.38 * weight;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
          if (pass === 0 && live.current.interactive && pointer.on) {
            const dx = a.x - pointer.x;
            const dy = a.y - pointer.y;
            const d = Math.hypot(dx, dy);
            if (d < link * 1.4) {
              ctx.strokeStyle = accent;
              ctx.globalAlpha = (1 - d / (link * 1.4)) ** 2 * 0.45;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(pointer.x, pointer.y);
              ctx.stroke();
              ctx.strokeStyle = fg;
            }
          }
        }
      }
      for (const p of particles) {
        ctx.globalAlpha = 0.45 + 0.4 * p.seed;
        ctx.fillStyle = amount > 0.5 ? accent : fg;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * (1 + amount * 0.3), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const still = () => {
      // Reduced motion: jump straight to the end state, no travel.
      amount = live.current.converge ? 1 : 0;
      if (amount === 1) {
        particles.forEach((p, i) => {
          const t = targetOf(p, i);
          p.x = t.x;
          p.y = t.y;
        });
      }
      draw();
    };

    const frame = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      step(dt);
      draw();
      raf = visible && !live.current.paused ? requestAnimationFrame(frame) : 0;
    };

    const isStill = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    kick.current = () => {
      if (isStill()) {
        cancelAnimationFrame(raf);
        raf = 0;
        still();
        return;
      }
      if (live.current.paused) {
        draw();
        return;
      }
      if (raf || !visible) return;
      last = 0;
      raf = requestAnimationFrame(frame);
    };
    kick.current();

    const ro = new ResizeObserver(() => {
      resize();
      if (!raf) kick.current();
    });
    ro.observe(root);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
      if (visible) kick.current();
    });
    io.observe(root);
    const mo = new MutationObserver(() => {
      readColors();
      if (!raf) kick.current();
    });
    const moOpts = { attributes: true, attributeFilter: ["class", "data-theme", "style"] };
    mo.observe(document.documentElement, moOpts);
    mo.observe(root, { attributes: true, attributeFilter: ["class", "style"] });

    const onMove = (e: PointerEvent) => {
      const r = root.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
      pointer.on =
        pointer.x >= 0 && pointer.y >= 0 && pointer.x <= r.width && pointer.y <= r.height;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      mo.disconnect();
      window.removeEventListener("pointermove", onMove);
    };
  }, [maxDpr]);

  // Restart or redraw when behaviour changes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: kick reads the latest props from `live`.
  React.useEffect(() => {
    kick.current();
  }, [paused, converge, shape, reducedMotion, count]);

  const state = failed
    ? "fallback"
    : reducedMotion || paused
      ? "still"
      : converge
        ? "converging"
        : "drifting";

  return (
    <div
      ref={mergeRefs(rootRef, ref)}
      data-slot="particle-field"
      data-state={state}
      data-converge={converge}
      className={cn("relative isolate overflow-hidden text-kura-fg-subtle", className)}
      {...props}
    >
      <canvas
        ref={canvasRef}
        aria-hidden
        data-slot="particle-field-canvas"
        className={cn("-z-10 absolute inset-0 block size-full", failed && "hidden")}
      />
      {failed && (
        <div
          aria-hidden
          data-slot="particle-field-fallback"
          className="-z-10 absolute inset-0 bg-[radial-gradient(currentColor_1px,transparent_1.5px)] bg-size-[28px_28px] opacity-30"
        />
      )}
      {children}
    </div>
  );
}
