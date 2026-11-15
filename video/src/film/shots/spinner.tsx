import type * as React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { clamp, E, mix, pulse, spr, tw } from "../ease";
import { chase, G, RING } from "../glyph";
import { K, SANS } from "../palette";
import { type Cam, camera, discMatrix, FOCAL } from "../proj";
import { ShotOrigin, useF } from "../shot";
import { useTextDots, useTextWidth } from "../text-dots";
import { B } from "../timing";
import { FaceWall } from "./faces";
import { Context, Rail } from "./measure";
import { Tokens } from "./tokens";

/** The film's clock in ms (the library's loops are seeked to the same time). */
const ms = (f: number) => (f * 1000) / 60;

/** A running status ring, `u` px per glyph unit, seen through a camera. */
export function RunningRing({
  f,
  cam,
  u,
  fill = K.fg,
}: {
  f: number;
  cam: Cam;
  u: number;
  fill?: string;
}) {
  const project = camera(cam);
  return (
    <>
      {RING.map((p, i) => {
        const { matrix, visible } = discMatrix(
          project,
          { x: p.x * u, y: p.y * u, z: 0 },
          G.DOT * u,
        );
        if (!visible) return null;
        return <circle key={i} r={1} transform={matrix} fill={fill} opacity={chase(i, ms(f))} />;
      })}
    </>
  );
}

/**
 * 0:12.2 → 0:16.3. The spinner is all the user sees; the work it hides flashes between its cuts,
 * the cuts shrinking from two beats to a sixteenth into the track's pocket. The ring never stops.
 */
type Cut =
  | { at: number; kind: "ring"; cam: Partial<Cam>; u: number; drift?: number }
  | { at: number; kind: "wall" | "rail" | "context" | "tokens"; origin: number };

export const SPIN_FROM = 24;
export const SPIN_TO = 32;
export const CUTS: Cut[] = [
  {
    at: 24,
    kind: "ring",
    u: 64,
    cam: { yaw: -30, pitch: 40, roll: -6, sx: 960, sy: 540 },
    drift: 22,
  },
  { at: 26, kind: "wall", origin: 20.3 },
  {
    at: 27,
    kind: "ring",
    u: 64,
    cam: { yaw: 18, pitch: 10, roll: 3, sx: 960, sy: 540 },
    drift: -10,
  },
  { at: 28, kind: "rail", origin: 21.7 },
  { at: 28.5, kind: "ring", u: 64, cam: { yaw: -10, pitch: -26, roll: -4, sx: 960, sy: 540 } },
  { at: 29, kind: "tokens", origin: 3.1 },
  { at: 29.5, kind: "ring", u: 64, cam: { yaw: 30, pitch: 18, roll: 6, sx: 960, sy: 540 } },
  { at: 30, kind: "context", origin: 23.3 },
  { at: 30.5, kind: "ring", u: 64, cam: { yaw: 0, pitch: 30, roll: 0, sx: 960, sy: 540 } },
  { at: 31, kind: "wall", origin: 20.8 },
  { at: 31.5, kind: "ring", u: 64, cam: { yaw: 0, pitch: 0, roll: 0, sx: 960, sy: 540 } },
];

export function SpinnerCuts() {
  const f = useF();
  return (
    <AbsoluteFill>
      {CUTS.map((c, i) => {
        const end = CUTS[i + 1]?.at ?? SPIN_TO;
        const from = B(c.at) - B(SPIN_FROM);
        const len = B(end) - B(c.at);
        if (c.kind !== "ring") {
          const C = { wall: FaceWall, rail: Rail, context: Context, tokens: Tokens }[c.kind];
          return (
            <Sequence key={i} from={from} durationInFrames={len} layout="none">
              <ShotOrigin.Provider value={B(c.origin)}>
                <C />
              </ShotOrigin.Provider>
            </Sequence>
          );
        }
        if (f < B(c.at) || f >= B(end)) return null;
        const t = tw(f, B(c.at), B(end), 0, 1, E.out);
        const cam: Cam = {
          tx: 0,
          ty: 0,
          tz: 0,
          dist: FOCAL * mix(1.04, 0.97, t),
          yaw: (c.cam.yaw ?? 0) + (c.drift ?? 6) * tw(f, B(c.at), B(end), 0, 1, E.inOut),
          pitch: c.cam.pitch,
          roll: (c.cam.roll ?? 0) + mix(0, 3, t),
          sx: c.cam.sx,
          sy: c.cam.sy,
        };
        return (
          <AbsoluteFill key={i}>
            <svg width={1920} height={1080} viewBox="0 0 1920 1080" aria-hidden>
              <RunningRing f={f} cam={cam} u={c.u} />
            </svg>
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
}

/**
 * 0:16.3, the pocket. The music drops to almost nothing; the spinner collapses to one dot. On the
 * next beat the dot bursts into the name, full width; on the one after, the dots resolve into type.
 */
export const TITLE_FROM = 32;
const T_SIZE = 470;
const T_PITCH = 20;

export function Title() {
  const f = useF();
  const dots = useTextDots("Kura UI", T_SIZE, T_PITCH);
  const width = useTextWidth("Kura UI", T_SIZE);
  if (!dots || width == null) return null;
  const X0 = (1920 - width) / 2;
  const BASE = 540 + T_SIZE * 0.36;
  const c = { x: 960, y: 540 };
  const burst = B(33);
  const solid = B(34);
  const reveal = tw(f, solid, solid + 12, 0, 1, E.inOut);
  const revealX = X0 - 20 + reveal * (width + 60);
  const push = 1 + 0.03 * tw(f, solid, B(36), 0, 1, E.out);
  const nodes: React.ReactNode[] = [];
  if (f < burst) {
    // The ring closes on the downbeat of the pocket (it was running a frame ago).
    const close = E.anticipate(clamp((f - B(32)) / 14));
    const p = pulse(f - B(32) - 14, 30);
    RING.forEach((d, i) => {
      const x = c.x + d.x * 64 * (1 - close);
      const y = c.y + d.y * 64 * (1 - close);
      const r = mix(G.DOT * 64, 46 * (1 + 0.12 * p), close);
      nodes.push(
        <circle
          key={i}
          cx={x}
          cy={y}
          r={r}
          fill={K.fg}
          opacity={mix(chase(i, ms(B(32))), 1, close)}
        />,
      );
    });
  } else {
    // The token holds the centre while the name pops round it, then shrinks away.
    const hold = 1 - E.in(clamp((f - burst) / 10));
    if (hold > 0) nodes.push(<circle key="token" cx={c.x} cy={c.y} r={46 * hold} fill={K.fg} />);
    dots.pts.forEach((p, j) => {
      const x1 = X0 + p.x;
      const y1 = BASE + p.y;
      if (x1 < revealX) return;
      // Each dot pops in place, in a ring travelling out from the centre where the token was.
      const d = Math.hypot(x1 - c.x, (y1 - c.y) * 1.6);
      const start = burst + Math.round((d / 1000) * 12);
      if (f < start) return;
      const t = clamp(spr(f, start, "snap"), 0, 1.15);
      nodes.push(<circle key={j} cx={x1} cy={y1} r={T_PITCH * 0.42 * t} fill={K.fg} />);
    });
  }
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" aria-hidden>
        <defs>
          <clipPath id="revealed">
            <rect x={0} y={0} width={Math.max(0, revealX)} height={1080} />
          </clipPath>
        </defs>
        <g transform={`translate(960 540) scale(${push}) translate(-960 -540)`}>
          {f >= solid && (
            <text
              x={X0}
              y={BASE}
              clipPath="url(#revealed)"
              style={{
                fontFamily: SANS,
                fontWeight: 600,
                fontSize: T_SIZE,
                letterSpacing: "-0.045em",
                fill: "var(--kura-fg)",
              }}
            >
              Kura UI
            </text>
          )}
          {nodes}
        </g>
      </svg>
    </AbsoluteFill>
  );
}
