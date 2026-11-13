import type * as React from "react";
import { cn } from "../../lib/cn";

export interface DotRailProps extends Omit<React.ComponentProps<"div">, "children"> {
  /** How much is lit, 0–1. As progress it runs from the start; with `start` it is a span's length. */
  value: number;
  /** Where the lit run begins, 0–1 (a span on a shared axis). Default 0. */
  start?: number;
  /** Pulse the leading dot: this is still moving. Default false. */
  live?: boolean;
  /** Colour of the lit dots. Use "ember" only for something waiting on a person. Default "ink". */
  tone?: "ink" | "muted" | "ember" | "success" | "danger";
  /** Dot spacing in px. Default 6. */
  pitch?: number;
  /** Accessible name. With it the rail is a progressbar; without it, it is decorative. */
  label?: string;
}

const TONE = {
  ink: "text-kura-fg",
  muted: "text-kura-fg-subtle",
  ember: "text-kura-ember",
  success: "text-kura-success",
  danger: "text-kura-danger-text",
} as const;

const clamp = (n: number) => Math.min(1, Math.max(0, n));

/**
 * Progress as a row of dots. Lit dots run from `start` for `value`; unlit dots stay faintly
 * visible, so the whole length always reads. Snaps to whole dots, so a dot is never cut in half.
 */
export function DotRail({
  value,
  start = 0,
  live = false,
  tone = "ink",
  pitch = 6,
  label,
  className,
  style,
  ...props
}: DotRailProps) {
  const from = clamp(start);
  const length = Math.min(clamp(value), 1 - from);
  const step = `${pitch}px`;
  const left = `round(down, ${from * 100}%, ${step})`;
  const width = `round(up, ${length * 100}%, ${step})`;
  const shared = {
    "data-slot": "dot-rail",
    "data-tone": tone,
    "data-live": live || undefined,
    className: cn("relative w-full", TONE[tone], className),
    style: { height: pitch, "--kura-dots-pitch": step, ...style } as React.CSSProperties,
    ...props,
  };
  // The track is the widest run of whole dots that fits, so the rail never ends in half a dot.
  // Lit dots and the live dot sit on the same grid, at the same size, over the unlit ones.
  const dots = (
    <span
      data-slot="dot-rail-track"
      className="kura-dots absolute inset-y-0 left-0"
      style={{ width: `round(down, 100%, ${step})` }}
    >
      <span
        data-slot="dot-rail-lit"
        className="kura-dots absolute inset-y-0 transition-[left,width] duration-(--kura-duration-slower) ease-kura-snap motion-reduce:transition-none"
        style={{ "--kura-dots-color": "currentColor", left, width } as React.CSSProperties}
      />
      {live && (
        <span
          data-slot="dot-rail-head"
          // The dot being filled now: the first unlit dot, pulsing.
          className="kura-dots absolute inset-y-0 animate-kura-dot-pulse transition-[left] duration-(--kura-duration-slower) ease-kura-snap motion-reduce:animate-none motion-reduce:opacity-50 motion-reduce:transition-none"
          style={
            {
              "--kura-dots-color": "currentColor",
              width: step,
              left: `min(calc(${left} + ${width}), calc(100% - ${step}))`,
            } as React.CSSProperties
          }
        />
      )}
    </span>
  );
  return label ? (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(length * 100)}
      {...shared}
    >
      {dots}
    </div>
  ) : (
    <div aria-hidden {...shared}>
      {dots}
    </div>
  );
}
