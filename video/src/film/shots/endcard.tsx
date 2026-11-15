import { AbsoluteFill } from "remotion";
import { clamp, E, mix, spr, tw } from "../ease";
import { MONO, SANS } from "../palette";
import { useF } from "../shot";
import { B } from "../timing";

/**
 * 0:48.8, the end card. One dot: the token. The token-gate mark's two stepped walls
 * (design/logo/kura-mark.svg, unchanged) slide in along the diagonal and lock round it on the
 * beat. A bar later the mark moves left and the name, the line and the address set beside it.
 */
const WALL_A =
  "M0,0 L511,0 L511,122.5 L363,122.5 L363,225.5 L225.5,225.5 L225.5,363 L122.5,363 L122.5,511 L0,511 Z";
const WALL_B =
  "M748,748 L237,748 L237,625.5 L385,625.5 L385,522.5 L522.5,522.5 L522.5,385 L625.5,385 L625.5,237 L748,237 Z";
const VB = 748;

export function EndCard({ at = 96 }: { at?: number }) {
  const f = useF();
  const lock = B(at + 1);
  // The walls travel the diagonal (anticipation: a small step back first), landing on the beat.
  const inA = E.anticipate(clamp((f - B(at + 0.25)) / (lock - B(at + 0.25))));
  // On the lock the walls bite a few units past home and spring back.
  const since = f - lock;
  const bite = since >= 0 ? -16 * Math.exp(-since / 5) * Math.cos(since / 3.2) : 0;
  const travel = (1 - inA) * 1400 + bite;
  // The lockup: the mark moves left and shrinks a little; the type sets on the next beats.
  const lk = tw(f, B(at + 2), B(at + 2) + 26, 0, 1, E.inOut);
  const big = 640;
  const small = 440;
  const size = mix(big, small, lk);
  const cx = mix(960, 400, lk);
  const cy = 540;
  const k = size / VB;
  const dotPulse = f < lock ? 1 + 0.06 * Math.sin(((f - B(at)) / 30.5) * Math.PI * 2) : 1;
  const name = f >= B(at + 2.5);
  const line = f >= B(at + 3.5);
  const url = f >= B(at + 4.5);
  const tx = 715;
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" aria-hidden>
        <g transform={`translate(${cx - size / 2} ${cy - size / 2}) scale(${k})`}>
          <g transform={`translate(${-travel} ${-travel})`}>
            <path d={WALL_A} fill="var(--kura-fg)" />
          </g>
          <g transform={`translate(${travel} ${travel})`}>
            <path d={WALL_B} fill="var(--kura-fg)" />
          </g>
          <circle cx={374} cy={374} r={110 * dotPulse} fill="var(--kura-fg)" />
        </g>
        <g
          style={{
            fontFamily: SANS,
            fontWeight: 600,
            letterSpacing: "-0.045em",
            fill: "var(--kura-fg)",
          }}
        >
          {name && (
            <text x={tx} y={520 + (1 - spr(f, B(at + 2.5), "snap")) * 10} style={{ fontSize: 236 }}>
              Kura UI
            </text>
          )}
        </g>
        {line && (
          <text
            x={tx + 8}
            y={628 + (1 - spr(f, B(at + 3.5), "snap")) * 8}
            style={{
              fontFamily: SANS,
              fontWeight: 500,
              fontSize: 64,
              letterSpacing: "-0.03em",
              fill: "var(--kura-fg-muted)",
            }}
          >
            Components for agent interfaces.
          </text>
        )}
        {url && (
          <text
            x={tx + 10}
            y={750 + (1 - spr(f, B(at + 4.5), "snap")) * 6}
            style={{
              fontFamily: MONO,
              fontWeight: 500,
              fontSize: 58,
              letterSpacing: "-0.02em",
              fill: "var(--kura-fg-muted)",
            }}
          >
            Open source · kuro.abstergo.fyi
          </text>
        )}
      </svg>
    </AbsoluteFill>
  );
}
