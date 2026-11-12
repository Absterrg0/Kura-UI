"use client";

import {
  PopoverClose as PopoverClosePrimitive,
  PopoverContent as PopoverContentPrimitive,
  Popover as PopoverPrimitive,
  PopoverTrigger as PopoverTriggerPrimitive,
} from "@ui-sdk/react/popover";
import * as React from "react";
import { asChildProps } from "../../lib/as-child";
import { cn } from "../../lib/cn";

/** Lets a `PopoverAnchor` position the content instead of the trigger. */
const AnchorContext = React.createContext<{
  anchor: HTMLElement | null;
  setAnchor: (el: HTMLElement | null) => void;
} | null>(null);

export interface PopoverProps extends React.ComponentProps<typeof PopoverPrimitive> {}

/**
 * Root, built on the ui-sdk Popover. Controlled via `open` + `onOpenChange` or uncontrolled via
 * `defaultOpen`. Compose with PopoverTrigger and PopoverContent. An agent connected through
 * `createAgent` can open and close it.
 */
export function Popover(props: PopoverProps) {
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);
  return (
    <AnchorContext.Provider value={{ anchor, setAnchor }}>
      <PopoverPrimitive {...props} />
    </AnchorContext.Provider>
  );
}

export interface PopoverTriggerProps extends React.ComponentProps<typeof PopoverTriggerPrimitive> {
  /** Render the child element (e.g. a Kura `<Button>`) as the trigger. */
  asChild?: boolean;
}

export function PopoverTrigger({ asChild, children, ...props }: PopoverTriggerProps) {
  return <PopoverTriggerPrimitive {...props} {...asChildProps(asChild, children)} />;
}

export interface PopoverAnchorProps extends React.ComponentProps<"div"> {
  /** Render the child element as the anchor instead of a wrapping div. */
  asChild?: boolean;
}

/** Positions the content against this element instead of the trigger. */
export function PopoverAnchor({ asChild, children, ref, ...props }: PopoverAnchorProps) {
  const ctx = React.useContext(AnchorContext);
  const setRef = React.useCallback(
    (el: HTMLElement | null) => {
      ctx?.setAnchor(el);
      if (typeof ref === "function") ref(el as HTMLDivElement);
      else if (ref) ref.current = el as HTMLDivElement;
    },
    [ctx, ref],
  );
  if (asChild && React.isValidElement<{ ref?: React.Ref<HTMLElement> }>(children)) {
    return React.cloneElement(children, {
      ...props,
      "data-slot": "popover-anchor",
      ref: setRef,
    } as never);
  }
  return (
    <div data-slot="popover-anchor" ref={setRef} {...props}>
      {children}
    </div>
  );
}

export interface PopoverCloseProps extends React.ComponentProps<typeof PopoverClosePrimitive> {
  /** Render the child element (e.g. a Kura `<Button>`) as the close button. */
  asChild?: boolean;
}

export function PopoverClose({ asChild, children, ...props }: PopoverCloseProps) {
  return <PopoverClosePrimitive {...props} {...asChildProps(asChild, children)} />;
}

export interface PopoverContentProps
  extends Omit<React.ComponentProps<typeof PopoverContentPrimitive>, "children"> {
  children?: React.ReactNode;
  /**
   * Kept for compatibility: content always renders in place and shows in the top layer, so no
   * ancestor clips or covers it, inside dialogs too.
   */
  inline?: boolean;
}

/**
 * Floating surface. Opaque raised surface with a hairline ring and a soft shadow, origin-aware
 * scale and fade. Focus moves inside on open and returns to the trigger on close.
 */
export function PopoverContent({
  className,
  align = "center",
  sideOffset = 8,
  collisionPadding = 8,
  inline: _inline,
  anchor,
  children,
  ...props
}: PopoverContentProps) {
  const ctx = React.useContext(AnchorContext);
  // ui-sdk labels the content by its trigger even when given an aria-label; point it at the label.
  const labelId = React.useId();
  const label = props["aria-label"];
  const named = label && !props["aria-labelledby"];
  // ui-sdk owns `data-slot`; a component that uses a popover names its card through `render`.
  const slot = (props as { "data-slot"?: string })["data-slot"];
  return (
    <PopoverContentPrimitive
      align={align}
      sideOffset={sideOffset}
      collisionPadding={collisionPadding}
      anchor={anchor ?? ctx?.anchor ?? undefined}
      className={cn(
        "z-50 m-0 w-72 max-w-[calc(100vw-16px)] overflow-visible rounded-kura-xl border-0 bg-kura-surface-raised p-3 font-kura-sans text-kura-fg text-sm shadow-kura-lg outline-none",
        "origin-(--transform-origin) transition-[opacity,scale] duration-(--kura-duration-base) ease-kura-out",
        "data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0 motion-reduce:transition-none",
        className,
      )}
      {...props}
      aria-labelledby={named ? labelId : props["aria-labelledby"]}
      render={slot ? <div data-slot={slot} /> : props.render}
    >
      {named && (
        <span id={labelId} hidden>
          {label}
        </span>
      )}
      {children}
    </PopoverContentPrimitive>
  );
}
