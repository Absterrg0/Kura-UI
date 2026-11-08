"use client";

import { Check, Minus, X } from "lucide-react";
import * as React from "react";
import { cn } from "../../lib/cn";
import { ShimmerText } from "../shimmer-text";

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

export function formatStepDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s < 10 ? s.toFixed(1) : Math.round(s)}s`;
  const r = Math.round(s);
  return `${Math.floor(r / 60)}m ${String(r % 60).padStart(2, "0")}s`;
}

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

function Node({ status, small }: { status: AgentStepStatus; small: boolean }) {
  return (
    <span
      aria-hidden
      data-slot="agent-timeline-node"
      data-status={status}
      className={cn(
        "relative z-10 grid shrink-0 place-items-center rounded-full bg-kura-surface transition-[background-color,color,box-shadow] duration-(--kura-duration-base) ease-kura-out",
        small ? "size-4 [&_svg]:size-2.5" : "size-5 [&_svg]:size-3",
        status === "queued" &&
          "text-kura-fg-subtle shadow-[inset_0_0_0_1.5px_var(--kura-border-strong)]",
        status === "active" && "bg-kura-accent-subtle text-kura-accent-text",
        status === "done" &&
          "bg-kura-surface-sunken text-kura-success-text shadow-[inset_0_0_0_1px_var(--kura-border)]",
        status === "failed" && "bg-kura-danger-subtle text-kura-danger-text",
        status === "skipped" && "text-kura-fg-subtle shadow-[inset_0_0_0_1px_var(--kura-border)]",
      )}
    >
      {status === "active" && (
        <>
          <span className="absolute inset-0 animate-kura-pulse rounded-full shadow-[0_0_0_3px_var(--kura-accent-subtle)] motion-reduce:animate-none" />
          <span className={cn("rounded-full bg-current", small ? "size-1.5" : "size-2")} />
        </>
      )}
      {status === "done" && <Check strokeWidth={3} className="animate-kura-pop-in" />}
      {status === "failed" && <X strokeWidth={3} className="animate-kura-pop-in" />}
      {status === "skipped" && <Minus strokeWidth={3} />}
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
        <span
          aria-hidden
          data-slot="agent-timeline-connector"
          data-filled={filled}
          className={cn(
            "absolute w-px overflow-hidden rounded-full bg-kura-border",
            small ? "top-[19px] bottom-[3px] left-[7.5px]" : "top-[23px] bottom-[3px] left-[9.5px]",
          )}
        >
          <span
            className={cn(
              "absolute inset-0 origin-top transition-[scale,opacity] duration-(--kura-duration-slower) ease-kura-in-out motion-reduce:transition-opacity",
              "bg-kura-fg-subtle",
              filled ? "scale-y-100 opacity-100" : "scale-y-0 opacity-0 motion-reduce:scale-y-100",
            )}
          />
        </span>
      )}
      <span className={cn("flex shrink-0", small ? "pt-px" : "pt-0.5")}>
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
            {active ? <ShimmerText duration={2.4}>{step.title}</ShimmerText> : step.title}
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
 * Vertical plan/step tracker for multi-step agents. Steps are queued, active (jade pulse,
 * shimmering title, live timer), done, failed or skipped; sub-steps nest; the connector between
 * nodes fills as the agent moves past each step.
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
