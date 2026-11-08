"use client";

import { AgentFleet, type FleetAgent } from "@kura-ui/react/agent-fleet";
import { type FileChange, FileChanges } from "@kura-ui/react/file-changes";
import { RunHeader } from "@kura-ui/react/run-header";
import { TaskList, type TaskListItem } from "@kura-ui/react/task-list";
import { Terminal } from "@kura-ui/react/terminal";
import * as React from "react";
import { cn } from "@/lib/cn";
import { Specimen } from "./specimen";

/**
 * The landing hero: one agent run, assembled from Kura components and played on a loop.
 * Phases advance on a timer; the terminal streams real-looking vitest output.
 */

const ESC = "\u001b[";
const c = (code: string, s: string) => `${ESC}${code}m${s}${ESC}0m`;

const PRE = [
  ` ${c("2", "src/auth/client.ts")}     | ${c("32", "++++++++++++")}${c("31", "---------------")} 29`,
  ` ${c("2", "src/middleware.ts")}      | ${c("32", "+++++++++")}${c("31", "----")} 13`,
  ` ${c("2", "src/auth/login.test.ts")} | ${c("32", "++++++")}${c("31", "--")} 8`,
  ` ${c("2", "src/lib/http.ts")}        | ${c("31", "-----------------------------------------")} 41`,
  ` 4 files changed, ${c("32", "28 insertions(+)")}, ${c("31", "63 deletions(-)")}`,
  "",
  `${c("2", "$")} pnpm tsc --noEmit`,
  ` ${c("32", "✓")} No type errors ${c("2", "(3.4s)")}`,
];

const RUN_1 = [
  "",
  ` ${c("7;36", " RUN ")} ${c("36", "v3.2.4")} ${c("2", "/repo/acme-web")}`,
  "",
  ` ${c("32", "✓")} src/auth/client.test.ts ${c("2", "(8 tests)")} ${c("33", "42ms")}`,
  ` ${c("32", "✓")} src/middleware.test.ts ${c("2", "(6 tests)")} ${c("33", "31ms")}`,
  ` ${c("32", "✓")} src/routes/account.test.ts ${c("2", "(11 tests)")} ${c("33", "64ms")}`,
  ` ${c("31", "❯")} src/auth/login.test.ts ${c("2", "(5 tests | ")}${c("31", "1 failed")}${c("2", ")")} ${c("33", "58ms")}`,
  `   ${c("31", "×")} refreshes an expired session`,
  "",
  `${c("7;31", " FAIL ")} src/auth/login.test.ts > refreshes an expired session`,
  `${c("31", "AssertionError")}: expected ${c("32", "'active'")} but got ${c("31", "'expired'")}`,
  ` ${c("2", "❯")} src/auth/login.test.ts:${c("33", "48:31")}`,
  "",
  ` ${c("2", "Test Files")}  ${c("1;31", "1 failed")} ${c("2", "|")} ${c("1;32", "3 passed")} ${c("2", "(4)")}`,
  ` ${c("2", "     Tests")}  ${c("1;31", "1 failed")} ${c("2", "|")} ${c("1;32", "29 passed")} ${c("2", "(30)")}`,
];

const RUN_2 = [
  "",
  ` ${c("7;36", " RUN ")} ${c("36", "v3.2.4")} ${c("2", "/repo/acme-web")}`,
  "",
  ` ${c("32", "✓")} src/auth/client.test.ts ${c("2", "(8 tests)")} ${c("33", "40ms")}`,
  ` ${c("32", "✓")} src/middleware.test.ts ${c("2", "(6 tests)")} ${c("33", "29ms")}`,
  ` ${c("32", "✓")} src/routes/account.test.ts ${c("2", "(11 tests)")} ${c("33", "61ms")}`,
  ` ${c("32", "✓")} src/auth/login.test.ts ${c("2", "(5 tests)")} ${c("33", "55ms")}`,
  "",
  ` ${c("2", "Test Files")}  ${c("1;32", "4 passed")} ${c("2", "(4)")}`,
  ` ${c("2", "     Tests")}  ${c("1;32", "30 passed")} ${c("2", "(30)")}`,
  ` ${c("2", "  Duration")}  1.84s`,
];

type Phase = 0 | 1 | 2 | 3 | 4;
const PHASE_AT = [0, 4200, 8400, 14200, 19500];
const LOOP_MS = 26000;

function tasks(p: Phase): TaskListItem[] {
  const s = (done: boolean, running: boolean): TaskListItem["status"] =>
    done ? "done" : running ? "running" : "queued";
  return [
    { id: "read", title: "Read the session routes", status: "done", durationMs: 41_000 },
    { id: "map", title: "Map call sites of fetchUser()", status: "done", durationMs: 96_000 },
    {
      id: "client",
      title: "Patch src/auth/client.ts",
      status: s(p >= 1, p === 0),
      durationMs: p >= 1 ? 74_000 : undefined,
    },
    {
      id: "mw",
      title: "Move refresh into middleware",
      status: s(p >= 2, p === 1),
      durationMs: p >= 2 ? 62_000 : undefined,
    },
    {
      id: "test",
      title: "Run pnpm test",
      status: p === 2 ? "running" : p === 3 ? "failed" : p >= 4 ? "done" : "queued",
      detail: p === 3 ? "login.test.ts › refreshes an expired session" : undefined,
    },
    ...(p >= 3
      ? [
          {
            id: "fix",
            title: "Fix expired-session refresh",
            status: (p === 3 ? "running" : "done") as TaskListItem["status"],
          },
        ]
      : []),
    { id: "pr", title: "Open a pull request", status: "queued" },
  ];
}

function fleet(p: Phase): FleetAgent[] {
  return [
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
      id: "patcher",
      name: "client-patcher",
      role: "Patches the auth client",
      status: p >= 2 ? "done" : "running",
      activity: p >= 2 ? "Replaced fetchUser() with auth.getSession()" : "Replacing fetchUser()",
      progress: p >= 2 ? 1 : 0.35 + p * 0.3,
      tokens: 61_400 + p * 9000,
      cost: 0.17 + p * 0.03,
    },
    {
      id: "tests",
      name: "test-writer",
      role: "Updates tests",
      status: p >= 4 ? "done" : p >= 1 ? "running" : "queued",
      activity: p >= 3 ? "Adding a fixture for expired sessions" : "Rewriting session mocks",
      progress: p >= 4 ? 1 : p * 0.22,
      tokens: p >= 1 ? 22_000 + p * 4000 : undefined,
      cost: p >= 1 ? 0.04 + p * 0.01 : undefined,
    },
    {
      id: "reviewer",
      name: "reviewer",
      role: "Reviews the diff",
      status: p >= 4 ? "running" : "queued",
      activity: p >= 4 ? "Reading 4 changed files" : "Starts when tests pass",
      progress: p >= 4 ? 0.2 : undefined,
    },
  ];
}

function files(p: Phase): FileChange[] {
  return [
    {
      path: "src/auth/client.ts",
      status: "M",
      additions: 13,
      deletions: 16,
      state: p === 0 ? "editing" : undefined,
    },
    {
      path: "src/middleware.ts",
      status: "M",
      additions: p >= 1 ? 9 : 0,
      deletions: p >= 1 ? 4 : 0,
      state: p === 1 ? "editing" : undefined,
    },
    {
      path: "src/auth/login.test.ts",
      status: "M",
      additions: p >= 3 ? 14 : 6,
      deletions: 2,
      state: p === 3 ? "editing" : undefined,
    },
    { path: "src/auth/fixtures/session.ts", status: "A", additions: p >= 3 ? 22 : 0 },
    { path: "src/lib/http.ts", status: "D", deletions: 41 },
  ];
}

function useScript(reduced: boolean) {
  const [phase, setPhase] = React.useState<Phase>(reduced ? 4 : 0);
  const [lineCount, setLineCount] = React.useState(reduced ? RUN_2.length : 0);
  const [loop, setLoop] = React.useState(0);
  // biome-ignore lint/correctness/useExhaustiveDependencies: `loop` restarts the script
  React.useEffect(() => {
    if (reduced) {
      setPhase(4);
      setLineCount(RUN_2.length);
      return;
    }
    setPhase(0);
    setLineCount(0);
    const timers = PHASE_AT.slice(1).map((at, i) =>
      setTimeout(() => {
        setPhase((i + 1) as Phase);
        if (i + 1 === 2 || i + 1 === 4) setLineCount(0);
      }, at),
    );
    timers.push(setTimeout(() => setLoop((l) => l + 1), LOOP_MS));
    return () => timers.forEach(clearTimeout);
  }, [loop, reduced]);
  // Stream terminal lines during the two test runs.
  React.useEffect(() => {
    if (reduced || (phase !== 2 && phase !== 4)) return;
    const total = phase === 2 ? RUN_1.length : RUN_2.length;
    const id = setInterval(() => setLineCount((n) => (n >= total ? n : n + 1)), 260);
    return () => clearInterval(id);
  }, [phase, reduced]);
  return { phase, lineCount };
}

export function ControlRoom({ reveal, className }: { reveal: boolean; className?: string }) {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);
  const { phase, lineCount } = useScript(reduced);
  const [startedAt] = React.useState(() => Date.now() - 7 * 60_000 - 18_000);

  const run = phase >= 4 ? RUN_2 : RUN_1;
  const testRunning = phase === 2 || phase === 4;
  const termStatus = testRunning
    ? lineCount >= run.length
      ? phase === 2
        ? "failed"
        : "done"
      : "running"
    : phase === 3
      ? "failed"
      : "done";
  const showTerm = phase >= 2;

  return (
    <div
      className={cn(
        "rounded-[20px] bg-kura-surface-sunken p-2 shadow-[0_0_0_1px_var(--kura-border),0_24px_60px_-24px_oklch(0_0_0/0.22)] dark:shadow-[0_0_0_1px_var(--kura-border),0_24px_60px_-20px_oklch(0_0_0/0.8)]",
        className,
      )}
    >
      <div className="grid gap-2">
        <Specimen name="RunHeader" slug="run-header" reveal={reveal}>
          <RunHeader
            variant="bar"
            title="Migrate session API to @acme/auth"
            agent="Kura"
            model="claude-opus-5-5"
            branch="kura/auth-client"
            status="running"
            startedAt={startedAt}
            tokens={{ input: 296_000 + phase * 24_000, output: 24_300 + phase * 3_400 }}
            cost={1.21 + phase * 0.14}
            budget={5}
            progress={{ done: Math.min(7, 2 + phase), total: phase >= 3 ? 8 : 7 }}
            shortcuts={false}
            onStop={() => {}}
          />
        </Specimen>
        <div className="grid gap-2 md:h-[488px] md:grid-cols-[minmax(0,1fr)_minmax(0,21rem)] lg:grid-cols-[minmax(0,18.5rem)_minmax(0,1fr)_minmax(0,21rem)] [&>*]:min-h-0">
          <Specimen name="TaskList" slug="task-list" reveal={reveal} className="hidden lg:block">
            <TaskList
              items={tasks(phase)}
              title="Plan"
              collapseCompleted={false}
              className="h-full"
            />
          </Specimen>
          <Specimen name="Terminal" slug="terminal" reveal={reveal} className="h-[360px] md:h-auto">
            <Terminal
              command={showTerm ? "pnpm test src/auth" : "git diff --stat"}
              lines={showTerm ? run.slice(0, lineCount) : PRE}
              status={showTerm ? termStatus : "done"}
              exitCode={termStatus === "failed" ? 1 : termStatus === "done" ? 0 : null}
              duration={showTerm ? undefined : 3_420}
              cwd="~/acme-web"
              className="h-full"
            />
          </Specimen>
          <div className="hidden min-h-0 flex-col gap-2 md:flex">
            <Specimen name="AgentFleet" slug="agent-fleet" reveal={reveal}>
              <AgentFleet agents={fleet(phase)} density="compact" title="Subagents" />
            </Specimen>
            <Specimen
              name="FileChanges"
              slug="file-changes"
              reveal={reveal}
              className="min-h-0 flex-1"
            >
              <FileChanges
                files={files(phase)}
                defaultView="list"
                className="h-full overflow-hidden"
              />
            </Specimen>
          </div>
        </div>
      </div>
    </div>
  );
}
