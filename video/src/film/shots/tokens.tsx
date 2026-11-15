import type * as React from "react";
import { AbsoluteFill } from "remotion";
import { clamp, E, mix, pulse, spr, tw } from "../ease";
import { K } from "../palette";
import { type Cam, camera, FOCAL, lerpCam } from "../proj";
import { useF } from "../shot";
import { B, riffBeats, sinceLast } from "../timing";

/**
 * 0:00. One token, a macro: a dot 760 px across, already thumping on the riff. The camera pulls
 * back and it is the live edge of a paragraph an agent is writing, in dots; then the page turns
 * into depth and keeps being written.
 */

const PITCH = 26;
const LINE = 64;
const R = 8.5;
const COLS = 46;

// Deterministic "words": runs of 2–7 tokens with one empty cell between them.
function lineCells(line: number): boolean[] {
  const cells: boolean[] = [];
  let s = (line + 11) * 9301;
  const rnd = () => {
    s = (s * 49297 + 233280) % 233280;
    return s / 233280;
  };
  while (cells.length < COLS) {
    const n = 2 + Math.floor(rnd() * 6);
    for (let i = 0; i < n; i++) cells.push(true);
    cells.push(false);
  }
  return cells.slice(0, COLS);
}
const LINES = Array.from({ length: 9 }, (_, i) => lineCells(i));
/** The paragraph's current line is the last one; it is written up to HEAD0 at the start. */
const CUR = LINES.length - 1;
const HEAD0 = 24;

const HITS = riffBeats(0, 4);
/** After the pull-back, one token every sixteenth. */
const STREAM = Array.from({ length: 9 }, (_, i) => 1.75 + i * 0.25);

function headCell(f: number) {
  const n = STREAM.filter((b) => B(b) <= f).length;
  // Advance over empty cells: a space is not a token.
  let cell = HEAD0;
  let k = 0;
  while (k < n) {
    cell++;
    if (LINES[CUR][cell]) k++;
  }
  return cell;
}

export function Tokens() {
  const f = useF();
  const head = headCell(f);
  const hx = head * PITCH;
  const hy = 0;
  // The head glides between cells rather than jumping, so the camera can follow it.
  const lastStep = STREAM.filter((b) => B(b) <= f).at(-1);
  const glide = lastStep == null ? 1 : spr(f, B(lastStep), "snap");
  const prevHx = (lastStep == null ? head : head - 1) * PITCH;
  const followX = mix(prevHx, hx, clamp(glide, 0, 1.2));

  const macro: Cam = { tx: hx, ty: hy, tz: 0, dist: FOCAL / 44, sx: 1190, sy: 548 };
  const macroEnd: Cam = { ...macro, dist: FOCAL / 47 };
  const wide: Cam = { tx: followX, ty: -110, tz: 0, dist: FOCAL / 1.55, sx: 1240, sy: 560 };
  const deep: Cam = {
    tx: followX,
    ty: -150,
    tz: 0,
    dist: FOCAL / 1.2,
    yaw: -38,
    pitch: 22,
    roll: -4,
    sx: 1320,
    sy: 610,
  };
  let cam: Cam;
  if (f < B(1.5)) cam = lerpCam(macro, macroEnd, tw(f, 0, B(1.5), 0, 1, E.inOut));
  else if (f < B(2.5)) cam = lerpCam(macroEnd, wide, tw(f, B(1.5), B(2.5), 0, 1, E.out));
  else cam = lerpCam(wide, deep, tw(f, B(2.4), B(4), 0, 1, E.inOut));
  const project = camera(cam);

  // The live edge thumps on every riff hit.
  const thump = pulse(sinceLast(f, HITS), 16);
  const dots: React.ReactNode[] = [];
  const items: {
    x: number;
    y: number;
    r: number;
    fill: string;
    o: number;
    z: number;
    k: string;
  }[] = [];
  for (let li = 0; li < LINES.length; li++) {
    const y = (li - CUR) * LINE;
    for (let c = 0; c < COLS; c++) {
      if (!LINES[li][c]) continue;
      if (li === CUR && c > head) continue;
      const isHead = li === CUR && c === head;
      const p = project({ x: c * PITCH, y, z: 0 });
      if (!p.visible) continue;
      // A newly written token lands with a small overshoot.
      const born = li === CUR && c > HEAD0 ? STREAM[countTokens(c) - 1] : null;
      const pop = born == null ? 1 : mix(0.35, 1, spr(f, B(born), "snap"));
      const r = R * p.s * pop * (isHead ? 1 + 0.16 * thump : 1);
      // Older lines sit back in ink-2; the line being written is ink.
      const age = CUR - li;
      items.push({
        x: p.x,
        y: p.y,
        r,
        fill: isHead ? K.fg : li === CUR ? K.fg : K.muted,
        o: isHead ? 1 : li === CUR ? 0.92 : Math.max(0.28, 0.8 - age * 0.07),
        z: p.z,
        k: `${li}-${c}`,
      });
    }
  }
  items.sort((a, b) => b.z - a.z);
  for (const d of items)
    if (d.x > -100 && d.x < 2020 && d.y > -100 && d.y < 1180)
      dots.push(<circle key={d.k} cx={d.x} cy={d.y} r={d.r} fill={d.fill} opacity={d.o} />);

  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" aria-hidden>
        {dots}
      </svg>
    </AbsoluteFill>
  );
}

/** How many tokens of the current line lie after HEAD0 up to and including cell c. */
function countTokens(c: number) {
  let n = 0;
  for (let i = HEAD0 + 1; i <= c; i++) if (LINES[CUR][i]) n++;
  return n;
}
