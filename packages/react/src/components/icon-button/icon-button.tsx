"use client";

import type * as React from "react";
import { cn } from "../../lib/cn";
import type { KeyName } from "../../lib/keys";
import { Button, type ButtonProps } from "../button";
import { Tooltip } from "../tooltip";

export interface IconButtonProps extends Omit<ButtonProps, "children" | "aria-label"> {
  /** Required accessible name. Also used as the tooltip text. */
  label: string;
  /** The icon, e.g. `<ArrowUp />` from lucide-react. Sized automatically. */
  icon: React.ReactNode;
  /** Show `label` (and `shortcut`) in a tooltip. Default true. */
  tooltip?: boolean;
  /** Shortcut displayed in the tooltip. Display only — bind it with `useHotkey`. */
  shortcut?: readonly KeyName[];
  tooltipSide?: "top" | "right" | "bottom" | "left";
}

const square = {
  xs: "size-6 px-0",
  sm: "size-7 px-0",
  md: "size-8 px-0",
  lg: "size-10 px-0",
} as const;

/**
 * Square, icon-only button with a mandatory accessible label and an automatic tooltip.
 * Defaults to the `ghost` variant.
 */
export function IconButton({
  label,
  icon,
  tooltip = true,
  shortcut,
  tooltipSide = "top",
  variant = "ghost",
  size = "md",
  className,
  ...props
}: IconButtonProps) {
  const button = (
    <Button
      data-slot="icon-button"
      aria-label={label}
      variant={variant}
      size={size}
      className={cn(square[size], className)}
      {...props}
    >
      {icon}
    </Button>
  );
  if (!tooltip) return button;
  return (
    <Tooltip content={label} shortcut={shortcut} side={tooltipSide}>
      {button}
    </Tooltip>
  );
}
