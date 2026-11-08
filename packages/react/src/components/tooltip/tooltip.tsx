"use client";

import { Tooltip as TooltipPrimitive } from "radix-ui";
import type * as React from "react";
import { cn } from "../../lib/cn";
import type { KeyName } from "../../lib/keys";
import { Kbd } from "../kbd";

export interface TooltipProviderProps
  extends React.ComponentProps<typeof TooltipPrimitive.Provider> {}

/**
 * Optional. Wrap an area (or the app) so moving between tooltips skips the open delay.
 * `<Tooltip>` works without it.
 */
export function TooltipProvider({
  delayDuration = 500,
  skipDelayDuration = 300,
  ...props
}: TooltipProviderProps) {
  return (
    <TooltipPrimitive.Provider
      delayDuration={delayDuration}
      skipDelayDuration={skipDelayDuration}
      {...props}
    />
  );
}

export interface TooltipContentProps extends React.ComponentProps<typeof TooltipPrimitive.Content> {
  /** Keyboard shortcut shown after the label, e.g. `["mod", "enter"]`. */
  shortcut?: readonly KeyName[];
}

/** The floating label. Origin-aware scale+fade in, instant when moving between tooltips. */
export function TooltipContent({
  className,
  sideOffset = 6,
  shortcut,
  children,
  ...props
}: TooltipContentProps) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "z-50 inline-flex max-w-xs select-none items-center gap-2 rounded-kura-sm bg-kura-ink px-2 py-1 font-kura-sans text-kura-fg-inverted text-xs leading-snug shadow-kura-md",
          "origin-(--radix-tooltip-content-transform-origin)",
          "data-[state=delayed-open]:animate-kura-pop-in data-[state=closed]:animate-kura-pop-out data-[state=instant-open]:animate-none",
          className,
        )}
        {...props}
      >
        {children}
        {shortcut && (
          <Kbd
            keys={shortcut}
            variant="ghost"
            size="sm"
            className="-mr-1 [&_[data-slot=kbd-key]]:bg-white/15 [&_[data-slot=kbd-key]]:text-kura-fg-inverted"
          />
        )}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

export const TooltipRoot = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export interface TooltipProps
  extends Omit<React.ComponentProps<typeof TooltipPrimitive.Root>, "children"> {
  /** The tooltip label. Keep it to a few words; never put interactive content in a tooltip. */
  content: React.ReactNode;
  /** The trigger. Must be a single focusable element that accepts a ref (e.g. <Button>). */
  children: React.ReactElement;
  /** Keyboard shortcut rendered as keys after the label. */
  shortcut?: readonly KeyName[];
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  /** Delay before opening in ms. Default 500 (0 when moving between tooltips). */
  delayDuration?: number;
  /** Disable without unmounting the trigger. */
  disabled?: boolean;
  /** Extra classes for the content bubble. */
  contentClassName?: string;
}

/**
 * Label-on-hover/focus for an icon or control. Opens on hover after a delay and immediately on
 * keyboard focus; closes on Escape. Includes its own provider.
 */
export function Tooltip({
  content,
  children,
  shortcut,
  side = "top",
  align = "center",
  delayDuration = 500,
  disabled = false,
  contentClassName,
  ...rootProps
}: TooltipProps) {
  if (disabled) return children;
  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration} skipDelayDuration={300}>
      <TooltipPrimitive.Root data-slot="tooltip" {...rootProps}>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipContent side={side} align={align} shortcut={shortcut} className={contentClassName}>
          {content}
        </TooltipContent>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
