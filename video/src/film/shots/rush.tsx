import { AbsoluteFill } from "remotion";
import { E, mix, tw } from "../ease";
import { useF } from "../shot";
import { Stage } from "../stage";
import { B } from "../timing";
import { useParts } from "./wall";

/**
 * 0:28.5 → 0:31.5. The run, faster: macro crops of the parts, one beat, then half a beat each,
 * every one from a new angle, each pushing in. Cut list in beats.
 */
type Crop = {
  at: number;
  part: string;
  width: number;
  zoom: number;
  /** Where the part's centre sits at the start and end of the cut. */
  x: [number, number];
  y: [number, number];
  rx: number;
  ry: number;
  rz: number;
};
export const CROPS: Crop[] = [
  {
    at: 56,
    part: "timeline",
    width: 460,
    zoom: 4.6,
    x: [1080, 980],
    y: [600, 540],
    rx: 10,
    ry: -16,
    rz: -2,
  },
  {
    at: 57,
    part: "plan",
    width: 470,
    zoom: 4.4,
    x: [1100, 1000],
    y: [700, 600],
    rx: -12,
    ry: 14,
    rz: 2,
  },
  {
    at: 58,
    part: "trace",
    width: 640,
    zoom: 4.0,
    x: [1300, 1140],
    y: [520, 480],
    rx: 18,
    ry: -20,
    rz: -4,
  },
  {
    at: 59,
    part: "fleet",
    width: 600,
    zoom: 4.2,
    x: [900, 980],
    y: [600, 560],
    rx: 6,
    ry: 22,
    rz: 1,
  },
  {
    at: 60,
    part: "diff",
    width: 640,
    zoom: 4.4,
    x: [1260, 1200],
    y: [700, 640],
    rx: 14,
    ry: 10,
    rz: 3,
  },
  {
    at: 60.5,
    part: "term",
    width: 600,
    zoom: 4.4,
    x: [1300, 1240],
    y: [560, 520],
    rx: -10,
    ry: -18,
    rz: -2,
  },
  {
    at: 61,
    part: "context",
    width: 480,
    zoom: 4.2,
    x: [1100, 1020],
    y: [640, 580],
    rx: 20,
    ry: -8,
    rz: -4,
  },
  {
    at: 61.5,
    part: "tools",
    width: 540,
    zoom: 4.8,
    x: [1280, 1200],
    y: [600, 560],
    rx: 0,
    ry: -28,
    rz: 2,
  },
];
export const RUSH_TO = 62;

export function Rush() {
  const f = useF();
  const parts = useParts(f);
  const i = Math.max(
    0,
    CROPS.findLastIndex((c) => B(c.at) <= f),
  );
  const c = CROPS[i];
  const end = CROPS[i + 1]?.at ?? RUSH_TO;
  const t = tw(f, B(c.at), B(end), 0, 1, E.out);
  return (
    <AbsoluteFill>
      <Stage
        key={i}
        width={c.width}
        zoom={c.zoom * mix(1, 1.04, t)}
        x={mix(c.x[0], c.x[1], t)}
        y={mix(c.y[0], c.y[1], t)}
        rx={c.rx}
        ry={c.ry}
        rz={c.rz}
      >
        {parts[c.part]}
      </Stage>
    </AbsoluteFill>
  );
}
