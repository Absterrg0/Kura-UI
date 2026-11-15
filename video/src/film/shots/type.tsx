import type * as React from "react";
import { AbsoluteFill } from "remotion";
import { clamp, E, mix, pulse, spr, tw } from "../ease";
import { G, RING } from "../glyph";
import { K, SANS } from "../palette";
import { useF } from "../shot";
import { useTextDots, useTextWidth } from "../text-dots";
import { B, sinceLast } from "../timing";

/**
 * Kinetic type: one word-group per beat, hard swaps (the cut is the animation), a few px of
 * settle with overshoot and a slow push per group. A group that ends in "." gets the live dot as
 * its full stop: it drops in on the beat and thumps on the hits.
 *
 * With `wrap`, the last group is scanned into a dot matrix, bends round the status ring like type
 * on a path and condenses into the ring's eight dots (the next shot's actor).
 */
export type TypeGroup = { text: string; at: number };

const X0 = 150;
/** Widest a line may run before it is scaled down to fit the frame. */
const MAX_W = 1640;
/** The ring the wrap lands on (the Ring shot's geometry: one glyph unit is 64 px). */
export const U = 64;
export const RING_C = { x: 960, y: 540 } as const;

function Group({
  text,
  size,
  hasStop,
  f,
  at,
  hits,
  last,
  wrap,
}: {
  text: string;
  size: number;
  hasStop: boolean;
  f: number;
  at: number;
  hits: readonly number[];
  last: boolean;
  wrap?: number;
}) {
  const width = useTextWidth(text, size);
  const pitch = Math.round(size * 0.062);
  const dots = useTextDots(text, size, pitch);
  if (width == null || dots == null) return null;
  const dotR = size * 0.07;
  const full = width + (hasStop ? size * 0.035 + dotR * 2 : 0);
  const fit = Math.min(1, MAX_W / full);
  const base = 540 + size * 0.36 * fit;

  const settle = (1 - spr(f, B(at), "snap")) * 0.05 * size;
  const push = 1 + 0.018 * tw(f - B(at), 0, 30, 0, 1, E.out);
  const thump = pulse(sinceLast(f, hits), 14);

  const cx0 = X0 + width + size * 0.035 + dotR;
  const cy0 = -dotR;

  // --- the wrap (only on the last group of a line that hands over to the ring)
  const scanA = wrap != null ? B(wrap) : Number.POSITIVE_INFINITY;
  const scan = tw(f, scanA, scanA + 9, 0, 1, E.inOut);
  const scanX = X0 - 20 + scan * (width + 60);
  const inFlight = last && f >= scanA;
  const nodes: React.ReactNode[] = [];
  const ring = RING.map((p) => ({ x: RING_C.x + p.x * U, y: RING_C.y + p.y * U }));
  const RR = G.R * U;
  // The scanned word holds as dots for a third of a beat, then wraps quickly (so it never sits
  // half-bent), then condenses ring dot by ring dot, clockwise from twelve.
  const wrapA = scanA + B(0.3);
  const wrapB = scanA + B(0.85);
  const wrapT = E.inOut(clamp((f - wrapA) / (wrapB - wrapA)));
  const arrived = new Array(8).fill(0);
  const total = new Array(8).fill(0);
  // Screen transform of the group (fit, push about the left of the baseline).
  const gx = (x: number) => X0 + (x - X0) * fit * push;
  const gy = (y: number) => base + y * fit * push;
  if (inFlight) {
    for (let j = 0; j < dots.pts.length; j++) {
      const p = dots.pts[j];
      const x0 = gx(X0 + p.x);
      const y0 = gy(p.y);
      if (X0 + p.x > scanX) continue;
      const u = p.x / width;
      const th = Math.PI * 2 * (0.07 + 0.86 * u);
      const rad = RR * 0.6 + -p.y * 0.78 * fit;
      const wx = RING_C.x + Math.sin(th) * rad;
      const wy = RING_C.y - Math.cos(th) * rad;
      const k = ((Math.round(th / (Math.PI / 4)) % 8) + 8) % 8;
      total[k]++;
      const cStart = wrapB + 6 + k * 2 + (j % 3);
      const c = E.anticipate(clamp((f - cStart) / 14));
      if (c >= 0.86) {
        arrived[k]++;
        continue;
      }
      const x = mix(mix(x0, wx, wrapT), ring[k].x, c);
      const y = mix(mix(y0, wy, wrapT), ring[k].y, c);
      const r = pitch * 0.42 * fit * mix(1, 0.78, wrapT) * (1 - 0.3 * c);
      nodes.push(<circle key={j} cx={x} cy={y} r={r} fill={K.fg} />);
    }
    const settled = tw(f, wrapB + 30, wrapB + 40, 0, 1, E.snap);
    for (let k = 0; k < 8; k++) {
      const share = total[k] ? arrived[k] / total[k] : 0;
      const base0 = k === 0 && f >= wrapA ? 0.55 : 0;
      const r = G.DOT * U * Math.max(base0 + (1 - base0) * Math.sqrt(share), settled);
      if (r <= 0.5) continue;
      nodes.push(<circle key={`r${k}`} cx={ring[k].x} cy={ring[k].y} r={r} fill={K.fg} />);
    }
  }

  let stop: React.ReactNode = null;
  if (hasStop && (wrap == null || f < wrapA + (wrapB - wrapA) * 0.6)) {
    const land = spr(f, B(at), "snap");
    const t = inFlight ? wrapT : 0;
    const x = mix(gx(cx0), ring[0].x, t);
    // The stop lands on the baseline, popping from small with a little overshoot.
    const y = mix(gy(cy0), ring[0].y, t);
    const r = mix(dotR * fit * push * (1 + 0.14 * thump) * mix(0.35, 1, land), G.DOT * U * 0.55, t);
    stop = <circle cx={x} cy={y} r={r} fill={K.fg} />;
  }

  return (
    <>
      <defs>
        <clipPath id="unscanned">
          <rect x={scanX} y={-2000} width={4000} height={4000} />
        </clipPath>
      </defs>
      <g
        transform={`translate(${X0} ${base}) scale(${fit * push}) translate(${-X0} 0)`}
        clipPath={inFlight ? "url(#unscanned)" : undefined}
      >
        <text
          x={X0}
          y={settle}
          style={{
            fontFamily: SANS,
            fontWeight: 600,
            fontSize: size,
            letterSpacing: "-0.045em",
            fill: "var(--kura-fg)",
          }}
        >
          {text}
        </text>
      </g>
      {stop}
      {nodes}
    </>
  );
}

export function Type({
  groups,
  size = 300,
  hits,
  wrap,
}: {
  groups: readonly TypeGroup[];
  size?: number;
  /** Beats the live full stop thumps on. Default: every beat. */
  hits?: readonly number[];
  /** Beat at which the last group is scanned into dots and wrapped into the ring. */
  wrap?: number;
}) {
  const f = useF();
  const gi = Math.max(0, groups.filter((g) => B(g.at) <= f).length - 1);
  const g = groups[gi];
  const hasStop = g.text.endsWith(".");
  const text = hasStop ? g.text.slice(0, -1) : g.text;
  const beats =
    hits ??
    Array.from({ length: 64 }, (_, i) => Math.floor(groups[0].at) + i * 0.5).filter(
      (b) => b >= g.at,
    );
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" aria-hidden>
        <Group
          key={gi}
          text={text}
          size={size}
          hasStop={hasStop}
          f={f}
          at={g.at}
          hits={beats}
          last={gi === groups.length - 1}
          wrap={wrap}
        />
      </svg>
    </AbsoluteFill>
  );
}
