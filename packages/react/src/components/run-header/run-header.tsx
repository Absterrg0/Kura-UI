"use client";

import { Pause, Play, Square } from "lucide-react";
import * as React from "react";
import { useElapsed } from "../../hooks/use-elapsed";
import { useFocusFallback } from "../../hooks/use-focus-fallback";
import { useHotkey } from "../../hooks/use-hotkey";
import { cn } from "../../lib/cn";
import { formatClock, formatCost, formatTokens } from "../../lib/format";
import { mergeRefs } from "../../lib/merge-refs";
import { AgentSigil } from "../agent-sigil";
import { Button } from "../button";
import { DotRail } from "../dot-rail";
import { IconButton } from "../icon-button";
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
  /** The agent's name, e.g. "Kura". Shown with its sigil. */
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
  /** Budget in USD. Shows spend against it; the figure turns red past 100%. */
  budget?: number;
  /** Git branch the agent works on, shown in mono with a branch icon. */
  branch?: string;
  /** Plan progress, drawn as a rail of dots (red when the run failed). */
  progress?: RunHeaderProgress;
  /** Extra controls placed before Pause / Stop, e.g. an "Open PR" button. */
  actions?: React.ReactNode;
  /** Shows a Stop control while the run is live. */
  onStop?: () => void;
  /** Shows a Pause control while running. */
  onPause?: () => void;
  /** Shows a Resume control while paused. */
  onResume?: () => void;
  /** `bar` = one dense row; `panel` = sigil, title, figures and a full-width progress rail. Default "panel". */
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
  waiting: "Needs you",
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
        status === "waiting" && "text-kura-ember-text",
        status === "failed" && "text-kura-danger-text",
        (status === "done" || status === "paused" || status === "running") && "text-kura-fg-muted",
      )}
    >
      {text}
    </span>
  );
}

/** Plan progress as a rail of dots: ink, or red when the run failed. Ember stays on the glyph. */
function StepsRail({
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
  // The step in hand counts as half a step, so the lead dot sits inside it.
  const value = total === 0 ? 0 : (done + (live && done < total ? 0.5 : 0)) / total;
  return (
    <DotRail
      data-slot="run-header-progress"
      value={value}
      live={live}
      tone={status === "failed" ? "danger" : "ink"}
      className={className}
    />
  );
}

/**
 * The header of one agent run: the agent's sigil, title, branch and model, status, a live elapsed
 * clock, tokens, cost against a budget, plan progress as a rail of dots, and Stop / Pause / Resume
 * controls with keyboard shortcuts. `bar` is one dense row; `panel` adds the sigil and the rail.
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
  ref,
  ...props
}: RunHeaderProps) {
  const id = React.useId();
  // Stop and Pause leave when the run ends: focus stays on the header instead of the page.
  const rootRef = React.useRef<HTMLElement>(null);
  useFocusFallback(rootRef);
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
      className="min-w-0 truncate font-kura-mono text-[12px] text-kura-fg-subtle"
    >
      <span className="sr-only">Branch </span>
      {branch}
    </span>
  );

  if (bar) {
    return (
      <section
        aria-labelledby={`${id}-title`}
        data-slot="run-header"
        data-variant="bar"
        data-status={status}
        tabIndex={-1}
        className={cn(
          "@container flex h-11 min-w-0 items-center gap-3 rounded-kura-xl bg-kura-surface pr-2 pl-4 font-kura-sans text-[13px] text-kura-fg shadow-kura-surface outline-hidden focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-kura-ring",
          className,
        )}
        {...props}
        ref={mergeRefs(rootRef, ref)}
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
          {/* The glyph already says the state; the word joins it once the title has its room. */}
          <span className="hidden text-[12px] @2xl:inline">
            <StatusLabel status={status} />
          </span>
          {branchChip && <span className="hidden min-w-0 @5xl:flex">{branchChip}</span>}
        </div>
        <dl
          data-slot="run-header-stats"
          className="flex shrink-0 items-center gap-4 font-kura-mono text-[12px] text-kura-fg-muted tabular-nums"
        >
          {progress && progress.total > 0 && (
            <div className="hidden items-center gap-2 @lg:flex">
              <dt className="sr-only">Steps</dt>
              <StepsRail progress={progress} status={status} className="w-[84px]" />
              <dd>
                {Math.min(progress.done, progress.total)}
                <span className="text-kura-fg-subtle">/{progress.total}</span>
              </dd>
            </div>
          )}
          {/* Tokens are read out; on screen the bar keeps to progress, spend and time. */}
          {totalTokens != null && (
            <div className={cn(cost != null ? "sr-only" : "hidden @xl:block")}>
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
        {/* A bar keeps a slot for each control it was given, also while that control does not
            apply: stacked runs share columns, and nothing shifts when a run changes state. */}
        {(actions != null || onPause != null || onResume != null || onStop != null) && (
          <>
            {/* In a narrow bar the columns cannot line up anyway: empty slots give the title room. */}
            <div
              data-slot="run-header-controls"
              className={cn("shrink-0 items-center gap-1.5", controls ? "flex" : "hidden @sm:flex")}
            >
              {actions}
              {(onPause != null || onResume != null) &&
                (pauseButton || <span aria-hidden className="hidden size-7 shrink-0 @sm:block" />)}
              {onStop != null &&
                (stopButton || <span aria-hidden className="hidden size-7 shrink-0 @sm:block" />)}
            </div>
          </>
        )}
        {announce}
      </section>
    );
  }

  // The run's numbers, inline and in mono: the clock, then spend against the budget (or tokens
  // when there is no cost). Labels are for assistive technology; the figures speak for themselves.
  const steps =
    progress && progress.total > 0
      ? { done: Math.min(progress.done, progress.total), total: progress.total }
      : null;
  const figures = (
    <dl
      data-slot="run-header-stats"
      className="flex shrink-0 items-baseline gap-4 font-kura-mono text-[12px] text-kura-fg-subtle tabular-nums"
    >
      {steps && (
        <div data-slot="run-header-stat" data-stat="steps" className="sr-only">
          <dt>Steps</dt>
          <dd>
            {steps.done} of {steps.total}
          </dd>
        </div>
      )}
      {tokens && totalTokens != null && (
        <div
          data-slot="run-header-stat"
          data-stat="tokens"
          title={`${formatTokens(tokens.input)} in, ${formatTokens(tokens.output)} out`}
          className={cn(cost != null && "sr-only")}
        >
          <dt className="sr-only">Tokens</dt>
          <dd>
            <span className="text-kura-fg">{formatTokens(totalTokens)}</span>
            <span className="font-kura-sans"> tokens</span>
          </dd>
        </div>
      )}
      {cost != null && (
        <div data-slot="run-header-stat" data-stat="cost">
          <dt className="sr-only">Cost</dt>
          <dd>
            <span className={over ? "text-kura-danger-text" : "text-kura-fg"}>
              {formatCost(cost)}
            </span>
            {budget != null && (
              <>
                <span className="font-kura-sans"> of </span>
                {formatCost(budget)}
              </>
            )}
          </dd>
        </div>
      )}
      <div data-slot="run-header-stat" data-stat="elapsed">
        <dt className="sr-only">Elapsed</dt>
        <dd
          data-slot="run-header-elapsed"
          className="inline-block min-w-[5ch] text-right text-kura-fg"
        >
          {clock}
        </dd>
      </div>
    </dl>
  );

  return (
    <section
      aria-labelledby={`${id}-title`}
      data-slot="run-header"
      data-variant="panel"
      data-status={status}
      tabIndex={-1}
      className={cn(
        "@container flex min-w-0 flex-col gap-3.5 rounded-kura-xl bg-kura-surface px-4 pt-4 pb-3.5 font-kura-sans text-[13px] text-kura-fg leading-5 shadow-kura-surface outline-hidden focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-kura-ring",
        className,
      )}
      {...props}
      ref={mergeRefs(rootRef, ref)}
    >
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <div className="flex min-w-[min(100%,15rem)] flex-1 items-center gap-3">
          {agent != null && <AgentSigil name={agent} />}
          <div className="flex min-w-0 flex-col gap-0.5">
            <h2
              id={`${id}-title`}
              data-slot="run-header-title"
              className="line-clamp-2 font-semibold text-[15px] leading-5 tracking-[-0.015em] @sm:line-clamp-1"
            >
              {title}
            </h2>
            {(agent != null || branch != null || model != null) && (
              <div className="flex min-w-0 items-baseline gap-2.5 text-[12.5px] text-kura-fg-muted leading-4">
                {agent != null && (
                  <span data-slot="run-header-agent" className="shrink-0">
                    {agent}
                  </span>
                )}
                {branchChip}
                {model != null && (
                  <span
                    data-slot="run-header-model"
                    className="hidden truncate font-kura-mono text-[12px] text-kura-fg-subtle @sm:inline"
                  >
                    {model}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        <span className="inline-flex h-7 shrink-0 items-center gap-2 text-[13px]">
          <StatusGlyph status={status} label={null} />
          <StatusLabel status={status} />
        </span>
        {!steps && figures}
        {controls}
      </div>
      {steps && progress && (
        // The measured line: plan progress as a rail of dots, and the figures at its end.
        <div className="flex items-center gap-5">
          <StepsRail progress={progress} status={status} className="min-w-0 flex-1" />
          {figures}
        </div>
      )}
      {announce}
    </section>
  );
}
