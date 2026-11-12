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
import { Spec } from "./spec";

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
  ` ${c("36", "…")} backfill 48,210 rows ${c("2", "(batch 3 of 10)")}`,
];

function useStream(lines: readonly string[], key: string, reduced: boolean, every = 260) {
  const [n, setN] = React.useState(reduced ? lines.length : 0);
  // biome-ignore lint/correctness/useExhaustiveDependencies: `key` restarts the stream
  React.useEffect(() => {
    if (reduced) {
      setN(lines.length);
      return;
    }
    setN(0);
    const id = setInterval(() => setN((v) => (v >= lines.length ? v : v + 1)), every);
    return () => clearInterval(id);
  }, [key, reduced]);
  return lines.slice(0, n);
}

export function HeroStage({ className }: { className?: string }) {
  const reduced = useReducedMotion();
  const [decision, setDecision] = React.useState<ApprovalDecision>("pending");
  const [t0] = React.useState(() => Date.now());
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
    const t = setTimeout(() => setDecision("pending"), 12_000);
    return () => clearTimeout(t);
  }, [pending]);

  const testLines = useStream(TESTS, "tests", reduced);
  const migrateLines = useStream(MIGRATE, `migrate-${decision}`, reduced || !approved, 520);
  const migrated = approved && migrateLines.length >= MIGRATE.length;
  const term = approved
    ? {
        command: "pnpm db:migrate --env production",
        lines: migrateLines,
        status: migrated ? ("done" as const) : ("running" as const),
      }
    : {
        command: "pnpm test src/auth",
        lines: testLines,
        status: testLines.length >= TESTS.length ? ("done" as const) : ("running" as const),
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
      detail: pending ? "Needs you" : decision === "denied" ? "Denied by you" : undefined,
      startedAt: approved && !migrated ? t0 : undefined,
      durationMs: migrated ? 5_100 : undefined,
    },
    {
      id: "preview",
      title: "Deploy a preview",
      status: moveOn ? "running" : "queued",
      startedAt: moveOn ? t0 : undefined,
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
          : "Told no. Nothing ran",
      progress: approved && !migrated ? migrateLines.length / MIGRATE.length : undefined,
    },
  ];

  const spans: TraceSpan[] = [
    { id: "plan", name: "plan", kind: "llm", start: 0, end: 9_800, status: "done" },
    {
      id: "explorer",
      name: "explorer",
      kind: "agent",
      start: 12_000,
      end: 108_000,
      status: "done",
    },
    { id: "edit", name: "edit_file", kind: "tool", start: 112_000, end: 186_000, status: "done" },
    { id: "test", name: "pnpm test", kind: "tool", start: 190_000, end: 208_000, status: "done" },
    {
      id: "writer",
      name: "test-writer",
      kind: "agent",
      start: 212_000,
      end: approved || decision === "denied" ? undefined : 420_000,
      status: "running",
    },
    {
      id: "migrate",
      name: "db:migrate",
      kind: "tool",
      start: 425_000,
      end: pending || !approved ? 432_000 : migrated ? 470_000 : undefined,
      status: migrateStatus,
    },
  ];

  return (
    <div data-slot="hero-stage" className={cn("flex flex-col gap-3", className)}>
      <Spec name="RunHeader" slug="run-header" className="hidden md:block">
        <RunHeader
          title="Migrate session API to @acme/auth"
          agent="Kura"
          model="claude-opus-5-5"
          branch="kura/auth-client"
          status={pending ? "waiting" : "running"}
          startedAt={t0 - 7 * 60_000 - 18_000}
          tokens={{ input: 312_000, output: 27_400 }}
          cost={1.63}
          budget={5}
          progress={{ done, total: tasks.length }}
          shortcuts={false}
          onStop={() => {}}
        />
      </Spec>
      <div className="grid items-start gap-3 md:grid-cols-2 lg:grid-cols-[330px_minmax(0,1fr)_320px]">
        <div className="order-1 flex min-w-0 flex-col gap-3 md:col-span-2 lg:order-2 lg:col-span-1">
          <Spec name="ApprovalPrompt" slug="approval-prompt">
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
              onDecisionChange={setDecision}
              approveLabel="Run migration"
            />
          </Spec>
          <Spec name="Terminal" slug="terminal">
            <Terminal
              title="Terminal"
              cwd="~/acme-web"
              command={term.command}
              lines={term.lines}
              status={term.status}
              exitCode={term.status === "done" ? 0 : null}
              duration={term.status === "done" ? (approved ? 5_100 : 1_840) : undefined}
              maxHeight={196}
              wrap={false}
              copyable={false}
              className="[&_[data-slot=terminal-output]]:min-h-[176px]"
            />
          </Spec>
        </div>
        <div className="order-2 flex min-w-0 flex-col gap-3 lg:order-1">
          <Spec name="TaskList" slug="task-list">
            <TaskList title="Plan" items={tasks} collapseCompleted={false} />
          </Spec>
          <Spec name="TraceWaterfall" slug="trace-waterfall" className="hidden lg:block">
            <TraceWaterfall spans={spans} startedAt={t0 - 7 * 60_000 - 18_000} />
          </Spec>
        </div>
        <div className="order-3 hidden min-w-0 flex-col gap-3 md:flex">
          <Spec name="AgentFleet" slug="agent-fleet">
            <AgentFleet agents={fleet} title="Subagents" />
          </Spec>
          <Spec name="ContextMeter" slug="context-meter">
            <ContextPanel
              max={200_000}
              segments={[
                { id: "system", label: "System prompt", tokens: 14_200 },
                { id: "history", label: "Conversation", tokens: 61_800 },
                { id: "tools", label: "Tool results", tokens: 38_400 },
                { id: "files", label: "Files", tokens: 17_600 },
              ]}
            />
          </Spec>
        </div>
      </div>
    </div>
  );
}
