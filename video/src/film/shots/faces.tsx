import type * as React from "react";
import { AbsoluteFill } from "remotion";
import { clamp, E, mix, spr, tw } from "../ease";
import { G } from "../glyph";
import { K, MONO, SANS } from "../palette";
import { camera, discMatrix, FOCAL, lerpCam } from "../proj";
import { useF } from "../shot";
import { face, TILE_RX } from "../sigil";
import { B } from "../timing";

/** Draws a raised sigil tile with its face, lying in the world's z = 0 plane at (cx, cy). */
export function Tile({
  project,
  cx,
  cy,
  size,
  name,
  f,
  born,
  shape = 1,
  fill = K.raised,
  lit = 1,
}: {
  project: ReturnType<typeof camera>;
  cx: number;
  cy: number;
  size: number;
  name: string;
  f: number;
  /** Frame the face starts to assemble (rows drop in one after another). */
  born: number;
  /** 0 = a disc, 1 = the tile. */
  shape?: number;
  fill?: string;
  lit?: number;
}) {
  const { matrix, visible } = discMatrix(project, { x: cx, y: cy, z: 0 }, size);
  if (!visible) return null;
  const rx = mix(0.5, TILE_RX, shape);
  const out: React.ReactNode[] = [
    <rect
      key="t"
      x={-0.5}
      y={-0.5}
      width={1}
      height={1}
      rx={rx}
      transform={matrix}
      fill={fill}
      stroke="rgb(255 255 255 / 0.09)"
      strokeWidth={0.006}
    />,
  ];
  for (const d of face(name)) {
    const s = spr(f, born + d.row * 2 + Math.abs(d.col - 2), "snap");
    if (s <= 0.001) continue;
    const m = discMatrix(
      project,
      { x: cx + d.x * size, y: cy + d.y * size, z: 0 },
      d.r * size * mix(0.3, 1, s),
    );
    if (!m.visible) continue;
    out.push(
      <circle
        key={`${d.row}-${d.col}`}
        r={1}
        transform={m.matrix}
        fill={d.on ? K.fg : K.dotOff}
        opacity={d.on ? lit : 1}
      />,
    );
  }
  return <g>{out}</g>;
}

/**
 * 0:07. The done disc becomes a raised tile and a face assembles on it: "Every agent / has a face."
 * Sequence-relative: frame 0 is beat 14.
 */
export const FACES_FROM = 14;
export function FaceIntro() {
  const f = useF();
  const m = spr(f, B(14), "land");
  const size = 660;
  const disc = G.DONE * 64 * 2;
  const cam = lerpCam(
    { tx: 0, ty: 0, tz: 0, dist: FOCAL, sx: 1440, sy: 540 },
    { tx: 0, ty: 0, tz: 0, dist: FOCAL * 1.04, yaw: -30, pitch: 8, roll: 0, sx: 1450, sy: 540 },
    clamp(m, 0, 1.06),
  );
  const drift = tw(f, B(14.5), B(16), 0, 1, E.inOut);
  cam.yaw = (cam.yaw ?? 0) + 14 * drift;
  const project = camera(cam);
  const l1 = f >= B(14);
  const l2 = f >= B(15);
  const s2 = (1 - spr(f, B(15), "snap")) * 10;
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" aria-hidden>
        <Tile
          project={project}
          cx={0}
          cy={0}
          size={mix(disc, size, clamp(m))}
          shape={clamp(m)}
          fill={m < 0.5 ? K.muted : K.raised}
          name="planner"
          f={f}
          born={B(14) + 6}
        />
        <g
          style={{
            fontFamily: SANS,
            fontWeight: 600,
            fontSize: 172,
            letterSpacing: "-0.045em",
            fill: "var(--kura-fg)",
          }}
        >
          {l1 && (
            <text x={130} y={500 + (1 - spr(f, B(14), "snap")) * 10}>
              Every agent
            </text>
          )}
          {l2 && (
            <text x={130} y={690 + s2}>
              has a face.
            </text>
          )}
        </g>
      </svg>
    </AbsoluteFill>
  );
}

/**
 * 0:08. One beat each: three more agents, three faces, the name in mono. Same name, same face.
 * Sequence-relative: frame 0 is beat 16.
 */
const CUTS = [
  {
    name: "migrator",
    cam: { yaw: 34, pitch: 14, roll: 3, sx: 660, sy: 540 },
    label: { x: 1120, y: 572 },
  },
  {
    name: "reviewer",
    cam: { yaw: 12, pitch: 10, roll: 1, sx: 1300, sy: 520 },
    label: { x: 150, y: 572 },
  },
  {
    name: "test-writer",
    cam: { yaw: -10, pitch: 30, roll: 0, sx: 960, sy: 450 },
    label: { x: 960, y: 990, mid: true },
  },
] as const;
export function FaceCuts() {
  const f = useF();
  const i = Math.min(2, Math.max(0, Math.floor((f - B(16)) / (B(17) - B(16)))));
  const c = CUTS[i];
  const at = B(16 + i);
  const push = tw(f, at, at + 30, 0, 1, E.out);
  const project = camera({
    tx: 0,
    ty: 0,
    tz: 0,
    dist: FOCAL * mix(1.0, 0.94, push),
    yaw: c.cam.yaw - 12 * tw(f, at, at + (B(17) - B(16)), 0, 1, (x) => x),
    pitch: c.cam.pitch,
    roll: c.cam.roll,
    sx: c.cam.sx,
    sy: c.cam.sy,
  });
  const lbl = c.label as { x: number; y: number; mid?: boolean };
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" aria-hidden>
        <Tile project={project} cx={0} cy={0} size={700} name={c.name} f={f} born={at} />
        <text
          x={lbl.x}
          y={lbl.y + (1 - spr(f, at, "snap")) * 8}
          textAnchor={lbl.mid ? "middle" : "start"}
          style={{
            fontFamily: MONO,
            fontWeight: 500,
            fontSize: 92,
            letterSpacing: "-0.03em",
            fill: "var(--kura-fg)",
          }}
        >
          {c.name}
        </text>
      </svg>
    </AbsoluteFill>
  );
}

/**
 * 0:09.4. Pull back: test-writer is one of thirty-two. Faces light up across the wall on the
 * sixteenths, like a fleet coming alive.
 * Sequence-relative: frame 0 is beat 19.
 */
const NAMES = [
  "explorer",
  "planner",
  "migrator",
  "reviewer",
  "patcher",
  "indexer",
  "linter",
  "triager",
  "scout",
  "test-writer",
  "bisector",
  "profiler",
  "docs",
  "scribe",
  "auditor",
  "deployer",
  "fixer",
  "router",
  "tracer",
  "watcher",
  "packer",
  "mapper",
  "grader",
  "fetcher",
  "seeder",
  "parser",
  "pruner",
  "ranker",
  "syncer",
  "keeper",
  "sentry",
  "builder",
];
const COLS = 8;
const PITCH = 230;
export function FaceWall() {
  const f = useF();
  const focus = NAMES.indexOf("test-writer");
  const fx = ((focus % COLS) - (COLS - 1) / 2) * PITCH;
  const fy = (Math.floor(focus / COLS) - 1.5) * PITCH;
  const t = tw(f, B(19), B(20.4), 0, 1, E.out);
  const cam = lerpCam(
    { tx: fx, ty: fy, tz: 0, dist: FOCAL / 3.6, yaw: -22, pitch: 30, sx: 960, sy: 450 },
    { tx: 120, ty: 40, tz: 0, dist: FOCAL * 1.18, yaw: -34, pitch: 18, roll: 5, sx: 960, sy: 540 },
    t,
  );
  const project = camera(cam);
  const tiles: React.ReactNode[] = [];
  // Draw far tiles first.
  const order = NAMES.map((n, i) => {
    const x = ((i % COLS) - (COLS - 1) / 2) * PITCH;
    const y = (Math.floor(i / COLS) - 1.5) * PITCH;
    return { n, i, x, y, z: project({ x, y, z: 0 }).z };
  }).sort((a, b) => b.z - a.z);
  for (const o of order) {
    // A wave of light across the wall: each face lights on a sixteenth, by distance from focus.
    const d = Math.hypot(o.x - fx, o.y - fy) / PITCH;
    const lightAt = B(19.25 + d * 0.12);
    const lit = o.i === focus ? 1 : f >= lightAt ? 1 : 0.35;
    tiles.push(
      <Tile
        key={o.n}
        project={project}
        cx={o.x}
        cy={o.y}
        size={170}
        name={o.n}
        f={f}
        born={o.i === focus ? -999 : B(19.2) + Math.round(d * 3)}
        lit={lit}
      />,
    );
  }
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" aria-hidden>
        {tiles}
      </svg>
    </AbsoluteFill>
  );
}
