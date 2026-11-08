"use client";

import { ArrowDown } from "lucide-react";
import * as React from "react";
import { useReducedMotion } from "../../hooks/use-reduced-motion";
import { cn } from "../../lib/cn";

export interface MessageListProps extends React.ComponentProps<"div"> {
  /** Follow new content while the reader is at the bottom; stop as soon as they scroll up. Default true. */
  stickToBottom?: boolean;
  /** Distance in px from the bottom that still counts as “at the bottom”. Default 64. */
  threshold?: number;
  /** Label of the pill that appears when the reader has scrolled away. Default “Jump to latest”. */
  jumpLabel?: string;
  /** Classes for the inner content column (gap, max width, padding). */
  contentClassName?: string;
}

/**
 * Scrollable chat thread (`role="log"`). Sticks to the bottom while content streams in, lets the
 * reader scroll up without being yanked back, and offers a “Jump to latest” pill until they
 * return. Give it a height (`h-[480px]`, `flex-1`, …).
 */
export function MessageList({
  stickToBottom = true,
  threshold = 64,
  jumpLabel = "Jump to latest",
  contentClassName,
  className,
  children,
  ...props
}: MessageListProps) {
  const viewport = React.useRef<HTMLDivElement>(null);
  const content = React.useRef<HTMLDivElement>(null);
  const stuck = React.useRef(true);
  const lastTop = React.useRef(0);
  const [atBottom, setAtBottom] = React.useState(true);
  const reduced = useReducedMotion();

  const distance = React.useCallback(() => {
    const el = viewport.current;
    return el ? el.scrollHeight - el.scrollTop - el.clientHeight : 0;
  }, []);

  const pin = React.useCallback(() => {
    const el = viewport.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  // Start at the bottom, and follow content growth (new messages, streaming tokens) while stuck.
  React.useLayoutEffect(() => {
    if (stickToBottom) pin();
    const el = content.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      if (stickToBottom && stuck.current) pin();
      setAtBottom(distance() <= threshold);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [stickToBottom, threshold, pin, distance]);

  const onScroll = () => {
    const el = viewport.current;
    if (!el) return;
    const bottom = distance() <= threshold;
    if (bottom) stuck.current = true;
    else if (el.scrollTop < lastTop.current - 1) stuck.current = false;
    lastTop.current = el.scrollTop;
    setAtBottom(bottom);
  };

  const jump = () => {
    stuck.current = true;
    viewport.current?.scrollTo({
      top: viewport.current.scrollHeight,
      behavior: reduced ? "auto" : "smooth",
    });
  };

  const showJump = !atBottom;

  return (
    <div
      data-slot="message-list"
      data-at-bottom={atBottom}
      className={cn("relative flex min-h-0 flex-col overflow-hidden", className)}
      {...props}
    >
      <div
        ref={viewport}
        role="log"
        aria-label="Conversation"
        // biome-ignore lint/a11y/noNoninteractiveTabindex: the log must be keyboard-scrollable
        tabIndex={0}
        onScroll={onScroll}
        onWheel={(e) => {
          // Scrolling up with a wheel or trackpad releases the stick immediately, even mid-stream.
          if (e.deltaY < 0) stuck.current = false;
        }}
        data-slot="message-list-viewport"
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain outline-none [scrollbar-gutter:stable] [scrollbar-width:thin] focus-visible:shadow-[inset_0_0_0_2px_var(--kura-ring)]"
      >
        <div
          ref={content}
          data-slot="message-list-content"
          className={cn("flex flex-col gap-5 px-4 py-6", contentClassName)}
        >
          {children}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
        <button
          type="button"
          data-slot="message-list-jump"
          data-state={showJump ? "visible" : "hidden"}
          inert={!showJump || undefined}
          aria-hidden={!showJump || undefined}
          onClick={jump}
          className={cn(
            "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full bg-kura-overlay pr-3.5 pl-3 font-kura-sans font-medium text-kura-fg text-xs shadow-kura-md outline-none backdrop-blur-xl",
            "transition-[opacity,transform,scale] duration-(--kura-duration-base) ease-kura-out focus-visible:shadow-kura-focus active:scale-[0.97]",
            showJump
              ? "pointer-events-auto translate-y-0 opacity-100"
              : "translate-y-2 scale-95 opacity-0 duration-(--kura-duration-fast)",
            "motion-reduce:translate-y-0 motion-reduce:scale-100 motion-reduce:active:scale-100",
          )}
        >
          <ArrowDown aria-hidden className="size-3.5 text-kura-fg-muted" />
          {jumpLabel}
        </button>
      </div>
    </div>
  );
}
