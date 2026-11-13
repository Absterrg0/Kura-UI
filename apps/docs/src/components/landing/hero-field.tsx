"use client";

import { useReducedMotion } from "@kura-ui/react/hooks";
import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * The hero's ground: a fine grid of dots, quieter behind the headline and gone at the edges. It
 * bends around the pointer (dots within reach are pushed away from it and brighten, then spring
 * back when it leaves). It draws only while the bend is moving, so at rest it costs nothing.
 * Under reduced motion it is a still grid.
 */

const PITCH = 22;
// How far the pointer reaches, and how hard it pushes the dots at its centre.
const REACH = 190;
const PUSH = 30;

export function HeroField({ anchorId, className }: { anchorId: string; className?: string }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let w = 0;
    let h = 0;
    let ink = "#888";
    // Every dot's rest position and how much it may show (precomputed once per layout).
    let xs = new Float32Array(0);
    let ys = new Float32Array(0);
    let alphas = new Float32Array(0);
    // Where the pointer is (x, y) chasing where it went (tx, ty); s eases toward ts (1 inside).
    const pointer = { x: 0, y: 0, tx: 0, ty: 0, s: 0, ts: 0 };
    let frame = 0;

    const layout = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ink = getComputedStyle(canvas).getPropertyValue("--kura-fg").trim() || ink;

      const anchor = document.getElementById(anchorId)?.getBoundingClientRect();
      const cx = anchor ? anchor.left + anchor.width / 2 - rect.left : w / 2;
      const cy = anchor ? anchor.top + anchor.height / 2 - rect.top + 40 : h * 0.4;
      const rx = anchor ? anchor.width * 0.7 : 420;
      const ry = anchor ? anchor.height * 1.6 : 220;

      const cols = Math.ceil(w / PITCH) + 1;
      const rows = Math.ceil(h / PITCH) + 1;
      const ox = (w - (cols - 1) * PITCH) / 2;
      const nx: number[] = [];
      const ny: number[] = [];
      const na: number[] = [];
      for (let r = 0; r < rows; r++) {
        const y = PITCH / 2 + r * PITCH;
        for (let c = 0; c < cols; c++) {
          const x = ox + c * PITCH;
          // Gone at the sides and the bottom; half as strong behind the headline.
          const ex = Math.abs(x - w / 2) / (w / 2);
          const edge = Math.max(0, 1 - ex ** 4) * Math.max(0, 1 - (y / h) ** 2.2);
          const dx = (x - cx) / rx;
          const dy = (y - cy) / ry;
          const inner = Math.min(1, Math.sqrt(dx * dx + dy * dy));
          const a = edge * (0.45 + 0.55 * inner * inner) * 0.3;
          if (a < 0.01) continue;
          nx.push(x);
          ny.push(y);
          na.push(a);
        }
      }
      xs = Float32Array.from(nx);
      ys = Float32Array.from(ny);
      alphas = Float32Array.from(na);
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = ink;
      const reach2 = REACH * REACH;
      const bending = pointer.s > 0.002;
      for (let i = 0; i < xs.length; i++) {
        let x = xs[i]!;
        let y = ys[i]!;
        let r = 1.15;
        let a = alphas[i]!;
        if (bending) {
          const dx = x - pointer.x;
          const dy = y - pointer.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < reach2) {
            const d = Math.sqrt(d2) || 1;
            const fall = 1 - d2 / reach2;
            const near = fall * fall * pointer.s;
            x += (dx / d) * near * PUSH;
            y += (dy / d) * near * PUSH;
            r += near * 0.9;
            a += near * 0.55;
          }
        }
        ctx.globalAlpha = Math.min(1, a);
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    // Ease the pointer and the bend's strength; keep drawing until both have settled.
    const tick = () => {
      frame = 0;
      pointer.x += (pointer.tx - pointer.x) * 0.3;
      pointer.y += (pointer.ty - pointer.y) * 0.3;
      pointer.s += (pointer.ts - pointer.s) * 0.12;
      const settled =
        Math.abs(pointer.ts - pointer.s) < 0.004 &&
        Math.abs(pointer.tx - pointer.x) < 0.5 &&
        Math.abs(pointer.ty - pointer.y) < 0.5;
      if (settled) pointer.s = pointer.ts;
      draw();
      if (!settled) frame = requestAnimationFrame(tick);
    };
    const kick = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };

    layout();
    draw();

    const ro = new ResizeObserver(() => {
      layout();
      draw();
    });
    ro.observe(canvas);
    const mo = new MutationObserver(() => {
      ink = getComputedStyle(canvas).getPropertyValue("--kura-fg").trim() || ink;
      draw();
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    const onMove = (e: PointerEvent) => {
      if (reduced || e.pointerType === "touch") return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const inside = x >= 0 && x <= w && y >= 0 && y <= h;
      if (!inside && pointer.ts === 0) return;
      pointer.tx = x;
      pointer.ty = y;
      // Coming in from nowhere, the bend starts where the pointer is rather than sliding over.
      if (pointer.s < 0.01) {
        pointer.x = x;
        pointer.y = y;
      }
      pointer.ts = inside ? 1 : 0;
      kick();
    };
    const onLeave = () => {
      pointer.ts = 0;
      kick();
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
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
