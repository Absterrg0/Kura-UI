import type * as React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { E, mix, spr, tw } from "../ease";
import { chase, G, RING } from "../glyph";
import { K } from "../palette";
import { type Cam, camera, discMatrix, FOCAL } from "../proj";
import { B } from "../timing";
import { Tile } from "./faces";

/**
 * 0:14.2. The ramp: shots shrink from a half beat to a sixteenth, each a different state of the
 * glyph at macro scale, in the library's own geometry. It runs into the pocket at bar 8.
 */
type Mark = "queued" | "running" | "done" | "failed" | "skipped" | "paused" | "sigil";
const C = G.C;
const step = 2.55;
const MARKS: Record<Exclude<Mark, "running" | "sigil">, [number, number, number?][]> = {
  queued: RING.map((p) => [p.x + C, p.y + C]),
  done: [[C, C, G.DONE]],
  failed: [
    [C, C],
    [C - step, C - step],
    [C - 2 * step, C - 2 * step],
    [C + step, C - step],
    [C + 2 * step, C - 2 * step],
    [C - step, C + step],
    [C - 2 * step, C + 2 * step],
    [C + step, C + step],
    [C + 2 * step, C + 2 * step],
  ],
  skipped: [
    [C - 3.6, C],
    [C, C],
    [C + 3.6, C],
  ],
  paused: [
    [C - 2.3, C - 3.2],
    [C - 2.3, C],
    [C - 2.3, C + 3.2],
    [C + 2.3, C - 3.2],
    [C + 2.3, C],
    [C + 2.3, C + 3.2],
  ],
};
const TONE: Record<Exclude<Mark, "sigil">, string> = {
  queued: K.subtle,
  running: K.fg,
  done: K.muted,
  failed: "var(--kura-danger-text)",
  skipped: K.subtle,
  paused: K.muted,
};

export const RAMP: { at: number; mark: Mark; cam: Partial<Cam>; u: number }[] = [
  { at: 29, mark: "running", u: 70, cam: { yaw: -40, pitch: 28, roll: 8, sx: 1100, sy: 520 } },
  { at: 29.5, mark: "failed", u: 54, cam: { yaw: 18, pitch: -10, roll: -6, sx: 760, sy: 560 } },
  { at: 30, mark: "paused", u: 62, cam: { yaw: -12, pitch: 40, roll: 0, sx: 1180, sy: 600 } },
  { at: 30.5, mark: "sigil", u: 52, cam: { yaw: 26, pitch: 12, roll: -10, sx: 900, sy: 540 } },
  { at: 31, mark: "skipped", u: 90, cam: { yaw: 0, pitch: 62, roll: 0, sx: 960, sy: 560 } },
  { at: 31.25, mark: "queued", u: 58, cam: { yaw: 34, pitch: 0, roll: 12, sx: 1240, sy: 520 } },
  { at: 31.5, mark: "running", u: 84, cam: { yaw: -20, pitch: -24, roll: -4, sx: 700, sy: 560 } },
  { at: 31.75, mark: "done", u: 64, cam: { yaw: 0, pitch: 0, roll: 0, sx: 960, sy: 540 } },
];

export function Ramp() {
  const f = useCurrentFrame() + B(29);
  const idx = RAMP.findLastIndex((r) => B(r.at) <= f);
  const shot = RAMP[Math.max(0, idx)];
  const next = RAMP[idx + 1]?.at ?? 32;
  const t = tw(f, B(shot.at), B(next), 0, 1, E.out);
  const project = camera({
    tx: 0,
    ty: 0,
    tz: 0,
    dist: FOCAL * mix(1.04, 0.96, t),
    yaw: shot.cam.yaw,
    pitch: shot.cam.pitch,
    roll: (shot.cam.roll ?? 0) + mix(0, 4, t),
    sx: shot.cam.sx,
    sy: shot.cam.sy,
  });
  const nodes: React.ReactNode[] = [];
  if (shot.mark === "sigil") {
    return (
      <AbsoluteFill>
        <svg width={1920} height={1080} viewBox="0 0 1920 1080" aria-hidden>
          <Tile project={project} cx={0} cy={0} size={shot.u * 15} name="scout" f={f} born={-999} />
        </svg>
      </AbsoluteFill>
    );
  }
  const u = shot.u;
  const land = spr(f, B(shot.at), "snap");
  if (shot.mark === "running") {
    const ms = ((f - B(shot.at)) * 1000) / 60 + 300;
    RING.forEach((p, i) => {
      const { matrix, visible } = discMatrix(
        project,
        { x: p.x * u, y: p.y * u, z: 0 },
        G.DOT * u * mix(0.7, 1, land),
      );
      if (!visible) return;
      nodes.push(<circle key={i} r={1} transform={matrix} fill={K.fg} opacity={chase(i, ms)} />);
    });
  } else {
    MARKS[shot.mark].forEach(([x, y, r], i) => {
      const { matrix, visible } = discMatrix(
        project,
        { x: (x - C) * u, y: (y - C) * u, z: 0 },
        (r ?? G.DOT) * u * mix(0.7, 1, land),
      );
      if (!visible) return;
      nodes.push(
        <circle
          key={i}
          r={1}
          transform={matrix}
          fill={TONE[shot.mark as Exclude<Mark, "sigil">]}
        />,
      );
    });
  }
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" aria-hidden>
        {nodes}
      </svg>
    </AbsoluteFill>
  );
}
