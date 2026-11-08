import type * as React from "react";
import { cn } from "../../lib/cn";

export interface SpinnerProps extends Omit<React.ComponentProps<"span">, "children"> {
  /** Visual size. `sm` 12px, `md` 16px, `lg` 20px. */
  size?: "sm" | "md" | "lg";
  /** Accessible label announced to screen readers. Pass `null` when a parent already announces loading. */
  label?: string | null;
}

const sizes = { sm: "size-3", md: "size-4", lg: "size-5" } as const;

/**
 * An ensō drawn as one brush stroke: a 292° arc on a 24-unit box that swells from a dry, thin
 * tail into a full, round head. Built once at module scope as a filled path, so it scales cleanly
 * from 12px to 20px and needs no stroke tricks.
 */
function ensoPath(): string {
  const cx = 12;
  const cy = 12;
  const radius = 8.75;
  const sweep = (292 * Math.PI) / 180;
  const start = -Math.PI / 2 - sweep;
  const steps = 40;
  const width = (t: number) => 0.4 + 3 * t ** 1.6;
  const at = (t: number, offset: number) => {
    const a = start + sweep * t;
    const r = radius + offset;
    return `${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`;
  };
  const outer: string[] = [];
  const inner: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    outer.push(at(t, width(t) / 2));
    inner.unshift(at(t, -width(t) / 2));
  }
  const head = (width(1) / 2).toFixed(2);
  const tail = (width(0) / 2).toFixed(2);
  return `M${outer.join("L")}A${head} ${head} 0 0 1 ${inner.join("L")}A${tail} ${tail} 0 0 1 ${outer[0]}Z`;
}

const ENSO = ensoPath();

/**
 * Ensō spinner: a single tapered brush stroke turning on a faint wash of the full circle.
 * Inherits `currentColor`. Under reduced motion it holds still and breathes (opacity) instead.
 */
export function Spinner({ size = "md", label = "Loading", className, ...props }: SpinnerProps) {
  return (
    <span
      data-slot="spinner"
      role={label ? "status" : undefined}
      aria-hidden={label ? undefined : true}
      className={cn("relative inline-flex shrink-0 text-current", sizes[size], className)}
      {...props}
    >
      {label && <span className="sr-only">{label}</span>}
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        fill="currentColor"
        className="absolute inset-0 size-full animate-kura-spin [animation-duration:0.9s] motion-reduce:animate-kura-pulse motion-reduce:[animation-duration:1.6s]"
      >
        <circle
          cx="12"
          cy="12"
          r="8.75"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          opacity="0.14"
        />
        <path d={ENSO} />
      </svg>
    </span>
  );
}
