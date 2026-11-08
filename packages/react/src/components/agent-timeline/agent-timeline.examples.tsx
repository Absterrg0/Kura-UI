"use client";

import { FileText, RotateCcw, Terminal } from "lucide-react";
import * as React from "react";
import { Button } from "../button";
import { ToolCall } from "../tool-call";
import { AgentTimeline, type AgentTimelineStep } from "./agent-timeline";

export function AgentTimelineMinimal() {
  return (
    <AgentTimeline
      className="w-full max-w-md"
      steps={[
        { id: "read", title: "Read the failing test", status: "done", duration: 1200 },
        { id: "fix", title: "Patch the date parser", status: "active" },
        { id: "verify", title: "Re-run the test suite", status: "queued" },
      ]}
    />
  );
}

type Plan = { id: string; title: string; ms: number; sub?: { id: string; title: string }[] };

const PLAN: Plan[] = [
  { id: "explore", title: "Read how sessions are fetched", ms: 1400 },
  {
    id: "plan",
    title: "Plan the move to getSession()",
    ms: 2200,
    sub: [
      { id: "plan-a", title: "Find the 11 call sites of fetchUser()" },
      { id: "plan-b", title: "Check what the auth middleware caches" },
    ],
  },
  { id: "edit", title: "Edit 4 files", ms: 2600 },
  { id: "test", title: "Run the test suite", ms: 2000 },
  { id: "pr", title: "Open a draft pull request", ms: 1200 },
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
  const [run, setRun] = React.useState(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: `run` replays the plan
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
  }, [run]);

  const done = cursor >= PLAN.length;
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <AgentTimeline steps={stepsAt(cursor, startedAt)} label="Migration plan" size="md" />
      <div className="flex items-center justify-between pt-3 shadow-[inset_0_1px_0_var(--kura-border-subtle)]">
        <span className="font-kura-mono text-[11px] text-kura-fg-subtle uppercase tabular-nums tracking-[0.12em]">
          {done ? "Done" : "Running"} · {Math.min(cursor, PLAN.length)}/{PLAN.length} steps
        </span>
        <Button variant="secondary" size="sm" disabled={!done} onClick={() => setRun((r) => r + 1)}>
          <RotateCcw /> Replay
        </Button>
      </div>
    </div>
  );
}

export function AgentTimelineStates() {
  return (
    <AgentTimeline
      size="sm"
      className="w-full max-w-sm"
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
    <div className="relative flex w-full max-w-lg flex-col gap-4 rounded-kura-md bg-kura-surface p-5 shadow-kura-sm before:pointer-events-none before:absolute before:inset-[3px] before:rounded-[5px] before:border before:border-kura-border-subtle">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between font-kura-mono text-[10px] text-kura-fg-subtle uppercase tabular-nums tracking-[0.14em]">
          <span>Run 14 · kura/web</span>
          <span>Step 2 of 3</span>
        </div>
        <h3 className="font-kura-display text-[19px] text-kura-fg leading-snug">
          Fix the flaky date test
        </h3>
      </div>
      <AgentTimeline
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
                icon={<FileText />}
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
                icon={<Terminal />}
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
