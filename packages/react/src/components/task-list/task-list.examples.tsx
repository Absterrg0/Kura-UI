"use client";

import { RotateCcw } from "lucide-react";
import * as React from "react";
import { IconButton } from "../icon-button";
import { TaskList, type TaskListItem } from "./task-list";

export function TaskListMinimal() {
  return (
    <TaskList
      className="w-full max-w-md"
      items={[
        { id: "read", title: "Read routes in src/app", status: "done", durationMs: 21_400 },
        { id: "map", title: "Map call sites of fetchUser()", status: "done", durationMs: 48_200 },
        {
          id: "patch",
          title: "Patch src/auth/client.ts",
          status: "running",
          startedAt: Date.now() - 34_000,
        },
        { id: "test", title: "Run pnpm test", status: "queued" },
      ]}
    />
  );
}

type Beat = { at: number; patch: (items: TaskListItem[]) => TaskListItem[] };

const PLAN: TaskListItem[] = [
  { id: "routes", title: "Read routes in src/app", status: "done", durationMs: 21_400 },
  {
    id: "map",
    title: "Map call sites of fetchUser()",
    status: "done",
    durationMs: 48_200,
    detail: "14 call sites across 9 files",
  },
  {
    id: "client",
    title: "Patch src/auth/client.ts",
    status: "done",
    durationMs: 72_900,
  },
  { id: "middleware", title: "Patch src/middleware.ts", status: "running" },
  {
    id: "tests",
    title: "Update tests",
    status: "queued",
    children: [
      { id: "tests-login", title: "login.test.ts", status: "queued" },
      { id: "tests-session", title: "session.test.ts", status: "queued" },
    ],
  },
  { id: "run", title: "Run pnpm test", status: "queued" },
  { id: "review", title: "Review the diff", status: "queued" },
  { id: "pr", title: "Open pull request", status: "queued" },
];

function set(items: TaskListItem[], id: string, patch: Partial<TaskListItem>): TaskListItem[] {
  return items.map((item) =>
    item.id === id
      ? { ...item, ...patch }
      : item.children
        ? { ...item, children: set([...item.children], id, patch) }
        : item,
  );
}

function insertAfter(items: TaskListItem[], id: string, next: TaskListItem): TaskListItem[] {
  const i = items.findIndex((item) => item.id === id);
  return [...items.slice(0, i + 1), next, ...items.slice(i + 1)];
}

/** One believable run: tests fail, the agent adds a fix task, re-runs and opens the PR. */
const SCRIPT: Beat[] = [
  {
    at: 2600,
    patch: (s) =>
      set(
        set(set(s, "middleware", { status: "done", durationMs: 41_300 }), "tests", {
          status: "running",
          startedAt: Date.now(),
        }),
        "tests-login",
        { status: "running", startedAt: Date.now() },
      ),
  },
  {
    at: 4400,
    patch: (s) =>
      set(set(s, "tests-login", { status: "done", durationMs: 18_200 }), "tests-session", {
        status: "running",
        startedAt: Date.now(),
      }),
  },
  {
    at: 6000,
    patch: (s) =>
      set(
        set(set(s, "tests-session", { status: "done", durationMs: 12_700 }), "tests", {
          status: "done",
          durationMs: 30_900,
        }),
        "run",
        { status: "running", startedAt: Date.now(), detail: "pnpm test --filter @acme/web" },
      ),
  },
  {
    at: 8400,
    patch: (s) =>
      insertAfter(
        set(s, "run", {
          status: "failed",
          durationMs: 38_400,
          detail: "login.test.ts › refreshes an expired session — expected 200, received 401",
        }),
        "run",
        {
          id: "fix",
          title: "Retry refresh with the rotated token",
          status: "running",
          startedAt: Date.now(),
          detail: "src/auth/client.ts:88",
        },
      ),
  },
  {
    at: 11_000,
    patch: (s) =>
      set(set(s, "fix", { status: "done", durationMs: 52_100, detail: undefined }), "run", {
        status: "running",
        startedAt: Date.now(),
        detail: "pnpm test --filter @acme/web",
      }),
  },
  {
    at: 13_200,
    patch: (s) =>
      set(set(s, "run", { status: "done", durationMs: 36_800, detail: "142 passed" }), "review", {
        status: "running",
        startedAt: Date.now(),
        detail: "reviewer subagent",
      }),
  },
  {
    at: 15_400,
    patch: (s) =>
      set(
        set(s, "review", { status: "done", durationMs: 186_000, detail: "2 nits, 0 blocking" }),
        "pr",
        { status: "running", startedAt: Date.now() },
      ),
  },
  {
    at: 17_000,
    patch: (s) => set(s, "pr", { status: "done", durationMs: 48_100, detail: "acme/web#482" }),
  },
];

export function TaskListFull() {
  const [items, setItems] = React.useState<TaskListItem[]>(() =>
    set(PLAN, "middleware", { startedAt: Date.now() - 27_000 }),
  );
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [run, setRun] = React.useState(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: `run` replays the script
  React.useEffect(() => {
    setItems(set(PLAN, "middleware", { startedAt: Date.now() - 27_000 }));
    const timers = SCRIPT.map((beat) => setTimeout(() => setItems(beat.patch), beat.at));
    return () => timers.forEach(clearTimeout);
  }, [run]);

  return (
    <TaskList
      className="w-full max-w-md"
      items={items}
      label="Migrate to @acme/auth client"
      selectedId={selectedId}
      onSelect={(id) => setSelectedId((cur) => (cur === id ? null : id))}
      actions={
        <IconButton
          label="Replay"
          icon={<RotateCcw />}
          variant="ghost"
          size="xs"
          className="-mr-1.5"
          onClick={() => setRun((r) => r + 1)}
        />
      }
    />
  );
}

export function TaskListStates() {
  return (
    <TaskList
      className="w-full max-w-md"
      title="Release checklist"
      collapseCompleted={false}
      items={[
        { id: "a", title: "Bump version to 2.4.0", status: "done", durationMs: 3_200 },
        {
          id: "b",
          title: "Regenerate API types",
          status: "skipped",
          detail: "Schema unchanged since 2.3.1",
        },
        {
          id: "c",
          title: "Run database migration 0042_sessions",
          status: "waiting",
          detail: "Needs your approval — touches production",
        },
        {
          id: "d",
          title: "Build preview deployment",
          status: "failed",
          durationMs: 84_100,
          detail: "next build exited with code 1 — Type error in src/middleware.ts:31",
        },
        { id: "e", title: "Notify #releases", status: "paused" },
        { id: "f", title: "Tag release", status: "queued" },
      ]}
    />
  );
}

const OUTPUT: Record<string, string[]> = {
  routes: [
    "$ rg --files src/app | rg route",
    "src/app/api/session/route.ts",
    "src/app/login/page.tsx",
    "src/app/(app)/layout.tsx",
  ],
  map: [
    "explorer · 14 call sites of fetchUser()",
    "src/app/(app)/layout.tsx:12",
    "src/components/nav/user-menu.tsx:8",
    "src/lib/server/session.ts:44",
    "… 11 more",
  ],
  client: [
    "Edited src/auth/client.ts  +64 −22",
    "Replaced legacy REST session calls",
    "with createAuthClient({ baseUrl })",
  ],
  run: [
    "$ pnpm test",
    "✕ login.test.ts › refreshes an expired session",
    "  expected 200, received 401",
    "141 passed, 1 failed (38.4s)",
  ],
};

export function TaskListComposition() {
  const [selectedId, setSelectedId] = React.useState("run");
  const [t0] = React.useState(() => Date.now());
  const items: TaskListItem[] = [
    { id: "routes", title: "Read routes", status: "done", durationMs: 21_400 },
    { id: "map", title: "Map fetchUser() calls", status: "done", durationMs: 48_200 },
    { id: "client", title: "Patch auth client", status: "done", durationMs: 72_900 },
    {
      id: "run",
      title: "Run pnpm test",
      status: "failed",
      durationMs: 38_400,
      detail: "1 failed",
    },
    { id: "fix", title: "Fix token refresh", status: "running", startedAt: t0 - 19_000 },
  ];
  const lines = OUTPUT[selectedId] ?? ["No output yet."];
  return (
    <div className="grid w-full max-w-2xl overflow-hidden rounded-kura-xl bg-kura-surface shadow-kura-sm sm:grid-cols-[240px_1fr]">
      <div className="border-kura-border-subtle border-b sm:border-r sm:border-b-0">
        <div className="flex h-10 items-center px-3.5 font-medium text-[13px]">Plan</div>
        <TaskList
          variant="plain"
          collapseCompleted={false}
          items={items}
          selectedId={selectedId}
          onSelect={(id) => setSelectedId(id)}
          label="Plan"
        />
      </div>
      <div className="flex min-w-0 flex-col">
        <div className="flex h-10 items-center gap-2 border-kura-border-subtle border-b px-3.5">
          <span className="truncate font-medium text-[13px]">
            {items.find((i) => i.id === selectedId)?.title}
          </span>
          <span className="ml-auto font-kura-mono text-[12px] text-kura-fg-subtle">output</span>
        </div>
        <pre className="m-0 min-h-40 flex-1 whitespace-pre-wrap bg-kura-surface-sunken px-3.5 py-3 font-kura-mono text-[12px] text-kura-fg-muted leading-5 [overflow-wrap:anywhere]">
          {lines.join("\n")}
        </pre>
      </div>
    </div>
  );
}
