import { AbsoluteFill, useCurrentFrame } from "remotion";
import { mix, settle, tween } from "../lib/anim";

/**
 * 0:48–0:55. The film ends where it began: one dot. It grows into the token, and the two
 * stepped walls of the mark slide in along the diagonal and close round it. Then the name,
 * the line from the site, and where to find it.
 */

export const END_FRAMES = 420;

// The mark, exactly as design/logo/kura-mark.svg draws it (viewBox 748).
const WALL_A =
  "M0,0 L511,0 L511,122.5 L363,122.5 L363,225.5 L225.5,225.5 L225.5,363 L122.5,363 L122.5,511 L0,511 Z";
const WALL_B =
  "M748,748 L237,748 L237,625.5 L385,625.5 L385,522.5 L522.5,522.5 L522.5,385 L625.5,385 L625.5,237 L748,237 Z";

export const LOCK = 112;

export function End() {
  const frame = useCurrentFrame();

  // The dot: the live edge from the first frame, pulsing, then it becomes the token.
  const pulse = 0.35 + 0.65 * (0.5 + 0.5 * Math.cos((frame / 66) * Math.PI * 2));
  const grow = settle(frame, 30, 110);
  const tokenR = mix(9 / (360 / 748), 110, grow); // in mark units
  const dotOpacity = frame < 30 ? pulse : mix(pulse, 1, tween(frame, 30, 44));

  const a = settle(frame, 66, 95);
  const b = settle(frame, 72, 95);
  const travel = 560;

  // The lockup: the mark steps left for the name.
  const lock = settle(frame, 150, 120);
  const markSize = mix(360, 176, lock);
  const markX = mix(960, 960 - 182, lock);
  const word = settle(frame, 166, 140);
  const line = tween(frame, 214, 226);
  const lineK = settle(frame, 214, 140);
  const url = tween(frame, 236, 248);
  const urlK = settle(frame, 236, 140);

  return (
    <AbsoluteFill>
      <svg
        viewBox="0 0 748 748"
        width={markSize}
        height={markSize}
        className="absolute"
        style={{ left: markX - markSize / 2, top: 470 - markSize / 2, overflow: "visible" }}
        aria-hidden
      >
        <path
          d={WALL_A}
          fill="var(--kura-fg)"
          opacity={tween(frame, 66, 76)}
          transform={`translate(${-travel * (1 - a)} ${-travel * (1 - a)})`}
        />
        <path
          d={WALL_B}
          fill="var(--kura-fg)"
          opacity={tween(frame, 72, 82)}
          transform={`translate(${travel * (1 - b)} ${travel * (1 - b)})`}
        />
        <circle cx={374} cy={374} r={tokenR} fill="var(--kura-fg)" opacity={dotOpacity} />
      </svg>
      <div
        className="absolute font-semibold text-kura-fg"
        style={{
          left: markX + markSize / 2 + 44,
          top: 470 - 84,
          fontSize: 150,
          lineHeight: "168px",
          letterSpacing: "-0.035em",
          overflow: "hidden",
          paddingRight: 8,
        }}
      >
        <span
          style={{
            display: "inline-block",
            transform: `translateY(${(1 - word) * 100}%)`,
            opacity: tween(frame, 166, 178),
          }}
        >
          Kura
        </span>
      </div>
      <div
        className="absolute inset-x-0 text-center text-kura-fg-muted"
        style={{
          top: 680,
          fontSize: 42,
          letterSpacing: "-0.02em",
          opacity: line,
          transform: `translateY(${(1 - lineK) * 14}px)`,
        }}
      >
        Components for agent interfaces.
      </div>
      <div
        className="absolute inset-x-0 text-center font-kura-mono text-kura-fg"
        style={{
          top: 760,
          fontSize: 32,
          opacity: url,
          transform: `translateY(${(1 - urlK) * 14}px)`,
        }}
      >
        kuro.abstergo.fyi
      </div>
    </AbsoluteFill>
  );
}
