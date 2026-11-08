"use client";

import { GitBranch, Pause, Play, Square } from "lucide-react";
import * as React from "react";
import { useElapsed } from "../../hooks/use-elapsed";
import { useHotkey } from "../../hooks/use-hotkey";
import { cn } from "../../lib/cn";
import { formatClock, formatCost, formatTokens } from "../../lib/format";
import { Button } from "../button";
import { IconButton } from "../icon-button";
import { ShimmerText } from "../shimmer-text";
import { type AgentStatus, StatusGlyph } from "../status-glyph";
import { Tooltip } from "../tooltip";

export interface RunHeaderTokens {
  /** Prompt / input tokens, including cache reads. */
  input: number;
  /** Completion / output tokens. */
  output: number;
}

export interface RunHeaderProgress {
  /** Steps finished. */
  done: number;
  /** Steps in the plan. */
  total: number;
}

export interface RunHeaderProps extends Omit<React.ComponentProps<"section">, "title"> {
  /** What the run is doing, e.g. "Migrate session API to @acme/auth". */
  title: React.ReactNode;
  /** The agent's name, e.g. "Kura". */
  agent?: string;
  /** Model id, shown in mono, e.g. "claude-opus-5-5". */
  model?: string;
  /** Run state. Non-terminal states (queued, running, waiting, paused) keep the clock ticking. */
  status: AgentStatus;
  /** When the run started. Drives the live elapsed clock. */
  startedAt?: Date | number;
  /** When the run ended. Freezes the clock at endedAt − startedAt. */
  endedAt?: Date | number;
  /** Token usage so far. */
  tokens?: RunHeaderTokens;
  /** Spend so far in USD. */
  cost?: number;
  /** Budget in USD. Shows spend against it with a meter that turns amber at 80% and red past 100%. */
  budget?: number;
  /** Git branch the agent works on, shown in mono with a branch icon. */
  branch?: string;
  /** Plan progress, shown as "4 of 7" with a segmented bar. */
  progress?: RunHeaderProgress;
  /** Extra controls placed before Pause / Stop, e.g. an "Open PR" button. */
  actions?: React.ReactNode;
  /** Shows a Stop control while the run is live. */
  onStop?: () => void;
  /** Shows a Pause control while running. */
  onPause?: () => void;
  /** Shows a Resume control while paused. */
  onResume?: () => void;
  /** `bar` = one dense row; `panel` = title row plus a stats strip. Default "panel". */
  variant?: "bar" | "panel";
  /** Bind ⌘/Ctrl+. to Stop and ⌘/Ctrl+Shift+P to Pause/Resume. Only one run header on screen should bind them. Default true. */
  shortcuts?: boolean;
}

const STOP_KEYS = ["mod", "."] as const;
const PAUSE_KEYS = ["mod", "shift", "p"] as const;

const LIVE: AgentStatus[] = ["queued", "running", "waiting", "paused"];

const STATUS_TEXT: Record<AgentStatus, string> = {
  queued: "Queued",
  running: "Running",
  waiting: "Waiting for you",
  paused: "Paused",
  done: "Completed",
  failed: "Failed",
  skipped: "Stopped",
};

function StatusLabel({ status }: { status: AgentStatus }) {
  const text = STATUS_TEXT[status];
  return (
    <span
      data-slot="run-header-status"
      className={cn(
        "whitespace-nowrap",
        status === "waiting" && "text-kura-warning-text",
        status === "failed" && "text-kura-danger-text",
        (status === "done" || status === "paused" || status === "running") && "text-kura-fg-muted",
      )}
    >
      {status === "running" ? <ShimmerText>{text}</ShimmerText> : text}
    </span>
  );
}

/** Segmented bar for discrete steps (continuous above 24 steps). */
function StepsBar({
  progress,
  status,
  className,
}: {
  progress: RunHeaderProgress;
  status: AgentStatus;
  className?: string;
}) {
  const total = Math.max(0, progress.total);
  const done = Math.min(total, Math.max(0, progress.done));
  const live = status === "running" || status === "waiting";
  const currentTone =
    status === "failed"
      ? "bg-kura-danger"
      : status === "waiting"
        ? "bg-kura-warning"
        : status === "running"
          ? "bg-kura-accent"
          : "bg-kura-hover";
  if (total > 24) {
    return (
      <span
        aria-hidden
        className={cn("flex h-1 overflow-hidden rounded-full bg-kura-hover", className)}
      >
        <span
          className="h-full rounded-full bg-kura-fg transition-[width] duration-(--kura-duration-slow) ease-kura-out motion-reduce:transition-none"
          style={{ width: `${(done / total) * 100}%` }}
        />
      </span>
    );
  }
  return (
    <span aria-hidden className={cn("flex h-1 gap-[3px]", className)}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-full min-w-0 flex-1 rounded-full transition-colors duration-(--kura-duration-base) ease-kura-out motion-reduce:transition-none",
            i < done
              ? "bg-kura-fg"
              : i === done && (live || status === "failed")
                ? currentTone
                : "bg-kura-hover",
            i === done && status === "running" && "animate-kura-pulse motion-reduce:animate-none",
          )}
        />
      ))}
    </span>
  );
}

function budgetTone(cost: number, budget: number) {
  const r = cost / budget;
  if (r > 1) return "bg-kura-danger";
  if (r >= 0.8) return "bg-kura-warning";
  return "bg-kura-fg";
}

function Meter({ value, tone, className }: { value: number; tone: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("flex h-1 overflow-hidden rounded-full bg-kura-hover", className)}
    >
      <span
        className={cn(
          "h-full rounded-full transition-[width,background-color] duration-(--kura-duration-slow) ease-kura-out motion-reduce:transition-none",
          tone,
        )}
        style={{ width: `${Math.min(1, Math.max(0, value)) * 100}%` }}
      />
    </span>
  );
}

/**
 * The header of one agent run: title, agent and model, status, branch, a live elapsed clock,
 * tokens, cost against a budget, plan progress, and Stop / Pause / Resume controls with
 * keyboard shortcuts. `bar` is one dense row; `panel` adds a stats strip.
 */
export function RunHeader({
  title,
  agent,
  model,
  status,
  startedAt,
  endedAt,
  tokens,
  cost,
  budget,
  branch,
  progress,
  actions,
  onStop,
  onPause,
  onResume,
  variant = "panel",
  shortcuts = true,
  className,
  ...props
}: RunHeaderProps) {
  const id = React.useId();
  const live = LIVE.includes(status);
  const ticking = useElapsed(startedAt, live && endedAt == null);
  const elapsed =
    startedAt != null && endedAt != null
      ? Math.max(0, +new Date(endedAt) - +new Date(startedAt))
      : ticking;
  const clock = elapsed == null ? "–:––" : formatClock(elapsed);

  const canStop = live && onStop != null;
  const canPause = status === "running" && onPause != null;
  const canResume = status === "paused" && onResume != null;

  useHotkey(STOP_KEYS, () => onStop?.(), { enabled: shortcuts && canStop });
  useHotkey(PAUSE_KEYS, () => (canPause ? onPause?.() : onResume?.()), {
    enabled: shortcuts && (canPause || canResume),
  });

  const bar = variant === "bar";
  const totalTokens = tokens ? tokens.input + tokens.output : null;
  const over = cost != null && budget != null && budget > 0 && cost > budget;

  const pauseButton = (canPause || canResume) && (
    <IconButton
      data-slot="run-header-pause"
      size="sm"
      variant={bar ? "ghost" : "outline"}
      label={canPause ? "Pause run" : "Resume run"}
      shortcut={shortcuts ? PAUSE_KEYS : undefined}
      aria-keyshortcuts={shortcuts ? "Meta+Shift+P Control+Shift+P" : undefined}
      icon={canPause ? <Pause className="fill-current" /> : <Play className="fill-current" />}
      onClick={() => (canPause ? onPause?.() : onResume?.())}
    />
  );

  const stopIcon = <Square className="size-3! fill-current" />;
  const stopButton =
    canStop &&
    (bar ? (
      <IconButton
        data-slot="run-header-stop"
        size="sm"
        label="Stop run"
        shortcut={shortcuts ? STOP_KEYS : undefined}
        aria-keyshortcuts={shortcuts ? "Meta+. Control+." : undefined}
        icon={stopIcon}
        onClick={onStop}
      />
    ) : (
      <Tooltip content="Stop run" shortcut={shortcuts ? STOP_KEYS : undefined}>
        <Button
          data-slot="run-header-stop"
          variant="outline"
          size="sm"
          onClick={onStop}
          aria-keyshortcuts={shortcuts ? "Meta+. Control+." : undefined}
          aria-label="Stop run"
          className="max-@md:size-7 max-@md:px-0"
        >
          {stopIcon}
          <span className="hidden @md:inline">Stop</span>
        </Button>
      </Tooltip>
    ));

  const controls =
    actions != null || pauseButton || stopButton ? (
      <div data-slot="run-header-controls" className="flex shrink-0 items-center gap-1.5">
        {actions}
        {pauseButton}
        {stopButton}
      </div>
    ) : null;

  const announce = (
    <span role="status" className="sr-only">
      {`Run ${STATUS_TEXT[status].toLowerCase()}`}
    </span>
  );

  const branchChip = branch != null && (
    <span
      data-slot="run-header-branch"
      className="inline-flex min-w-0 items-center gap-1 font-kura-mono text-[12px] text-kura-fg-muted"
    >
      <GitBranch aria-hidden className="size-3.5 shrink-0 text-kura-fg-subtle" strokeWidth={1.75} />
      <span className="truncate">{branch}</span>
    </span>
  );

  if (bar) {
    return (
      <section
        aria-labelledby={`${id}-title`}
        data-slot="run-header"
        data-variant="bar"
        data-status={status}
        className={cn(
          "@container flex h-11 min-w-0 items-center gap-3 rounded-kura-xl bg-kura-surface pr-2 pl-3.5 font-kura-sans text-[13px] text-kura-fg shadow-kura-sm",
          className,
        )}
        {...props}
      >
        <StatusGlyph status={status} label={null} />
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <h2
            id={`${id}-title`}
            data-slot="run-header-title"
            className="min-w-0 truncate font-medium tracking-[-0.006em]"
          >
            {title}
          </h2>
          <span className="hidden text-[12px] @md:inline">
            <StatusLabel status={status} />
          </span>
          {branchChip && <span className="hidden min-w-0 @3xl:flex">{branchChip}</span>}
        </div>
        <dl
          data-slot="run-header-stats"
          className="flex shrink-0 items-center gap-4 font-kura-mono text-[12px] text-kura-fg-muted tabular-nums"
        >
          {progress && progress.total > 0 && (
            <div className="hidden items-center gap-2 @lg:flex">
              <dt className="sr-only">Steps</dt>
              <StepsBar progress={progress} status={status} className="w-20" />
              <dd>
                {Math.min(progress.done, progress.total)}
                <span className="text-kura-fg-subtle">/{progress.total}</span>
              </dd>
            </div>
          )}
          {totalTokens != null && (
            <div className="hidden @2xl:block">
              <dt className="sr-only">Tokens</dt>
              <dd className="inline-block min-w-[5ch] text-right">
                {formatTokens(totalTokens)}
                <span className="font-kura-sans text-kura-fg-subtle"> tokens</span>
              </dd>
            </div>
          )}
          {cost != null && (
            <div className="hidden @xl:block">
              <dt className="sr-only">Cost</dt>
              <dd className={cn(over && "text-kura-danger-text")}>
                {formatCost(cost)}
                {budget != null && (
                  <span className="text-kura-fg-subtle">
                    <span className="font-kura-sans"> of </span>
                    {formatCost(budget)}
                  </span>
                )}
              </dd>
            </div>
          )}
          <div>
            <dt className="sr-only">Elapsed</dt>
            <dd
              className="inline-block min-w-[5ch] text-right text-kura-fg"
              data-slot="run-header-elapsed"
            >
              {clock}
            </dd>
          </div>
        </dl>
        {controls && (
          <>
            <span aria-hidden className="h-4 w-px shrink-0 bg-kura-border" />
            {controls}
          </>
        )}
        {announce}
      </section>
    );
  }

  const stats: { key: string; label: string; node: React.ReactNode }[] = [];
  stats.push({
    key: "elapsed",
    label: "Elapsed",
    node: (
      <span data-slot="run-header-elapsed" className="text-kura-fg">
        {clock}
      </span>
    ),
  });
  if (progress && progress.total > 0) {
    stats.push({
      key: "steps",
      label: "Steps",
      node: (
        <span className="flex flex-col gap-2">
          <span>
            <span className="text-kura-fg">{Math.min(progress.done, progress.total)}</span>
            <span className="text-kura-fg-subtle">
              <span className="font-kura-sans"> of </span>
              {progress.total}
            </span>
          </span>
          <StepsBar progress={progress} status={status} />
        </span>
      ),
    });
  }
  if (tokens) {
    stats.push({
      key: "tokens",
      label: "Tokens",
      node: (
        <span className="truncate">
          <span className="text-kura-fg">{formatTokens(tokens.input)}</span>
          <span className="font-kura-sans text-kura-fg-subtle"> in · </span>
          <span className="text-kura-fg">{formatTokens(tokens.output)}</span>
          <span className="font-kura-sans text-kura-fg-subtle"> out</span>
        </span>
      ),
    });
  }
  if (cost != null) {
    stats.push({
      key: "cost",
      label: budget != null ? "Spend" : "Cost",
      node: (
        <span className="flex flex-col gap-2">
          <span>
            <span className={over ? "text-kura-danger-text" : "text-kura-fg"}>
              {formatCost(cost)}
            </span>
            {budget != null && (
              <span className="text-kura-fg-subtle">
                <span className="font-kura-sans"> of </span>
                {formatCost(budget)}
              </span>
            )}
          </span>
          {budget != null && budget > 0 && (
            <Meter value={cost / budget} tone={budgetTone(cost, budget)} />
          )}
        </span>
      ),
    });
  }

  // Each meta item carries its own separator so items can drop out at narrow widths without
  // leaving a dangling "·". Branch outlives model, which outlives the agent name.
  const meta: { key: string; className: string; node: React.ReactNode }[] = [];
  if (agent != null)
    meta.push({
      key: "agent",
      className: "hidden @md:flex",
      node: (
        <span data-slot="run-header-agent" className="text-kura-fg-muted">
          {agent}
        </span>
      ),
    });
  if (model != null)
    meta.push({
      key: "model",
      className: "hidden @sm:flex",
      node: (
        <span data-slot="run-header-model" className="truncate font-kura-mono">
          {model}
        </span>
      ),
    });
  if (branchChip) meta.push({ key: "branch", className: "flex", node: branchChip });

  return (
    <section
      aria-labelledby={`${id}-title`}
      data-slot="run-header"
      data-variant="panel"
      data-status={status}
      className={cn(
        "@container flex min-w-0 flex-col overflow-hidden rounded-kura-xl bg-kura-surface font-kura-sans text-kura-fg shadow-kura-sm",
        className,
      )}
      {...props}
    >
      <div className="flex items-start gap-3 px-4 pt-3.5 pb-3.5">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <h2
            id={`${id}-title`}
            data-slot="run-header-title"
            className="truncate font-medium text-[15px] leading-5 tracking-[-0.011em]"
          >
            {title}
          </h2>
          <div className="flex min-w-0 items-center gap-2 text-[12px] text-kura-fg-subtle leading-4">
            <span className="inline-flex shrink-0 items-center gap-1.5">
              <StatusGlyph status={status} size="sm" label={null} />
              <StatusLabel status={status} />
            </span>
            {meta.map((m) => (
              <span key={m.key} className={cn("min-w-0 items-center gap-2", m.className)}>
                <span aria-hidden className="text-kura-border-strong">
                  ·
                </span>
                {m.node}
              </span>
            ))}
          </div>
        </div>
        {controls}
      </div>
      <dl
        data-slot="run-header-stats"
        className="grid grid-cols-2 gap-px @xl:grid-cols-[repeat(var(--run-header-stats),minmax(0,1fr))]"
        style={{ ["--run-header-stats" as string]: stats.length }}
      >
        {stats.map((s) => (
          <div
            key={s.key}
            data-slot="run-header-stat"
            data-stat={s.key}
            className="flex min-w-0 flex-col gap-1 bg-kura-surface px-4 pt-2.5 pb-3 shadow-[-1px_-1px_0_0_var(--kura-border-subtle)]"
          >
            <dt className="text-[12px] text-kura-fg-subtle leading-4">{s.label}</dt>
            <dd className="min-w-0 font-kura-mono text-[13px] leading-5 tabular-nums">{s.node}</dd>
          </div>
        ))}
      </dl>
      {announce}
    </section>
  );
}
