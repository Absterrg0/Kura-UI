"use client";

import { ChevronRight } from "lucide-react";
import * as React from "react";
import { useControllableState } from "../../hooks/use-controllable-state";
import { useElapsed } from "../../hooks/use-elapsed";
import { cn } from "../../lib/cn";
import { formatClock, formatCost, formatDuration, formatTokens } from "../../lib/format";
import { AgentSigil } from "../agent-sigil";
import { type AgentStatus, StatusGlyph } from "../status-glyph";

export type TraceSpanKind = "agent" | "llm" | "tool" | "retrieval";

export interface TraceSpan {
  /** Stable, unique across the whole tree. */
  id: string;
  /** What ran: "explorer", "Plan the migration", "bash". */
  name: string;
  kind: TraceSpanKind;
  /** Start, in ms since the run started. */
  start: number;
  /** End, in ms since the run started. Omit while running: the bar grows to "now". */
  end?: number;
  status: AgentStatus;
  /** Short machine hint after the name, in mono: a path, a command, a model. */
  meta?: string;
  /** Model used by an llm span. */
  model?: string;
  tokens?: { input: number; output: number };
  /** USD. */
  cost?: number;
  /** Shown in the details row. Strings render as mono, preserving whitespace. */
  input?: React.ReactNode;
  output?: React.ReactNode;
  /** Shown in the details row in red. */
  error?: React.ReactNode;
  children?: readonly TraceSpan[];
}

export interface TraceWaterfallProps
  extends Omit<React.ComponentProps<"div">, "title" | "children"> {
  /** Root spans (usually one agent span). Times are ms since the run started. */
  spans: readonly TraceSpan[];
  /** Header title. Default "Trace". */
  title?: React.ReactNode;
  /** Controls on the right of the header. */
  actions?: React.ReactNode;
  /** The run's current time in ms since start (a controlled clock). Running spans end here. */
  now?: number;
  /** Wall-clock start of the run. When given (and `now` isn't), running spans grow live. */
  startedAt?: Date | number;
  /** Selected span (controlled). Its details row opens under it. */
  selectedId?: string | null;
  /** Initially selected span when uncontrolled. */
  defaultSelectedId?: string | null;
  onSelectedIdChange?: (id: string | null) => void;
  /** Spans whose children start collapsed. */
  defaultCollapsedIds?: readonly string[];
  /** Replace the details row's body for a span (return null to fall back to the default). */
  renderDetails?: (span: TraceSpan) => React.ReactNode;
  /** Rendered when there are no spans. */
  empty?: React.ReactNode;
  /** Accessible name of the tree. Default "Trace". */
  label?: string;
}

interface Row {
  span: TraceSpan;
  depth: number;
  parentId: string | null;
  posinset: number;
  setsize: number;
}

const KIND_LABEL: Record<TraceSpanKind, string> = {
  agent: "agent",
  llm: "LLM call",
  tool: "tool",
  retrieval: "retrieval",
};

const STATUS_WORD: Record<AgentStatus, string> = {
  queued: "queued",
  running: "running",
  waiting: "waiting for you",
  done: "done",
  failed: "failed",
  skipped: "skipped",
  paused: "paused",
};

const STEPS = [
  50, 100, 200, 250, 500, 1000, 2000, 5000, 10_000, 15_000, 30_000, 60_000, 120_000, 300_000,
  600_000, 900_000, 1_800_000, 3_600_000, 7_200_000,
];

/** A tick step that yields about four to seven ticks across `total`. */
export function niceStep(total: number): number {
  const raw = total / 6;
  return STEPS.find((s) => s >= raw) ?? STEPS[STEPS.length - 1]!;
}

/** Axis label: 0, 250ms, 1.5s, 30s, 2m, 2m 30s, 1h. */
export function formatTick(ms: number): string {
  if (ms === 0) return "0";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${+(ms / 1000).toFixed(1)}s`;
  if (ms < 3_600_000) {
    const m = Math.floor(ms / 60_000);
    const s = Math.round((ms % 60_000) / 1000);
    return s ? `${m}m ${s}s` : `${m}m`;
  }
  const h = Math.floor(ms / 3_600_000);
  const m = Math.round((ms % 3_600_000) / 60_000);
  return m ? `${h}h ${m}m` : `${h}h`;
}

function walk(spans: readonly TraceSpan[], fn: (s: TraceSpan) => void) {
  for (const s of spans) {
    fn(s);
    if (s.children) walk(s.children, fn);
  }
}

function flatten(
  spans: readonly TraceSpan[],
  collapsed: ReadonlySet<string>,
  depth = 0,
  parentId: string | null = null,
  out: Row[] = [],
): Row[] {
  spans.forEach((span, i) => {
    out.push({ span, depth, parentId, posinset: i + 1, setsize: spans.length });
    if (span.children?.length && !collapsed.has(span.id))
      flatten(span.children, collapsed, depth + 1, span.id, out);
  });
  return out;
}

/** Colour of a span's lit dots. Ember only when the span waits on a person. */
function barTone(span: TraceSpan, selected: boolean): string {
  switch (span.status) {
    case "running":
      return "text-kura-fg";
    case "failed":
      return "text-kura-danger-text";
    case "waiting":
      return "text-kura-fg-muted";
    case "queued":
    case "skipped":
      return "text-kura-faint";
    case "paused":
      return "text-kura-fg-subtle";
  }
  if (selected) return "text-kura-fg";
  return span.kind === "agent" ? "text-kura-fg-muted" : "text-kura-fg-subtle";
}

// In a narrow panel (under 24rem) a span is two lines: its name and duration, then its rail at
// the full width of the panel. From 24rem up, name and rail share one row.
const TRACK = "absolute inset-y-0 left-4 right-4 @sm:left-3 @sm:right-5";
const GRID =
  "grid grid-cols-1 @sm:grid-cols-[minmax(150px,50%)_1fr] @lg:grid-cols-[minmax(176px,46%)_1fr] @3xl:grid-cols-[minmax(300px,40%)_1fr]";

function Text({ children, tone }: { children: React.ReactNode; tone?: "danger" }) {
  return (
    <div
      className={cn(
        // Code in a well, straight on the sheet: the one edge recipe, as ToolCall draws it.
        "max-h-44 overflow-auto whitespace-pre-wrap break-words rounded-kura-lg bg-kura-surface-sunken px-3 py-2 font-kura-mono text-[12px] leading-[18px] shadow-kura-sunk",
        tone === "danger" ? "text-kura-danger-text" : "text-kura-fg-muted",
      )}
    >
      {children}
    </div>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-[11.5px] text-kura-fg-subtle">{label}</dt>
      <dd className="truncate font-kura-mono text-[12.5px] text-kura-fg tabular-nums">
        {children}
      </dd>
    </div>
  );
}

function Details({ span, end }: { span: TraceSpan; end: number }) {
  const running = span.status === "running";
  return (
    <div className="flex flex-col gap-3">
      <dl className="flex flex-wrap gap-x-8 gap-y-2">
        <Stat label="Kind">{span.kind}</Stat>
        <Stat label="Start">+{formatDuration(span.start)}</Stat>
        <Stat label="Duration">
          {formatDuration(end - span.start)}
          {running && <span className="text-kura-fg-subtle"> so far</span>}
        </Stat>
        {span.model && <Stat label="Model">{span.model}</Stat>}
        {span.tokens && (
          <Stat label="Tokens">
            {formatTokens(span.tokens.input)}
            <span className="text-kura-fg-subtle"> in · </span>
            {formatTokens(span.tokens.output)}
            <span className="text-kura-fg-subtle"> out</span>
          </Stat>
        )}
        {span.cost != null && <Stat label="Cost">{formatCost(span.cost)}</Stat>}
      </dl>
      {(span.input != null || span.output != null || span.error != null) && (
        <div className="grid gap-3 @xl:grid-cols-2">
          {span.input != null && (
            <div className="flex min-w-0 flex-col gap-1.5">
              <span className="text-[11.5px] text-kura-fg-subtle">Input</span>
              <Text>{span.input}</Text>
            </div>
          )}
          {(span.output != null || span.error != null) && (
            <div className="flex min-w-0 flex-col gap-1.5">
              <span className="text-[11.5px] text-kura-fg-subtle">
                {span.error != null ? "Error" : "Output"}
              </span>
              <Text tone={span.error != null ? "danger" : undefined}>
                {span.error ?? span.output}
              </Text>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * A span tree on a shared time axis, LangSmith/Honeycomb style: the left column is an indented tree
 * (kind icon, name, mono hint, duration), the right column draws each span as a bar against common
 * ticks. Running spans grow live; selecting a span opens a details row (timing, tokens, cost, input
 * and output); subtrees collapse; the tree is fully keyboard navigable.
 */
export function TraceWaterfall({
  spans,
  title = "Trace",
  actions,
  now: nowProp,
  startedAt,
  selectedId: selectedProp,
  defaultSelectedId = null,
  onSelectedIdChange,
  defaultCollapsedIds,
  renderDetails,
  empty,
  label = "Trace",
  className,
  ...props
}: TraceWaterfallProps) {
  const [selectedId, setSelectedId] = useControllableState<string | null>({
    value: selectedProp,
    defaultValue: defaultSelectedId,
    onChange: onSelectedIdChange,
  });
  const [collapsed, setCollapsed] = React.useState<ReadonlySet<string>>(
    () => new Set(defaultCollapsedIds),
  );
  const [focusedId, setFocusedId] = React.useState<string | null>(null);
  const itemRefs = React.useRef(new Map<string, HTMLDivElement>());
  const focusOnUpdate = React.useRef(false);
  const detailsId = React.useId();

  // Aggregate facts over the whole tree.
  let anyRunning = false;
  let count = 0;
  let maxKnown = 0;
  let tokens = 0;
  let cost = 0;
  let hasTokens = false;
  let hasCost = false;
  let failed = 0;
  walk(spans, (s) => {
    count++;
    if (s.status === "running") anyRunning = true;
    if (s.status === "failed") failed++;
    maxKnown = Math.max(maxKnown, s.end ?? s.start, s.start);
    if (s.tokens) {
      hasTokens = true;
      tokens += s.tokens.input + s.tokens.output;
    }
    if (s.cost != null) {
      hasCost = true;
      cost += s.cost;
    }
  });
  // Cost and tokens live on leaves; avoid double counting when parents also report totals.
  const rootTotals = spans.every((s) => s.tokens || s.cost != null);
  if (rootTotals) {
    tokens = spans.reduce((a, s) => a + (s.tokens ? s.tokens.input + s.tokens.output : 0), 0);
    cost = spans.reduce((a, s) => a + (s.cost ?? 0), 0);
  }

  const live = useElapsed(nowProp == null ? startedAt : null, anyRunning, 250);
  const now = nowProp ?? live ?? maxKnown;
  const endOf = (s: TraceSpan) => s.end ?? Math.max(now, s.start);

  let total = 0;
  walk(spans, (s) => {
    total = Math.max(total, endOf(s));
  });
  total = Math.max(total, 1);
  const step = niceStep(total);
  const axis = Math.max(step, Math.ceil((total * 1.04) / step) * step);
  const ticks: number[] = [];
  for (let t = 0; t <= axis + 1e-6; t += step) ticks.push(t);
  const pct = (ms: number) => `${Math.min(100, Math.max(0, (ms / axis) * 100))}%`;

  const rows = flatten(spans, collapsed);
  // A flat list has nothing to expand, so it does not reserve room for a chevron.
  const flat = spans.every((sp) => !sp.children?.length);
  const rowIndex = new Map(rows.map((r, i) => [r.span.id, i] as const));
  const activeFocus =
    focusedId != null && rowIndex.has(focusedId)
      ? focusedId
      : selectedId != null && rowIndex.has(selectedId)
        ? selectedId
        : (rows[0]?.span.id ?? null);

  React.useEffect(() => {
    if (!focusOnUpdate.current || activeFocus == null) return;
    focusOnUpdate.current = false;
    itemRefs.current.get(activeFocus)?.focus();
  });

  const moveFocus = (id: string | undefined) => {
    if (id == null) return;
    focusOnUpdate.current = true;
    setFocusedId(id);
  };
  const toggle = (id: string, open?: boolean) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      const isOpen = !prev.has(id);
      if ((open ?? !isOpen) === true) next.delete(id);
      else next.add(id);
      return next;
    });
  const select = (id: string) => setSelectedId((cur) => (cur === id ? null : id));

  const onItemKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, row: Row) => {
    if (e.target !== e.currentTarget) return;
    const i = rowIndex.get(row.span.id) ?? 0;
    const hasKids = !!row.span.children?.length;
    const open = hasKids && !collapsed.has(row.span.id);
    let handled = true;
    switch (e.key) {
      case "ArrowDown":
        moveFocus(rows[i + 1]?.span.id);
        break;
      case "ArrowUp":
        moveFocus(rows[i - 1]?.span.id);
        break;
      case "Home":
        moveFocus(rows[0]?.span.id);
        break;
      case "End":
        moveFocus(rows[rows.length - 1]?.span.id);
        break;
      case "ArrowRight":
        if (hasKids && !open) toggle(row.span.id, true);
        else if (open) moveFocus(rows[i + 1]?.span.id);
        break;
      case "ArrowLeft":
        if (open) toggle(row.span.id, false);
        else if (row.parentId) moveFocus(row.parentId);
        break;
      case "Enter":
      case " ":
        select(row.span.id);
        break;
      case "Escape":
        if (selectedId != null) setSelectedId(null);
        else handled = false;
        break;
      default:
        handled = false;
    }
    if (handled) e.preventDefault();
  };

  const runningNow = anyRunning ? now : null;
  const announcement = failed
    ? `${failed} span${failed > 1 ? "s" : ""} failed`
    : count > 0 && !anyRunning
      ? `Trace complete, ${formatDuration(total)}`
      : "";

  return (
    <div
      data-slot="trace-waterfall"
      data-state={anyRunning ? "running" : "idle"}
      className={cn(
        "@container flex min-w-0 flex-col overflow-hidden rounded-kura-xl bg-kura-surface font-kura-sans text-kura-fg shadow-kura-sm",
        className,
      )}
      {...props}
    >
      <div
        data-slot="trace-waterfall-header"
        className="flex h-11 shrink-0 items-center gap-3 px-4"
      >
        <span className="font-semibold text-[13px] tracking-[-0.01em]">{title}</span>
        <span className="flex-1" />
        {count > 0 && (
          <span
            data-slot="trace-waterfall-summary"
            className="flex items-center gap-1.5 whitespace-nowrap font-kura-mono text-[12px] text-kura-fg-subtle tabular-nums"
          >
            <span className="hidden @md:inline">{count} spans</span>
            <span aria-hidden className="hidden @md:inline">
              ·
            </span>
            <span className={cn("min-w-[6ch] text-right", anyRunning && "text-kura-fg-muted")}>
              {anyRunning ? formatClock(total) : formatDuration(total)}
            </span>
            {hasTokens && (
              <>
                <span aria-hidden className="hidden @lg:inline">
                  ·
                </span>
                <span className="hidden @lg:inline">{formatTokens(tokens)} tok</span>
              </>
            )}
            {hasCost && (
              <>
                <span aria-hidden className="hidden @lg:inline">
                  ·
                </span>
                <span className="hidden @lg:inline">{formatCost(cost)}</span>
              </>
            )}
          </span>
        )}
        {actions}
      </div>

      {count === 0 ? (
        <div
          data-slot="trace-waterfall-empty"
          className="flex flex-col items-center gap-1 px-6 py-10 text-center"
        >
          {empty ?? (
            <>
              <span className="font-medium text-[13px]">No spans yet</span>
              <span className="text-[12px] text-kura-fg-subtle">
                Spans appear here as the agent calls models and tools.
              </span>
            </>
          )}
        </div>
      ) : (
        <div data-slot="trace-waterfall-body" className="relative min-h-0 flex-1 overflow-auto">
          {/* Axis */}
          <div
            data-slot="trace-waterfall-axis"
            aria-hidden
            className={cn(
              GRID,
              "sticky top-0 z-20 h-7 bg-kura-surface text-[11.5px] text-kura-fg-subtle",
            )}
          >
            <div className="hidden items-center justify-between px-4 @sm:flex">
              <span>Span</span>
              <span className="hidden @md:inline">Duration</span>
            </div>
            <div className="relative">
              <div className={TRACK}>
                {ticks.map((t, i) => {
                  // More than five ticks: label every other one, so labels never collide.
                  if (ticks.length > 5 && i % 2 === 1) return null;
                  const lastLabel =
                    ticks.length > 5 ? i >= ticks.length - 2 : i === ticks.length - 1;
                  return (
                    <span
                      key={t}
                      className={cn(
                        "absolute top-1/2 -translate-y-1/2 whitespace-nowrap font-kura-mono tabular-nums",
                        i === 0 ? "" : "-translate-x-1/2",
                        // A short track (name and rail side by side, under 32rem) keeps only the
                        // first and last labels; the stacked narrow layout has room for all.
                        i > 0 && !lastLabel && "@sm:@max-lg:hidden",
                        // Keep the outermost label inside the track.
                        i === ticks.length - 1 && "-translate-x-full",
                      )}
                      style={{ left: pct(t) }}
                    >
                      {formatTick(t)}
                    </span>
                  );
                })}
                {anyRunning && (
                  <span
                    className="absolute bottom-0 h-2 w-px bg-kura-fg-subtle transition-[left] duration-(--kura-duration-base) ease-linear motion-reduce:transition-none"
                    style={{ left: pct(now) }}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="relative">
            {/* Grid lines and the "now" marker, under the rows. */}
            <div
              aria-hidden
              className={cn(GRID, "pointer-events-none absolute inset-0 z-0 hidden @sm:grid")}
            >
              <div />
              <div className="relative">
                <div className={TRACK}>
                  {runningNow != null && (
                    <span
                      data-slot="trace-waterfall-now"
                      className="absolute top-0 bottom-2.5 w-px bg-kura-border-strong transition-[left] duration-(--kura-duration-base) ease-linear motion-reduce:transition-none"
                      style={{ left: pct(runningNow) }}
                    />
                  )}
                </div>
              </div>
            </div>

            <div role="tree" aria-label={label} className="relative z-10 pb-1.5">
              {rows.map((row) => {
                const { span, depth } = row;
                const end = endOf(span);
                const hasKids = !!span.children?.length;
                const open = hasKids && !collapsed.has(span.id);
                const selected = selectedId === span.id;
                const dur = end - span.start;
                // Done is the quiet default; every other state says so with its glyph.
                const showGlyph = span.status !== "done" && span.status !== "queued";
                // Still counting: a clock, like every other live timer. Finished: a duration.
                const ticking =
                  span.end == null && (span.status === "running" || span.status === "waiting");
                const details = selected
                  ? (renderDetails?.(span) ?? <Details span={span} end={end} />)
                  : null;
                return (
                  <div
                    key={span.id}
                    ref={(el) => {
                      if (el) itemRefs.current.set(span.id, el);
                      else itemRefs.current.delete(span.id);
                    }}
                    role="treeitem"
                    aria-level={depth + 1}
                    aria-posinset={row.posinset}
                    aria-setsize={row.setsize}
                    aria-expanded={hasKids ? open : undefined}
                    aria-selected={selected}
                    // The row is named by what it shows (name, hint, duration), plus its kind and
                    // state as words. No aria-label: what is on screen changes with the width.
                    tabIndex={activeFocus === span.id ? 0 : -1}
                    data-slot="trace-waterfall-span"
                    data-kind={span.kind}
                    data-status={span.status}
                    data-selected={selected || undefined}
                    onKeyDown={(e) => onItemKeyDown(e, row)}
                    onFocus={(e) => {
                      if (e.target === e.currentTarget) setFocusedId(span.id);
                    }}
                    className="group/item outline-hidden transition-opacity duration-(--kura-duration-base) ease-kura-out starting:opacity-0"
                  >
                    {/* biome-ignore lint/a11y/noStaticElementInteractions: pointer shortcut; the treeitem owns keyboard interaction. */}
                    {/* biome-ignore lint/a11y/useKeyWithClickEvents: Enter/Space are handled on the treeitem. */}
                    <div
                      data-slot="trace-waterfall-row"
                      onClick={() => {
                        select(span.id);
                        setFocusedId(span.id);
                      }}
                      className={cn(
                        GRID,
                        "relative cursor-default pt-1 pb-1.5 transition-colors duration-(--kura-duration-fast) ease-kura-snap @sm:h-8 @sm:py-0",
                        "group-focus-visible/item:shadow-[inset_0_0_0_2px_var(--kura-ring)]",
                        selected ? "bg-kura-active" : "hover:bg-kura-hover",
                      )}
                    >
                      <div
                        className="flex h-6 min-w-0 items-center gap-1.5 pr-4 @sm:h-auto @sm:pr-3.5"
                        style={{ paddingLeft: `${(flat ? 16 : 10) + depth * 16}px` }}
                      >
                        {hasKids ? (
                          // biome-ignore lint/a11y/noStaticElementInteractions: mouse affordance; ArrowLeft/Right on the treeitem do the same.
                          // biome-ignore lint/a11y/useKeyWithClickEvents: ArrowLeft/Right on the treeitem do the same.
                          <span
                            data-slot="trace-waterfall-toggle"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggle(span.id);
                              setFocusedId(span.id);
                            }}
                            className="-my-1 grid size-5 shrink-0 place-items-center rounded-kura-xs text-kura-fg-subtle hover:bg-kura-hover hover:text-kura-fg"
                          >
                            <ChevronRight
                              aria-hidden
                              strokeWidth={2}
                              className={cn(
                                "size-3.5 transition-transform duration-(--kura-duration-fast) ease-kura-out motion-reduce:transition-none",
                                open && "rotate-90",
                              )}
                            />
                          </span>
                        ) : flat ? null : (
                          <span className="size-5 shrink-0" />
                        )}
                        {span.kind === "agent" ? (
                          <AgentSigil name={span.name} size="sm" bare className="size-3.5" />
                        ) : (
                          // Anything that is not an agent is marked by one dot; the kind is in the
                          // type (tools are mono) and in the spoken name.
                          <span aria-hidden className="grid size-3.5 shrink-0 place-items-center">
                            <span className="size-1 rounded-full bg-kura-faint" />
                          </span>
                        )}
                        <span
                          className={cn(
                            "min-w-0 shrink truncate text-[13px]",
                            span.kind === "agent" ? "font-medium" : "",
                            span.kind === "tool" && "font-kura-mono text-[12.5px]",
                            span.status === "queued" && "text-kura-fg-subtle",
                          )}
                        >
                          {span.name}
                        </span>
                        {/* Real spaces between the parts, so the row's text reads as its name does. */}
                        {span.meta && (
                          <>
                            {" "}
                            <span className="hidden min-w-0 flex-1 truncate font-kura-mono text-[12px] text-kura-fg-subtle @md:inline">
                              {span.meta}
                            </span>
                          </>
                        )}
                        <span className={cn("flex-1", span.meta && "@md:hidden")} />
                        {showGlyph && <StatusGlyph status={span.status} size="sm" label={null} />}{" "}
                        <span
                          data-slot="trace-waterfall-duration"
                          className={cn(
                            "min-w-[5ch] shrink-0 text-right font-kura-mono text-[12px] tabular-nums",
                            span.status === "running"
                              ? "text-kura-fg-muted"
                              : "text-kura-fg-subtle",
                          )}
                        >
                          {span.status === "queued"
                            ? "—"
                            : ticking
                              ? formatClock(dur)
                              : formatDuration(dur)}
                        </span>
                        <span className="sr-only">
                          , {KIND_LABEL[span.kind]}, {STATUS_WORD[span.status]}
                        </span>
                      </div>
                      <div className="relative h-3.5 @sm:h-auto">
                        <div className={TRACK}>
                          {/* The time axis for this row: faint dots, lit where the span ran. */}
                          <span className="kura-dots absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2" />
                          <span
                            data-slot="trace-waterfall-bar"
                            className={cn(
                              "kura-dots absolute top-1/2 h-1.5 -translate-y-1/2 transition-[left,width,color] duration-(--kura-duration-base) ease-kura-snap motion-reduce:transition-none",
                              barTone(span, selected),
                            )}
                            style={
                              {
                                "--kura-dots-color": "currentColor",
                                left: `round(down, ${pct(span.start)}, 6px)`,
                                width: `max(6px, round(up, calc(${pct(end)} - ${pct(span.start)}), 6px))`,
                              } as React.CSSProperties
                            }
                          />
                          {span.status === "running" && (
                            <span
                              aria-hidden
                              className="absolute top-1/2 size-1.5 -translate-y-1/2 animate-kura-dot-pulse text-kura-fg motion-reduce:animate-none"
                              style={{
                                left: `round(down, ${pct(end)}, 6px)`,
                                backgroundImage:
                                  "radial-gradient(circle at center, currentColor 1.6px, transparent 2px)",
                              }}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                    {details != null && (
                      <div
                        id={detailsId}
                        data-slot="trace-waterfall-details"
                        className="relative px-4 pt-2 pb-3.5 animate-kura-fade-in"
                      >
                        {details}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      <span role="status" className="sr-only">
        {announcement}
      </span>
    </div>
  );
}
