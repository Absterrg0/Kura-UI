import * as React from "react";
import { AbsoluteFill, Easing, useCurrentFrame } from "remotion";
import { mix, tween } from "../lib/anim";
import { Camera, type Shot } from "../lib/camera";
import { Pointer, Ripple } from "../lib/pointer";
import { Headline } from "../lib/type";
import { CENTRE, PITCH } from "./glyph";
import { RunStage, type StageRefs, useStageRefs } from "./run-stage";
import { X0 } from "./tokens";

/**
 * 0:18–0:32. The camera pulls out of the done disc into the real run: plan, subagents, trace,
 * terminal, context. It visits the faces and the hundred dots, then the run asks for a person:
 * ember. A person presses the key; ember leaves and the whole view moves on together.
 */

export const RUN_FRAMES = 840;
const PRESS = 708;
const DECIDE = 720;
const DIM = 0.05;

/** Which panel holds the frame, and when (frames into the shot). */
const FOCUS: { key: keyof StageRefs; from: number; to: number }[] = [
  { key: "fleet", from: 186, to: 326 },
  { key: "context", from: 326, to: 452 },
  { key: "prompt", from: 572, to: 738 },
];

function focusOf(frame: number) {
  const out: Partial<Record<keyof StageRefs, number>> = {};
  const keys: (keyof StageRefs)[] = [
    "header",
    "plan",
    "trace",
    "prompt",
    "terminal",
    "fleet",
    "context",
  ];
  for (const k of keys) {
    let o = 1;
    for (const f of FOCUS) {
      if (f.key === k) continue;
      const amt = tween(frame, f.from, f.from + 22) * (1 - tween(frame, f.to, f.to + 22));
      o = Math.min(o, mix(1, DIM, amt));
    }
    out[k] = o;
  }
  return out;
}

export function Run() {
  const frame = useCurrentFrame();
  const refs = useStageRefs();
  const stage = React.useRef<HTMLDivElement>(null);
  const t = (frame / 60) * 1000;

  // The first glyph of the plan opens the shot at the size of the disc the last shot ended on.
  const disc = 9 * PITCH + PITCH * 0.56;
  const glyph = () => refs.plan.current?.querySelector<HTMLElement>("[data-slot=status-glyph]");
  const glyphPx = glyph()?.offsetWidth ?? 15;
  const open = disc / ((5.6 / 15) * glyphPx);

  const wide = { target: "stage", scale: 1.4, screen: { x: 960, y: 540 } };
  const shots: Shot[] = [
    { at: 0, dur: 0, target: "glyph", scale: open, screen: CENTRE },
    { at: 0, dur: 104, ...wide, ease: Easing.bezier(0.5, 0, 0.12, 1) },
    { at: 176, dur: 52, target: "fleet", scale: 2.45, screen: { x: 1360, y: 540 } },
    { at: 318, dur: 52, target: "context", scale: 2.2, screen: { x: 1340, y: 540 } },
    { at: 446, dur: 50, ...wide },
    { at: 566, dur: 60, target: "prompt", scale: 1.8, screen: { x: 1310, y: 560 } },
    { at: 736, dur: 64, ...wide },
  ];

  const button = () =>
    refs.prompt.current?.querySelector<HTMLElement>("button[data-agent-confirm]") ?? null;

  return (
    <AbsoluteFill>
      <Camera
        frame={frame}
        shots={shots}
        targets={{
          stage: () => stage.current,
          glyph,
          fleet: () => refs.fleet.current,
          context: () => refs.context.current,
          prompt: () => refs.prompt.current,
        }}
      >
        <div ref={stage} style={{ position: "relative" }}>
          <RunStage
            t={t}
            refs={refs}
            dim={focusOf(frame)}
            promptPressed={frame >= PRESS && frame < DECIDE}
          />
          {/* A person's pointer: it comes for the key only once the run has asked. */}
          <Pointer
            frame={frame}
            target={button}
            from={{ x: 300, y: 230 }}
            enter={640}
            arrive={700}
            leave={760}
          />
          <Ripple frame={frame} at={PRESS} target={button} />
        </div>
      </Camera>

      <Headline
        text={"Every agent\nhas a face."}
        at={196}
        out={310}
        size={92}
        style={{ position: "absolute", left: X0 - 6, top: 400, width: 760 }}
      />
      <Headline
        text={"Context is a\nhundred dots."}
        at={340}
        out={440}
        size={92}
        style={{ position: "absolute", left: X0 - 6, top: 400, width: 760 }}
      />
      <Headline
        text={"Ember means\nit needs you."}
        at={592}
        out={716}
        size={88}
        style={{ position: "absolute", left: X0 - 6, top: 400, width: 640 }}
      />
    </AbsoluteFill>
  );
}
