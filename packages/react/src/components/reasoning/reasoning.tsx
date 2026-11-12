"use client";

import { ChevronRight } from "lucide-react";
import * as React from "react";
import { useControllableState } from "../../hooks/use-controllable-state";
import { cn } from "../../lib/cn";
import { StatusGlyph } from "../status-glyph";

export interface ReasoningProps extends React.ComponentProps<"div"> {
  /** The model is still thinking: the label shimmers and an elapsed timer ticks. Default false. */
  active?: boolean;
  /** Seconds spent thinking, if you know it (e.g. from the API). Otherwise measured while `active`. */
  duration?: number;
  /** Expanded (controlled). */
  open?: boolean;
  /** Initial expanded state when uncontrolled. Default: `active` (open while thinking). */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Collapse automatically when `active` turns false — unless the reader toggled it meanwhile. Default true. */
  autoCollapse?: boolean;
  /** Custom label, e.g. for i18n. Default “Thinking… 12s” / “Thought for 14s”. */
  formatLabel?: (state: { active: boolean; seconds: number }) => React.ReactNode;
}

export function formatSeconds(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return s % 60 ? `${m}m ${s % 60}s` : `${m}m`;
}

/**
 * Collapsible “thinking” trace. While `active` it shows a shimmering “Thinking… 12s” label and
 * the reasoning streaming in; when done it collapses to “Thought for 14s”. Expanding reveals the
 * muted trace with an interruptible height transition.
 */
export function Reasoning({
  active = false,
  duration,
  open: openProp,
  defaultOpen,
  onOpenChange,
  autoCollapse = true,
  formatLabel,
  className,
  children,
  ...props
}: ReasoningProps) {
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen ?? active,
    onChange: onOpenChange,
  });

  // Elapsed time: measured from when `active` became true.
  const startedAt = React.useRef<number | null>(null);
  const [elapsed, setElapsed] = React.useState(0);
  const elapsedRef = React.useRef(elapsed);
  elapsedRef.current = elapsed;
  React.useEffect(() => {
    if (!active) return;
    // Resume from the time already spent (e.g. a paused-then-resumed agent).
    startedAt.current = Date.now() - elapsedRef.current * 1000;
    const id = setInterval(() => {
      if (startedAt.current != null) setElapsed((Date.now() - startedAt.current) / 1000);
    }, 250);
    return () => {
      clearInterval(id);
      if (startedAt.current != null) setElapsed((Date.now() - startedAt.current) / 1000);
    };
  }, [active]);
  const seconds = duration ?? elapsed;

  // Auto-collapse when thinking ends, unless the reader took control during it.
  const touched = React.useRef(false);
  const wasActive = React.useRef(active);
  React.useEffect(() => {
    if (wasActive.current && !active && autoCollapse && !touched.current) setOpen(false);
    if (!wasActive.current && active) touched.current = false;
    wasActive.current = active;
  }, [active, autoCollapse, setOpen]);

  const id = React.useId();
  const contentId = `${id}-content`;
  const label = formatLabel ? (
    formatLabel({ active, seconds })
  ) : active ? (
    <>
      Thinking… <span className="tabular-nums">{formatSeconds(seconds)}</span>
    </>
  ) : seconds >= 1 ? (
    <>
      Thought for <span className="tabular-nums">{formatSeconds(seconds)}</span>
    </>
  ) : (
    "Thought for a moment"
  );

  return (
    <div
      data-slot="reasoning"
      data-status={active ? "active" : "done"}
      data-state={open ? "open" : "closed"}
      className={cn("flex flex-col font-kura-sans", className)}
      {...props}
    >
      <button
        type="button"
        data-slot="reasoning-trigger"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => {
          touched.current = true;
          setOpen(!open);
        }}
        className={cn(
          "group/trigger -mx-1.5 inline-flex h-7 w-fit cursor-pointer items-center gap-1 rounded-[8px] px-1.5 text-[13px] text-kura-fg-muted outline-hidden",
          "transition-colors duration-(--kura-duration-fast) ease-kura-snap hover:text-kura-fg focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-kura-ring",
        )}
      >
        {active && <StatusGlyph status="running" size="sm" label={null} className="mr-0.5" />}
        <span data-slot="reasoning-label">{label}</span>
        <ChevronRight
          aria-hidden
          className={cn(
            "size-3.5 text-kura-fg-subtle transition-[rotate,color] duration-(--kura-duration-base) ease-kura-out group-hover/trigger:text-kura-fg-muted motion-reduce:transition-none",
            open && "rotate-90",
          )}
        />
      </button>
      <span className="sr-only" role="status">
        {active ? "Thinking" : `Thought for ${formatSeconds(seconds)}`}
      </span>
      <div
        id={contentId}
        data-slot="reasoning-content"
        inert={!open || undefined}
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-(--kura-duration-slow) ease-kura-snap motion-reduce:transition-opacity",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="relative mt-1 whitespace-pre-wrap py-0.5 pl-[18px] text-[13px] text-kura-fg-muted leading-relaxed [&_[data-slot=streaming-text]]:text-[13px] [&_[data-slot=streaming-text]]:text-kura-fg-muted">
            <span aria-hidden className="kura-leader absolute inset-y-1 left-[1.5px] w-[5px]" />
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
