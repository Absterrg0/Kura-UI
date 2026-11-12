"use client";

import * as React from "react";
import { ToolCall } from "../tool-call";
import { AgentFleet, type FleetAgent } from "./agent-fleet";

const ago = (s: number) => Date.now() - s * 1000;

export function AgentFleetMinimal() {
  const [t] = React.useState(() => Date.now());
  return (
    <AgentFleet
      className="w-full max-w-xl"
      agents={[
        {
          id: "explorer",
          name: "explorer",
          role: "Maps call sites",
          status: "done",
          activity: "Found 23 calls to fetchUser() in 9 files",
          startedAt: t - 540_000,
          endedAt: t - 446_000,
          tokens: 84_200,
        },
        {
          id: "test-writer",
          name: "test-writer",
          role: "Updates tests",
          status: "running",
          activity: "Rewriting session mocks in login.test.ts",
          progress: 0.4,
          startedAt: t - 128_000,
          tokens: 31_900,
        },
        {
          id: "reviewer",
          name: "reviewer",
          role: "Reviews the diff",
          status: "queued",
          activity: "Starts when the patches land",
        },
      ]}
    />
  );
}

type Beat = Partial<Record<string, Partial<FleetAgent>>>;

/** Each beat patches some agents; the fleet advances one beat every ~1.6s, then settles. */
const BEATS: Beat[] = [
  {},
  {
    client: { progress: 0.71, tokens: 61_400, cost: 0.17 },
    tests: { progress: 0.34, tokens: 22_800 },
  },
  {
    middleware: {
      status: "running",
      activity: "Moving session refresh into the edge middleware",
      progress: 0.42,
    },
    tests: { progress: 0.48, tokens: 29_300 },
  },
  {
    client: {
      status: "done",
      activity: "Patched 9 call sites · +64 −41",
      progress: 1,
      tokens: 72_900,
      cost: 0.2,
    },
    middleware: { progress: 0.7, tokens: 38_100 },
  },
  {
    tests: {
      activity: "Running pnpm test --filter web",
      progress: 0.81,
      tokens: 40_600,
    },
    middleware: {
      status: "done",
      activity: "Patched src/middleware.ts · +38 −12",
      progress: 1,
      tokens: 44_500,
      cost: 0.12,
    },
  },
  {
    tests: {
      status: "failed",
      activity: "1 failed · login.test.ts › refreshes an expired session",
      tokens: 42_300,
      cost: 0.11,
    },
  },
  {
    reviewer: {
      status: "running",
      activity: "Reading the diff: 7 files, +142 −38",
      progress: 0.36,
      tokens: 18_200,
      cost: 0.05,
    },
  },
];

function initialFleet(): FleetAgent[] {
  return [
    {
      id: "explorer",
      name: "explorer",
      role: "Maps call sites",
      status: "done",
      activity: "Found 23 calls to fetchUser() in 9 files",
      startedAt: ago(612),
      endedAt: ago(518),
      tokens: 84_200,
      cost: 0.21,
    },
    {
      id: "docs",
      name: "docs-reader",
      role: "Reads @acme/auth docs",
      status: "done",
      activity: "Summarized the session and refresh APIs",
      startedAt: ago(605),
      endedAt: ago(561),
      tokens: 26_700,
      cost: 0.07,
    },
    {
      id: "client",
      name: "client-patcher",
      role: "Patches src/auth/client.ts",
      status: "running",
      activity: "Replacing fetchUser() with auth.getSession()",
      progress: 0.55,
      startedAt: ago(214),
      tokens: 53_100,
      cost: 0.15,
    },
    {
      id: "middleware",
      name: "middleware-patcher",
      role: "Patches src/middleware.ts",
      status: "waiting",
      activity: "Needs approval to edit src/middleware.ts",
      progress: 0.3,
      startedAt: ago(201),
      tokens: 31_400,
      cost: 0.09,
    },
    {
      id: "tests",
      name: "test-writer",
      role: "Updates tests",
      status: "running",
      activity: "Rewriting session mocks in login.test.ts",
      progress: 0.22,
      startedAt: ago(96),
      tokens: 17_600,
      cost: 0.05,
    },
    {
      id: "reviewer",
      name: "reviewer",
      role: "Reviews the diff",
      status: "queued",
      activity: "Starts when the patches land",
    },
  ];
}

export function AgentFleetFull() {
  const [agents, setAgents] = React.useState<FleetAgent[]>(initialFleet);
  const [beat, setBeat] = React.useState(0);
  const [selectedId, setSelectedId] = React.useState<string | null>("client");

  React.useEffect(() => {
    if (beat >= BEATS.length - 1) return;
    const t = setTimeout(() => {
      const next = beat + 1;
      const patch = BEATS[next] ?? {};
      const now = Date.now();
      setAgents((list) =>
        list.map((a) => {
          const p = patch[a.id];
          if (!p) return a;
          const merged = { ...a, ...p };
          if (p.status === "running" && a.startedAt == null) merged.startedAt = now;
          if ((p.status === "done" || p.status === "failed") && a.endedAt == null)
            merged.endedAt = now;
          return merged;
        }),
      );
      setBeat(next);
    }, 1600);
    return () => clearTimeout(t);
  }, [beat]);

  return (
    <AgentFleet
      className="w-full max-w-2xl"
      agents={agents}
      selectedId={selectedId}
      onSelect={setSelectedId}
    />
  );
}

export function AgentFleetCompact() {
  const [agents] = React.useState(initialFleet);
  return (
    <AgentFleet
      className="w-full max-w-2xl"
      density="compact"
      agents={agents}
      defaultSelectedId="middleware"
      onSelect={() => {}}
    />
  );
}

export function AgentFleetEmpty() {
  return <AgentFleet className="w-full max-w-xl" agents={[]} />;
}

const CALLS: Record<string, React.ReactNode> = {
  explorer: (
    <>
      <ToolCall
        name="grep"
        args={{ pattern: "fetchUser\\(", path: "src" }}
        status="success"
        duration={420}
        summary="fetchUser\( in src/ · 23 matches"
        variant="inline"
        className="mx-0 w-full"
      />
      <ToolCall
        name="read_file"
        args={{ path: "src/routes/api/session.ts" }}
        status="success"
        duration={180}
        variant="inline"
        className="mx-0 w-full"
      />
    </>
  ),
  "test-writer": (
    <>
      <ToolCall
        name="edit_file"
        args={{ path: "src/auth/__tests__/login.test.ts" }}
        status="success"
        duration={2_400}
        summary="login.test.ts · +18 −9"
        variant="inline"
        className="mx-0 w-full"
      />
      <ToolCall
        name="bash"
        args={{ command: "pnpm test --filter web" }}
        status="running"
        variant="inline"
        className="mx-0 w-full"
      />
    </>
  ),
  reviewer: <p className="px-1.5 text-[13px] text-kura-fg-subtle">No tool calls yet.</p>,
};

export function AgentFleetComposition() {
  const [t] = React.useState(() => Date.now());
  const [selectedId, setSelectedId] = React.useState("test-writer");
  const agents: FleetAgent[] = [
    {
      id: "explorer",
      name: "explorer",
      role: "Maps call sites",
      status: "done",
      activity: "Found 23 calls to fetchUser() in 9 files",
      startedAt: t - 540_000,
      endedAt: t - 446_000,
      tokens: 84_200,
      cost: 0.21,
    },
    {
      id: "test-writer",
      name: "test-writer",
      role: "Updates tests",
      status: "running",
      activity: "Running pnpm test --filter web",
      progress: 0.78,
      startedAt: t - 151_000,
      tokens: 40_600,
      cost: 0.11,
    },
    {
      id: "reviewer",
      name: "reviewer",
      role: "Reviews the diff",
      status: "queued",
      activity: "Starts when tests pass",
    },
  ];
  const agent = agents.find((a) => a.id === selectedId);
  return (
    <div className="grid w-full max-w-3xl gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <AgentFleet
        agents={agents}
        density="compact"
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
      <section
        aria-labelledby="fleet-detail-title"
        className="flex min-w-0 flex-col overflow-hidden rounded-kura-xl bg-kura-surface shadow-kura-sm"
      >
        <div className="flex h-10 items-center gap-2 border-kura-border-subtle border-b px-3.5">
          <h4 id="fleet-detail-title" className="font-medium text-[13px]">
            {agent?.name}
          </h4>
          <span className="truncate text-[12px] text-kura-fg-subtle">{agent?.role}</span>
        </div>
        <div className="flex flex-col gap-0.5 p-2">{CALLS[selectedId]}</div>
      </section>
    </div>
  );
}
