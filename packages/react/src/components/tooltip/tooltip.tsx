"use client";

import {
  Tooltip as TooltipPrimitive,
  TooltipContent as TooltipPrimitiveContent,
  TooltipTrigger as TooltipPrimitiveTrigger,
} from "@ui-sdk/react/tooltip";
import * as React from "react";
import { cn } from "../../lib/cn";
import type { KeyName } from "../../lib/keys";
import { Kbd } from "../kbd";

export interface TooltipProviderProps {
  /** Delay in ms before a tooltip inside opens on hover. Default 500. */
  delayDuration?: number;
  children?: React.ReactNode;
}

/** The delay a surrounding `TooltipProvider` sets for the tooltips inside it. */
const ProviderDelay = React.createContext<number | undefined>(undefined);

/**
 * Optional. Sets one hover delay for every `<Tooltip>` and `IconButton` inside it. Moving between
 * neighbouring tooltips is instant with or without it: once one is open, the next opens at once.
 */
export function TooltipProvider({ delayDuration = 500, children }: TooltipProviderProps) {
  return <ProviderDelay.Provider value={delayDuration}>{children}</ProviderDelay.Provider>;
}

export interface TooltipContentProps
  extends Omit<React.ComponentProps<typeof TooltipPrimitiveContent>, "children"> {
  children?: React.ReactNode;
  /** Keyboard shortcut shown after the label, e.g. `["mod", "enter"]`. */
  shortcut?: readonly KeyName[];
}

/** The floating label. Origin-aware scale and fade in, instant when moving between tooltips. */
export function TooltipContent({
  className,
  sideOffset = 6,
  shortcut,
  children,
  ...props
}: TooltipContentProps) {
  return (
    <TooltipPrimitiveContent
      sideOffset={sideOffset}
      className={cn(
        "z-50 m-0 inline-flex min-h-6 max-w-xs select-none items-center gap-2 overflow-visible rounded-kura-md border-0 bg-kura-ink px-2 py-1 font-kura-sans font-medium text-kura-fg-inverted text-xs leading-4 shadow-kura-popover",
        "origin-(--transform-origin) transition-[opacity,scale] duration-(--kura-duration-fast) ease-kura-out",
        "data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0",
        "data-instant:transition-none motion-reduce:transition-none",
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
          className="-mr-1 [&_[data-slot=kbd-key]]:bg-kura-fg-inverted/15 [&_[data-slot=kbd-key]]:text-kura-fg-inverted/75 [&_[data-slot=kbd-key]]:opacity-100"
        />
      )}
    </TooltipPrimitiveContent>
  );
}

/** The ui-sdk Tooltip root, for fully custom compositions. */
export const TooltipRoot = TooltipPrimitive;
/** The ui-sdk Tooltip trigger. Pass `render={<YourButton />}` to use your own element. */
export const TooltipTrigger = TooltipPrimitiveTrigger;

export interface TooltipProps
  extends Omit<React.ComponentProps<typeof TooltipPrimitive>, "children" | "shortcut" | "delay"> {
  /** The tooltip label. Keep it to a few words; never put interactive content in a tooltip. */
  content: React.ReactNode;
  /** The trigger. Must be a single focusable element that accepts a ref (e.g. <Button>). */
  children: React.ReactElement<Record<string, unknown>>;
  /** Keyboard shortcut rendered as keys after the label, and set as the trigger's `aria-keyshortcuts`. */
  shortcut?: readonly KeyName[];
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  /** Delay before opening in ms. Default 500, or the surrounding TooltipProvider's. */
  delayDuration?: number;
  /** Disable without unmounting the trigger. A natively disabled trigger shows no tooltip either. */
  disabled?: boolean;
  /** Extra classes for the content bubble. */
  contentClassName?: string;
}

/**
 * Label-on-hover/focus for an icon or control, built on the ui-sdk Tooltip. Opens on hover after a
 * delay and at once on keyboard focus; closes on Escape. Once one tooltip is open, its neighbours
 * open instantly. It names an icon-only trigger and describes any other.
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
  const providerDelay = React.useContext(ProviderDelay);
  // A natively disabled trigger can't be focused or hovered, so it can't show a tooltip. Use
  // `focusableWhenDisabled` (Kura Button) or aria-disabled to keep the tooltip on it.
  const trigger = children.props;
  if (disabled || (trigger.disabled && !trigger.focusableWhenDisabled)) return children;
  return (
    <TooltipPrimitive
      delay={delayDuration ?? providerDelay ?? 500}
      shortcut={shortcut?.join("+")}
      {...rootProps}
    >
      <TooltipPrimitiveTrigger render={children} />
      <TooltipContent side={side} align={align} shortcut={shortcut} className={contentClassName}>
        {content}
      </TooltipContent>
    </TooltipPrimitive>
  );
}
