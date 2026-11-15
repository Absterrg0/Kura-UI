import type * as React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { clamp, E, mix, pulse, spr, tw } from "../ease";
import { K, SANS } from "../palette";
import { useTextDots, useTextWidth } from "../text-dots";
import { B } from "../timing";

/**
 * 0:16.3, the pocket: the music drops to almost nothing and so does the picture. One dot. On the
 * next beat it bursts into the dot matrix of the name; on the one after, the dots resolve into type
 * (dots into type, the reverse of 0:04); then the line.
 * Sequence-relative: frame 0 is beat 32.
 */
export const TITLE_FROM = 32;
const SIZE = 300;
const X0 = 150;
const BASE = 590;
const PITCH = 12;

export function Title() {
  const f = useCurrentFrame() + B(TITLE_FROM);
  const dots = useTextDots("Kura UI", SIZE, PITCH);
  const width = useTextWidth("Kura UI", SIZE);
  if (!dots || width == null) return null;
  const origin = { x: X0 + width + 60, y: BASE - 22 };
  const burst = B(33);
  const solid = B(34);
  const reveal = tw(f, solid, solid + 10, 0, 1, E.inOut);
  const revealX = X0 - 20 + reveal * (width + 60);
  const nodes: React.ReactNode[] = [];
  if (f < burst) {
    const p = pulse(f - B(32), 30);
    nodes.push(<circle key="o" cx={origin.x} cy={origin.y} r={22 * (1 + 0.12 * p)} fill={K.fg} />);
  } else {
    dots.pts.forEach((p, j) => {
      const x1 = X0 + p.x;
      const y1 = BASE + p.y;
      if (x1 < revealX) return;
      const d = Math.hypot(x1 - origin.x, y1 - origin.y);
      const start = burst + Math.round((d / 1400) * 16) + (j % 4);
      const t = E.out(clamp((f - start) / 18));
      if (f < start) return;
      nodes.push(
        <circle
          key={j}
          cx={mix(origin.x, x1, t)}
          cy={mix(origin.y, y1, t)}
          r={PITCH * 0.36 * mix(0.6, 1, t)}
          fill={K.fg}
        />,
      );
    });
  }
  const line = f >= B(35);
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" aria-hidden>
        <defs>
          <clipPath id="revealed">
            <rect x={0} y={0} width={Math.max(0, revealX)} height={1080} />
          </clipPath>
        </defs>
        {f >= solid && (
          <text
            x={X0}
            y={BASE}
            clipPath="url(#revealed)"
            style={{
              fontFamily: SANS,
              fontWeight: 600,
              fontSize: SIZE,
              letterSpacing: "-0.045em",
              fill: "var(--kura-fg)",
            }}
          >
            Kura UI
          </text>
        )}
        {nodes}
        {line && (
          <text
            x={X0 + 8}
            y={BASE + 140 + (1 - spr(f, B(35), "snap")) * 8}
            style={{
              fontFamily: SANS,
              fontWeight: 500,
              fontSize: 76,
              letterSpacing: "-0.035em",
              fill: "var(--kura-fg-muted)",
            }}
          >
            Components for agent interfaces.
          </text>
        )}
      </svg>
    </AbsoluteFill>
  );
}
