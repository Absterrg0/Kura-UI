"use client";

import { Tooltip as TooltipPrimitive } from "radix-ui";
import * as React from "react";
import { cn } from "../../lib/cn";
import type { KeyName } from "../../lib/keys";
import { Kbd } from "../kbd";

export interface TooltipProviderProps
  extends React.ComponentProps<typeof TooltipPrimitive.Provider> {}

/** True inside a `TooltipProvider`, so `<Tooltip>` joins it instead of creating its own. */
const InsideProvider = React.createContext(false);

/**
 * Optional. Wrap an area (or the app) so moving between tooltips skips the open delay — this
 * includes every `<Tooltip>` and `IconButton` inside it. `<Tooltip>` works without it.
 */
export function TooltipProvider({
  delayDuration = 500,
  skipDelayDuration = 300,
  children,
  ...props
}: TooltipProviderProps) {
  return (
    <TooltipPrimitive.Provider
      delayDuration={delayDuration}
      skipDelayDuration={skipDelayDuration}
      {...props}
    >
      <InsideProvider.Provider value={true}>{children}</InsideProvider.Provider>
    </TooltipPrimitive.Provider>
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
          // A slip of ink with paper-coloured text: lit top edge, short warm shadow, no ring.
          "z-50 inline-flex max-w-xs select-none items-center gap-2 rounded-kura-xs bg-kura-ink px-2 py-[5px] font-kura-sans font-medium text-[12px] text-kura-fg-inverted leading-[1.35] tracking-[0.005em]",
          "shadow-[inset_0_1px_0_0_color-mix(in_oklab,white_10%,transparent),0_1px_2px_-1px_color-mix(in_oklab,black_35%,transparent),0_8px_18px_-8px_color-mix(in_oklab,black_40%,transparent)]",
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
            className="-mr-1 font-normal [&_[data-slot=kbd-key]]:opacity-70"
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
  /** Delay before opening in ms. Default 500, or the surrounding TooltipProvider's (0 when moving between tooltips). */
  delayDuration?: number;
  /** Disable without unmounting the trigger. */
  disabled?: boolean;
  /** Extra classes for the content bubble. */
  contentClassName?: string;
}

/**
 * Label-on-hover/focus for an icon or control. Opens on hover after a delay and immediately on
 * keyboard focus; closes on Escape. Creates its own provider unless it sits inside a
 * `TooltipProvider`, which it then shares (instant hand-off between neighbouring tooltips).
 */
export function Tooltip({
  content,
  children,
  shortcut,
  side = "top",
  align = "center",
  delayDuration,
  disabled = false,
  contentClassName,
  ...rootProps
}: TooltipProps) {
  const shared = React.useContext(InsideProvider);
  if (disabled) return children;
  const root = (
    <TooltipPrimitive.Root data-slot="tooltip" delayDuration={delayDuration} {...rootProps}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipContent side={side} align={align} shortcut={shortcut} className={contentClassName}>
        {content}
      </TooltipContent>
    </TooltipPrimitive.Root>
  );
  // Inside a TooltipProvider, join it so the skip-delay hand-off works across tooltips.
  if (shared) return root;
  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration ?? 500} skipDelayDuration={300}>
      {root}
    </TooltipPrimitive.Provider>
  );
}
