import { AgentFleet, type FleetAgent } from "@kura/components/agent-fleet";
import { type ApprovalDecision, ApprovalPrompt } from "@kura/components/approval-prompt";
import { ContextPanel } from "@kura/components/context-meter";
import { RunHeader } from "@kura/components/run-header";
import { TaskList, type TaskListItem } from "@kura/components/task-list";
import { Terminal } from "@kura/components/terminal";
import { type TraceSpan, TraceWaterfall } from "@kura/components/trace-waterfall";
import * as React from "react";
import { filmNow } from "../lib/clock";

/**
 * The run, as the site's hero stage composes it, but every state is a function of the film's
 * clock instead of timers: `t` is milliseconds into this shot. Real Kura components only.
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

/** When things happen, in ms into the shot. */
export const RUN_AT = {
  patchDone: 1000,
  testsStart: 1000,
  testEvery: 250,
  asked: 8000,
  decided: 12000,
  migrateEvery: 250,
} as const;

export type StageRefs = Record<
  "header" | "plan" | "trace" | "prompt" | "terminal" | "fleet" | "context",
  React.RefObject<HTMLDivElement | null>
>;

export function useStageRefs(): StageRefs {
  return {
    header: React.useRef<HTMLDivElement>(null),
    plan: React.useRef<HTMLDivElement>(null),
    trace: React.useRef<HTMLDivElement>(null),
    prompt: React.useRef<HTMLDivElement>(null),
    terminal: React.useRef<HTMLDivElement>(null),
    fleet: React.useRef<HTMLDivElement>(null),
    context: React.useRef<HTMLDivElement>(null),
  };
}

export function RunStage({
  t,
  refs,
  dim,
  promptPressed,
}: {
  t: number;
  refs: StageRefs;
  /** Opacity for each panel (1 = in focus). */
  dim?: Partial<Record<keyof StageRefs, number>>;
  /** The approve key is held down (1px travel). */
  promptPressed?: boolean;
}) {
  const now = filmNow();
  // The run began 7m 18s before this shot.
  const RUN = now - t - (7 * 60_000 + 18_000);
  const sinceRun = (ms: number) => RUN + 7 * 60_000 + 18_000 + ms;

  const step = t < RUN_AT.patchDone ? 1 : t < RUN_AT.asked ? 2 : 3;
  const asked = step >= 3;
  const decision: ApprovalDecision = t >= RUN_AT.decided ? "approved" : "pending";
  const pending = decision === "pending";
  const approved = !pending;

  const testsN = Math.max(
    0,
    Math.min(TESTS.length, Math.floor((t - RUN_AT.testsStart) / RUN_AT.testEvery) + 1),
  );
  const testsDone = testsN >= TESTS.length;
  const migrateN = approved
    ? Math.min(MIGRATE.length, Math.floor((t - RUN_AT.decided) / RUN_AT.migrateEvery) + 1)
    : 0;
  const migrated = approved && migrateN >= MIGRATE.length;

  const term = approved
    ? {
        command: "pnpm db:migrate --env production",
        lines: MIGRATE.slice(0, migrateN),
        status: migrated ? ("done" as const) : ("running" as const),
        startedAt: sinceRun(RUN_AT.decided),
        duration: 5_100,
      }
    : {
        command: "pnpm test src/auth",
        lines: TESTS.slice(0, testsN),
        status:
          t < RUN_AT.testsStart
            ? ("idle" as const)
            : testsDone
              ? ("done" as const)
              : ("running" as const),
        startedAt: sinceRun(RUN_AT.testsStart),
        duration: 1_840,
      };

  const migrateStatus = !asked
    ? ("queued" as const)
    : pending
      ? ("waiting" as const)
      : migrated
        ? ("done" as const)
        : ("running" as const);

  const stepStatus = (i: number) =>
    step > i ? ("done" as const) : step === i ? ("running" as const) : ("queued" as const);
  const tasks: TaskListItem[] = [
    { id: "map", title: "Map call sites of fetchUser()", status: "done", durationMs: 96_000 },
    {
      id: "client",
      title: "Patch src/auth/client.ts",
      status: stepStatus(1),
      durationMs: 74_000,
      startedAt: step === 1 ? now - 70_000 : undefined,
    },
    {
      id: "test",
      title: "Run the auth test suite",
      status: step > 2 ? "done" : step === 2 ? (testsDone ? "done" : "running") : "queued",
      durationMs: 18_000,
      startedAt: step === 2 ? now - 16_000 : undefined,
    },
    {
      id: "migrate",
      title: "Migrate the sessions table",
      status: migrateStatus,
      detail: !asked ? "Asks before it runs" : pending ? "Needs you" : "Approved by you",
      startedAt: approved && !migrated ? sinceRun(RUN_AT.decided) : undefined,
      durationMs: migrated ? 5_100 : undefined,
    },
    {
      id: "preview",
      title: "Deploy a preview",
      status: migrated ? "running" : "queued",
      startedAt: migrated ? sinceRun(RUN_AT.decided + 1500) : undefined,
    },
    { id: "pr", title: "Open a pull request", status: "queued" },
  ];
  const done = tasks.filter((x) => x.status === "done").length;

  // The test-writer's rail fills over the shot.
  const writer = Math.min(0.96, 0.34 + t / 26_000);
  const fleet: FleetAgent[] = [
    {
      id: "explorer",
      name: "explorer",
      status: "done",
      activity: "Found 23 calls to fetchUser() in 9 files",
      startedAt: 0,
      endedAt: 96_000,
    },
    step > 1
      ? {
          id: "patcher",
          name: "patcher",
          status: "done",
          activity: "Patched src/auth/client.ts",
          startedAt: 0,
          endedAt: 74_000,
        }
      : {
          id: "patcher",
          name: "patcher",
          status: "running",
          activity: "Editing src/auth/client.ts",
          startedAt: now - 70_000,
        },
    {
      id: "tests",
      name: "test-writer",
      status: "running",
      activity: "Adding a fixture for expired sessions",
      progress: writer,
      startedAt: now - 94_000,
    },
    {
      id: "migrator",
      name: "migrator",
      status: migrateStatus,
      activity: !asked
        ? "Waits for the tests"
        : pending
          ? "Waiting for your approval"
          : migrated
            ? "Backfilled 48,210 rows"
            : "Running the migration",
      progress: pending || !asked ? 0 : migrated ? undefined : migrateN / MIGRATE.length,
    },
  ];

  const T = 7 * 60_000 + 18_000;
  const spans: TraceSpan[] = [
    { id: "explorer", name: "explorer", kind: "agent", start: 0, end: 96_000, status: "done" },
    { id: "edit", name: "patcher", kind: "agent", start: 100_000, end: 174_000, status: "done" },
    { id: "test", name: "pnpm test", kind: "tool", start: 178_000, end: 196_000, status: "done" },
    { id: "writer", name: "test-writer", kind: "agent", start: T - 94_000, status: "running" },
    {
      id: "migrate",
      name: "migrate",
      kind: "tool",
      start: approved ? T + RUN_AT.decided : T + RUN_AT.asked - 14_000,
      end: migrated ? T + RUN_AT.decided + 5_100 : undefined,
      status: migrateStatus,
    },
  ];

  // The context window fills across the shot: one dot per percent.
  const fill = Math.min(1, Math.max(0.3, 0.3 + ((t - 5_000) / 2_200) * 0.7));
  const grow = (tokens: number) => Math.round(tokens * fill);

  const o = (k: keyof StageRefs) => ({ opacity: dim?.[k] ?? 1 });

  return (
    <div className="flex w-[1180px] flex-col gap-3" data-slot="film-stage">
      <div ref={refs.header} style={o("header")}>
        <RunHeader
          title="Migrate session API to @acme/auth"
          agent="Kura"
          model="claude-opus-5-5"
          branch="kura/auth-client"
          status={asked && pending ? "waiting" : "running"}
          startedAt={RUN}
          tokens={{ input: 312_000, output: 27_400 }}
          cost={1.63}
          budget={5}
          progress={{ done, total: tasks.length }}
          shortcuts={false}
        />
      </div>
      <div className="grid grid-cols-[330px_minmax(0,1fr)_320px] items-stretch gap-3">
        <div className="flex min-w-0 flex-col gap-3">
          <div ref={refs.plan} style={o("plan")}>
            <TaskList title="Plan" items={tasks} collapseCompleted={false} />
          </div>
          <div ref={refs.trace} style={o("trace")}>
            <TraceWaterfall spans={spans} startedAt={RUN} />
          </div>
        </div>
        <div className="flex min-w-0 flex-col gap-3">
          <div ref={refs.prompt} style={o("prompt")}>
            <div
              style={{
                opacity: asked ? 1 : 0.4,
                filter: asked ? undefined : "grayscale(1)",
              }}
              data-pressed={promptPressed || undefined}
              className="[&[data-pressed]_button[data-agent-confirm]]:translate-y-px"
            >
              <ApprovalPrompt
                title="Run the sessions migration on production"
                agent={{ name: "migrator", detail: "for step 4 of the plan" }}
                requestedAt={sinceRun(RUN_AT.asked - 3_000)}
                command="pnpm db:migrate --env production"
                facts={[
                  { label: "Target", value: "acme-prod · Postgres 16" },
                  { label: "Rows affected", value: "48,210" },
                  { label: "Rollback", value: "Snapshot first, about 2 min" },
                ]}
                risk="high"
                decision={decision}
                approveLabel="Run migration"
              />
            </div>
          </div>
          <div ref={refs.terminal} style={o("terminal")} className="flex flex-1 flex-col">
            <Terminal
              title="Terminal"
              cwd="~/acme-web"
              command={term.command}
              lines={term.lines}
              status={term.status}
              startedAt={term.startedAt}
              exitCode={term.status === "done" ? 0 : null}
              duration={term.status === "done" ? term.duration : undefined}
              maxHeight={196}
              copyable={false}
              className="flex-1 [&_[data-slot=terminal-output]]:min-h-[196px]"
            />
          </div>
        </div>
        <div className="flex min-w-0 flex-col gap-3">
          <div ref={refs.fleet} style={o("fleet")}>
            <AgentFleet agents={fleet} title="Subagents" className="min-h-[312px]" />
          </div>
          <div ref={refs.context} style={o("context")}>
            <ContextPanel
              max={200_000}
              segments={[
                { id: "system", label: "System prompt", tokens: 14_200 },
                { id: "history", label: "Conversation", tokens: grow(61_800) },
                { id: "tools", label: "Tool results", tokens: grow(38_400) },
                { id: "files", label: "Files", tokens: grow(17_600) },
              ]}
              footer="Older turns are summarized at 90%."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
