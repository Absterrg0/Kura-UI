"use client";

import { Popover as PopoverPrimitive } from "radix-ui";
import type * as React from "react";
import { cn } from "../../lib/cn";

export interface PopoverProps extends React.ComponentProps<typeof PopoverPrimitive.Root> {}

/**
 * Root. Controlled via `open` + `onOpenChange` or uncontrolled via `defaultOpen`.
 * Compose with PopoverTrigger and PopoverContent.
 */
export function Popover(props: PopoverProps) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

export interface PopoverTriggerProps
  extends React.ComponentProps<typeof PopoverPrimitive.Trigger> {}

export function PopoverTrigger(props: PopoverTriggerProps) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

export interface PopoverAnchorProps extends React.ComponentProps<typeof PopoverPrimitive.Anchor> {}

export function PopoverAnchor(props: PopoverAnchorProps) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />;
}

export interface PopoverCloseProps extends React.ComponentProps<typeof PopoverPrimitive.Close> {}

export function PopoverClose(props: PopoverCloseProps) {
  return <PopoverPrimitive.Close data-slot="popover-close" {...props} />;
}

export interface PopoverContentProps extends React.ComponentProps<typeof PopoverPrimitive.Content> {
  /** Render without a portal (e.g. inside a dialog that traps focus). Default false. */
  inline?: boolean;
}

/**
 * Floating surface: bright print stock with a hairline edge and an inner keyline, origin-aware
 * scale+fade.
 * Focus moves inside on open and returns to the trigger on close.
 */
export function PopoverContent({
  className,
  align = "center",
  sideOffset = 8,
  collisionPadding = 8,
  inline = false,
  ...props
}: PopoverContentProps) {
  const content = (
    <PopoverPrimitive.Content
      data-slot="popover-content"
      align={align}
      sideOffset={sideOffset}
      collisionPadding={collisionPadding}
      className={cn(
        // Bright print stock laid on the page: hairline edge, warm lift, and a keyline just inside
        // the edge (painted under the content, so rows and fields cover it). `before:hidden` drops it.
        "relative isolate z-50 w-72 max-w-[calc(100vw-16px)] rounded-kura-md bg-kura-surface-raised p-3 font-kura-sans text-kura-fg text-sm shadow-kura-lg outline-none",
        "before:pointer-events-none before:absolute before:inset-[3px] before:-z-10 before:rounded-[5px] before:border before:border-kura-border-subtle before:content-['']",
        "origin-(--radix-popover-content-transform-origin)",
        "data-[state=open]:animate-kura-pop-in data-[state=closed]:animate-kura-pop-out",
        className,
      )}
      {...props}
    />
  );
  return inline ? content : <PopoverPrimitive.Portal>{content}</PopoverPrimitive.Portal>;
}
