// The root's role is dynamic: role="img" for display, role="slider" (focusable, with pointer and
// key handlers) when `onSeek` is set — static analysis cannot see that.
// biome-ignore-all lint/a11y/noStaticElementInteractions: handlers are only attached with role="slider".
// biome-ignore-all lint/a11y/useAriaPropsSupportedByRole: aria-label/value props match the runtime role.
"use client";

import * as React from "react";
import {
  type AudioAnalyser,
  type AudioFrame,
  useAudioAnalyser,
} from "../../hooks/use-audio-analyser";
import { useReducedMotion } from "../../hooks/use-reduced-motion";
import { cn } from "../../lib/cn";
import { mergeRefs } from "../../lib/merge-refs";

export interface AudioWaveformProps
  extends Omit<React.ComponentProps<"div">, "children" | "onChange"> {
  /** A live analyser from `useAudioAnalyser` (share one between several visuals). */
  analyser?: AudioAnalyser;
  /** Mic stream or media element to analyse internally when no `analyser` is given. */
  source?: MediaStream | HTMLMediaElement | null;
  /** Generate synthetic audio data (docs, previews, before permission). */
  simulate?: boolean | "speech" | "music" | "silence";
  /**
   * Static/recorded mode: amplitudes 0..1 (any length; resampled to the bar count). When set,
   * live data is ignored. Use `peaksFromSamples` to build them from decoded audio.
   */
  peaks?: readonly number[];
  /** Playback position 0..1 for static mode. Bars before it are drawn solid, after it faded. */
  progress?: number;
  /** Make the waveform a seek slider (pointer drag + arrow keys). Receives 0..1. */
  onSeek?: (progress: number) => void;
  /** Total duration in seconds, used for the slider's spoken value ("0:12 of 1:04"). */
  duration?: number;
  /** `bars` = bottom-aligned, `mirrored` = symmetric around the centre, `line` = oscilloscope/envelope. Default "mirrored". */
  variant?: "bars" | "mirrored" | "line";
  /**
   * Live data shown by `bars`/`mirrored`: `history` scrolls recent loudness from right to left
   * (voice memo), `spectrum` shows frequency bands. Default: history for mirrored, spectrum for bars.
   */
  display?: "history" | "spectrum";
  /** Bar width in CSS px. Default 3. */
  barWidth?: number;
  /** Gap between bars in CSS px. Default 2. */
  barGap?: number;
  /** Minimum bar height in CSS px so silence still reads as a line of dots. Default 2. */
  minBarHeight?: number;
  /** `default` = ink, `muted` = subtle ink, `accent` = the signal colour (only for live AI listening). Default "default". */
  tone?: "default" | "muted" | "accent";
  /** Pause the live animation (the last frame stays). Default true. */
  active?: boolean;
  /** Accessible name. Default "Audio waveform" (or "Seek" when `onSeek` is set). */
  label?: string;
}

/** Downsample raw PCM samples (-1..1) to `count` peak amplitudes 0..1, normalised to the loudest. */
export function peaksFromSamples(samples: ArrayLike<number>, count: number): number[] {
  const out = new Array<number>(Math.max(0, count)).fill(0);
  if (!samples.length || count <= 0) return out;
  const size = samples.length / count;
  let max = 0;
  for (let i = 0; i < count; i++) {
    const start = Math.floor(i * size);
    const end = Math.max(start + 1, Math.floor((i + 1) * size));
    let peak = 0;
    for (let j = start; j < end && j < samples.length; j++) {
      const v = Math.abs(samples[j] ?? 0);
      if (v > peak) peak = v;
    }
    out[i] = peak;
    if (peak > max) max = peak;
  }
  return max > 0 ? out.map((v) => v / max) : out;
}

function resample(values: ArrayLike<number>, count: number): Float32Array {
  const out = new Float32Array(count);
  const n = values.length;
  if (!n) return out;
  for (let i = 0; i < count; i++) {
    const a = Math.floor((i * n) / count);
    const b = Math.max(a + 1, Math.floor(((i + 1) * n) / count));
    let peak = 0;
    for (let j = a; j < b && j < n; j++) peak = Math.max(peak, values[j] ?? 0);
    out[i] = peak;
  }
  return out;
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

const TONES = {
  default: "text-kura-fg",
  muted: "text-kura-fg-subtle",
  accent: "text-kura-accent",
} as const;

const HISTORY_INTERVAL = 50; // ms per history sample

/**
 * Canvas waveform for live audio (mic, playback, simulated) or recorded peaks, crisp at any
 * device pixel ratio. Static mode can be a seek slider with a played/unplayed split.
 */
export function AudioWaveform({
  analyser: analyserProp,
  source,
  simulate,
  peaks,
  progress,
  onSeek,
  duration,
  variant = "mirrored",
  display,
  barWidth = 3,
  barGap = 2,
  minBarHeight = 2,
  tone = "default",
  active = true,
  label,
  className,
  ref,
  onKeyDown,
  ...props
}: AudioWaveformProps) {
  const isStatic = peaks !== undefined;
  const internal = useAudioAnalyser({
    source,
    simulate,
    enabled: !analyserProp && !isStatic && (!!source || !!simulate),
  });
  const analyser = analyserProp ?? internal;
  const reduced = useReducedMotion();
  const mode = display ?? (variant === "bars" ? "spectrum" : "history");

  const rootRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const sizeRef = React.useRef({ w: 0, h: 0, dpr: 1 });
  const colorRef = React.useRef("currentColor");
  const historyRef = React.useRef<number[]>([]);
  const lastPush = React.useRef(0);
  const hoverRef = React.useRef<number | null>(null);
  const draggingRef = React.useRef(false);
  const lastFrame = React.useRef<AudioFrame | null>(null);
  const [scrubbing, setScrubbing] = React.useState(false);

  const draw = React.useCallback(
    (frame: AudioFrame | null, now: number) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      const { w, h, dpr } = sizeRef.current;
      if (!canvas || !ctx || w === 0 || h === 0) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = colorRef.current;
      ctx.strokeStyle = colorRef.current;

      const step = barWidth + barGap;
      const count = Math.max(1, Math.floor((w + barGap) / step));
      const usable = h - 2;
      const radius = barWidth / 2;
      const align = variant === "bars" ? "bottom" : "center";
      const playedX = typeof progress === "number" ? Math.min(1, Math.max(0, progress)) * w : null;
      const hoverX = hoverRef.current;

      const bar = (x: number, v: number, alpha: number) => {
        const bh = Math.max(minBarHeight, v * usable);
        const y = align === "bottom" ? h - 1 - bh : (h - bh) / 2;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        if (typeof ctx.roundRect === "function")
          ctx.roundRect(x, y, barWidth, bh, Math.min(radius, bh / 2));
        else ctx.rect(x, y, barWidth, bh);
        ctx.fill();
      };

      const alphaFor = (x: number) => {
        if (playedX === null) return 1;
        if (x + barWidth / 2 <= playedX) return 1;
        if (hoverX !== null && x <= hoverX) return 0.5;
        return 0.24;
      };

      // Static peaks.
      if (isStatic) {
        const values = resample(peaks ?? [], count);
        if (variant === "line") {
          drawEnvelope(ctx, values, w, h, minBarHeight);
          if (playedX !== null) {
            ctx.save();
            ctx.globalCompositeOperation = "destination-in";
            ctx.globalAlpha = 1;
            ctx.fillRect(0, 0, playedX, h);
            ctx.globalAlpha = 0.24;
            ctx.fillRect(playedX, 0, w - playedX, h);
            ctx.restore();
          }
        } else {
          const offset = (w - (count * step - barGap)) / 2;
          for (let i = 0; i < count; i++) {
            const x = Math.round(offset + i * step);
            bar(x, values[i] ?? 0, alphaFor(x));
          }
        }
        if (playedX !== null && (hoverX !== null || draggingRef.current)) {
          ctx.globalAlpha = 0.9;
          ctx.fillRect(Math.round(hoverX ?? playedX), 0, 1, h);
        }
        ctx.globalAlpha = 1;
        return;
      }

      // Live.
      const f = frame;
      if (variant === "line") {
        const lw = 1.5;
        ctx.globalAlpha = 1;
        ctx.lineWidth = lw;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.beginPath();
        const data = f?.waveform;
        const points = Math.min(160, Math.max(24, Math.floor(w / 4)));
        // Keep the stroke (including its width) inside the box.
        const top = lw / 2 + 0.5;
        const bottom = h - lw / 2 - 0.5;
        const half = Math.max(0, (bottom - top) / 2);
        let px = 0;
        let py = h / 2;
        for (let i = 0; i <= points; i++) {
          const x = (i / points) * w;
          const idx = data ? Math.floor((i / points) * (data.length - 1)) : 0;
          const v = data ? (data[idx] ?? 0) : 0;
          // taper the ends so the line breathes out of a flat baseline
          const taper = Math.sin((i / points) * Math.PI);
          const y = Math.min(bottom, Math.max(top, h / 2 + v * half * taper * 1.6));
          if (i === 0) ctx.moveTo(x, y);
          else ctx.quadraticCurveTo(px, py, (px + x) / 2, (py + y) / 2);
          px = x;
          py = y;
        }
        ctx.lineTo(px, py);
        ctx.stroke();
        return;
      }

      if (mode === "spectrum") {
        const values = resample(f?.bands ?? [], count);
        const offset = (w - (count * step - barGap)) / 2;
        for (let i = 0; i < count; i++) {
          bar(Math.round(offset + i * step), values[i] ?? 0, 1);
        }
        return;
      }

      // history: newest on the right, scrolling left.
      const hist = historyRef.current;
      const elapsed = reduced ? 1 : Math.min(1, (now - lastPush.current) / HISTORY_INTERVAL);
      const shift = elapsed * step;
      // Older samples fade out toward the left edge.
      const fade = Math.min(w * 0.22, 72);
      for (let i = 0; i < count + 1; i++) {
        const v = hist[hist.length - 1 - i] ?? 0;
        const x = Math.round(w - barWidth - i * step - shift + step);
        if (x + barWidth < 0) break;
        if (x > w - barWidth) continue;
        const edge = x < fade ? Math.max(0, x / fade) : 1;
        bar(x, v, 0.08 + 0.92 * edge * edge);
      }
      ctx.globalAlpha = 1;
    },
    [barWidth, barGap, minBarHeight, variant, mode, isStatic, peaks, progress, reduced],
  );

  const redraw = React.useCallback(() => {
    draw(lastFrame.current, typeof performance !== "undefined" ? performance.now() : 0);
  }, [draw]);

  // Size the canvas to the element at device-pixel resolution.
  React.useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    const readColor = () => {
      colorRef.current = window.getComputedStyle(root).color || "currentColor";
    };
    const resize = () => {
      const dpr = Math.min(3, window.devicePixelRatio || 1);
      const w = root.clientWidth;
      const h = root.clientHeight;
      sizeRef.current = { w, h, dpr };
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      readColor();
      redraw();
    };
    resize();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    ro?.observe(root);
    // Theme switches change the token colour without resizing.
    const mo =
      typeof MutationObserver !== "undefined"
        ? new MutationObserver(() => {
            readColor();
            redraw();
          })
        : null;
    mo?.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "style"],
    });
    return () => {
      ro?.disconnect();
      mo?.disconnect();
    };
  }, [redraw]);

  // Re-read the colour when the tone changes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: tone changes the CSS colour we sample.
  React.useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    colorRef.current = window.getComputedStyle(root).color || "currentColor";
    redraw();
  }, [tone, redraw]);

  // Live loop.
  React.useEffect(() => {
    if (isStatic || !active) return;
    let lastDraw = 0;
    return analyser.subscribe((frame) => {
      lastFrame.current = frame;
      const now = frame.time;
      if (now - lastPush.current >= HISTORY_INTERVAL) {
        const hist = historyRef.current;
        hist.push(Math.min(1, frame.level * 0.85 + frame.peak * 0.25));
        if (hist.length > 600) hist.splice(0, hist.length - 600);
        lastPush.current = now;
      }
      // Reduced motion: a calm meter that updates a few times per second.
      if (reduced && now - lastDraw < 160) return;
      lastDraw = now;
      draw(frame, now);
    });
  }, [analyser, isStatic, active, draw, reduced]);

  // Static redraws.
  React.useEffect(() => {
    if (isStatic) redraw();
  }, [isStatic, redraw]);

  const seekable = isStatic && !!onSeek;
  const posFromEvent = (e: React.PointerEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return rect.width > 0 ? Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)) : 0;
  };

  const pct =
    typeof progress === "number" ? Math.round(Math.min(1, Math.max(0, progress)) * 100) : 0;
  const valueText =
    duration !== undefined
      ? `${formatTime((pct / 100) * duration)} of ${formatTime(duration)}`
      : `${pct}%`;

  return (
    <div
      ref={mergeRefs(rootRef, ref)}
      data-slot="audio-waveform"
      data-variant={variant}
      data-mode={isStatic ? "static" : "live"}
      data-status={isStatic ? undefined : analyser.status}
      data-scrubbing={scrubbing || undefined}
      role={seekable ? "slider" : "img"}
      aria-label={label ?? (seekable ? "Seek" : "Audio waveform")}
      aria-valuemin={seekable ? 0 : undefined}
      aria-valuemax={seekable ? 100 : undefined}
      aria-valuenow={seekable ? pct : undefined}
      aria-valuetext={seekable ? valueText : undefined}
      tabIndex={seekable ? 0 : undefined}
      onPointerDown={
        seekable
          ? (e) => {
              e.currentTarget.setPointerCapture?.(e.pointerId);
              draggingRef.current = true;
              setScrubbing(true);
              onSeek?.(posFromEvent(e));
            }
          : undefined
      }
      onPointerMove={
        seekable
          ? (e) => {
              const p = posFromEvent(e);
              hoverRef.current = p * sizeRef.current.w;
              if (draggingRef.current) onSeek?.(p);
              else redraw();
            }
          : undefined
      }
      onPointerUp={
        seekable
          ? () => {
              draggingRef.current = false;
              setScrubbing(false);
            }
          : undefined
      }
      onPointerLeave={
        seekable
          ? () => {
              hoverRef.current = null;
              if (!draggingRef.current) redraw();
            }
          : undefined
      }
      onKeyDown={(e) => {
        onKeyDown?.(e);
        if (!seekable || e.defaultPrevented) return;
        const current = typeof progress === "number" ? progress : 0;
        const delta = e.shiftKey ? 0.1 : 0.05;
        let next: number | null = null;
        if (e.key === "ArrowRight" || e.key === "ArrowUp") next = current + delta;
        else if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = current - delta;
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = 1;
        if (next !== null) {
          e.preventDefault();
          onSeek?.(Math.min(1, Math.max(0, next)));
        }
      }}
      className={cn(
        "relative h-10 w-full min-w-0 select-none",
        TONES[tone],
        seekable &&
          "cursor-pointer touch-none rounded-kura-sm outline-none focus-visible:shadow-kura-focus",
        className,
      )}
      {...props}
    >
      <canvas ref={canvasRef} aria-hidden className="absolute inset-0 size-full" />
    </div>
  );
}

function drawEnvelope(
  ctx: CanvasRenderingContext2D,
  values: Float32Array,
  w: number,
  h: number,
  min: number,
) {
  const n = values.length;
  if (!n) return;
  const mid = h / 2;
  const amp = (v: number) => Math.max(min / 2, (v * (h - 2)) / 2);
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.moveTo(0, mid);
  for (let i = 0; i < n; i++) {
    const x = (i / Math.max(1, n - 1)) * w;
    ctx.lineTo(x, mid - amp(values[i] ?? 0));
  }
  for (let i = n - 1; i >= 0; i--) {
    const x = (i / Math.max(1, n - 1)) * w;
    ctx.lineTo(x, mid + amp(values[i] ?? 0));
  }
  ctx.closePath();
  ctx.fill();
}
