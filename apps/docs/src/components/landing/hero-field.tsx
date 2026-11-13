"use client";

import { useReducedMotion } from "@kura-ui/react/hooks";
import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * The hero's ground, drawn in the library's one motif: dots.
 *
 * - a faint grid, quieter behind the headline and gone at the edges;
 * - tokens: short runs of lit dots that fall down a column, a step at a time, the way an agent
 *   emits them;
 * - two dotted rings around the headline, each with a light chasing it: the status glyph's
 *   "running" ring at page scale;
 * - the field bends around the pointer: dots within reach are pushed away from it (hardest
 *   close in) and brighten, then spring back when it leaves.
 *
 * Under reduced motion it draws one still frame. It pauses offscreen and in background tabs.
 */

const PITCH = 22;
// How far the pointer reaches, and how hard it pushes the dots at its centre.
const REACH = 190;
const PUSH = 30;

interface Stream {
  col: number;
  head: number;
  speed: number;
  len: number;
}

export function HeroField({ anchorId, className }: { anchorId: string; className?: string }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let cx = 0;
    let cy = 0;
    let ring = 300;
    let ink = "#888";
    // Where the pointer is (x, y) chasing where it went (tx, ty); s eases toward ts (1 inside).
    const pointer = { x: 0, y: 0, tx: 0, ty: 0, s: 0, ts: 0 };
    let frame = 0;
    let visible = true;
    let last = performance.now();
    let spawnIn = 0;
    const streams: Stream[] = [];
    const t0 = performance.now();

    const readColors = () => {
      ink = getComputedStyle(canvas).getPropertyValue("--kura-fg").trim() || ink;
    };

    const layout = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const anchor = document.getElementById(anchorId)?.getBoundingClientRect();
      cx = anchor ? anchor.left + anchor.width / 2 - rect.left : w / 2;
      cy = anchor ? anchor.top + anchor.height / 2 - rect.top + 40 : h * 0.4;
      ring = Math.max(250, Math.min(w * 0.36, anchor ? anchor.width * 0.66 : 420));
    };

    // How much a point may show: nothing at the edges, half behind the headline, full between.
    const field = (x: number, y: number) => {
      const ex = Math.abs(x - w / 2) / (w / 2);
      const edge = Math.max(0, 1 - ex ** 4) * Math.max(0, 1 - (y / h) ** 2.4);
      const dx = (x - cx) / (ring * 1.05);
      const dy = (y - cy) / (ring * 0.62);
      const inner = Math.min(1, Math.sqrt(dx * dx + dy * dy));
      return edge * (0.4 + 0.6 * inner * inner);
    };

    // The bend: how far a dot at (x, y) moves away from the pointer, and how near it is (0..1).
    const bend = (x: number, y: number): [number, number, number] => {
      if (pointer.s < 0.002) return [x, y, 0];
      const dx = x - pointer.x;
      const dy = y - pointer.y;
      const d2 = dx * dx + dy * dy;
      if (d2 >= REACH * REACH) return [x, y, 0];
      const d = Math.sqrt(d2) || 1;
      const fall = 1 - d2 / (REACH * REACH);
      const near = fall * fall * pointer.s;
      return [x + (dx / d) * near * PUSH, y + (dy / d) * near * PUSH, near];
    };

    const dot = (x: number, y: number, r: number, a: number) => {
      if (a <= 0.004) return;
      ctx.globalAlpha = Math.min(1, a);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    };

    const draw = (now: number) => {
      const dt = Math.min(64, now - last) / 1000;
      last = now;
      const t = (now - t0) / 1000;
      const k = Math.min(1, dt * 60);
      pointer.x += (pointer.tx - pointer.x) * 0.3 * k;
      pointer.y += (pointer.ty - pointer.y) * 0.3 * k;
      pointer.s += (pointer.ts - pointer.s) * 0.12 * k;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = ink;

      const cols = Math.ceil(w / PITCH) + 1;
      const rows = Math.ceil(h / PITCH) + 1;
      const ox = (w - (cols - 1) * PITCH) / 2;
      const oy = PITCH / 2;

      // The tokens: lit cells by column and row, brightest at the head.
      const lit = new Map<number, number>();
      if (!reduced) {
        spawnIn -= dt;
        if (spawnIn <= 0 && streams.length < Math.max(6, Math.round(cols / 4))) {
          spawnIn = 0.18 + Math.random() * 0.35;
          streams.push({
            col: Math.floor(Math.random() * cols),
            head: -1,
            speed: 6 + Math.random() * 7,
            len: 3 + Math.floor(Math.random() * 6),
          });
        }
        for (let i = streams.length - 1; i >= 0; i--) {
          const s = streams[i]!;
          s.head += s.speed * dt;
          const row = Math.floor(s.head);
          if (row - s.len > rows) {
            streams.splice(i, 1);
            continue;
          }
          for (let k = 0; k <= s.len; k++) {
            const r = row - k;
            if (r < 0 || r >= rows) continue;
            const key = r * cols + s.col;
            const v = k === 0 ? 1 : (1 - k / (s.len + 1)) * 0.7;
            lit.set(key, Math.max(lit.get(key) ?? 0, v));
          }
        }
      }

      for (let r = 0; r < rows; r++) {
        const y = oy + r * PITCH;
        for (let c = 0; c < cols; c++) {
          const x = ox + c * PITCH;
          const f = field(x, y);
          if (f <= 0.01) continue;
          const [bx, by, l] = bend(x, y);
          const token = lit.get(r * cols + c) ?? 0;
          dot(bx, by, 1.15 + l * 0.9 + token * 0.6, f * (0.26 + l * 0.6 + token * 0.7));
        }
      }

      // The rings: dots on two circles, with a light running round each (the outer one the other way).
      for (const [radius, dir, speed, spacing] of [
        [ring, 1, 0.32, 13],
        [ring * 1.42, -1, 0.21, 15],
      ] as const) {
        const n = Math.round((Math.PI * 2 * radius) / spacing);
        const head = reduced ? -Math.PI / 3 : dir * t * speed - Math.PI / 2;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2;
          const x = cx + Math.cos(a) * radius;
          const y = cy + Math.sin(a) * radius * 0.62;
          if (x < -4 || x > w + 4 || y < -4 || y > h + 4) continue;
          const f = field(x, y);
          if (f <= 0.01) continue;
          // Angular distance behind the head, in the direction of travel.
          let d = (dir * (head - a)) % (Math.PI * 2);
          if (d < 0) d += Math.PI * 2;
          const run = d < 1.1 ? (1 - d / 1.1) ** 1.6 : 0;
          const [bx, by, l] = bend(x, y);
          dot(bx, by, 1.2 + run * 0.6 + l * 0.8, f * (0.32 + run * 0.68 + l * 0.5));
        }
      }
      ctx.globalAlpha = 1;
    };

    const loop = (now: number) => {
      frame = 0;
      draw(now);
      if (!reduced && visible && !document.hidden) frame = requestAnimationFrame(loop);
    };
    const start = () => {
      if (!frame) {
        last = performance.now();
        frame = requestAnimationFrame(loop);
      }
    };

    readColors();
    layout();
    draw(performance.now());
    if (!reduced) start();

    const ro = new ResizeObserver(() => {
      layout();
      draw(performance.now());
    });
    ro.observe(canvas);
    const io = new IntersectionObserver((entries) => {
      visible = entries.some((e) => e.isIntersecting);
      if (visible && !reduced) start();
    });
    io.observe(canvas);
    const mo = new MutationObserver(() => {
      readColors();
      draw(performance.now());
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const inside = x >= 0 && x <= w && y >= 0 && y <= h;
      pointer.tx = x;
      pointer.ty = y;
      // Coming in from nowhere, the bend starts where the pointer is rather than sliding over.
      if (pointer.s < 0.01) {
        pointer.x = x;
        pointer.y = y;
      }
      pointer.ts = inside ? 1 : 0;
    };
    const onLeave = () => {
      pointer.ts = 0;
    };
    const onVisibility = () => {
      if (!document.hidden && visible && !reduced) start();
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      io.disconnect();
      mo.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [anchorId, reduced]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      data-slot="hero-field"
      className={cn("pointer-events-none absolute inset-x-0 block w-full select-none", className)}
    />
  );
}
