"use client";

import { AgentFleet, type FleetAgent } from "@kura-ui/react/agent-fleet";
import { type ApprovalDecision, ApprovalPrompt } from "@kura-ui/react/approval-prompt";
import { ContextMeter } from "@kura-ui/react/context-meter";
import { useReducedMotion } from "@kura-ui/react/hooks";
import { RunHeader } from "@kura-ui/react/run-header";
import { TaskList, type TaskListItem } from "@kura-ui/react/task-list";
import { Terminal } from "@kura-ui/react/terminal";
import { Database } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/cn";
import { Spec } from "./spec";

/**
 * The hero stage: one agent run, paused on a high-risk approval, composed from live Kura
 * components. Nothing is scripted beyond the components' own live states; approving or denying
 * the prompt moves the run on.
 */

const ESC = "\u001b[";
const c = (code: string, s: string) => `${ESC}${code}m${s}${ESC}0m`;

const TESTS = [
  ` ${c("7;36", " RUN ")} ${c("36", "v3.2.4")} ${c("2", "~/acme-web")}`,
  "",
  ` ${c("32", "✓")} src/auth/client.test.ts ${c("2", "(8 tests)")} ${c("33", "42ms")}`,
  ` ${c("32", "✓")} src/middleware.test.ts ${c("2", "(6 tests)")} ${c("33", "31ms")}`,
  ` ${c("32", "✓")} src/routes/account.test.ts ${c("2", "(11 tests)")} ${c("33", "64ms")}`,
  ` ${c("32", "✓")} src/auth/login.test.ts ${c("2", "(5 tests)")} ${c("33", "55ms")}`,
  "",
  ` ${c("2", "Test Files")}  ${c("1;32", "4 passed")} ${c("2", "(4)")}`,
  ` ${c("2", "     Tests")}  ${c("1;32", "30 passed")} ${c("2", "(30)")}`,
  ` ${c("2", "  Duration")}  1.84s`,
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

  const testLines = useStream(TESTS, "tests", reduced);
  const migrateLines = useStream(MIGRATE, `migrate-${decision}`, reduced || !approved, 520);
  const term = approved
    ? {
        command: "pnpm db:migrate --env production",
        lines: migrateLines,
        status: "running" as const,
      }
    : {
        command: "pnpm test src/auth",
        lines: testLines,
        status: testLines.length >= TESTS.length ? ("done" as const) : ("running" as const),
      };

  const tasks: TaskListItem[] = [
    { id: "read", title: "Read the session routes", status: "done", durationMs: 41_000 },
    { id: "map", title: "Map call sites of fetchUser()", status: "done", durationMs: 96_000 },
    { id: "client", title: "Patch src/auth/client.ts", status: "done", durationMs: 74_000 },
    { id: "mw", title: "Move refresh into middleware", status: "done", durationMs: 62_000 },
    { id: "test", title: "Run the auth test suite", status: "done", durationMs: 18_000 },
    {
      id: "migrate",
      title: "Migrate the sessions table",
      status: pending ? "waiting" : approved ? "running" : "skipped",
      detail: pending
        ? "Needs your approval: production database"
        : approved
          ? undefined
          : "Denied by you",
      startedAt: approved ? t0 : undefined,
    },
    {
      id: "preview",
      title: "Deploy a preview",
      status: decision === "denied" ? "running" : "queued",
      startedAt: decision === "denied" ? t0 : undefined,
    },
    { id: "pr", title: "Open a pull request", status: "queued" },
  ];

  const fleet: FleetAgent[] = [
    {
      id: "explorer",
      name: "explorer",
      role: "Maps call sites",
      status: "done",
      activity: "Found 23 calls to fetchUser() in 9 files",
      tokens: 84_200,
      cost: 0.21,
    },
    {
      id: "tests",
      name: "test-writer",
      role: "Updates tests",
      status: "running",
      activity: "Adding a fixture for expired sessions",
      progress: 0.62,
      startedAt: t0 - 94_000,
      tokens: 38_900,
      cost: 0.09,
    },
    {
      id: "reviewer",
      name: "reviewer",
      role: "Reviews the diff",
      status: "running",
      activity: "Reading 4 changed files",
      progress: 0.28,
      startedAt: t0 - 31_000,
      tokens: 12_400,
      cost: 0.03,
    },
    {
      id: "migrator",
      name: "migrator",
      role: "Runs database migrations",
      status: pending ? "waiting" : approved ? "running" : "skipped",
      activity: pending
        ? "Waiting for your approval"
        : approved
          ? "Backfilling 48,210 rows"
          : "Skipped",
      progress: approved ? 0.3 : undefined,
    },
  ];

  return (
    <div
      data-slot="hero-stage"
      className={cn(
        "relative md:rounded-[24px] md:bg-stage md:p-4 md:shadow-(--stage-shadow) lg:p-5",
        // light leaking over the top edge
        "before:pointer-events-none before:absolute before:inset-x-[18%] before:-top-px max-md:before:hidden before:h-px before:bg-[linear-gradient(90deg,transparent,var(--ember-hot),transparent)] before:opacity-80",
        className,
      )}
    >
      <div className="flex flex-col gap-3 md:gap-4">
        <Spec name="RunHeader" slug="run-header" className="hidden md:block">
          <RunHeader
            variant="bar"
            className="gloss"
            title="Migrate session API to @acme/auth"
            agent="Kura"
            model="claude-opus-5-5"
            branch="kura/auth-client"
            status={pending ? "waiting" : "running"}
            startedAt={t0 - 7 * 60_000 - 18_000}
            tokens={{ input: 312_000, output: 27_400 }}
            cost={1.63}
            budget={5}
            progress={{ done: 5, total: 8 }}
            shortcuts={false}
            onStop={() => {}}
            actions={
              <ContextMeter
                max={200_000}
                segments={[
                  { id: "system", label: "System prompt", tokens: 14_200 },
                  { id: "history", label: "Conversation", tokens: 61_800 },
                  { id: "tools", label: "Tool results", tokens: 38_400 },
                  { id: "files", label: "Files", tokens: 17_600 },
                ]}
              />
            }
          />
        </Spec>
        <div className="grid gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.36fr)_minmax(0,1fr)]">
          <Spec
            name="ApprovalPrompt"
            slug="approval-prompt"
            className="order-1 md:col-span-2 lg:order-2 lg:col-span-1 lg:self-center"
          >
            <ApprovalPrompt
              className="gloss gloss-raised"
              title="Kura wants to run a migration"
              icon={<Database />}
              command="pnpm db:migrate --env production"
              description="Adds refresh_token_hash to sessions and backfills 48,210 rows. Takes a short write lock on the table."
              risk="high"
              details={
                <ul className="flex list-disc flex-col gap-1 pl-4">
                  <li>Database: acme-prod (Postgres 16)</li>
                  <li>Requested by step 6 of 8, “Migrate the sessions table”</li>
                  <li>A snapshot is taken first; rollback takes about two minutes</li>
                </ul>
              }
              decision={decision}
              onDecisionChange={setDecision}
              shortcuts={false}
              approveLabel="Run migration"
            />
          </Spec>
          <Spec name="TaskList" slug="task-list" className="order-2 lg:order-1">
            <TaskList
              className="gloss h-full"
              title="Plan"
              items={tasks}
              collapseCompleted={false}
            />
          </Spec>
          <Spec name="AgentFleet" slug="agent-fleet" className="order-3 hidden md:block">
            <AgentFleet className="gloss h-full" agents={fleet} title="Subagents" />
          </Spec>
          <Spec name="Terminal" slug="terminal" className="order-4 md:col-span-2 lg:col-span-3">
            <Terminal
              className="gloss"
              cwd="~/acme-web"
              command={term.command}
              lines={term.lines}
              status={term.status}
              exitCode={term.status === "done" ? 0 : null}
              duration={term.status === "done" ? 1_840 : undefined}
              maxHeight={196}
              wrap={false}
            />
          </Spec>
        </div>
      </div>
    </div>
  );
}
