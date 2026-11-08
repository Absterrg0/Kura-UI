"use client";

import * as React from "react";
import { useControllableState } from "../../hooks/use-controllable-state";
import { useReducedMotion } from "../../hooks/use-reduced-motion";
import { cn } from "../../lib/cn";
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
  /** `ring` = compact donut + value; `bar` = a horizontal (segmented) bar with value. Default "ring". */
  variant?: "ring" | "bar";
  /** Fraction (0–1) at which the meter turns to warning. Default 0.7. */
  warningAt?: number;
  /** Fraction (0–1) at which the meter turns to danger. Default 0.9. */
  dangerAt?: number;
  /** What the value shows next to the meter. Default "percent" for ring, "tokens" for bar. */
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

const tints = ["var(--kura-fg)", "var(--kura-gray-9)", "var(--kura-gray-8)", "var(--kura-gray-7)"];
const segmentColor = (s: ContextSegment, i: number) =>
  s.color ?? `color-mix(in oklab, ${tints[i % tints.length]} ${i < 4 ? 100 : 60}%, transparent)`;

/**
 * Token / context-window usage as a compact ring or bar with warning and danger thresholds,
 * rolling tabular numbers, and a hover card that breaks usage down by segment.
 */
export function ContextMeter({
  max,
  used: usedProp,
  segments,
  variant = "ring",
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
  const display = valueDisplay ?? (variant === "ring" ? "percent" : "tokens");
  const tweenedRatio = useTweened(ratio);
  const tweenedUsed = useTweened(used);

  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: false,
    onChange: onOpenChange,
  });
  const timer = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  React.useEffect(() => () => clearTimeout(timer.current), []);
  const schedule = (next: boolean, delay: number) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(next), delay);
  };

  const pct = Math.round(ratio * 100);
  const levelText =
    level === "danger" ? ", nearly full" : level === "warning" ? ", filling up" : "";
  const accessibleName = `${label}: ${used.toLocaleString("en-US")} of ${max.toLocaleString("en-US")} tokens used (${pct}%${levelText})`;

  const tone = cn(
    level === "ok" && "text-kura-fg-muted",
    level === "warning" && "text-kura-warning-text",
    level === "danger" && "text-kura-danger-text",
  );
  const stroke =
    level === "danger"
      ? "var(--kura-danger)"
      : level === "warning"
        ? "var(--kura-warning)"
        : "var(--kura-fg-muted)";

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

  const R = 7;
  const C = 2 * Math.PI * R;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-slot="context-meter"
          data-variant={variant}
          data-level={level}
          aria-label={accessibleName}
          onPointerEnter={(e) => {
            onPointerEnter?.(e);
            if (e.pointerType !== "touch" && segments?.length) schedule(true, 300);
          }}
          onPointerLeave={(e) => {
            onPointerLeave?.(e);
            schedule(false, 150);
          }}
          onFocus={onFocus}
          onBlur={(e) => {
            onBlur?.(e);
            schedule(false, 100);
          }}
          className={cn(
            "group/meter inline-flex h-7 cursor-pointer items-center gap-2 rounded-kura-sm px-1.5 font-kura-sans outline-none",
            "transition-[background-color,box-shadow] duration-(--kura-duration-fast) ease-kura-out hover:bg-kura-hover focus-visible:shadow-kura-focus data-[state=open]:bg-kura-hover",
            className,
          )}
          {...props}
        >
          {variant === "ring" ? (
            <svg
              aria-hidden
              data-slot="context-meter-ring"
              viewBox="0 0 18 18"
              className="size-[18px] shrink-0 -rotate-90"
            >
              <circle
                cx="9"
                cy="9"
                r={R}
                fill="none"
                strokeWidth="2.25"
                className="stroke-kura-border"
              />
              <circle
                cx="9"
                cy="9"
                r={R}
                fill="none"
                strokeWidth="2.25"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={C * (1 - tweenedRatio)}
                style={{ stroke }}
                className="transition-[stroke] duration-(--kura-duration-slow) ease-kura-out"
                opacity={ratio === 0 ? 0 : 1}
              />
            </svg>
          ) : (
            <SegmentBar
              segments={segments}
              used={used}
              max={max}
              level={level}
              ratio={tweenedRatio}
              className="h-1.5 w-28 shrink-0"
            />
          )}
          {value}
        </button>
      </PopoverTrigger>
      {segments && segments.length > 0 && (
        <PopoverContent
          side="top"
          align={variant === "bar" ? "start" : "center"}
          data-slot="context-meter-card"
          className="w-72 p-4"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onPointerEnter={() => clearTimeout(timer.current)}
          onPointerLeave={() => schedule(false, 150)}
        >
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between font-kura-mono text-[10px] text-kura-fg-subtle uppercase tracking-[0.14em]">
                <span>{label} window</span>
                <span className="tabular-nums">{formatTokens(max)}</span>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <span
                  className={cn(
                    "font-kura-display text-[28px] leading-none tabular-nums",
                    level === "ok" ? "text-kura-fg" : tone,
                  )}
                >
                  {pct}%
                </span>
                <span className="font-kura-mono text-[11px] text-kura-fg-muted tabular-nums">
                  {formatTokens(used)} used · {formatTokens(Math.max(0, max - used))} free
                </span>
              </div>
            </div>
            <SegmentBar
              segments={segments}
              used={used}
              max={max}
              level={level}
              ratio={ratio}
              className="h-2"
            />
            <ul
              className="flex flex-col divide-y divide-kura-border-subtle shadow-[inset_0_1px_0_var(--kura-border-subtle)]"
              aria-label="Breakdown"
            >
              {segments.map((s, i) => (
                <li
                  key={s.id}
                  data-slot="context-meter-segment"
                  className="flex h-8 items-center gap-2.5 text-[13px]"
                >
                  <span
                    aria-hidden
                    className="size-2 shrink-0 rounded-[2px]"
                    style={{ background: segmentColor(s, i) }}
                  />
                  <span className="min-w-0 flex-1 truncate text-kura-fg-muted">{s.label}</span>
                  <span className="font-kura-mono text-[12px] text-kura-fg tabular-nums">
                    {formatTokens(s.tokens)}
                  </span>
                  <span className="w-9 text-right font-kura-mono text-[11px] text-kura-fg-subtle tabular-nums">
                    {max > 0 ? `${Math.round((s.tokens / max) * 100)}%` : "–"}
                  </span>
                </li>
              ))}
              <li className="flex h-8 items-center gap-2.5 text-[13px]">
                <span
                  aria-hidden
                  className="size-2 shrink-0 rounded-[2px] shadow-[inset_0_0_0_1px_var(--kura-border-strong)]"
                />
                <span className="flex-1 text-kura-fg-subtle">Free</span>
                <span className="font-kura-mono text-[12px] text-kura-fg-subtle tabular-nums">
                  {formatTokens(Math.max(0, max - used))}
                </span>
                <span className="w-9" />
              </li>
            </ul>
            {(footer != null || level !== "ok") && (
              <p
                className={cn(
                  "-mt-3 pt-3 text-xs leading-relaxed shadow-[inset_0_1px_0_var(--kura-border-subtle)]",
                  level === "ok" ? "text-kura-fg-muted" : tone,
                )}
              >
                {footer ??
                  (level === "danger"
                    ? "Nearly full — the oldest turns will be dropped or summarized."
                    : "Filling up — consider starting a new thread for unrelated work.")}
              </p>
            )}
          </div>
        </PopoverContent>
      )}
    </Popover>
  );
}

function SegmentBar({
  segments,
  used,
  max,
  level,
  ratio,
  className,
}: {
  segments: readonly ContextSegment[] | undefined;
  used: number;
  max: number;
  level: "ok" | "warning" | "danger";
  ratio: number;
  className?: string;
}) {
  const fill =
    level === "danger"
      ? "bg-kura-danger"
      : level === "warning"
        ? "bg-kura-warning"
        : "bg-kura-fg-muted";
  return (
    <span
      aria-hidden
      data-slot="context-meter-bar"
      className={cn("relative flex overflow-hidden rounded-full bg-kura-active", className)}
    >
      {segments && segments.length > 0 && level === "ok" ? (
        <span
          className="flex h-full origin-left transition-[width] duration-(--kura-duration-slow) ease-kura-out motion-reduce:transition-none"
          style={{ width: `${ratio * 100}%` }}
        >
          {segments.map((s, i) => (
            <span
              key={s.id}
              className="h-full [&+&]:ml-px"
              style={{
                width: `${used > 0 ? (s.tokens / used) * 100 : 0}%`,
                background: segmentColor(s, i),
              }}
            />
          ))}
        </span>
      ) : (
        <span
          className={cn(
            "h-full rounded-full transition-[width,background-color] duration-(--kura-duration-slow) ease-kura-out motion-reduce:transition-none",
            fill,
          )}
          style={{ width: `${max > 0 ? ratio * 100 : 0}%` }}
        />
      )}
    </span>
  );
}
