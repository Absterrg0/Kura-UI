import type * as React from "react";
import { AbsoluteFill } from "remotion";
import { clamp, E, mix, spr, stepped, tw } from "../ease";
import { K } from "../palette";
import { type Cam, camera, discMatrix, FOCAL, lerpCam } from "../proj";
import { Roll } from "../roll";
import { useF } from "../shot";
import { B } from "../timing";

/**
 * 0:10.3. Progress is a row of dots (DotRail). The rail arrives edge-on, as a line of slivers, and
 * its dots open to face the camera; then it advances in whole dots on the sixteenths while the
 * camera runs along it. Sequence-relative: frame 0 is beat 21.
 */
export const RAIL_FROM = 21;
const N = 64;
const RP = 40;
// DotRail: r 1.1 on a 6 px pitch.
const RR = (1.1 / 6) * RP * 1.25;
export function Rail() {
  const f = useF();
  const open = spr(f, B(21), "snap");
  // Whole dots only, on the sixteenths: 0 → 44 of 64.
  const steps = Math.max(0, Math.floor((f - B(21.25)) / (B(21.5) - B(21.25))) + 1);
  const lit = Math.min(44, steps * 7);
  const headX = (lit - 1) * RP;
  const follow = tw(f, B(21), B(22.5), 0, 1, E.inOut);
  const cam: Cam = lerpCam(
    {
      tx: 22 * RP,
      ty: -4.4 * RP,
      tz: 0,
      dist: 1100,
      yaw: -44,
      pitch: 22,
      roll: -4,
      sx: 900,
      sy: 560,
    },
    {
      tx: 34 * RP,
      ty: -4.4 * RP,
      tz: 0,
      dist: 880,
      yaw: -50,
      pitch: 26,
      roll: -6,
      sx: 960,
      sy: 560,
    },
    follow,
  );
  const project = camera(cam);
  // The dots lie in a plane that opens from edge-on (89°) to the camera.
  const tilt = mix(89, 0, clamp(open, 0, 1.1)) * (Math.PI / 180);
  const u = { x: 1, y: 0, z: 0 };
  const v = { x: 0, y: Math.cos(tilt), z: Math.sin(tilt) };
  const live = 0.625 + 0.375 * Math.cos(((f % 66) / 66) * Math.PI * 2); // kura-dot-pulse, 1.1 s
  const nodes: React.ReactNode[] = [];
  // Five agents' rails, one above the other; the front one is the hero, the others advance at
  // their own rates, each in whole dots.
  const RATES = [7, 4, 9, 2, 5];
  const START = [0, 30, 12, 50, 21];
  const items: {
    k: string;
    p: { x: number; y: number; z: number };
    on: boolean;
    head: boolean;
    z: number;
  }[] = [];
  RATES.forEach((rate, r) => {
    const n = r === 0 ? lit : Math.min(N - 2, START[r] + steps * rate);
    for (let i = 0; i < N; i++) {
      const p = { x: i * RP, y: -r * RP * 2.2, z: 0 };
      items.push({ k: `${r}-${i}`, p, on: i < n, head: i === n - 1, z: project(p).z });
    }
  });
  items.sort((a, b) => b.z - a.z);
  for (const it of items) {
    const { matrix, visible } = discMatrix(project, it.p, RR, u, v);
    if (!visible) continue;
    nodes.push(
      <circle
        key={it.k}
        r={1}
        transform={matrix}
        fill={it.on ? K.fg : K.dotOff}
        opacity={it.head ? live : 1}
      />,
    );
  }
  const hp = project({ x: headX, y: 0, z: 0 });
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" aria-hidden>
        {nodes}
        {lit > 0 && (
          <Roll
            value={(stepped(f, B(21.25), B(21.5) - B(21.25), 7, 44) / N) * 100}
            x={hp.x + 40}
            y={hp.y - 70}
            size={96}
            suffix="%"
            fill="var(--kura-fg)"
          />
        )}
      </svg>
    </AbsoluteFill>
  );
}

/**
 * 0:11. Context is one hundred dots, one per percent (ContextPanel's 25 × 4 matrix, shaded by
 * segment). The window fills on the sixteenths while the camera cranes from straight on to low
 * and across. Sequence-relative: frame 0 is beat 22.5.
 */
export const CONTEXT_FROM = 22.5;
const SEGMENTS = [
  { label: "System", pct: 9, shade: 1 },
  { label: "Conversation", pct: 31, shade: 0.68 },
  { label: "Tools", pct: 14, shade: 0.46 },
  { label: "Files", pct: 18, shade: 0.3 },
];
const CP = 66;
const CR = CP * 0.27;
export function Context() {
  const f = useF();
  const steps = Math.max(0, Math.floor((f - B(22.5)) / (B(22.75) - B(22.5))) + 1);
  const filled = Math.min(72, steps * 12);
  const shades: number[] = [];
  for (const s of SEGMENTS) for (let k = 0; k < s.pct; k++) shades.push(s.shade);
  const t = tw(f, B(22.5), B(24), 0, 1, E.inOut);
  const cam = lerpCam(
    { tx: 0, ty: 0, tz: 0, dist: FOCAL / 1.05, yaw: 0, pitch: 0, sx: 960, sy: 600 },
    { tx: 180, ty: 30, tz: 0, dist: FOCAL / 1.6, yaw: 26, pitch: 52, roll: -10, sx: 1000, sy: 640 },
    t,
  );
  const project = camera(cam);
  const nodes: React.ReactNode[] = [];
  for (let i = 0; i < 100; i++) {
    const col = i % 25;
    const row = Math.floor(i / 25);
    const p = { x: (col - 12) * CP, y: (row - 1.5) * CP * 0.9, z: 0 };
    const on = i < filled;
    const born = B(22.5) + Math.floor(i / 12) * (B(22.75) - B(22.5));
    const s = on ? spr(f, born + (i % 12), "snap") : 1;
    const { matrix, visible } = discMatrix(project, p, CR * (on ? mix(0.6, 1, s) : 1));
    if (!visible) continue;
    nodes.push(
      <circle
        key={i}
        r={1}
        transform={matrix}
        fill={on ? K.fg : K.dotOff}
        opacity={on ? shades[i] : 1}
      />,
    );
  }
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" aria-hidden>
        {nodes}
        <Roll
          value={stepped(f, B(22.5), B(22.75) - B(22.5), 12, 72)}
          x={140}
          y={330}
          size={220}
          suffix="%"
        />
      </svg>
    </AbsoluteFill>
  );
}
