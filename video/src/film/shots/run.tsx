import { AgentFleet } from "@kura/components/agent-fleet";
import { DiffView } from "@kura/components/diff-view";
import { TaskList } from "@kura/components/task-list";
import { Terminal } from "@kura/components/terminal";
import { ToolCall } from "@kura/components/tool-call";
import { TraceWaterfall } from "@kura/components/trace-waterfall";
import { AbsoluteFill } from "remotion";
import { DIFF, fleet, planItems, TEST_LINES, traceSpans } from "../data";
import { clamp, E, mix, spr, tw } from "../ease";
import { chase, G, RING } from "../glyph";
import { K } from "../palette";
import { useF } from "../shot";
import { Anchored, anchorOf, Stage, useRemeasure } from "../stage";
import { B } from "../timing";

/** Sixteenths since beat `from` (1 on the beat itself). */
export const S16 = (from: number, f: number) =>
  Math.max(0, Math.floor((f - B(from)) / (B(from + 0.25) - B(from))) + 1);
const ms = (f: number) => (f * 1000) / 60;
const logMix = (a: number, b: number, t: number) => Math.exp(mix(Math.log(a), Math.log(b), t));

/**
 * 0:19.8. "step." — its full stop opens into a running ring (one dot becomes eight: the reverse of
 * done), and the ring is the running step of a real plan: the camera pulls back from it to the
 * whole plan, whose steps tick to done on the eighths.
 */
export const PLAN_FROM = 39;
const PLAN_ZOOM = 3.4;
const RING_U = 40;
export function PlanReveal() {
  const f = useF();
  const remeasure = useRemeasure();
  const swap = B(39.5);
  const spread = E.back(clamp((f - B(39)) / 12));
  const a = anchorOf("plan-reveal");
  // Steps tick on the eighths once the camera is out.
  const k = f < B(40.5) ? 0 : Math.min(3, Math.floor((f - B(40.5)) / (B(41) - B(40.5))) + 1);
  const items = planItems(2 + k);
  const s0 = a ? (15 * RING_U) / a.w : 10;
  const t = tw(f, swap, B(41.4), 0, 1, (x) => E.inOut(x) * 0.35 + E.out(x) * 0.65);
  const s = logMix(s0, 1, t);
  const end = a ? { x: 960 - a.W / 2 + a.ox, y: 540 - a.H / 2 + a.oy } : { x: 960, y: 540 };
  const px = mix(960, end.x, E.inOut(t));
  const py = mix(540, end.y, E.inOut(t));
  return (
    <AbsoluteFill>
      <div style={{ opacity: f >= swap ? 1 : 0 }}>
        <Anchored
          onMeasured={remeasure}
          id="plan-reveal"
          width={470}
          zoom={PLAN_ZOOM}
          selector="[data-slot=task-list-list] > li:nth-child(3) [data-slot=status-glyph]"
          px={px}
          py={py}
          scale={s}
        >
          <TaskList items={items} title="Migrate sessions to the edge" collapseCompleted={false} />
        </Anchored>
      </div>
      {f < swap && (
        <svg
          width={1920}
          height={1080}
          viewBox="0 0 1920 1080"
          aria-hidden
          style={{ position: "absolute" }}
        >
          {RING.map((p, i) => (
            <circle
              key={i}
              cx={960 + p.x * RING_U * spread}
              cy={540 + p.y * RING_U * spread}
              r={mix(26, G.DOT * RING_U, clamp(spread))}
              fill={K.fg}
              opacity={mix(1, chase(i, ms(f)), clamp(spread))}
            />
          ))}
        </svg>
      )}
    </AbsoluteFill>
  );
}

/** 0:21.4. The trace, readable, laid back a little; spans grow; the camera dollies along time. */
export function Trace() {
  const f = useF();
  const t = tw(f, B(42), B(44), 0, 1, E.inOut);
  const now = mix(6400, 14400, tw(f, B(42), B(43.75), 0, 1, E.out));
  return (
    <Stage
      width={600}
      zoom={3.6}
      x={mix(1040, 900, t)}
      y={mix(560, 520, t)}
      rx={10}
      ry={-10}
      rz={-2}
      z={mix(0, 90, t)}
    >
      <TraceWaterfall spans={traceSpans(now)} now={now} />
    </Stage>
  );
}

/** 0:22.9. Tool calls arrive edge-on and turn to face the camera; they succeed on the sixteenths. */
export function Tools() {
  const f = useF();
  const open = tw(f, B(45), B(45) + 22, 0, 1, E.back);
  const k = S16(45.25, f);
  const st = (n: number) => (k >= n ? ("success" as const) : ("running" as const));
  return (
    <Stage
      width={500}
      zoom={3.9}
      x={mix(1100, 960, open)}
      y={540}
      rx={6}
      ry={mix(-86, -12, open)}
      rz={-2}
      z={mix(0, 80, tw(f, B(45), B(47)))}
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
          status={st(2)}
          duration={k >= 2 ? 412 : undefined}
          args={{ path: "src/auth/client.ts" }}
        />
        <ToolCall
          name="edit_file"
          status={st(3)}
          duration={k >= 3 ? 388 : undefined}
          args={{ path: "src/middleware.ts" }}
        />
        <ToolCall
          name="run_tests"
          status={st(5)}
          duration={k >= 5 ? 8_210 : undefined}
          args={{ filter: "src/auth" }}
        />
      </div>
    </Stage>
  );
}

/** 0:24.4. The diff, large; the camera runs down the hunk. */
export function Diff() {
  const f = useF();
  const t = tw(f, B(48), B(50), 0, 1, E.inOut);
  return (
    <Stage width={640} zoom={2.9} x={mix(1000, 940, t)} y={mix(880, 180, t)} rx={10} ry={8} rz={1}>
      <DiffView diff={DIFF} />
    </Stage>
  );
}

/** 0:25.9. Subagents, close; they finish on the sixteenths, the reviewer starts. */
export function Fleet() {
  const f = useF();
  const k = S16(51, f);
  const t = tw(f, B(51), B(53), 0, 1, E.out);
  return (
    <Stage
      width={600}
      zoom={3.1}
      x={mix(1020, 940, t)}
      y={mix(560, 520, t)}
      rx={8}
      ry={mix(20, 10, t)}
      rz={-2}
    >
      <AgentFleet agents={fleet(k)} />
    </Stage>
  );
}

/** 0:27. The suite streams in, one line a sixteenth. */
export function Term() {
  const f = useF();
  const n = Math.min(TEST_LINES.length, S16(53, f) + 4);
  // The terminal keeps its full height from the first frame; lines fill it in place.
  const done = n >= TEST_LINES.length && f >= B(55.5);
  const t = tw(f, B(53), B(56), 0, 1, E.inOut);
  return (
    <Stage width={540} zoom={3.7} x={mix(930, 990, t)} y={mix(560, 530, t)} rx={-6} ry={-10} rz={1}>
      <Terminal
        command="pnpm test src/auth"
        lines={TEST_LINES.map((l, i) => (i < n ? l : " "))}
        status={done ? "done" : "running"}
        exitCode={done ? 0 : null}
        cwd="~/acme/web"
      />
    </Stage>
  );
}

export { spr };
