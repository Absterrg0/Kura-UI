import type * as React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { clamp, E, mix, pulse, spr, tw } from "../ease";
import { G, RING } from "../glyph";
import { K, SANS } from "../palette";
import { useTextDots, useTextWidth } from "../text-dots";
import { B, riffBeats, sinceLast } from "../timing";

/**
 * 0:02. "Agents / work / in / tokens." One word per beat, hard swaps, 380 px. The live dot rides
 * after each word like a cursor; on "tokens" it is the full stop. Then the word is scanned into
 * a dot matrix and its dots fly into the eight dots of the status ring (the next shot's actor):
 * type becomes dots becomes a glyph.
 *
 * Sequence-relative: frame 0 here is beat 4 of the film.
 */
export const WORDS_FROM = 4;
const SIZE = 380;
const X0 = 150;
const BASE = 690;
const WORDS = ["Agents", "work", "in", "tokens"] as const;
const DOT_R = SIZE * 0.07;
/** Ring scale: one glyph unit in px. The ring is 15 units, so 960 px. */
export const U = 64;
export const RING_C = { x: 960, y: 540 } as const;

const HITS = riffBeats(4, 10);
const PITCH = 15;

export function Words() {
  const local = useCurrentFrame();
  const f = local + B(WORDS_FROM);
  const beat = Math.min(3, Math.floor((f - B(4)) / (B(5) - B(4))));
  const wi = Math.max(0, f < B(8) ? [4, 5, 6, 7].filter((b) => B(b) <= f).length - 1 : 3);
  const word = WORDS[wi];
  const width = useTextWidth(word, SIZE);
  const dots = useTextDots("tokens", SIZE, PITCH);
  if (width == null || dots == null) return null;
  void beat;

  const since = f - B(4 + wi);
  // A hard cut, then a 10-frame settle from a few px low, with overshoot.
  const settle = f < B(8) ? (1 - spr(f, B(4 + wi), "snap")) * 0.05 * SIZE : 0;
  // A slow push through the four words, re-based on each cut so every word has its own push.
  const push = wi === 3 ? 1 : 1 + 0.018 * tw(since, 0, 30, 0, 1, E.out);
  const thump = pulse(sinceLast(f, HITS), 14);

  // The cursor dot: after the word, sitting on the baseline like a full stop.
  const cx0 = X0 + width + SIZE * 0.035 + DOT_R;
  const cy0 = BASE - DOT_R;

  // --- the scan and the flight (beats 8–10)
  const scanA = B(8);
  const scanB = B(8) + 9;
  const scan = tw(f, scanA, scanB, 0, 1, E.inOut);
  const scanX = X0 - 20 + scan * (width + 60);
  const inFlight = f >= scanA;

  const ring = RING.map((p) => ({ x: RING_C.x + p.x * U, y: RING_C.y + p.y * U }));
  const nodes: React.ReactNode[] = [];
  const RR = G.R * U;
  // Wrap: the word bends round the ring like type on a path (beats 8.3–9.1), clockwise from one
  // o'clock to eleven, letters standing on the circle; then every dot condenses into its nearest
  // ring dot (9.1–9.7) and the ring's dots swell as they arrive.
  const wrap = E.inOut(clamp((f - B(8.3)) / (B(9.1) - B(8.3))));
  const arrived = new Array(8).fill(0);
  const total = new Array(8).fill(0);
  if (inFlight) {
    for (let j = 0; j < dots.pts.length; j++) {
      const p = dots.pts[j];
      const x0 = X0 + p.x;
      const y0 = BASE + p.y;
      if (x0 > scanX) continue;
      const u = p.x / width;
      const th = Math.PI * 2 * (0.07 + 0.86 * u);
      // Height above the baseline becomes height outside the circle.
      const rad = RR + -p.y * 0.62;
      const wx = RING_C.x + Math.sin(th) * rad;
      const wy = RING_C.y - Math.cos(th) * rad;
      const k = ((Math.round(th / (Math.PI / 4)) % 8) + 8) % 8;
      total[k]++;
      // Condense, ring dot by ring dot, clockwise from twelve: the ring draws itself.
      const cStart = B(9.05) + k * 2 + (j % 3);
      const c = E.anticipate(clamp((f - cStart) / 16));
      if (c >= 1) {
        arrived[k]++;
        continue;
      }
      const x = mix(mix(x0, wx, wrap), ring[k].x, c);
      const y = mix(mix(y0, wy, wrap), ring[k].y, c);
      const r = PITCH * 0.37 * mix(1, 0.8, wrap) * (1 - 0.4 * c);
      nodes.push(<circle key={j} cx={x} cy={y} r={r} fill={K.fg} />);
    }
  }

  // The full stop: drops in on the riff hit as the word lands, then lifts to twelve o'clock.
  const stopT = E.inOut(clamp((f - B(8.3)) / (B(9.1) - B(8.3))));
  const settled = tw(f, B(9.7), B(10), 0, 1, E.snap);
  for (let k = 0; k < 8; k++) {
    const share = total[k] ? arrived[k] / total[k] : 0;
    const grown = Math.sqrt(share);
    const base = k === 0 && f >= B(9.1) ? 0.55 : 0;
    const r = G.DOT * U * Math.max(base + (1 - base) * grown, settled);
    if (r <= 0.5) continue;
    nodes.push(
      <circle
        key={`r${k}`}
        cx={ring[k].x}
        cy={ring[k].y}
        r={r}
        fill={settled > 0.5 ? K.subtle : K.fg}
      />,
    );
  }

  let stop: React.ReactNode = null;
  if (wi === 3 && f < B(9.1)) {
    const land = spr(f, B(7), "snap");
    const x = mix(cx0, ring[0].x, stopT);
    const y = mix(cy0 - (1 - Math.min(1, land)) * 90, ring[0].y, stopT);
    const r = mix(DOT_R * (1 + 0.14 * thump), G.DOT * U * 0.55, stopT);
    stop = <circle cx={x} cy={y} r={r} fill={K.fg} />;
  }

  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" aria-hidden>
        <defs>
          <clipPath id="unscanned">
            <rect x={scanX} y={0} width={1920} height={1080} />
          </clipPath>
        </defs>
        <g transform={`translate(${X0} ${BASE}) scale(${push}) translate(${-X0} ${-BASE})`}>
          <text
            x={X0}
            y={BASE + settle}
            clipPath={inFlight ? "url(#unscanned)" : undefined}
            style={{
              fontFamily: SANS,
              fontWeight: 600,
              fontSize: SIZE,
              letterSpacing: "-0.045em",
              fill: "var(--kura-fg)",
            }}
          >
            {word}
          </text>
          {stop}
        </g>
        {nodes}
      </svg>
    </AbsoluteFill>
  );
}
