import { AgentFleet, type FleetAgent } from "@kura/components/agent-fleet";
import type { AgentStatus } from "@kura/components/status-glyph/status-glyph";
import { TaskList, type TaskListItem } from "@kura/components/task-list";
import { ToolCall } from "@kura/components/tool-call";
import { type TraceSpan, TraceWaterfall } from "@kura/components/trace-waterfall";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { E, mix, tw } from "../ease";
import { Plane } from "../plane";
import { B } from "../timing";

/**
 * 0:12.2, the hats come in. The real components, pulled out of the page and staged in space, one
 * per beat or two; their state is driven by the frame (spans grow, agents finish, steps tick).
 */

const S16 = (from: number, f: number) =>
  Math.max(0, Math.floor((f - B(from)) / (B(from + 0.25) - B(from))) + 1);

/** Beats 24–26: the trace, laid back, the camera running along its time axis. */
export function MTrace() {
  const f = useCurrentFrame() + B(24);
  const t = tw(f, B(24), B(26), 0, 1, E.inOut);
  const now = mix(5200, 14200, tw(f, B(24), B(25.75), 0, 1, E.out));
  const run = (
    id: string,
    s: number,
    e: number,
    rest: Pick<TraceSpan, "name" | "kind"> & Partial<TraceSpan>,
  ): TraceSpan => ({
    id,
    start: s,
    ...(now >= e ? { end: e, status: "done" as const } : { status: "running" as const }),
    ...rest,
  });
  const spans: TraceSpan[] = [
    {
      id: "run",
      name: "Migrate sessions",
      kind: "agent" as const,
      meta: "claude-opus-5-5",
      start: 0,
      status: "running" as const,
      children: [
        run("plan", 0, 3100, { name: "Plan the migration", kind: "llm" as const }),
        run("explorer", 900, 6100, {
          name: "explorer",
          kind: "agent" as const,
          meta: "23 call sites",
        }),
        run("read", 3200, 3700, {
          name: "read_file",
          kind: "tool" as const,
          meta: "src/auth/client.ts",
        }),
        run("patch", 3800, 9800, { name: "Write the patch", kind: "llm" as const }),
        run("tests", 6400, 12600, {
          name: "test-writer",
          kind: "agent" as const,
          meta: "session mocks",
        }),
        run("bash", 9900, 11800, {
          name: "bash",
          kind: "tool" as const,
          meta: "pnpm test src/auth",
        }),
        run("review", 11900, 14200, { name: "reviewer", kind: "agent" as const }),
      ],
    },
  ];
  return (
    <AbsoluteFill>
      <Plane
        width={820}
        zoom={4.2}
        x={mix(1240, 560, t)}
        y={mix(700, 620, t)}
        rx={36}
        ry={-18}
        rz={-9}
        perspective={1100}
      >
        <TraceWaterfall spans={spans} now={now} />
      </Plane>
    </AbsoluteFill>
  );
}

const FLEET: FleetAgent[] = [
  {
    id: "explorer",
    name: "explorer",
    role: "Maps call sites",
    status: "done",
    activity: "Found 23 calls to fetchUser()",
    tokens: 84_200,
  },
  {
    id: "planner",
    name: "planner",
    role: "Orders the work",
    status: "done",
    activity: "Plan of 6 steps",
    tokens: 12_900,
  },
  {
    id: "migrator",
    name: "migrator",
    role: "Moves sessions",
    status: "running",
    activity: "Patching src/auth/client.ts",
    progress: 0.4,
    tokens: 61_400,
  },
  {
    id: "test-writer",
    name: "test-writer",
    role: "Updates tests",
    status: "running",
    activity: "Rewriting the session mocks",
    progress: 0.2,
    tokens: 31_900,
  },
  {
    id: "reviewer",
    name: "reviewer",
    role: "Reviews the diff",
    status: "queued",
    activity: "Starts when the patches land",
  },
];
/** Beat 26: the fleet, close, turning; agents advance on the sixteenths. */
export function MFleet() {
  const f = useCurrentFrame() + B(26);
  const k = S16(26, f);
  const agents = FLEET.map((a) => {
    if (a.id === "migrator")
      return {
        ...a,
        progress: Math.min(1, 0.4 + 0.15 * k),
        status: (k >= 4 ? "done" : "running") as AgentStatus,
      };
    if (a.id === "test-writer") return { ...a, progress: 0.2 + 0.12 * k };
    if (a.id === "reviewer" && k >= 3)
      return {
        ...a,
        status: "running" as AgentStatus,
        activity: "Reading the diff",
        progress: 0.1,
      };
    return a;
  });
  const t = tw(f, B(26), B(27), 0, 1, E.out);
  return (
    <AbsoluteFill>
      <Plane
        width={560}
        zoom={4.8}
        x={mix(1600, 1500, t)}
        y={mix(620, 560, t)}
        rx={10}
        ry={mix(32, 22, t)}
        rz={-3}
        perspective={1100}
      >
        <AgentFleet agents={agents} />
      </Plane>
    </AbsoluteFill>
  );
}

const STEPS = [
  "Map every call to fetchUser()",
  "Move session refresh to the edge",
  "Patch src/auth/client.ts",
  "Update the session mocks",
  "Run the auth suite",
  "Open the pull request",
];
/** Beat 27: the plan, from below; steps tick to done on the sixteenths. */
export function MPlan() {
  const f = useCurrentFrame() + B(27);
  const k = S16(27, f);
  const items: TaskListItem[] = STEPS.map((title, i) => ({
    id: `s${i}`,
    title,
    status: (i < 1 + k ? "done" : i === 1 + k ? "running" : "queued") as AgentStatus,
    durationMs: i < 1 + k ? 4_000 + i * 2_300 : undefined,
  }));
  const t = tw(f, B(27), B(28), 0, 1, E.out);
  return (
    <AbsoluteFill>
      <Plane
        width={460}
        zoom={4.6}
        x={mix(1060, 1000, t)}
        y={mix(640, 560, t)}
        rx={-26}
        ry={-16}
        rz={4}
        perspective={1100}
      >
        <TaskList items={items} title="Plan" collapseCompleted={false} />
      </Plane>
    </AbsoluteFill>
  );
}

/** Beat 28: tool calls, edge-on to face-on. */
export function MTools() {
  const f = useCurrentFrame() + B(28);
  const open = tw(f, B(28), B(28) + 18, 0, 1, E.back);
  const k = S16(28, f);
  return (
    <AbsoluteFill>
      <Plane
        width={520}
        zoom={4.4}
        x={1080}
        y={560}
        rx={8}
        ry={mix(-88, -24, open)}
        rz={-2}
        perspective={1100}
      >
        <div className="flex flex-col gap-2">
          <ToolCall
            name="read_file"
            status="success"
            duration={96}
            args={{ path: "src/auth/client.ts" }}
          />
          <ToolCall
            name="edit_file"
            status={k >= 2 ? "success" : "running"}
            duration={k >= 2 ? 412 : undefined}
            args={{ path: "src/auth/client.ts" }}
          />
          <ToolCall
            name="run_tests"
            status={k >= 4 ? "success" : "running"}
            duration={k >= 4 ? 8_210 : undefined}
            args={{ filter: "src/auth" }}
          />
        </div>
      </Plane>
    </AbsoluteFill>
  );
}
