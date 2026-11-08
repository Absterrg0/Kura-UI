"use client";

import type * as React from "react";
import { useIsApplePlatform } from "../../hooks/use-platform";
import { cn } from "../../lib/cn";
import { formatKey, type KeyName, keyLabel } from "../../lib/keys";

export interface KbdProps extends React.ComponentProps<"kbd"> {
  /**
   * Keys to render as a combo, e.g. `["mod", "k"]`. `mod` renders ⌘ on Apple platforms and Ctrl
   * elsewhere. When omitted, `children` is rendered as a single key.
   */
  keys?: readonly KeyName[];
  /** `raised` = standalone keycap; `ghost` = inline inside buttons, tooltips and menus. */
  variant?: "raised" | "ghost";
  size?: "sm" | "md";
  /** Render as pressed (used by KbdShortcut while the combo is held). */
  pressed?: boolean;
}

const keyBase =
  "inline-flex min-w-[1.6em] items-center justify-center font-kura-sans font-medium tabular-nums leading-none " +
  "transition-[transform,background-color,box-shadow,color] duration-(--kura-duration-instant) ease-kura-out";

const keyVariants = {
  raised:
    "rounded-kura-xs bg-kura-surface text-kura-fg-muted shadow-[0_0_0_1px_var(--kura-border),0_1px_0_0_var(--kura-border-strong)] " +
    "data-[pressed=true]:translate-y-px data-[pressed=true]:bg-kura-surface-sunken data-[pressed=true]:text-kura-fg data-[pressed=true]:shadow-[0_0_0_1px_var(--kura-border)] motion-reduce:data-[pressed=true]:translate-y-0",
  ghost:
    "rounded-kura-xs bg-kura-hover text-current opacity-80 data-[pressed=true]:bg-kura-active data-[pressed=true]:opacity-100",
} as const;

const keySizes = {
  sm: "h-[18px] px-1 text-[11px]",
  md: "h-[22px] px-1.5 text-xs",
} as const;

/**
 * A keyboard key or key combination. Platform-aware (⌘ on Apple, Ctrl elsewhere) and
 * hydration-safe. Combos read as one spoken label like "Command K" (visually hidden text; glyphs are aria-hidden).
 */
export function Kbd({
  keys,
  variant = "raised",
  size = "md",
  pressed = false,
  className,
  children,
  ...props
}: KbdProps) {
  const apple = useIsApplePlatform();

  if (!keys) {
    return (
      <kbd
        data-slot="kbd"
        data-pressed={pressed}
        className={cn(keyBase, keyVariants[variant], keySizes[size], className)}
        {...props}
      >
        {children}
      </kbd>
    );
  }

  const label = keys.map((k) => keyLabel(k, apple)).join(" ");
  return (
    <kbd
      data-slot="kbd"
      data-pressed={pressed}
      className={cn("inline-flex items-center gap-0.5 font-kura-sans", className)}
      {...props}
    >
      <span className="sr-only">{label}</span>
      {keys.map((k, i) => (
        <kbd
          key={`${k}-${i}`}
          aria-hidden
          data-slot="kbd-key"
          data-pressed={pressed}
          className={cn(keyBase, keyVariants[variant], keySizes[size])}
        >
          {formatKey(k, apple)}
        </kbd>
      ))}
    </kbd>
  );
}
