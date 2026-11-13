"use client";

import * as React from "react";
import { ToolCall } from "../tool-call";
import { AgentTimeline, type AgentTimelineStep } from "./agent-timeline";

export function AgentTimelineMinimal() {
  return (
    <AgentTimeline
      className="w-full max-w-md rounded-kura-xl bg-kura-surface p-4 shadow-kura-surface"
      steps={[
        { id: "read", title: "Read the failing test", status: "done", duration: 1200 },
        {
          id: "cause",
          title: "Find the cause",
          status: "done",
          duration: 4800,
          description: "parseDate() ignores the TZ offset",
        },
        { id: "fix", title: "Patch the date parser", status: "active" },
        { id: "verify", title: "Re-run the test suite", status: "queued" },
      ]}
    />
  );
}

type Plan = { id: string; title: string; ms: number; sub?: { id: string; title: string }[] };

const PLAN: Plan[] = [
  { id: "explore", title: "Explore the repository", ms: 1400 },
  {
    id: "plan",
    title: "Plan the migration",
    ms: 2200,
    sub: [
      { id: "plan-a", title: "List call sites of fetchUser()" },
      { id: "plan-b", title: "Check the auth middleware" },
    ],
  },
  { id: "edit", title: "Edit 4 files", ms: 2600 },
  { id: "test", title: "Run the test suite", ms: 2000 },
  { id: "pr", title: "Open a pull request", ms: 1200 },
];

/** Derives step states from a cursor that walks through the plan. */
function stepsAt(cursor: number, startedAt: number | undefined): AgentTimelineStep[] {
  return PLAN.map((p, i) => ({
    id: p.id,
    title: p.title,
    status: i < cursor ? "done" : i === cursor ? "active" : "queued",
    duration: i < cursor ? p.ms : undefined,
    startedAt: i === cursor ? startedAt : undefined,
    description: p.id === "edit" && i <= cursor ? "src/api/user.ts, src/lib/auth.ts +2" : undefined,
    steps: p.sub?.map((s, j) => ({
      id: s.id,
      title: s.title,
      status:
        i < cursor ? "done" : i === cursor ? (j === 0 ? "done" : "active") : ("queued" as const),
      duration: i < cursor || (i === cursor && j === 0) ? 800 + j * 400 : undefined,
    })),
  }));
}

export function AgentTimelineFull() {
  const [cursor, setCursor] = React.useState(0);
  const [startedAt, setStartedAt] = React.useState<number>();
  React.useEffect(() => {
    let i = 0;
    setCursor(0);
    setStartedAt(Date.now());
    let id: ReturnType<typeof setTimeout>;
    const next = () => {
      id = setTimeout(() => {
        i++;
        setCursor(i);
        setStartedAt(Date.now());
        if (i < PLAN.length) next();
      }, PLAN[i]!.ms);
    };
    next();
    return () => clearTimeout(id);
  }, []);

  return (
    <div className="flex w-full max-w-md flex-col rounded-kura-xl bg-kura-surface shadow-kura-surface">
      <div className="flex h-11 items-center gap-3 px-4">
        <h3 className="truncate font-semibold text-[13px] text-kura-fg tracking-[-0.01em]">
          Migrate to the new auth client
        </h3>
        <span className="shrink-0 font-kura-mono text-[12px] text-kura-fg-subtle tabular-nums">
          {Math.min(cursor, PLAN.length)} of {PLAN.length}
        </span>
      </div>
      <AgentTimeline
        className="px-4 pb-4"
        steps={stepsAt(cursor, startedAt)}
        label="Migration plan"
        size="md"
      />
    </div>
  );
}

export function AgentTimelineStates() {
  return (
    <AgentTimeline
      size="sm"
      className="w-full max-w-sm rounded-kura-xl bg-kura-surface p-4 shadow-kura-surface"
      steps={[
        { id: "1", title: "Install dependencies", status: "done", duration: 8300 },
        { id: "2", title: "Generate types", status: "skipped", description: "Already up to date" },
        {
          id: "3",
          title: "Build the docs",
          status: "failed",
          duration: 21_400,
          description: "next build exited with code 1",
        },
        { id: "4", title: "Deploy preview", status: "queued" },
      ]}
    />
  );
}

export function AgentTimelineWithTools() {
  return (
    <div className="flex w-full max-w-lg flex-col rounded-kura-xl bg-kura-surface shadow-kura-surface">
      <div className="flex h-11 items-center gap-3 px-4">
        <h3 className="font-semibold text-[13px] text-kura-fg tracking-[-0.01em]">
          Fix flaky date test
        </h3>
        <span className="font-kura-mono text-[12px] text-kura-fg-subtle tabular-nums">1 of 3</span>
      </div>
      <AgentTimeline
        className="px-4 pb-4"
        label="Fix flaky date test"
        steps={[
          {
            id: "read",
            title: "Read the failing test",
            status: "done",
            duration: 900,
            content: (
              <ToolCall
                variant="inline"
                name="read_file"
                status="success"
                duration={120}
                args={{ path: "src/date.test.ts" }}
              />
            ),
          },
          {
            id: "run",
            title: "Reproduce with a fixed timezone",
            status: "active",
            content: (
              <ToolCall
                variant="inline"
                name="run_command"
                status="running"
                args={{ command: "TZ=Pacific/Auckland pnpm test date" }}
              />
            ),
          },
          { id: "fix", title: "Patch and verify", status: "queued" },
        ]}
      />
    </div>
  );
}
