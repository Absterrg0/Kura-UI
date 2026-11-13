"use client";

import { createParts } from "@ui-sdk/react/primitive";
import * as React from "react";
import { useControllableState } from "../../hooks/use-controllable-state";
import { useElapsed } from "../../hooks/use-elapsed";
import { agentSurface } from "../../lib/agent-surface";
import { cn } from "../../lib/cn";
import { formatClock, formatCost, formatDuration, formatTokens } from "../../lib/format";
import { AgentSigil } from "../agent-sigil";
import { DotRail } from "../dot-rail";
import { type AgentStatus, StatusGlyph } from "../status-glyph";

export interface FleetAgent {
  /** Stable id, used for selection and React keys. */
  id: string;
  /** Short name, e.g. "explorer". */
  name: string;
  /** What this agent is for, e.g. "Maps call sites". */
  role?: string;
  status: AgentStatus;
  /** What it is doing right now (running) or its last result (done / failed). One line. */
  activity?: string;
  /** 0–1. Shown as a thin bar while the agent is live. */
  progress?: number;
  startedAt?: Date | number;
  /** Freezes the elapsed time at endedAt − startedAt. */
  endedAt?: Date | number;
  /** Total tokens used. */
  tokens?: number;
  /** Spend in USD. */
  cost?: number;
}

export interface AgentFleetProps
  extends Omit<React.ComponentProps<"div">, "onSelect" | "title" | "children"> {
  /** The subagents, in display order. */
  agents: FleetAgent[];
  /** Panel title. Default "Subagents". */
  title?: React.ReactNode;
  /** Selected agent id (controlled). */
  selectedId?: string | null;
  /** Initially selected agent id when uncontrolled. */
  defaultSelectedId?: string | null;
  /** Called with the agent id when a row is chosen (click, Enter or Space). Makes rows selectable. */
  onSelect?: (id: string) => void;
  /** `compact` = one 36px row per agent; `comfortable` = two lines with role and activity. Default "comfortable". */
  density?: "compact" | "comfortable";
  /** Shown when `agents` is empty. */
  empty?: React.ReactNode;
}

const LIVE: AgentStatus[] = ["running", "waiting", "paused"];

const SUMMARY_ORDER: { status: AgentStatus; word: string; tone?: string }[] = [
  { status: "running", word: "running" },
  { status: "waiting", word: "waiting" },
  { status: "paused", word: "paused" },
  { status: "failed", word: "failed", tone: "text-kura-danger-text" },
  { status: "done", word: "done" },
  { status: "queued", word: "queued" },
  { status: "skipped", word: "skipped" },
];

const SPOKEN: Record<AgentStatus, string> = {
  queued: "queued",
  running: "running",
  waiting: "waiting for you",
  paused: "paused",
  done: "done",
  failed: "failed",
  skipped: "skipped",
};

function useAnnouncements(agents: FleetAgent[]) {
  const prev = React.useRef<Map<string, AgentStatus> | null>(null);
  const [message, setMessage] = React.useState("");
  React.useEffect(() => {
    const next = new Map(agents.map((a) => [a.id, a.status]));
    const before = prev.current;
    prev.current = next;
    if (!before) return;
    const changes = agents
      .filter((a) => before.has(a.id) && before.get(a.id) !== a.status && a.status !== "running")
      .map((a) => `${a.name} ${SPOKEN[a.status]}`);
    if (changes.length) {
      // A status region only speaks when its text changes: an agent that waits, runs and waits
      // again would be silent the second time, so a repeat differs by one invisible space.
      const next = changes.join(", ");
      setMessage((last) => (last === next ? `${next}\u00a0` : next));
    }
  }, [agents]);
  return message;
}

const { Root: AgentFleetRoot } = createParts(agentSurface("agent-fleet", ["select"]), {
  root: "div",
});

/**
 * Parallel subagents at a glance: one row per agent with its status glyph, name and role, what it
 * is doing now, a rail of dots for progress, elapsed time, tokens and cost.
 * The header sums the fleet ("3 running · 1 waiting · 2 done"). Rows are a selectable listbox
 * when `onSelect` is given.
 */
export function AgentFleet({
  agents,
  title = "Subagents",
  selectedId: selectedProp,
  defaultSelectedId = null,
  onSelect,
  density = "comfortable",
  empty,
  className,
  ...props
}: AgentFleetProps) {
  const id = React.useId();
  const [selected, setSelected] = useControllableState<string | null>({
    value: selectedProp,
    defaultValue: defaultSelectedId,
    onChange: (v) => v != null && onSelect?.(v),
  });
  const selectable = onSelect != null || selectedProp !== undefined;
  const [focusId, setFocusId] = React.useState<string | null>(null);
  const rowRefs = React.useRef(new Map<string, HTMLLIElement>());
  const message = useAnnouncements(agents);

  const counts = new Map<AgentStatus, number>();
  for (const a of agents) counts.set(a.status, (counts.get(a.status) ?? 0) + 1);
  const summary = SUMMARY_ORDER.filter((s) => counts.get(s.status));

  const tabStop =
    agents.find((a) => a.id === focusId)?.id ??
    agents.find((a) => a.id === selected)?.id ??
    agents[0]?.id;

  const moveFocus = (to: number) => {
    const a = agents[Math.max(0, Math.min(agents.length - 1, to))];
    if (!a) return;
    setFocusId(a.id);
    rowRefs.current.get(a.id)?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLUListElement>) => {
    const index = agents.findIndex((a) => a.id === (e.target as HTMLElement).dataset.agentId);
    if (index < 0) return;
    if (e.key === "ArrowDown" || e.key === "j") moveFocus(index + 1);
    else if (e.key === "ArrowUp" || e.key === "k") moveFocus(index - 1);
    else if (e.key === "Home") moveFocus(0);
    else if (e.key === "End") moveFocus(agents.length - 1);
    else if (e.key === "Enter" || e.key === " ") setSelected(agents[index]?.id ?? null);
    else return;
    e.preventDefault();
  };

  return (
    <AgentFleetRoot
      value={summary.map((s) => `${counts.get(s.status)} ${s.status}`).join(", ")}
      items={agents.map((a) => ({
        value: a.id,
        label: `${a.name}: ${a.status}${a.activity ? `, ${a.activity}` : ""}`,
      }))}
      onAction={(_, [ref]) => {
        const a = agents.find((x) => x.id === ref || x.name === ref);
        if (!a) throw new Error(`No subagent "${String(ref)}".`);
        if (!selectable) throw new Error("This fleet doesn't select subagents.");
        setSelected(a.id);
      }}
      aria-labelledby={`${id}-title`}
      data-density={density}
      className={cn(
        "@container flex min-w-0 flex-col overflow-hidden rounded-kura-xl bg-kura-surface font-kura-sans text-kura-fg shadow-kura-sm",
        className,
      )}
      {...props}
    >
      <div data-slot="agent-fleet-header" className="flex h-11 shrink-0 items-center gap-3 px-4">
        <h3 className="flex items-baseline gap-2 font-semibold text-[13px] tracking-[-0.01em]">
          <span id={`${id}-title`}>{title}</span>
          <span className="font-kura-mono font-normal text-[12px] text-kura-fg-subtle tabular-nums">
            {agents.length}
          </span>
        </h3>
        {summary.length > 0 && (
          // One line of whole counts: a count that does not fit wraps out of sight, never mid-word.
          <p
            data-slot="agent-fleet-summary"
            className="ml-auto hidden h-[18px] min-w-0 flex-wrap justify-end overflow-hidden text-[12px] text-kura-fg-subtle leading-[18px] @xs:flex"
          >
            {summary.map((s, i) => (
              <span key={s.status} className="whitespace-nowrap">
                {i > 0 && (
                  <span aria-hidden className="whitespace-pre">
                    {" · "}
                  </span>
                )}
                <span className={s.tone}>
                  <span className="font-kura-mono tabular-nums">{counts.get(s.status)}</span>{" "}
                  {s.word}
                </span>
              </span>
            ))}
          </p>
        )}
      </div>

      {agents.length === 0 ? (
        <div
          data-slot="agent-fleet-empty"
          className="flex min-h-24 flex-col items-center justify-center gap-1 px-6 py-6 text-center"
        >
          {empty ?? (
            <>
              <p className="font-medium text-[13px] text-kura-fg-muted">No subagents yet</p>
              <p className="text-[12px] text-kura-fg-subtle">
                Delegated work shows up here as it starts.
              </p>
            </>
          )}
        </div>
      ) : (
        <ul
          role={selectable ? "listbox" : "list"}
          aria-labelledby={`${id}-title`}
          onKeyDown={selectable ? onKeyDown : undefined}
          className="flex flex-col px-1.5 pb-1.5"
        >
          {agents.map((agent) => (
            <AgentRow
              key={agent.id}
              agent={agent}
              density={density}
              selectable={selectable}
              selected={selected === agent.id}
              tabbable={tabStop === agent.id}
              rowRef={(el) => {
                if (el) rowRefs.current.set(agent.id, el);
                else rowRefs.current.delete(agent.id);
              }}
              onFocus={() => setFocusId(agent.id)}
              onChoose={() => setSelected(agent.id)}
            />
          ))}
        </ul>
      )}
      <span role="status" className="sr-only">
        {message}
      </span>
    </AgentFleetRoot>
  );
}

function AgentRow({
  agent,
  density,
  selectable,
  selected,
  tabbable,
  rowRef,
  onFocus,
  onChoose,
}: {
  agent: FleetAgent;
  density: "compact" | "comfortable";
  selectable: boolean;
  selected: boolean;
  tabbable: boolean;
  rowRef: (el: HTMLLIElement | null) => void;
  onFocus: () => void;
  onChoose: () => void;
}) {
  const live = LIVE.includes(agent.status);
  const ticking = useElapsed(agent.startedAt, live && agent.endedAt == null);
  const elapsed =
    agent.startedAt != null && agent.endedAt != null
      ? Math.max(0, +new Date(agent.endedAt) - +new Date(agent.startedAt))
      : agent.startedAt != null
        ? ticking
        : null;
  const compact = density === "compact";
  const showProgress = agent.progress != null && live;

  const activity = agent.activity ? (
    <span
      data-slot="agent-fleet-activity"
      className={cn(
        "block min-w-0 truncate text-kura-fg-subtle",
        agent.status === "waiting" && "text-kura-ember-text",
        agent.status === "failed" && "text-kura-danger-text",
      )}
    >
      {agent.activity}
    </span>
  ) : null;

  const progress = showProgress ? (
    <DotRail
      data-slot="agent-fleet-progress"
      value={agent.progress ?? 0}
      live={agent.status !== "paused"}
      tone={agent.status === "running" ? "ink" : "muted"}
    />
  ) : null;

  const numbers = (
    <span className="flex items-center gap-2.5 font-kura-mono text-[12px] text-kura-fg-subtle tabular-nums">
      {agent.tokens != null && (
        <span
          data-slot="agent-fleet-tokens"
          className={cn(
            "min-w-[5ch] text-right",
            compact ? "hidden @md:inline-block" : "inline-block",
          )}
        >
          {formatTokens(agent.tokens)}
        </span>
      )}
      {agent.cost != null && !compact && (
        <span
          data-slot="agent-fleet-cost"
          className="hidden min-w-[5ch] text-right @lg:inline-block"
        >
          {formatCost(agent.cost)}
        </span>
      )}
      <span data-slot="agent-fleet-elapsed" className="inline-block text-right">
        {elapsed == null ? "" : live ? formatClock(elapsed) : formatDuration(elapsed)}
      </span>
      <StatusGlyph status={agent.status} />
    </span>
  );

  const name = (
    <span
      data-slot="agent-fleet-name"
      className={cn(
        "min-w-0 truncate font-medium text-[13px]",
        (agent.status === "done" || agent.status === "skipped") && "text-kura-fg-muted",
        // In a tight row the name gives way first when the agent is waiting on a person.
        compact && agent.status === "waiting" && "min-w-[7ch] shrink-[1000]",
      )}
    >
      {agent.name}
    </span>
  );

  const progressText =
    showProgress && agent.progress != null
      ? `, ${Math.round(Math.min(1, Math.max(0, agent.progress)) * 100)}%`
      : "";

  return (
    // biome-ignore lint/a11y/useAriaPropsSupportedByRole: role is "option" whenever aria-selected is set
    // biome-ignore lint/a11y/useKeyWithClickEvents: Enter/Space are handled by the listbox's onKeyDown
    <li
      ref={rowRef}
      role={selectable ? "option" : undefined}
      aria-selected={selectable ? selected : undefined}
      tabIndex={selectable ? (tabbable ? 0 : -1) : undefined}
      data-slot="agent-fleet-agent"
      data-agent-id={agent.id}
      data-status={agent.status}
      data-selected={selected || undefined}
      onClick={selectable ? onChoose : undefined}
      onFocus={selectable ? onFocus : undefined}
      className={cn(
        "relative min-w-0 rounded-[9px] px-2.5 outline-hidden transition-colors duration-(--kura-duration-fast) ease-kura-snap hover:bg-kura-hover motion-reduce:transition-none",
        selectable && "cursor-pointer focus-visible:shadow-[inset_0_0_0_2px_var(--kura-ring)]",
        selected && "bg-kura-active hover:bg-kura-active",
        compact
          ? "flex h-9 items-center gap-x-2.5"
          : "grid grid-cols-[30px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-0.5 py-[9px]",
      )}
    >
      <AgentSigil
        name={agent.name}
        size={compact ? "sm" : "md"}
        className={cn(!compact && "row-span-2 self-start")}
      />
      {compact ? (
        <>
          {name}
          <span
            className={cn(
              "min-w-0 text-[12.5px]",
              agent.status === "waiting" ? "flex-[1_1_auto]" : "flex-1",
            )}
          >
            {activity}
          </span>
          {numbers}
        </>
      ) : (
        <>
          <span className="flex min-w-0 items-baseline gap-2 leading-5">
            {name}
            {agent.role && (
              <span
                data-slot="agent-fleet-role"
                className="hidden min-w-0 truncate text-[12px] text-kura-fg-subtle @md:block"
              >
                {agent.role}
              </span>
            )}
          </span>
          {numbers}
          {activity && (
            <span className="col-span-2 col-start-2 min-w-0 text-[12.5px] leading-[18px]">
              {activity}
            </span>
          )}
          {progress && <span className="col-span-2 col-start-2 mt-[5px] mb-0.5">{progress}</span>}
        </>
      )}
      {/* Read last: "test-writer, adding a fixture, running, 62%". */}
      <span className="sr-only">{progressText}</span>
    </li>
  );
}
