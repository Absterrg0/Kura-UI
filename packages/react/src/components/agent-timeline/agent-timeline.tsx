"use client";

import * as React from "react";
import { useElapsed } from "../../hooks/use-elapsed";
import { cn } from "../../lib/cn";
import { formatClock, formatDuration } from "../../lib/format";
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

/** A step that is still running counts from `startedAt`, or from when it became active. */
function useLiveDuration(active: boolean, startedAt?: Date | number): number | null {
  const began = React.useRef<number | null>(null);
  if (!active) began.current = null;
  else if (began.current == null) began.current = Date.now();
  const elapsed = useElapsed(startedAt ?? began.current, active);
  return active ? elapsed : null;
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
      className="relative z-10 flex h-5 w-4 shrink-0 items-center justify-center"
    >
      <StatusGlyph status={GLYPH[status]} size={small ? "sm" : "md"} label={null} />
    </span>
  );
}

// The spine: one column of fine dots between two glyphs, lit behind the agent.
const spine = {
  "--kura-dots-pitch": "5px",
  "--kura-dots-r": "0.85px",
} as React.CSSProperties;

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
      className={cn("relative flex gap-2.5", !last && (small ? "pb-3" : "pb-4"))}
    >
      {!last && (
        <span
          aria-hidden
          data-slot="agent-timeline-connector"
          data-filled={filled}
          className="kura-dots absolute top-[21px] bottom-[1px] left-[5.5px] w-[5px]"
          style={spine}
        >
          <span
            className={cn(
              "kura-dots absolute inset-x-0 top-0 text-kura-fg-subtle transition-[height] duration-(--kura-duration-slower) ease-kura-snap motion-reduce:transition-none",
              filled ? "h-full" : "h-0",
            )}
            style={{ ...spine, "--kura-dots-color": "currentColor" } as React.CSSProperties}
          />
        </span>
      )}
      <Node status={step.status} small={small} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex min-h-5 items-baseline gap-3 text-[13px] leading-5">
          <span
            data-slot="agent-timeline-title"
            className={cn(
              "min-w-0 flex-1 transition-colors duration-(--kura-duration-base)",
              step.status === "queued" && "text-kura-fg-subtle",
              step.status === "active" && "text-kura-fg",
              step.status === "done" && "text-kura-fg-muted",
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
              className={cn(
                "shrink-0 font-kura-mono text-[12px] tabular-nums",
                active ? "text-kura-fg-muted" : "text-kura-fg-subtle",
              )}
            >
              {/* Still running: a clock, like every live timer. Finished: the duration. */}
              {step.duration == null && active ? formatClock(ms) : formatDuration(ms)}
            </span>
          )}
        </div>
        {step.description != null && (
          <p
            data-slot="agent-timeline-description"
            className={cn(
              "text-kura-fg-subtle",
              small ? "text-[12px] leading-[17px]" : "text-[12.5px] leading-[18px]",
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
