"use client";

import { createParts } from "@ui-sdk/react/primitive";
import { ChevronRight } from "lucide-react";
import * as React from "react";
import { useControllableState } from "../../hooks/use-controllable-state";
import { useElapsed } from "../../hooks/use-elapsed";
import { agentSurface } from "../../lib/agent-surface";
import { cn } from "../../lib/cn";
import { formatClock, formatDuration } from "../../lib/format";
import { DotRail } from "../dot-rail";
import { type AgentStatus, StatusGlyph } from "../status-glyph";

export interface TaskListItem {
  /** Stable key. Keep it stable across updates so rows don't remount. */
  id: string;
  /** Imperative, one line: "Patch src/auth/client.ts". */
  title: React.ReactNode;
  status: AgentStatus;
  /** Secondary line. Always shown for failed and waiting items; for the others when given. */
  detail?: React.ReactNode;
  /** Final duration (ms) of a finished item, shown on the right in mono. */
  durationMs?: number;
  /** When a running item started (wall clock). Drives the live timer on the right. */
  startedAt?: Date | number;
  /** Sub-tasks, rendered indented under the item. One level is the sweet spot. */
  children?: readonly TaskListItem[];
}

export interface TaskListProps extends Omit<React.ComponentProps<"div">, "title" | "onSelect"> {
  /** The plan, in order. */
  items: readonly TaskListItem[];
  /** Heading in the panel header. Default "Plan". */
  title?: React.ReactNode;
  /** Extra controls on the right of the header (e.g. an IconButton). */
  actions?: React.ReactNode;
  /** `panel` = card with header and segmented progress (default); `plain` = rows only, for sidebars. */
  variant?: "panel" | "plain";
  /** Fold the leading run of finished items into a "Completed (n)" row while work remains. Default true. */
  collapseCompleted?: boolean;
  /** Whether the "Completed" group is expanded (controlled). */
  completedOpen?: boolean;
  /** Initial state of the "Completed" group when uncontrolled. Default false. */
  defaultCompletedOpen?: boolean;
  onCompletedOpenChange?: (open: boolean) => void;
  /** Highlighted item (e.g. the one whose output is shown next to the list). */
  selectedId?: string | null;
  /** Makes rows interactive (buttons with arrow-key navigation) and reports the clicked item. */
  onSelect?: (id: string, item: TaskListItem) => void;
  /** Rendered when `items` is empty. Default: a quiet "No plan yet" state. */
  empty?: React.ReactNode;
  /** Accessible name of the list. Default: "Plan". */
  label?: string;
}

const FINISHED = new Set<AgentStatus>(["done", "skipped"]);

const SPOKEN: Record<AgentStatus, string> = {
  queued: "pending",
  running: "in progress",
  waiting: "waiting for you",
  done: "done",
  failed: "failed",
  skipped: "skipped",
  paused: "paused",
};

const rowEnter =
  "transition-[opacity,translate,background-color] duration-(--kura-duration-base) ease-kura-out starting:translate-y-[2px] starting:opacity-0 motion-reduce:transition-[opacity,background-color] motion-reduce:starting:translate-y-0";

function textColor(status: AgentStatus): string {
  switch (status) {
    case "done":
    case "paused":
      return "text-kura-fg-muted";
    case "queued":
    case "skipped":
      return "text-kura-fg-subtle";
    default:
      return "text-kura-fg";
  }
}

function Timer({ item }: { item: TaskListItem }) {
  const running = item.status === "running";
  const live = useElapsed(item.startedAt, running, 1000);
  let text: string | null = null;
  if (running && live != null) text = formatClock(live);
  else if (item.durationMs != null) text = formatDuration(item.durationMs);
  return (
    <span
      data-slot="task-list-duration"
      className={cn(
        "min-w-[4.5ch] shrink-0 text-right font-kura-mono text-[12px] leading-5 tabular-nums",
        running ? "text-kura-fg-muted" : "text-kura-fg-subtle",
      )}
    >
      {text}
    </span>
  );
}

interface RowProps {
  item: TaskListItem;
  depth: number;
  selectedId: string | null | undefined;
  onSelect: TaskListProps["onSelect"];
}

function Row({ item, depth, selectedId, onSelect }: RowProps) {
  const { status } = item;
  const interactive = onSelect != null;
  const selected = selectedId === item.id;
  const childDone = item.children?.filter((c) => FINISHED.has(c.status)).length ?? 0;
  const showDetail =
    item.detail != null &&
    (status === "failed" || status === "waiting" || status === "running" || depth === 0);
  const titleNode = <span>{item.title}</span>;

  const inner = (
    <>
      <span className="flex h-5 w-4 shrink-0 items-center justify-center">
        <StatusGlyph status={status} label={null} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex min-h-5 items-baseline gap-2">
          <span
            data-slot="task-list-title"
            className={cn(
              // A step's title is what the row is about: it wraps to a second line before it is cut.
              "line-clamp-2 min-w-0 text-[13px] leading-5 transition-colors duration-(--kura-duration-base)",
              textColor(status),
              status === "skipped" && "line-through decoration-kura-border-strong",
            )}
          >
            {titleNode}
            <span className="sr-only"> ({SPOKEN[status]})</span>
          </span>
          {item.children && item.children.length > 0 && (
            <span className="shrink-0 font-kura-mono text-[12px] text-kura-fg-subtle tabular-nums">
              {childDone}/{item.children.length}
            </span>
          )}
        </span>
        {showDetail && (
          <span
            data-slot="task-list-detail"
            className={cn(
              "text-[12.5px] leading-[18px]",
              status === "failed"
                ? "text-kura-danger-text"
                : status === "waiting"
                  ? "text-kura-ember-text"
                  : "text-kura-fg-subtle",
            )}
          >
            {item.detail}
          </span>
        )}
      </span>
      <Timer item={item} />
    </>
  );

  const rowClass = cn(
    // 36px rows; a sub-task is 32px and starts where its parent's title starts.
    "relative flex w-full items-start gap-2.5 rounded-[9px] pr-2.5 text-left transition-colors duration-(--kura-duration-fast) ease-kura-snap",
    depth === 0 ? "py-2 pl-2.5" : "py-1.5 pl-9",
    selected && "bg-kura-active",
  );

  return (
    <li
      data-slot="task-list-item"
      data-status={status}
      data-selected={selected || undefined}
      aria-current={status === "running" ? "step" : undefined}
      className={cn(
        rowEnter,
        // The tree guide: a dotted line under the parent's glyph that stops level with the last
        // sub-task's glyph.
        depth > 0 &&
          "relative before:kura-leader before:absolute before:top-0 before:bottom-0 before:left-[15.5px] before:w-[5px] last:before:bottom-auto last:before:h-4",
      )}
    >
      {interactive ? (
        <button
          type="button"
          data-slot="task-list-row"
          data-task-row=""
          aria-pressed={selected}
          onClick={() => onSelect(item.id, item)}
          className={cn(
            rowClass,
            "cursor-default outline-hidden hover:bg-kura-hover focus-visible:shadow-[inset_0_0_0_2px_var(--kura-ring)]",
            selected && "hover:bg-kura-active",
          )}
        >
          {inner}
        </button>
      ) : (
        <div data-slot="task-list-row" className={cn(rowClass, "hover:bg-kura-hover")}>
          {inner}
        </div>
      )}
      {item.children && item.children.length > 0 && (
        <ul data-slot="task-list-children" className="pb-1">
          {item.children.map((child) => (
            <Row
              key={child.id}
              item={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function sumDurations(items: readonly TaskListItem[]): number {
  return items.reduce((acc, i) => acc + (i.durationMs ?? 0), 0);
}

const { Root: TaskListRoot } = createParts(agentSurface("task-list", []), {
  root: "div",
});

/**
 * The agent's plan as a todo list (Claude Code TodoWrite style): a header with "3 of 7" and a
 * dot rail, one row per task with a status glyph, a shimmering title for the running
 * task, live and final durations in mono, details for failures, nested sub-tasks, and the finished
 * head of the plan folded into a "Completed (n)" row.
 */
export function TaskList({
  items,
  title = "Plan",
  actions,
  variant = "panel",
  collapseCompleted = true,
  completedOpen: completedOpenProp,
  defaultCompletedOpen = false,
  onCompletedOpenChange,
  selectedId,
  onSelect,
  empty,
  label,
  className,
  onKeyDown,
  ...props
}: TaskListProps) {
  const [completedOpen, setCompletedOpen] = useControllableState({
    value: completedOpenProp,
    defaultValue: defaultCompletedOpen,
    onChange: onCompletedOpenChange,
  });
  const groupId = React.useId();

  const total = items.length;
  const doneCount = items.filter((i) => FINISHED.has(i.status)).length;
  const runningIndex = items.findIndex((i) => i.status === "running");
  const failedItem = items.find((i) => i.status === "failed");
  const waitingItem = items.find((i) => i.status === "waiting");
  const allFinished = total > 0 && doneCount === total;

  // The leading run of finished items folds away while there is still work ahead.
  let lead = 0;
  while (lead < items.length && FINISHED.has(items[lead]!.status)) lead++;
  const fold = collapseCompleted && !allFinished && lead >= 3;
  const head = fold ? items.slice(0, lead) : [];
  const rest = fold ? items.slice(lead) : items;

  const runningTitle = runningIndex >= 0 ? items[runningIndex]!.title : null;
  const announcement = failedItem
    ? `Task failed: ${typeof failedItem.title === "string" ? failedItem.title : ""}`
    : waitingItem
      ? "Waiting for you"
      : allFinished
        ? "All tasks complete"
        : runningIndex >= 0
          ? `Task ${runningIndex + 1} of ${total}${typeof runningTitle === "string" ? `: ${runningTitle}` : ""}`
          : "";

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented || !onSelect) return;
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
    const rows = Array.from(
      e.currentTarget.querySelectorAll<HTMLElement>("[data-task-row], [data-task-group]"),
    );
    const index = rows.indexOf(document.activeElement as HTMLElement);
    if (index < 0) return;
    e.preventDefault();
    const next =
      e.key === "Home"
        ? 0
        : e.key === "End"
          ? rows.length - 1
          : Math.min(rows.length - 1, Math.max(0, index + (e.key === "ArrowDown" ? 1 : -1)));
    rows[next]?.focus();
  };

  const listLabel = label ?? (typeof title === "string" ? title : "Plan");

  const body =
    total === 0 ? (
      <div
        data-slot="task-list-empty"
        className="flex flex-col items-center gap-1 px-6 pt-4 pb-8 text-center text-[13px] text-kura-fg-subtle"
      >
        {empty ?? "No plan yet"}
      </div>
    ) : (
      <ul
        aria-label={listLabel}
        data-slot="task-list-list"
        className={cn("flex flex-col", variant === "panel" ? "px-1.5 pb-1.5" : "")}
      >
        {fold && (
          <li data-slot="task-list-completed" data-state={completedOpen ? "open" : "closed"}>
            <button
              type="button"
              data-task-group=""
              aria-expanded={completedOpen}
              aria-controls={groupId}
              onClick={() => setCompletedOpen((o) => !o)}
              className="flex h-9 w-full cursor-default items-center gap-2.5 rounded-[9px] px-2.5 text-left text-[13px] text-kura-fg-muted outline-hidden transition-colors duration-(--kura-duration-fast) ease-kura-snap hover:bg-kura-hover hover:text-kura-fg focus-visible:shadow-[inset_0_0_0_2px_var(--kura-ring)]"
            >
              <span className="grid w-4 shrink-0 place-items-center text-kura-fg-subtle">
                <ChevronRight
                  aria-hidden
                  strokeWidth={2}
                  className={cn(
                    "size-3.5 transition-transform duration-(--kura-duration-fast) ease-kura-out motion-reduce:transition-none",
                    completedOpen && "rotate-90",
                  )}
                />
              </span>
              <span className="flex flex-1 items-baseline gap-2">
                Completed
                <span className="font-kura-mono text-[12px] text-kura-fg-subtle tabular-nums">
                  {head.length}
                </span>
              </span>
              <span className="font-kura-mono text-[12px] text-kura-fg-subtle tabular-nums">
                {formatDuration(sumDurations(head))}
              </span>
            </button>
            <ul id={groupId} hidden={!completedOpen} aria-label="Completed tasks" className="pb-1">
              {head.map((item) => (
                <Row
                  key={item.id}
                  item={item}
                  depth={0}
                  selectedId={selectedId}
                  onSelect={onSelect}
                />
              ))}
            </ul>
          </li>
        )}
        {rest.map((item) => (
          <Row key={item.id} item={item} depth={0} selectedId={selectedId} onSelect={onSelect} />
        ))}
      </ul>
    );

  return (
    <TaskListRoot
      value={`${doneCount} of ${total} done`}
      items={items.map((it) => ({ value: it.id, label: `${it.title}: ${it.status}` }))}
      aria-label={listLabel}
      data-variant={variant}
      data-progress={`${doneCount}/${total}`}
      className={cn(
        "flex min-w-0 flex-col font-kura-sans text-kura-fg",
        variant === "panel" &&
          "overflow-hidden rounded-kura-xl bg-kura-surface shadow-kura-surface",
        className,
      )}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {variant === "panel" && (
        <div data-slot="task-list-header" className="flex h-11 shrink-0 items-center gap-3 px-4">
          <span className="truncate font-semibold text-[13px] tracking-[-0.01em]">{title}</span>
          {total > 0 && (
            <span className="font-kura-mono text-[12px] text-kura-fg-subtle tabular-nums">
              {doneCount} of {total}
            </span>
          )}
          <span className="flex-1" />
          {total > 0 && (
            <DotRail
              data-slot="task-list-progress"
              value={(doneCount + (runningIndex >= 0 || waitingItem ? 0.5 : 0)) / total}
              live={runningIndex >= 0 || waitingItem != null}
              tone={failedItem ? "danger" : "ink"}
              className="w-[clamp(60px,24%,108px)] shrink-0"
            />
          )}
          {actions}
        </div>
      )}
      {body}
      <span role="status" className="sr-only">
        {announcement}
      </span>
    </TaskListRoot>
  );
}
