"use client";

import * as React from "react";
import { useHotkey } from "../../hooks/use-hotkey";
import { cn } from "../../lib/cn";
import type { KeyName } from "../../lib/keys";
import { Kbd } from "../kbd";

export interface KbdShortcutProps extends Omit<React.ComponentProps<"span">, "children"> {
  /** The combo, e.g. `["mod", "enter"]`. `mod` = ⌘ on Apple, Ctrl elsewhere. */
  keys: readonly KeyName[];
  /** Short action label shown before the keys, e.g. "Send". Omit for keys only. */
  label?: React.ReactNode;
  /**
   * Bind the combo globally and call this when pressed. Omit for a display-only hint.
   * While the combo is held, the keys render pressed.
   */
  onTrigger?: (event: KeyboardEvent) => void;
  /** Enable/disable the binding without hiding the hint. Default true. */
  enabled?: boolean;
  /** Fire while typing in inputs. Default: true when the combo has a modifier. */
  allowInInputs?: boolean;
  variant?: "raised" | "ghost";
  size?: "sm" | "md";
}

/**
 * A labelled shortcut hint ("Send ⌘↵") that can also bind the shortcut and light up its keys
 * when pressed. Use it for the hints under composers, in empty states and in menus.
 */
export function KbdShortcut({
  keys,
  label,
  onTrigger,
  enabled = true,
  allowInInputs,
  variant = "raised",
  size = "sm",
  className,
  ...props
}: KbdShortcutProps) {
  const [pressed, setPressed] = React.useState(false);
  const timeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  useHotkey(
    onTrigger ? keys : null,
    (event) => {
      setPressed(true);
      if (timeout.current) clearTimeout(timeout.current);
      // Fallback release in case keyup is swallowed (e.g. focus moved).
      timeout.current = setTimeout(() => setPressed(false), 400);
      onTrigger?.(event);
    },
    {
      enabled,
      allowInInputs,
      onKeyUp: () => {
        if (timeout.current) clearTimeout(timeout.current);
        setPressed(false);
      },
    },
  );

  React.useEffect(
    () => () => {
      if (timeout.current) clearTimeout(timeout.current);
    },
    [],
  );

  return (
    <span
      data-slot="kbd-shortcut"
      data-pressed={pressed}
      data-bound={!!onTrigger && enabled}
      className={cn(
        "group inline-flex items-center gap-1.5 font-kura-sans text-kura-fg-subtle text-xs",
        className,
      )}
      {...props}
    >
      {label != null && (
        <span
          data-slot="kbd-shortcut-label"
          className="transition-colors duration-(--kura-duration-fast) group-data-[pressed=true]:text-kura-fg"
        >
          {label}
        </span>
      )}
      <Kbd
        keys={keys}
        variant={variant}
        size={size}
        pressed={pressed}
        // A ghost key takes its colour from the text around it; here that must stay readable.
        className={variant === "ghost" ? "text-kura-fg-muted" : undefined}
      />
    </span>
  );
}
