"use client";

import { type Checkpoint, Checkpoints } from "@kura-ui/react/checkpoints";
import { PromptQueue, type QueuedPrompt } from "@kura-ui/react/prompt-queue";
import { TaskList, type TaskListItem } from "@kura-ui/react/task-list";
import { Terminal } from "@kura-ui/react/terminal";
import { type TraceSpan, TraceWaterfall } from "@kura-ui/react/trace-waterfall";
import * as React from "react";

/**
 * Small, composed demos for the "Every part of the run" grid: each shows one component whole, at
 * a height that sits level with its neighbour, so nothing is cropped or faded.
 */

const ESC = "\u001b[";
const c = (code: string, s: string) => `${ESC}${code}m${s}${ESC}0m`;

export function TerminalDemo() {
  return (
    <Terminal
      cwd="~/acme-web"
      command="pnpm vitest run src/auth"
      status="failed"
      exitCode={1}
      duration={1_420}
      wrap={false}
      lines={[
        ` ${c("32", "✓")} session.test.ts ${c("2", "(6)")} ${c("2", "41ms")}`,
        ` ${c("32", "✓")} middleware.test.ts ${c("2", "(4)")} ${c("2", "18ms")}`,
        ` ${c("31", "×")} login.test.ts ${c("2", "(5 |")} ${c("31", "1 failed")}${c("2", ")")}`,
        `   ${c("31", "→ expected 'tok_expired' to be 'tok_next'")}`,
        "",
        ` ${c("2", "Tests")}  ${c("1;31", "1 failed")} ${c("2", "|")} ${c("1;32", "14 passed")}`,
      ]}
    />
  );
}

export function QueueDemo() {
  const [items, setItems] = React.useState<QueuedPrompt[]>([
    { id: "a", text: "Keep the old /api/v1/session route for one release" },
    { id: "b", text: "Then update the auth section of the README" },
    { id: "c", text: "Open the PR as a draft when tests pass" },
  ]);
  return (
    <PromptQueue
      items={items}
      onItemsChange={setItems}
      onSendNow={(item) => setItems((list) => list.filter((i) => i.id !== item.id))}
      hint="Sends after this step"
    />
  );
}

export function CheckpointsDemo() {
  const [checkpoints] = React.useState<Checkpoint[]>(() => {
    const ago = (s: number) => Date.now() - s * 1000;
    return [
      {
        id: "c3",
        label: "Patched src/middleware.ts",
        at: ago(70),
        filesChanged: 1,
        kind: "auto",
        current: true,
      },
      {
        id: "c2",
        label: "Replaced fetchUser() in 9 files",
        at: ago(260),
        filesChanged: 9,
        kind: "auto",
      },
      { id: "c1", label: "Before the auth refactor", at: ago(690), kind: "manual" },
    ];
  });
  return <Checkpoints checkpoints={checkpoints} onRestore={() => {}} />;
}

export function PlanDemo() {
  const [t0] = React.useState(() => Date.now() - 29_000);
  const items: TaskListItem[] = [
    { id: "read", title: "Read the auth module", status: "done", durationMs: 21_400 },
    { id: "map", title: "Map call sites of fetchUser()", status: "done", durationMs: 96_000 },
    { id: "patch", title: "Patch src/middleware.ts", status: "done", durationMs: 74_000 },
    {
      id: "tests",
      title: "Update the tests",
      status: "running",
      startedAt: t0,
      children: [
        { id: "login", title: "login.test.ts", status: "done" },
        { id: "session", title: "session.test.ts", status: "running" },
      ],
    },
    { id: "run", title: "Run pnpm test", status: "queued" },
    { id: "pr", title: "Open a pull request", status: "queued" },
  ];
  return <TaskList title="Plan" items={items} collapseCompleted={false} />;
}

const TRACE: TraceSpan[] = [
  {
    id: "run",
    name: "Kura",
    kind: "agent",
    meta: "acme/web",
    start: 0,
    status: "running",
    children: [
      { id: "plan", name: "Plan the migration", kind: "llm", start: 0, end: 9_800, status: "done" },
      {
        id: "search",
        name: "search_code",
        kind: "tool",
        meta: "fetchUser(",
        start: 11_000,
        end: 12_700,
        status: "done",
      },
      {
        id: "explorer",
        name: "explorer",
        kind: "agent",
        meta: "subagent",
        start: 14_000,
        end: 63_500,
        status: "done",
      },
      {
        id: "draft",
        name: "Draft the patch",
        kind: "llm",
        start: 66_000,
        end: 103_000,
        status: "done",
      },
      {
        id: "edit",
        name: "edit_file",
        kind: "tool",
        meta: "src/middleware.ts",
        start: 104_000,
        end: 104_700,
        status: "done",
      },
      {
        id: "test",
        name: "pnpm test",
        kind: "tool",
        meta: "src/auth",
        start: 108_000,
        end: 126_000,
        status: "done",
      },
      {
        id: "writer",
        name: "test-writer",
        kind: "agent",
        meta: "subagent",
        start: 130_000,
        status: "running",
      },
    ],
  },
];

export function TraceDemo() {
  const [t0] = React.useState(() => Date.now() - 171_000);
  return <TraceWaterfall spans={TRACE} startedAt={t0} />;
}
