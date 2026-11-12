"use client";

import * as React from "react";
import { useControllableState } from "../../hooks/use-controllable-state";
import { useReducedMotion } from "../../hooks/use-reduced-motion";
import { cn } from "../../lib/cn";
import { DotRail } from "../dot-rail";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";

export interface ContextSegment {
  /** Stable key, e.g. "system". */
  id: string;
  /** Legend label, e.g. "System prompt". */
  label: string;
  /** Tokens used by this part of the context. */
  tokens: number;
  /** Optional CSS color for the swatch and bar segment. Default: an ink tint by position. */
  color?: string;
}

export interface ContextMeterProps extends Omit<React.ComponentProps<"button">, "children"> {
  /** Context window size in tokens, e.g. 200000. */
  max: number;
  /** Tokens used. Default: the sum of `segments`. */
  used?: number;
  /** Breakdown shown in the bar and the hover card, e.g. system, history, tools, files. */
  segments?: readonly ContextSegment[];
  /** Fraction (0–1) at which the meter turns to warning. Default 0.7. */
  warningAt?: number;
  /** Fraction (0–1) at which the meter turns to danger. Default 0.9. */
  dangerAt?: number;
  /** What the value shows next to the rail. Default "percent". */
  valueDisplay?: "percent" | "tokens" | "none";
  /** Short name used in the accessible label and the card title. Default “Context”. */
  label?: string;
  /** Extra content at the bottom of the hover card, e.g. “Older turns will be summarized”. */
  footer?: React.ReactNode;
  /** Hover card open (controlled). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function formatTokens(n: number): string {
  const v = Math.max(0, n);
  if (v < 1000) return String(Math.round(v));
  if (v < 1_000_000) {
    const k = v / 1000;
    return `${k < 100 ? k.toFixed(1).replace(/\.0$/, "") : Math.round(k)}k`;
  }
  const m = v / 1_000_000;
  return `${m.toFixed(m < 10 ? 2 : 1).replace(/\.?0+$/, "")}M`;
}

/** Eases a number toward its target so counters roll instead of jumping. */
function useTweened(target: number, duration = 520): number {
  const reduced = useReducedMotion();
  const [value, setValue] = React.useState(target);
  const from = React.useRef(target);
  const current = React.useRef(target);
  current.current = value;
  React.useEffect(() => {
    if (reduced || typeof requestAnimationFrame !== "function") {
      setValue(target);
      return;
    }
    from.current = current.current;
    const start = performance.now();
    let frame = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - (1 - p) ** 4;
      setValue(from.current + (target - from.current) * eased);
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration, reduced]);
  return value;
}

// Segments are told apart by how bright their dots are, never by hue.
// The dimmest step still stands clear of an unlit dot (about 14%).
const SHADES = [100, 68, 46, 30];
const segmentColor = (s: ContextSegment, i: number) =>
  s.color ?? `color-mix(in oklab, var(--kura-fg) ${SHADES[i % SHADES.length]}%, transparent)`;

/**
 * Token / context-window usage as a compact rail of dots with warning and danger thresholds,
 * rolling tabular numbers, and a hover card that draws the window as one hundred dots (one per
 * percent), shaded by segment. `ContextPanel` is the same hundred dots as a standing panel.
 */
export function ContextMeter({
  max,
  used: usedProp,
  segments,
  warningAt = 0.7,
  dangerAt = 0.9,
  valueDisplay,
  label = "Context",
  footer,
  open: openProp,
  onOpenChange,
  className,
  onPointerEnter,
  onPointerLeave,
  onFocus,
  onBlur,
  ...props
}: ContextMeterProps) {
  const used = usedProp ?? segments?.reduce((sum, s) => sum + s.tokens, 0) ?? 0;
  const ratio = max > 0 ? Math.min(1, Math.max(0, used / max)) : 0;
  const level = ratio >= dangerAt ? "danger" : ratio >= warningAt ? "warning" : "ok";
  const display = valueDisplay ?? "percent";
  const tweenedRatio = useTweened(ratio);
  const tweenedUsed = useTweened(used);

  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: false,
    onChange: onOpenChange,
  });

  const pct = Math.round(ratio * 100);
  const levelText =
    level === "danger" ? ", nearly full" : level === "warning" ? ", filling up" : "";
  // Starts with the text on screen (label in name), then the exact numbers.
  const shown =
    display === "percent"
      ? `${pct}%`
      : display === "tokens"
        ? `${formatTokens(used)} / ${formatTokens(max)}`
        : "";
  const accessibleName = `${shown ? `${shown} ` : ""}${label.toLowerCase()} used: ${used.toLocaleString("en-US")} of ${max.toLocaleString("en-US")} tokens${levelText}`;

  const tone = cn(level === "ok" && "text-kura-fg-muted", level !== "ok" && "text-kura-fg");

  const value =
    display === "none" ? null : (
      <span
        data-slot="context-meter-value"
        className={cn(
          "text-left font-kura-mono text-xs tabular-nums",
          display === "percent" ? "min-w-[4ch]" : "min-w-[13ch]",
          tone,
        )}
      >
        {display === "percent" ? (
          `${Math.round(tweenedRatio * 100)}%`
        ) : (
          <>
            {formatTokens(tweenedUsed)}
            <span className="text-kura-fg-subtle"> / {formatTokens(max)}</span>
          </>
        )}
      </span>
    );

  return (
    <Popover
      open={open}
      onOpenChange={(next) => setOpen(next)}
      openOnHover={!!segments?.length}
      delay={300}
      closeDelay={150}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          data-slot="context-meter"
          data-level={level}
          aria-label={accessibleName}
          onPointerEnter={onPointerEnter}
          onPointerLeave={onPointerLeave}
          onFocus={onFocus}
          onBlur={onBlur}
          className={cn(
            "group/meter inline-flex h-7 cursor-pointer items-center gap-2 rounded-kura-md px-1.5 font-kura-sans outline-hidden",
            "transition-[background-color] duration-(--kura-duration-fast) ease-kura-snap hover:bg-kura-hover focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-kura-ring data-open:bg-kura-hover",
            className,
          )}
          {...props}
        >
          <DotRail
            data-slot="context-meter-bar"
            value={tweenedRatio}
            tone={level === "ok" ? "muted" : "ink"}
            className="w-[60px] shrink-0"
          />
          {value}
        </button>
      </PopoverTrigger>
      {segments && segments.length > 0 && (
        <PopoverContent
          side="top"
          align="start"
          data-slot="context-meter-card"
          className="w-[302px] p-4"
          initialFocus="none"
        >
          <Breakdown
            segments={segments}
            used={used}
            max={max}
            level={level}
            label={label}
            footer={footer}
          />
        </PopoverContent>
      )}
    </Popover>
  );
}

function levelOf(ratio: number, warningAt: number, dangerAt: number) {
  return ratio >= dangerAt ? "danger" : ratio >= warningAt ? "warning" : "ok";
}

// A filling window is not a failure, so it never turns red: it goes from muted to full ink, and
// the words say "filling up" or "nearly full".
const TONE = {
  ok: "text-kura-fg-muted",
  warning: "text-kura-fg",
  danger: "text-kura-fg",
} as const;

/** The breakdown shared by the hover card and the panel: figures, one hundred dots, a legend. */
function Breakdown({
  segments,
  used,
  max,
  level,
  label,
  footer,
}: {
  segments: readonly ContextSegment[];
  used: number;
  max: number;
  level: "ok" | "warning" | "danger";
  label: string;
  footer?: React.ReactNode;
}) {
  const tone = TONE[level];
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <span className="font-semibold text-[13px] text-kura-fg tracking-[-0.01em]">
          {label} window
        </span>
        <span className={cn("font-kura-mono text-xs tabular-nums", tone)}>
          {formatTokens(used)} <span className="text-kura-fg-subtle">/ {formatTokens(max)}</span>
        </span>
      </div>
      <DotMatrix segments={segments} max={max} />
      <ul className="flex flex-col gap-1.5" aria-label="Breakdown">
        {segments.map((s, i) => (
          <li
            key={s.id}
            data-slot="context-meter-segment"
            className="flex items-center gap-2 text-[13px]"
          >
            <span
              aria-hidden
              className="size-1.5 shrink-0 rounded-full"
              style={{ background: segmentColor(s, i) }}
            />
            <span className="min-w-0 flex-1 truncate text-kura-fg-muted">{s.label}</span>
            <span className="font-kura-mono text-kura-fg text-xs tabular-nums">
              {formatTokens(s.tokens)}
            </span>
            <span className="w-9 text-right font-kura-mono text-kura-fg-subtle text-xs tabular-nums">
              {max > 0 ? `${Math.round((s.tokens / max) * 100)}%` : "–"}
            </span>
          </li>
        ))}
        <li className="flex items-center gap-2 text-[13px]">
          <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-kura-dot-off" />
          <span className="flex-1 text-kura-fg-subtle">Free</span>
          <span className="font-kura-mono text-kura-fg-subtle text-xs tabular-nums">
            {formatTokens(Math.max(0, max - used))}
          </span>
          <span className="w-9 text-right font-kura-mono text-kura-fg-subtle text-xs tabular-nums">
            {max > 0 ? `${Math.round((Math.max(0, max - used) / max) * 100)}%` : "–"}
          </span>
        </li>
      </ul>
      {(footer != null || level !== "ok") && (
        <p className={cn("text-xs leading-relaxed", level === "ok" ? "text-kura-fg-muted" : tone)}>
          {footer ??
            (level === "danger"
              ? "Nearly full — the oldest turns will be dropped or summarized."
              : "Filling up — consider starting a new thread for unrelated work.")}
        </p>
      )}
    </div>
  );
}

export interface ContextPanelProps extends Omit<React.ComponentProps<"section">, "children"> {
  /** Context window size in tokens, e.g. 200000. */
  max: number;
  /** Tokens used. Default: the sum of `segments`. */
  used?: number;
  /** What fills the window, e.g. system, history, tools, files. */
  segments: readonly ContextSegment[];
  /** Fraction (0–1) at which the figures turn to warning. Default 0.7. */
  warningAt?: number;
  /** Fraction (0–1) at which the dots turn red. Default 0.9. */
  dangerAt?: number;
  /** Short name used in the title. Default “Context”. */
  label?: string;
  /** Extra line at the bottom, e.g. “Older turns will be summarized”. */
  footer?: React.ReactNode;
}

/**
 * The context window as a panel that is always open: one hundred dots, one per percent, shaded by
 * what fills them, with a legend. The same breakdown ContextMeter shows on hover.
 */
export function ContextPanel({
  max,
  used: usedProp,
  segments,
  warningAt = 0.7,
  dangerAt = 0.9,
  label = "Context",
  footer,
  className,
  ...props
}: ContextPanelProps) {
  const used = usedProp ?? segments.reduce((sum, s) => sum + s.tokens, 0);
  const ratio = max > 0 ? Math.min(1, Math.max(0, used / max)) : 0;
  const level = levelOf(ratio, warningAt, dangerAt);
  return (
    <section
      data-slot="context-panel"
      data-level={level}
      aria-label={`${label} window: ${Math.round(ratio * 100)}% used`}
      className={cn(
        "flex min-w-0 flex-col rounded-kura-xl bg-kura-surface p-4 font-kura-sans text-kura-fg shadow-kura-sm",
        className,
      )}
      {...props}
    >
      <Breakdown
        segments={segments}
        used={used}
        max={max}
        level={level}
        label={label}
        footer={footer}
      />
    </section>
  );
}

/** The window as one hundred dots, one per percent, lit in the shade of the segment that fills it. */
function DotMatrix({ segments, max }: { segments: readonly ContextSegment[]; max: number }) {
  const cells: (string | undefined)[] = [];
  if (max > 0) {
    let filled = 0;
    let exact = 0;
    segments.forEach((s, i) => {
      exact += (s.tokens / max) * 100;
      const upTo = Math.min(100, Math.round(exact));
      for (; filled < upTo; filled++) {
        cells[filled] = segmentColor(s, i);
      }
    });
  }
  return (
    <span
      aria-hidden
      data-slot="context-meter-matrix"
      className="grid grid-cols-[repeat(25,6px)] justify-between gap-y-[5px]"
    >
      {Array.from({ length: 100 }, (_, i) => (
        <span
          key={`dot-${i + 1}`}
          className="size-1.5 rounded-full bg-kura-dot-off transition-colors duration-(--kura-duration-slow) ease-kura-snap motion-reduce:transition-none"
          style={cells[i] ? { background: cells[i] } : undefined}
        />
      ))}
    </span>
  );
}
