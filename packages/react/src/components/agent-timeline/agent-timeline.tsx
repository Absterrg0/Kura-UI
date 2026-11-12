"use client";

import * as React from "react";
import { cn } from "../../lib/cn";
import { formatDuration } from "../../lib/format";
import { type AgentStatus, StatusGlyph } from "../status-glyph";

export type AgentStepStatus = "queued" | "active" | "done" | "failed" | "skipped";

export interface AgentTimelineStep {
  /** Stable key. */
  id: string;
  /** Short imperative title, e.g. "Run the test suite". */
  title: React.ReactNode;
  status: AgentStepStatus;
  /** Secondary line under the title (muted). */
  description?: React.ReactNode;
  /** Final duration in ms, shown on the right. */
  duration?: number;
  /** Start time of an active step; shows a live timer. Default: when the step became active. */
  startedAt?: Date | number;
  /** Nested sub-steps, rendered as a smaller timeline under this step. */
  steps?: readonly AgentTimelineStep[];
  /** Extra content under the step (a ToolCall, a CodeBlock, a link…). */
  content?: React.ReactNode;
}

export interface AgentTimelineProps extends Omit<React.ComponentProps<"div">, "children"> {
  /** The plan. Order is display order. */
  steps: readonly AgentTimelineStep[];
  /** Accessible name of the list. Default “Agent progress”. */
  label?: string;
  /** `md` (default) for a plan panel; `sm` for dense sidebars. Nested sub-steps always render one size down. */
  size?: "sm" | "md";
}

const spoken: Record<AgentStepStatus, string> = {
  queued: "queued",
  active: "in progress",
  done: "done",
  failed: "failed",
  skipped: "skipped",
};

/** @deprecated The shared formatter under its old name. */
export const formatStepDuration = formatDuration;

function useLiveDuration(active: boolean, startedAt?: Date | number): number | null {
  const start = React.useRef<number | null>(null);
  const [now, setNow] = React.useState<number | null>(null);
  React.useEffect(() => {
    if (!active) {
      start.current = null;
      setNow(null);
      return;
    }
    start.current = startedAt != null ? +new Date(startedAt) : Date.now();
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, [active, startedAt]);
  return active && start.current != null && now != null ? now - start.current : null;
}

const GLYPH: Record<AgentStepStatus, AgentStatus> = {
  queued: "queued",
  active: "running",
  done: "done",
  failed: "failed",
  skipped: "skipped",
};

function Node({ status, small }: { status: AgentStepStatus; small: boolean }) {
  return (
    <span
      aria-hidden
      data-slot="agent-timeline-node"
      data-status={status}
      className="relative z-10 grid shrink-0 place-items-center"
    >
      <StatusGlyph status={GLYPH[status]} size={small ? "sm" : "md"} label={null} />
    </span>
  );
}

function Step({ step, last, small }: { step: AgentTimelineStep; last: boolean; small: boolean }) {
  const active = step.status === "active";
  const live = useLiveDuration(active, step.startedAt);
  const ms = step.duration ?? live;
  // The connector below a step fills once the agent has moved past it.
  const filled = step.status === "done" || step.status === "skipped";
  return (
    <li
      data-slot="agent-timeline-step"
      data-status={step.status}
      aria-current={active ? "step" : undefined}
      className={cn("relative flex gap-3", !last && (small ? "pb-3" : "pb-5"))}
    >
      {!last && (
        // A column of dots between two glyphs; they light as the agent moves past the step.
        <span
          aria-hidden
          data-slot="agent-timeline-connector"
          data-filled={filled}
          className={cn(
            "kura-dots absolute w-1.5",
            small ? "top-[21px] bottom-0 left-[3.5px]" : "top-[25px] bottom-0 left-[4.5px]",
          )}
        >
          <span
            className={cn(
              "kura-dots absolute inset-x-0 top-0 text-kura-fg-subtle transition-[height] duration-(--kura-duration-slower) ease-kura-snap motion-reduce:transition-none",
              filled ? "h-full" : "h-0",
            )}
            style={{ "--kura-dots-color": "currentColor" } as React.CSSProperties}
          />
        </span>
      )}
      <span className={cn("flex shrink-0 items-start", small ? "pt-[2.5px]" : "pt-[4.5px]")}>
        <Node status={step.status} small={small} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div
          className={cn(
            "flex items-baseline gap-3",
            small ? "min-h-[18px] text-[13px]" : "min-h-6 text-sm",
          )}
        >
          <span
            data-slot="agent-timeline-title"
            className={cn(
              "min-w-0 flex-1 transition-colors duration-(--kura-duration-base)",
              step.status === "queued" && "text-kura-fg-muted",
              step.status === "active" && "font-medium text-kura-fg",
              step.status === "done" && "text-kura-fg",
              step.status === "failed" && "text-kura-fg",
              step.status === "skipped" &&
                "text-kura-fg-subtle line-through decoration-kura-border-strong",
            )}
          >
            {step.title}
            <span className="sr-only"> ({spoken[step.status]})</span>
          </span>
          {ms != null && (
            <span
              data-slot="agent-timeline-duration"
              className="shrink-0 font-kura-mono text-kura-fg-subtle text-xs tabular-nums"
            >
              {formatStepDuration(ms)}
            </span>
          )}
        </div>
        {step.description != null && (
          <p
            data-slot="agent-timeline-description"
            className={cn(
              "text-kura-fg-muted leading-relaxed",
              small ? "text-xs" : "text-[13px]",
              step.status === "failed" && "text-kura-danger-text",
            )}
          >
            {step.description}
          </p>
        )}
        {step.content != null && (
          <div data-slot="agent-timeline-content" className="pt-1.5">
            {step.content}
          </div>
        )}
        {step.steps && step.steps.length > 0 && (
          <div className="pt-2">
            <StepList steps={step.steps} small label={undefined} />
          </div>
        )}
      </div>
    </li>
  );
}

function StepList({
  steps,
  small,
  label,
}: {
  steps: readonly AgentTimelineStep[];
  small: boolean;
  label: string | undefined;
}) {
  return (
    <ol aria-label={label} data-slot="agent-timeline-list" className="flex flex-col">
      {steps.map((step, i) => (
        <Step key={step.id} step={step} last={i === steps.length - 1} small={small} />
      ))}
    </ol>
  );
}

/**
 * Vertical plan/step tracker for multi-step agents. Steps are queued, active (the chasing glyph
 * and a live timer), done, failed or skipped; sub-steps nest; the column of dots between two
 * glyphs lights as the agent moves past each step.
 */
export function AgentTimeline({
  steps,
  label = "Agent progress",
  size = "md",
  className,
  ...props
}: AgentTimelineProps) {
  const total = steps.length;
  const doneCount = steps.filter((s) => s.status === "done" || s.status === "skipped").length;
  const activeIndex = steps.findIndex((s) => s.status === "active");
  const failed = steps.find((s) => s.status === "failed");
  const active = activeIndex >= 0 ? steps[activeIndex] : undefined;
  const announcement = failed
    ? "A step failed"
    : active
      ? `Step ${activeIndex + 1} of ${total}`
      : doneCount === total
        ? "All steps complete"
        : "";

  return (
    <div
      data-slot="agent-timeline"
      data-size={size}
      data-progress={`${doneCount}/${total}`}
      className={cn("font-kura-sans", className)}
      {...props}
    >
      <StepList steps={steps} small={size === "sm"} label={label} />
      <span className="sr-only" role="status">
        {announcement}
      </span>
    </div>
  );
}
