"use client";

import { useReducedMotion } from "@kura-ui/react/hooks";
import { type AgentStatus, StatusGlyph } from "@kura-ui/react/status-glyph";
import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * The hero's one picture: the library's status glyph set large on a dot matrix, living through
 * its states. Queued is a hollow ring; running sends a light round it; needs-you turns it ember
 * and blinks its centre; done fills the disc from the middle out. Each dot eases to its next
 * state, so one state melts into the next. Under it, the component call that draws it.
 * Press it to step on. Under reduced motion it holds still on "running".
 */

const N = 25; // cells across
const C = (N - 1) / 2;
const RING = 9; // ring radius, in cells

const STATES: { status: AgentStatus; label: string; ms: number }[] = [
  { status: "queued", label: "Queued", ms: 1600 },
  { status: "running", label: "Running", ms: 4400 },
  { status: "waiting", label: "Needs you", ms: 3600 },
  { status: "done", label: "Done", ms: 2600 },
];

type RGB = [number, number, number];

/** Any CSS colour the canvas understands, as rgb and alpha. */
function parse(ctx: CanvasRenderingContext2D, css: string): [RGB, number] {
  ctx.fillStyle = "#000";
  ctx.fillStyle = css;
  const v = ctx.fillStyle;
  if (v.startsWith("#")) {
    const n = Number.parseInt(v.slice(1), 16);
    return [[(n >> 16) & 255, (n >> 8) & 255, n & 255], 1];
  }
  const m = v.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0, 1];
  return [[m[0]!, m[1]!, m[2]!], m[3] ?? 1];
}

export function HeroGlyph({ className }: { className?: string }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();
  const [index, setIndex] = React.useState(1);
  const state = STATES[index]!;
  // The state the drawing loop reads, and when it began.
  const live = React.useRef({ index: 1, since: 0 });
  // Under reduced motion nothing loops, so a new state asks for one fresh frame.
  const redraw = React.useRef<() => void>(() => {});

  // Step through the states on their own clock.
  React.useEffect(() => {
    live.current = { index, since: performance.now() };
    if (reduced) {
      redraw.current();
      return;
    }
    const t = setTimeout(() => setIndex((i) => (i + 1) % STATES.length), STATES[index]!.ms);
    return () => clearTimeout(t);
  }, [index, reduced]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let size = 0;
    let pitch = 0;
    let ink: RGB = [128, 128, 128];
    let ember: RGB = [242, 89, 26];
    let off: RGB = [128, 128, 128];
    let offAlpha = 0.15;
    const count = N * N;
    const dist = new Float32Array(count);
    const angle = new Float32Array(count);
    const fade = new Float32Array(count);
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        const i = y * N + x;
        const dx = x - C;
        const dy = y - C;
        dist[i] = Math.hypot(dx, dy);
        // Clockwise from twelve o'clock.
        angle[i] = (Math.atan2(dx, -dy) + Math.PI * 2) % (Math.PI * 2);
        // The unlit matrix thins out toward its corners, so it never ends in a hard square.
        fade[i] = Math.max(0, 1 - (dist[i]! / (C * 1.32)) ** 3);
      }
    // The ring: a midpoint circle, so it is exactly one dot thick with no clumps on the diagonals.
    const ring = new Uint8Array(count);
    {
      let x = RING;
      let y = 0;
      let err = 1 - RING;
      while (x >= y) {
        for (const [px, py] of [
          [x, y],
          [y, x],
          [-y, x],
          [-x, y],
          [-x, -y],
          [-y, -x],
          [y, -x],
          [x, -y],
        ] as const)
          ring[(C + py) * N + (C + px)] = 1;
        y++;
        if (err < 0) err += 2 * y + 1;
        else {
          x--;
          err += 2 * (y - x) + 1;
        }
      }
    }
    // Each dot's current light (0..1) and ember (0..1), easing toward their targets.
    const light = new Float32Array(count);
    const warm = new Float32Array(count);
    const pointer = { x: 0, y: 0, tx: 0, ty: 0, s: 0, ts: 0 };
    let frame = 0;
    let visible = true;

    const colors = () => {
      const cs = getComputedStyle(canvas);
      ink = parse(ctx, cs.getPropertyValue("--kura-fg").trim() || "#888")[0];
      ember = parse(ctx, cs.getPropertyValue("--kura-ember").trim() || "#f2591a")[0];
      [off, offAlpha] = parse(ctx, cs.getPropertyValue("--kura-dot-off").trim() || "#444");
    };
    const layout = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      size = rect.width;
      pitch = size / N;
      canvas.width = Math.round(size * dpr);
      canvas.height = Math.round(size * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    // What each dot wants to be right now: [light, ember].
    const target = (i: number, now: number): [number, number] => {
      const { index: s, since } = live.current;
      const status = STATES[s]!.status;
      const d = dist[i]!;
      const onRing = ring[i] === 1;
      const t = (now - since) / 1000;
      if (status === "queued") return onRing ? [0.32, 0] : [0, 0];
      if (status === "running") {
        if (!onRing) return [0, 0];
        const head = reduced ? Math.PI * 0.6 : (t * Math.PI * 2) / 1.6;
        const behind = (((head - angle[i]!) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const tail = Math.max(0, 1 - behind / (Math.PI * 1.15));
        return [0.22 + 0.78 * tail ** 2.2, 0];
      }
      if (status === "waiting") {
        if (onRing) return [0.95, 1];
        if (d <= 2.3) {
          const blink = (Math.sin((t * Math.PI * 2) / 1.2 - Math.PI / 2) + 1) / 2;
          return [0.3 + 0.7 * blink, 1];
        }
        return [0, 0];
      }
      // Done: the disc fills from the centre out.
      const reach = Math.min(RING, (t / 0.8) * RING);
      return d <= reach || onRing ? [1, 0] : [0, 0];
    };

    const draw = (now: number, ease: number) => {
      ctx.clearRect(0, 0, size, size);
      const reach = pitch * 5.5;
      const push = pitch * 0.55 * pointer.s;
      for (let y = 0; y < N; y++)
        for (let x = 0; x < N; x++) {
          const i = y * N + x;
          const [l, e] = target(i, now);
          light[i] = light[i]! + (l - light[i]!) * ease;
          warm[i] = warm[i]! + (e - warm[i]!) * ease;
          let cx = (x + 0.5) * pitch;
          let cy = (y + 0.5) * pitch;
          let near = 0;
          if (pointer.s > 0.002) {
            const dx = cx - pointer.x;
            const dy = cy - pointer.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < reach * reach) {
              const d = Math.sqrt(d2) || 1;
              near = (1 - d2 / (reach * reach)) ** 2;
              cx += (dx / d) * near * push;
              cy += (dy / d) * near * push;
            }
          }
          const lit = light[i]!;
          // The unlit dot underneath, then the lit one over it.
          ctx.globalAlpha = offAlpha * fade[i]! * (1 - lit);
          ctx.fillStyle = `rgb(${off[0]},${off[1]},${off[2]})`;
          ctx.beginPath();
          ctx.arc(cx, cy, pitch * (0.13 + near * 0.04), 0, Math.PI * 2);
          ctx.fill();
          if (lit < 0.01) continue;
          const w = warm[i]!;
          const r = Math.round(ink[0] + (ember[0] - ink[0]) * w);
          const g = Math.round(ink[1] + (ember[1] - ink[1]) * w);
          const b = Math.round(ink[2] + (ember[2] - ink[2]) * w);
          ctx.globalAlpha = Math.min(1, lit);
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.beginPath();
          ctx.arc(cx, cy, pitch * (0.2 + 0.15 * lit), 0, Math.PI * 2);
          ctx.fill();
        }
      ctx.globalAlpha = 1;
    };

    const tick = (now: number) => {
      frame = 0;
      pointer.x += (pointer.tx - pointer.x) * 0.3;
      pointer.y += (pointer.ty - pointer.y) * 0.3;
      pointer.s += (pointer.ts - pointer.s) * 0.12;
      draw(now, 0.14);
      if (visible && !document.hidden) frame = requestAnimationFrame(tick);
    };
    const start = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };

    colors();
    layout();
    redraw.current = () => draw(performance.now() + 5_000, 1);
    if (reduced) {
      // Settle at once and draw a single still frame.
      draw(performance.now(), 1);
    } else start();

    const ro = new ResizeObserver(() => {
      layout();
      draw(performance.now(), reduced ? 1 : 0.14);
    });
    ro.observe(canvas);
    const io = new IntersectionObserver((entries) => {
      visible = entries.some((e) => e.isIntersecting);
      if (visible && !reduced) start();
    });
    io.observe(canvas);
    const mo = new MutationObserver(() => {
      colors();
      if (reduced) draw(performance.now(), 1);
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    const onMove = (e: PointerEvent) => {
      if (reduced || e.pointerType === "touch") return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const inside = x >= 0 && x <= size && y >= 0 && y <= size;
      pointer.tx = x;
      pointer.ty = y;
      if (pointer.s < 0.01) {
        pointer.x = x;
        pointer.y = y;
      }
      pointer.ts = inside ? 1 : 0;
    };
    const onVisibility = () => {
      if (!document.hidden && visible && !reduced) start();
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      io.disconnect();
      mo.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reduced]);

  return (
    <figure className={cn("flex w-full flex-col items-center", className)}>
      <button
        type="button"
        onClick={() => setIndex((i) => (i + 1) % STATES.length)}
        aria-label={`Status glyph, ${state.label.toLowerCase()}. Show the next state`}
        className="relative block aspect-square w-full max-w-[460px] cursor-pointer rounded-[28px] outline-hidden focus-visible:shadow-kura-focus"
      >
        <canvas ref={canvasRef} aria-hidden data-slot="hero-glyph" className="block size-full" />
      </button>
      {/* The call that draws it, live: the status the matrix shows is the prop below. */}
      <figcaption
        aria-hidden
        className="mt-2 flex items-center gap-3 font-kura-mono text-[12.5px] text-kura-fg-subtle"
      >
        <StatusGlyph status={state.status} label={null} />
        <code className="whitespace-nowrap">
          {"<StatusGlyph status="}
          <span className="text-kura-fg">"{state.status}"</span>
          {" />"}
        </code>
      </figcaption>
    </figure>
  );
}
