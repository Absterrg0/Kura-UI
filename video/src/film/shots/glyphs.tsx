import type * as React from "react";
import { AbsoluteFill } from "remotion";
import { clamp, E, mix, spr, tw } from "../ease";
import { chase, G, RING } from "../glyph";
import { K } from "../palette";
import { type Cam, camera, discMatrix, lerpCam } from "../proj";
import { useF } from "../shot";
import { B } from "../timing";

const ms = (f: number) => (f * 1000) / 60;
/** kura-blink: 1.1 s, on for the first half. */
export const blink = (t: number) => ((t % 1100) + 1100) % 1100 < 550;

export const COLS = 15;
export const ROWS = 9;
const PITCH = 150;
/** The glyph that will need a person: near the middle. */
export const EMBER = Math.floor(ROWS / 2) * COLS + Math.floor(COLS / 2);

const at = (i: number) => ({
  x: ((i % COLS) - (COLS - 1) / 2) * PITCH,
  y: (Math.floor(i / COLS) - (ROWS - 1) / 2) * PITCH,
});

/** One glyph in the world plane at (cx, cy), `u` px per glyph unit. */
function Glyph({
  project,
  cx,
  cy,
  u,
  state,
  t,
  close = 0,
}: {
  project: ReturnType<typeof camera>;
  cx: number;
  cy: number;
  u: number;
  state: "running" | "waiting" | "done";
  /** The glyph's own loop time, ms. */
  t: number;
  /** 0 → 1: the ring closing into the done disc. */
  close?: number;
}) {
  const out: React.ReactNode[] = [];
  RING.forEach((p, i) => {
    const x = cx + p.x * u * (1 - clamp(close));
    const y = cy + p.y * u * (1 - clamp(close));
    const r = mix(G.DOT, G.DONE, close) * u;
    const m = discMatrix(project, { x, y, z: 0 }, r);
    if (!m.visible) return;
    const fill = state === "waiting" ? K.ember : close > 0 ? K.muted : K.fg;
    const o = state === "running" && close <= 0 ? chase(i, t) : 1;
    out.push(<circle key={i} r={1} transform={m.matrix} fill={fill} opacity={o} />);
  });
  if (state === "waiting" && blink(t)) {
    const m = discMatrix(project, { x: cx, y: cy, z: 0 }, 1.7 * u);
    if (m.visible) out.push(<circle key="c" r={1} transform={m.matrix} fill={K.ember} />);
  }
  return <>{out}</>;
}

/**
 * A wall of runs, every glyph running at its own phase. `ember`: the beat one glyph turns to
 * waiting (a person is needed). `wave`: the beat the wall starts to go done, outward from the
 * middle, one ring of glyphs per sixteenth.
 */
export function GlyphWall({
  from,
  to,
  cams,
  ember,
  wave,
  approved,
}: {
  from: number;
  to: number;
  cams: [Cam, Cam];
  ember?: number;
  wave?: number;
  /** The middle glyph is already done (it was the one approved). */
  approved?: boolean;
}) {
  const f = useF();
  const t = tw(f, B(from), B(to), 0, 1, E.inOut);
  const project = camera(lerpCam(cams[0], cams[1], t));
  const order = Array.from({ length: COLS * ROWS }, (_, i) => ({ i, ...at(i) }))
    .map((g) => ({ ...g, z: project({ x: g.x, y: g.y, z: 0 }).z }))
    .sort((a, b) => b.z - a.z);
  const c = at(EMBER);
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" aria-hidden>
        {order.map((g) => {
          const own = ms(f) + ((g.i * 383) % 1200);
          let state: "running" | "waiting" | "done" = "running";
          let close = 0;
          if (g.i === EMBER && ember != null && f >= B(ember)) state = "waiting";
          if (g.i === EMBER && approved) {
            state = "done";
            close = 1;
          }
          if (wave != null && g.i !== EMBER) {
            const d = Math.max(Math.abs(g.x - c.x), Math.abs(g.y - c.y)) / PITCH;
            const go = B(wave + Math.round(d) * 0.25);
            if (f >= go) {
              close = spr(f, go, "snap");
              state = "done";
            }
          }
          return (
            <Glyph
              key={g.i}
              project={project}
              cx={g.x}
              cy={g.y}
              u={6.4}
              state={state}
              t={own}
              close={close}
            />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
}

/**
 * 0:32.5, the hard stop. The music drops away; one glyph, waiting for a person: the ember ring,
 * its centre blinking. Nothing else on screen.
 */
export function EmberMacro({ from }: { from: number }) {
  const f = useF();
  const t = tw(f, B(from), B(from + 1), 0, 1, E.out);
  const project = camera({ tx: 0, ty: 0, tz: 0, dist: 1400 * mix(1.06, 1, t), sx: 960, sy: 540 });
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" aria-hidden>
        <Glyph project={project} cx={0} cy={0} u={46} state="waiting" t={ms(f - B(from))} />
      </svg>
    </AbsoluteFill>
  );
}
