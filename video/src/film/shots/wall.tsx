import { AgentFleet } from "@kura/components/agent-fleet";
import { AgentTimeline } from "@kura/components/agent-timeline";
import { ApprovalPrompt } from "@kura/components/approval-prompt";
import { Checkpoints } from "@kura/components/checkpoints";
import { Composer } from "@kura/components/composer";
import { ContextPanel } from "@kura/components/context-meter";
import { DiffView } from "@kura/components/diff-view";
import { FileChanges } from "@kura/components/file-changes";
import { RunHeader } from "@kura/components/run-header";
import { TaskList } from "@kura/components/task-list";
import { Terminal } from "@kura/components/terminal";
import { ToolCall } from "@kura/components/tool-call";
import { TraceWaterfall } from "@kura/components/trace-waterfall";
import type * as React from "react";
import { AbsoluteFill } from "remotion";
import { filmNow } from "../../lib/clock";
import { DIFF, fleet, planItems, RUN_STARTED, TEST_LINES, traceSpans } from "../data";
import { clamp, E, mix, tw } from "../ease";
import { K } from "../palette";
import { useF } from "../shot";
import { LIFT } from "../stage";
import { B } from "../timing";

export const CONTEXT = [
  { id: "system", label: "System", tokens: 18_000 },
  { id: "conversation", label: "Conversation", tokens: 62_000 },
  { id: "tools", label: "Tools", tokens: 28_000 },
  { id: "files", label: "Files", tokens: 36_000 },
];

/** Every staged component of the run, live, for the wall and the montage. */
export function useParts(f: number): Record<string, React.ReactNode> {
  const now = 14_000 + ((f % 600) / 600) * 0;
  return {
    plan: (
      <TaskList
        items={planItems(6)}
        title="Migrate sessions to the edge"
        collapseCompleted={false}
      />
    ),
    fleet: <AgentFleet agents={fleet(8)} />,
    trace: <TraceWaterfall spans={traceSpans(now)} now={now} />,
    diff: <DiffView diff={DIFF} maxHeight={330} />,
    term: (
      <Terminal
        command="pnpm test src/auth"
        lines={TEST_LINES}
        status="done"
        exitCode={0}
        cwd="~/acme/web"
        maxHeight={300}
      />
    ),
    approval: (
      <ApprovalPrompt
        title="Run the migration on production"
        agent={{ name: "migrator", detail: "step 6 of the plan" }}
        command="pnpm db:migrate --env production"
        risk="high"
        decision="approved"
        shortcuts={false}
      />
    ),
    run: (
      <RunHeader
        title="Migrate sessions to the edge"
        agent="migrator"
        model="claude-opus-5-5"
        status="running"
        variant="panel"
        startedAt={RUN_STARTED()}
        tokens={{ input: 412_000, output: 61_300 }}
        progress={{ done: 5, total: 6 }}
        branch="edge-sessions"
      />
    ),
    context: <ContextPanel max={200_000} segments={CONTEXT} />,
    tools: (
      <div className="flex flex-col gap-2">
        <ToolCall
          name="read_file"
          status="success"
          duration={96}
          args={{ path: "src/auth/client.ts" }}
        />
        <ToolCall
          name="edit_file"
          status="success"
          duration={412}
          args={{ path: "src/auth/client.ts" }}
        />
        <ToolCall
          name="run_tests"
          status="success"
          duration={8_210}
          args={{ filter: "src/auth" }}
        />
      </div>
    ),
    files: (
      <FileChanges
        files={[
          { path: "src/auth/client.ts", status: "M", additions: 14, deletions: 17 },
          { path: "src/auth/edge.ts", status: "A", additions: 42, deletions: 0 },
          { path: "src/middleware.ts", status: "M", additions: 6, deletions: 2 },
          { path: "src/auth/__tests__/session.test.ts", status: "M", additions: 31, deletions: 12 },
        ]}
      />
    ),
    checkpoints: (
      <Checkpoints
        checkpoints={[
          {
            id: "c3",
            label: "Ran the auth suite",
            at: filmNow() - 60_000,
            kind: "auto",
            current: true,
            filesChanged: 4,
          },
          {
            id: "c2",
            label: "Patched src/auth/client.ts",
            at: filmNow() - 9 * 60_000,
            kind: "auto",
            filesChanged: 2,
          },
          { id: "c1", label: "Before the migration", at: filmNow() - 41 * 60_000, kind: "manual" },
        ]}
      />
    ),
    timeline: (
      <AgentTimeline
        steps={[
          { id: "a", title: "Read the failing test", status: "done", duration: 1200 },
          { id: "b", title: "Find the cause", status: "done", duration: 4800 },
          { id: "c", title: "Patch the session refresh", status: "done", duration: 9200 },
          { id: "d", title: "Re-run the suite", status: "done", duration: 8200 },
        ]}
      />
    ),
    composer: <Composer defaultValue="Now move the rate limiter to the edge too" />,
  };
}

/** Wall layout: columns of parts (masonry), each part at its own width. */
const COLUMNS: string[][] = [
  ["files", "fleet", "tools"],
  ["checkpoints", "tools", "context"],
  ["run", "plan", "timeline"],
  ["approval", "trace", "files"],
  ["fleet", "diff", "run"],
  ["composer", "term", "plan"],
  ["timeline", "context", "checkpoints"],
];
const COL_W = 520;
/** Roughly the middle of the wall's height (layout px at zoom 2): the pivot it turns about. */
const MID = 1150;
const GAP = 44;

/**
 * 0:46.8. Two seconds: pull back from the approval prompt into a wall of every part of the run, live, laid
 * back in perspective: the scale moment. In the last half beat the wall collapses to one dot.
 */
export function Wall() {
  const f = useF();
  const parts = useParts(f);
  const t = tw(f, B(92), B(95.5), 0, 1, E.out);
  const collapse = E.in(clamp((f - B(95.5)) / (B(96) - B(95.5))));
  const Z = 2;
  const z = mix(420, -650, t);
  const rx = mix(2, 12, t);
  const rz = mix(0, -6, t);
  const W = (COLUMNS.length * COL_W + (COLUMNS.length - 1) * GAP) * Z;
  return (
    <AbsoluteFill style={{ perspective: 1800, perspectiveOrigin: "50% 45%" }}>
      <div
        style={{
          position: "absolute",
          left: 960 - W / 2,
          top: 540 - MID,
          width: W,
          transformStyle: "preserve-3d",
          transformOrigin: `${W / 2}px ${MID}px`,
          transform: `translate(${mix(-60, 0, t)}px, ${mix(700, 0, E.inOut(t))}px) translateZ(${z}px) rotateX(${rx}deg) rotateZ(${rz}deg) scale(${1 - collapse})`,
          opacity: 1 - clamp((f - B(95.85)) / 6),
          ...LIFT,
        }}
      >
        <div style={{ zoom: Z, display: "flex", gap: GAP, alignItems: "flex-start" }}>
          {COLUMNS.map((col, i) => (
            <div
              key={i}
              style={{
                width: COL_W,
                display: "flex",
                flexDirection: "column",
                gap: GAP,
                marginTop: [120, 220, 0, 90, 260, 40, 160][i],
              }}
            >
              {col.map((k, j) => (
                <div key={`${k}${j}`}>{parts[k]}</div>
              ))}
            </div>
          ))}
        </div>
      </div>
      {collapse > 0 && (
        <svg
          width={1920}
          height={1080}
          viewBox="0 0 1920 1080"
          style={{ position: "absolute", inset: 0 }}
          aria-hidden
        >
          <circle cx={960} cy={540} r={mix(4, 22, collapse)} fill={K.fg} />
        </svg>
      )}
    </AbsoluteFill>
  );
}
