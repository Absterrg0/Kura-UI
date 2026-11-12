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
  "inline-flex min-w-[1.6em] items-center justify-center font-kura-sans font-medium tabular-nums leading-none tracking-normal " +
  "transition-[transform,background-color,box-shadow,color] duration-(--kura-duration-instant) ease-kura-out";

const keyVariants = {
  // A keycap: the sheet colour with a hairline and a 1px bottom edge.
  raised:
    "rounded-[5px] bg-kura-surface text-kura-fg-subtle shadow-kura-key " +
    "data-[pressed=true]:translate-y-px data-[pressed=true]:bg-kura-gray-4 data-[pressed=true]:text-kura-fg data-[pressed=true]:shadow-[inset_0_0_0_1px_var(--kura-border-strong)] motion-reduce:data-[pressed=true]:translate-y-0",
  ghost:
    "rounded-[5px] bg-current/10 text-current shadow-[inset_0_0_0_1px_color-mix(in_oklab,currentColor_14%,transparent)] data-[pressed=true]:bg-current/20",
} as const;

const keySizes = {
  sm: "h-[18px] min-w-[18px] px-1 text-[10.5px]",
  md: "h-[22px] min-w-[22px] px-1.5 text-xs",
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
