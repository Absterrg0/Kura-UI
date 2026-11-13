"use client";

import { AgentFleet, type FleetAgent } from "@kura-ui/react/agent-fleet";
import { type ApprovalDecision, ApprovalPrompt } from "@kura-ui/react/approval-prompt";
import { ContextPanel } from "@kura-ui/react/context-meter";
import { useReducedMotion } from "@kura-ui/react/hooks";
import { RunHeader } from "@kura-ui/react/run-header";
import { TaskList, type TaskListItem } from "@kura-ui/react/task-list";
import { Terminal } from "@kura-ui/react/terminal";
import { type TraceSpan, TraceWaterfall } from "@kura-ui/react/trace-waterfall";
import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * The hero stage: one agent run, paused on a high-risk approval, composed from live Kura
 * components. Nothing is scripted beyond the components' own live states; approving or denying
 * the prompt moves the whole run on (plan, subagents, trace and terminal react together).
 */

const ESC = "\u001b[";
const c = (code: string, s: string) => `${ESC}${code}m${s}${ESC}0m`;

const TESTS = [
  ` ${c("32", "✓")} src/auth/client.test.ts ${c("2", "42ms")}`,
  ` ${c("32", "✓")} src/middleware.test.ts ${c("2", "31ms")}`,
  ` ${c("32", "✓")} src/routes/account.test.ts ${c("2", "64ms")}`,
  ` ${c("32", "✓")} src/auth/login.test.ts ${c("2", "55ms")}`,
  "",
  ` ${c("1;32", "30 passed")} ${c("2", "in 1.84s")}`,
];

const MIGRATE = [
  ` ${c("2", "migrate")} 20261112_session_refresh_hash`,
  ` ${c("32", "✓")} add column sessions.refresh_token_hash ${c("2", "(12ms)")}`,
  ` ${c("32", "✓")} create index sessions_refresh_hash_idx ${c("2", "(1.2s)")}`,
  ` ${c("32", "✓")} backfill 48,210 rows ${c("2", "(10 batches, 3.6s)")}`,
  "",
  ` ${c("1;32", "migrated")} ${c("2", "in 5.1s")}`,
];

/**
 * Prints `lines` one every `every` ms, by the clock rather than by counting ticks, so a slow
 * frame cannot stretch the run past the time its last line reports. Also says when it began.
 */
function useStream(lines: readonly string[], key: string, reduced: boolean, every = 260) {
  const [state, setState] = React.useState<{ n: number; startedAt: number | null }>({
    n: reduced ? lines.length : 0,
    startedAt: null,
  });
  // biome-ignore lint/correctness/useExhaustiveDependencies: `key` restarts the stream
  React.useEffect(() => {
    if (reduced) {
      setState({ n: lines.length, startedAt: null });
      return;
    }
    const startedAt = Date.now();
    setState({ n: 0, startedAt });
    const id = setInterval(() => {
      const n = Math.min(lines.length, Math.floor((Date.now() - startedAt) / every));
      setState((s) => (s.n === n ? s : { n, startedAt }));
      if (n >= lines.length) clearInterval(id);
    }, 40);
    return () => clearInterval(id);
  }, [key, reduced]);
  return { lines: lines.slice(0, state.n), startedAt: state.startedAt };
}

export function HeroStage({ className }: { className?: string }) {
  const reduced = useReducedMotion();
  const [decision, setDecision] = React.useState<ApprovalDecision>("pending");
  const [t0] = React.useState(() => Date.now());
  // One clock for the whole scene, in ms since the run began: it started 7m 18s ago, the
  // test-writer 94s ago, and the migrator asked 14s ago. Every panel reads from these.
  const RUN = t0 - (7 * 60_000 + 18_000);
  const ASKED = 7 * 60_000 + 18_000 - 14_000;
  const WRITER = 7 * 60_000 + 18_000 - 94_000;
  const [decidedAt, setDecidedAt] = React.useState<number | null>(null);
  const decide = (next: ApprovalDecision) => {
    // Snapped to the trace's quarter-second tick, so its clock and the terminal's turn together.
    setDecidedAt(next === "pending" ? null : Math.round((Date.now() - RUN) / 250) * 250);
    setDecision(next);
  };
  const pending = decision === "pending";
  const approved = decision === "approved" || decision === "always";

  // Lets screenshot tooling (and anyone curious) know the run is waiting on a person.
  React.useEffect(() => {
    document.documentElement.dataset.run = pending ? "attention" : "running";
    return () => {
      delete document.documentElement.dataset.run;
    };
  }, [pending]);

  // The stage is a demo: after a decision has played out, quietly ask again.
  React.useEffect(() => {
    if (pending) return;
    const t = setTimeout(() => {
      setDecidedAt(null);
      setDecision("pending");
    }, 20_000);
    return () => clearTimeout(t);
  }, [pending]);

  // Six lines each: the tests take the 1.84s and the migration the 5.1s their last lines report.
  const tests = useStream(TESTS, "tests", reduced, 306);
  const testLines = tests.lines;
  const migrateLines = useStream(MIGRATE, `migrate-${decision}`, reduced || !approved, 850).lines;
  const migrated = approved && migrateLines.length >= MIGRATE.length;
  const term = approved
    ? {
        command: "pnpm db:migrate --env production",
        lines: migrateLines,
        status: migrated ? ("done" as const) : ("running" as const),
        startedAt: decidedAt != null ? RUN + decidedAt : undefined,
      }
    : {
        command: "pnpm test src/auth",
        lines: testLines,
        status: testLines.length >= TESTS.length ? ("done" as const) : ("running" as const),
        startedAt: tests.startedAt ?? undefined,
      };

  const migrateStatus = pending
    ? ("waiting" as const)
    : approved
      ? migrated
        ? ("done" as const)
        : ("running" as const)
      : ("skipped" as const);
  const moveOn = migrated || decision === "denied";

  const tasks: TaskListItem[] = [
    { id: "map", title: "Map call sites of fetchUser()", status: "done", durationMs: 96_000 },
    { id: "client", title: "Patch src/auth/client.ts", status: "done", durationMs: 74_000 },
    { id: "test", title: "Run the auth test suite", status: "done", durationMs: 18_000 },
    {
      id: "migrate",
      title: "Migrate the sessions table",
      status: migrateStatus,
      // One line in every state, so the plan keeps its height when a decision lands.
      detail: pending ? "Needs you" : decision === "denied" ? "Denied by you" : "Approved by you",
      startedAt: approved && !migrated && decidedAt != null ? RUN + decidedAt : undefined,
      durationMs: migrated ? 5_100 : undefined,
    },
    {
      id: "preview",
      title: "Deploy a preview",
      status: moveOn ? "running" : "queued",
      startedAt: moveOn && decidedAt != null ? RUN + decidedAt + (migrated ? 5_100 : 0) : undefined,
    },
    { id: "pr", title: "Open a pull request", status: "queued" },
  ];
  const done = tasks.filter((t) => t.status === "done" || t.status === "skipped").length;

  const fleet: FleetAgent[] = [
    {
      id: "explorer",
      name: "explorer",
      status: "done",
      activity: "Found 23 calls to fetchUser() in 9 files",
      startedAt: 0,
      endedAt: 96_000,
    },
    {
      id: "patcher",
      name: "patcher",
      status: "done",
      activity: "Patched src/auth/client.ts",
      startedAt: 0,
      endedAt: 74_000,
    },
    {
      id: "tests",
      name: "test-writer",
      status: "running",
      activity: "Adding a fixture for expired sessions",
      progress: 0.62,
      startedAt: t0 - 94_000,
    },
    {
      id: "migrator",
      name: "migrator",
      status: migrateStatus,
      activity: pending
        ? "Waiting for your approval"
        : approved
          ? migrated
            ? "Backfilled 48,210 rows"
            : "Running the migration"
          : "Denied by you. Nothing ran",
      // The rail is there while the agent waits (unlit), so the row keeps its height when it runs.
      progress: pending
        ? 0
        : approved && !migrated
          ? migrateLines.length / MIGRATE.length
          : undefined,
    },
  ];

  const spans: TraceSpan[] = [
    { id: "explorer", name: "explorer", kind: "agent", start: 0, end: 96_000, status: "done" },
    { id: "edit", name: "patcher", kind: "agent", start: 100_000, end: 174_000, status: "done" },
    { id: "test", name: "pnpm test", kind: "tool", start: 178_000, end: 196_000, status: "done" },
    { id: "writer", name: "test-writer", kind: "agent", start: WRITER, status: "running" },
    {
      id: "migrate",
      name: "migrate",
      kind: "tool",
      // Waiting since it asked; once decided it either runs for the 5.1s the terminal reports,
      // or is skipped at the moment of the "no".
      start: approved && decidedAt != null ? decidedAt : ASKED,
      end:
        decidedAt == null
          ? undefined
          : approved
            ? migrated
              ? decidedAt + 5_100
              : undefined
            : decidedAt,
      status: migrateStatus,
    },
  ];

  return (
    <div data-slot="hero-stage" className={cn("flex flex-col gap-3", className)}>
      {/* On a phone the run header is not shown: the stage still has a heading above the prompt. */}
      <h2 className="sr-only md:hidden">Migrate session API to @acme/auth: an agent run</h2>
      <div className="hidden min-w-0 md:block max-lg:[&_[data-slot=run-header-model]]:hidden">
        <RunHeader
          title="Migrate session API to @acme/auth"
          agent="Kura"
          model="claude-opus-5-5"
          branch="kura/auth-client"
          status={pending ? "waiting" : "running"}
          startedAt={RUN}
          tokens={{ input: 312_000, output: 27_400 }}
          cost={1.63}
          budget={5}
          progress={{ done, total: tasks.length }}
          shortcuts={false}
        />
      </div>
      {/* Phone: prompt, terminal, plan. Tablet: prompt and terminal beside plan and subagents.
          Desktop: the full three columns. The prompt never gets less than half the row. */}
      <div className="grid items-start gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,320px)] md:grid-rows-[auto_1fr] md:items-stretch xl:grid-cols-[330px_minmax(0,1fr)_320px] xl:grid-rows-none xl:[&>div>div:last-child>*]:flex-1 xl:[&>div>div:last-child]:flex xl:[&>div>div:last-child]:flex-1 xl:[&>div>div:last-child]:flex-col">
        {/* Two columns on a tablet: the terminal and the subagents take up the slack, so both end level. */}
        <div className="flex min-w-0 flex-col gap-3 md:row-span-2 md:[&>div:last-child>*]:flex-1 md:[&>div:last-child]:flex md:[&>div:last-child]:flex-1 md:[&>div:last-child]:flex-col xl:order-2 xl:row-span-1">
          <div className="min-w-0">
            <ApprovalPrompt
              title="Run the sessions migration on production"
              agent={{ name: "migrator", detail: "for step 4 of the plan" }}
              requestedAt={t0 - 14_000}
              command="pnpm db:migrate --env production"
              facts={[
                { label: "Target", value: "acme-prod · Postgres 16" },
                { label: "Rows affected", value: "48,210" },
                { label: "Rollback", value: "Snapshot first, about 2 min" },
              ]}
              risk="high"
              decision={decision}
              onDecisionChange={decide}
              approveLabel="Run migration"
            />
          </div>
          <div className="min-w-0">
            <Terminal
              title="Terminal"
              cwd="~/acme-web"
              command={term.command}
              lines={term.lines}
              status={term.status}
              startedAt={term.startedAt}
              exitCode={term.status === "done" ? 0 : null}
              duration={term.status === "done" ? (approved ? 5_100 : 1_840) : undefined}
              maxHeight={196}
              copyable={false}
              className="[&_[data-slot=terminal-output]]:min-h-[196px]"
            />
          </div>
        </div>
        <div className="flex min-w-0 flex-col gap-3 md:col-start-2 xl:order-1 xl:col-start-auto">
          <div className="min-w-0">
            <TaskList title="Plan" items={tasks} collapseCompleted={false} />
          </div>
          <div className="hidden min-w-0 xl:block">
            <TraceWaterfall spans={spans} startedAt={RUN} />
          </div>
        </div>
        <div className="hidden min-w-0 flex-col gap-3 md:col-start-2 md:flex xl:order-3 xl:col-start-auto">
          <div className="min-w-0 md:max-xl:flex md:max-xl:flex-1 md:max-xl:flex-col md:max-xl:[&>*]:flex-1">
            {/* The height of four agents with two progress rails: a rail leaving does not move the stage. */}
            <AgentFleet agents={fleet} title="Subagents" className="min-h-[312px]" />
          </div>
          <div className="hidden min-w-0 xl:block">
            <ContextPanel
              max={200_000}
              segments={[
                { id: "system", label: "System prompt", tokens: 14_200 },
                { id: "history", label: "Conversation", tokens: 61_800 },
                { id: "tools", label: "Tool results", tokens: 38_400 },
                { id: "files", label: "Files", tokens: 17_600 },
              ]}
              footer="Older turns are summarized at 90%."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
