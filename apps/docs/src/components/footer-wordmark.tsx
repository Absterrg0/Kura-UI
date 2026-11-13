"use client";

import { useReducedMotion } from "@kura-ui/react/hooks";
import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * The footer's wordmark: "Kura" set in lit dots on a grid of unlit ones, with an ember full stop
 * (the mark's tile, as nine dots). It draws itself left to right the first time it scrolls into
 * view, and the dots bend away from the pointer, then spring back. Under reduced motion it is
 * simply there.
 */

const WORD = "Kura";
const REVEAL_MS = 1300;
// The pointer's reach, in cells, and how far it pushes a dot at its centre, in cells.
const REACH = 13;
const PUSH = 1.6;

export function FooterWordmark({ className }: { className?: string }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let w = 0;
    let h = 0;
    let cell = 6;
    let cols = 0;
    let rows = 0;
    let ox = 0;
    // Per cell: 0 unlit, 1 ink, 2 ember.
    let cells = new Uint8Array(0);
    let ink = "#888";
    let off = "#444";
    let ember = "#f60";
    let startedAt: number | null = reduced ? -Infinity : null;
    // Where the pointer is (x, y) chasing where it went (tx, ty); s eases toward ts.
    const pointer = { x: 0, y: 0, tx: 0, ty: 0, s: 0, ts: 0 };
    let frame = 0;

    const readColors = () => {
      const cs = getComputedStyle(canvas);
      ink = cs.getPropertyValue("--kura-fg").trim() || ink;
      off = cs.getPropertyValue("--kura-dot-off").trim() || off;
      ember = cs.getPropertyValue("--kura-ember").trim() || ember;
    };

    // Set the word on a small canvas, one pixel per cell, and keep the cells it covers.
    const rasterize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cell = Math.max(4, w / 170);
      cols = Math.floor(w / cell);
      rows = Math.floor(h / cell);
      ox = (w - cols * cell) / 2;
      // Not laid out yet (hidden, or fonts resolved before layout): nothing to set until it is.
      if (cols < 1 || rows < 1) {
        cells = new Uint8Array(0);
        cols = 0;
        rows = 0;
        return;
      }

      const off2 = document.createElement("canvas");
      off2.width = cols;
      off2.height = rows;
      const c2 = off2.getContext("2d", { willReadFrequently: true });
      if (!c2) return;
      const family = getComputedStyle(document.body).fontFamily;
      c2.font = `600 100px ${family}`;
      const probe = c2.measureText(WORD);
      const ascent = probe.actualBoundingBoxAscent;
      const stop = 0.115; // the full stop's side, in em
      const scale = Math.min(
        (rows * 0.96) / ascent,
        (cols * 0.97) / (probe.width + 100 * stop * 1.5),
      );
      const size = 100 * scale;
      c2.font = `600 ${size}px ${family}`;
      const textW = c2.measureText(WORD).width;
      const total = textW + size * stop * 1.5;
      const left = Math.round((cols - total) / 2);
      const baseline = Math.round((rows + ascent * scale) / 2);
      c2.fillStyle = "#000";
      c2.fillText(WORD, left, baseline);
      const data = c2.getImageData(0, 0, cols, rows).data;
      cells = new Uint8Array(cols * rows);
      for (let i = 0; i < cols * rows; i++) cells[i] = data[i * 4 + 3]! > 110 ? 1 : 0;
      // The ember stop: a round dot of whole cells on the baseline, like the mark's one ember dot.
      const side = Math.max(3, Math.round(size * stop));
      const sx = Math.round(left + textW + size * stop * 0.5);
      const rad = side / 2;
      for (let y = baseline - side; y < baseline; y++)
        for (let x = sx; x < sx + side; x++) {
          const dx = x + 0.5 - (sx + rad);
          const dy = y + 0.5 - (baseline - rad);
          if (dx * dx + dy * dy <= rad * rad && x >= 0 && x < cols && y >= 0 && y < rows)
            cells[y * cols + x] = 2;
        }
    };

    const draw = (now: number) => {
      ctx.clearRect(0, 0, w, h);
      const t = startedAt == null ? 0 : Math.min(1, (now - startedAt) / REVEAL_MS);
      // The reveal front, in columns, eased.
      const front = (1 - (1 - t) ** 3) * (cols + 8);
      const r0 = cell * 0.36;
      const reach = REACH * cell;
      const reach2 = reach * reach;
      const push = PUSH * cell * pointer.s;
      for (let y = 0; y < rows; y++) {
        const cy = (y + 0.5) * cell;
        for (let x = 0; x < cols; x++) {
          const kind = cells[y * cols + x]!;
          let cx = ox + (x + 0.5) * cell;
          let py = cy;
          let lens = 0;
          if (pointer.s > 0.002) {
            const dx = cx - pointer.x;
            const dy = cy - pointer.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < reach2) {
              const d = Math.sqrt(d2) || 1;
              const fall = 1 - d2 / reach2;
              lens = fall * fall * pointer.s;
              cx += (dx / d) * fall * fall * push;
              py += (dy / d) * fall * fall * push;
            }
          }
          if (kind === 0) {
            // The unlit grid fades out toward the edges, so it never ends in a hard box.
            const ex = Math.min(x, cols - 1 - x) / (cols * 0.12);
            const ey = Math.min(y, rows - 1 - y) / (rows * 0.25);
            const edge = Math.min(1, ex, ey);
            ctx.globalAlpha = edge * edge * (0.55 + lens * 0.45);
            ctx.fillStyle = off;
            ctx.beginPath();
            ctx.arc(cx, py, cell * 0.16 + lens * cell * 0.06, 0, Math.PI * 2);
            ctx.fill();
            continue;
          }
          // Each lit dot grows in as the front passes it.
          const k = Math.max(0, Math.min(1, (front - x) / 6));
          if (k <= 0) continue;
          ctx.globalAlpha = 1;
          ctx.fillStyle = kind === 2 ? ember : ink;
          ctx.beginPath();
          ctx.arc(cx, py, r0 * k * (1 + lens * 0.15), 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      return t < 1;
    };

    const tick = (now: number) => {
      frame = 0;
      pointer.x += (pointer.tx - pointer.x) * 0.32;
      pointer.y += (pointer.ty - pointer.y) * 0.32;
      pointer.s += (pointer.ts - pointer.s) * 0.14;
      const settled =
        Math.abs(pointer.ts - pointer.s) < 0.004 &&
        Math.abs(pointer.tx - pointer.x) < 0.5 &&
        Math.abs(pointer.ty - pointer.y) < 0.5;
      if (settled) pointer.s = pointer.ts;
      if (draw(now) || !settled) frame = requestAnimationFrame(tick);
    };
    const kick = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };

    let alive = true;
    const setup = () => {
      if (!alive) return;
      readColors();
      rasterize();
      draw(performance.now());
    };
    void document.fonts.ready.then(setup);
    setup();

    const ro = new ResizeObserver(() => {
      rasterize();
      draw(performance.now());
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && startedAt == null) {
          startedAt = performance.now();
          kick();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(canvas);
    const mo = new MutationObserver(() => {
      readColors();
      draw(performance.now());
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    const onMove = (e: PointerEvent) => {
      if (reduced || e.pointerType === "touch") return;
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const inside = x >= 0 && x <= w && y >= 0 && y <= h;
      if (!inside && pointer.ts === 0) return;
      pointer.tx = x;
      pointer.ty = y;
      if (pointer.s < 0.01) {
        pointer.x = x;
        pointer.y = y;
      }
      pointer.ts = inside ? 1 : 0;
      kick();
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      ro.disconnect();
      io.disconnect();
      mo.disconnect();
      window.removeEventListener("pointermove", onMove);
    };
  }, [reduced]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label="Kura"
      data-slot="footer-wordmark"
      className={cn("block aspect-[3.3/1] w-full", className)}
    />
  );
}
