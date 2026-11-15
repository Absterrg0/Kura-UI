import { AbsoluteFill } from "remotion";
import { clamp, E, mix, spr, tw } from "../ease";
import { G } from "../glyph";
import { K, MONO } from "../palette";
import { useF } from "../shot";
import { B } from "../timing";

/**
 * 0:42.7. One command, typed large into a sunken well that runs off both edges of the frame, the
 * whole command always in view. On the downbeat of bar 22 it runs, and the files land below it,
 * one a sixteenth, each with a done mark.
 */
const CMD = "npx @kura-ui/cli add approval-prompt";
const FILES = [
  "approval-prompt/approval-prompt.tsx",
  "status-glyph/status-glyph.tsx",
  "agent-sigil/agent-sigil.tsx",
  "halftone/halftone.tsx",
  "button/button.tsx",
  "kbd/kbd.tsx",
];
const SIZE = 74;
const TYPE_FROM = 84.25;
const RUN = 88;

export function Install() {
  const f = useF();
  // Characters on a steady hand: ~2 frames each, a short hold after each word.
  const times: number[] = [];
  let t0 = B(TYPE_FROM);
  for (let i = 0; i < CMD.length; i++) {
    times.push(t0);
    t0 += CMD[i] === " " ? 7 : 2.1;
  }
  const typed = times.filter((t) => t <= f).length;
  const ran = f >= B(RUN);
  // A slow push across the whole shot; one framing throughout.
  const scale = mix(1, 1.03, tw(f, B(84), B(92), 0, 1, E.inOut));
  const x = 110;
  const y = 380;
  const files = ran
    ? Math.max(
        0,
        Math.min(FILES.length, Math.floor((f - B(RUN + 0.5)) / (B(RUN + 0.75) - B(RUN + 0.5))) + 1),
      )
    : 0;
  const caretOn = Math.floor(f / 30) % 2 === 0 || (typed < CMD.length && typed > 0);
  return (
    <AbsoluteFill>
      {/* The well runs off both edges of the frame: a command line, not a card. */}
      <div
        className="bg-kura-surface-sunken shadow-kura-sunk"
        style={{
          position: "absolute",
          left: -40,
          right: -40,
          top: y - SIZE * scale * 1.05,
          height: SIZE * scale * 1.7,
          borderRadius: 0,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: x,
          top: y - SIZE * 0.78 * scale,
          transform: `scale(${scale})`,
          transformOrigin: "0 0",
          fontFamily: MONO,
          fontSize: SIZE,
          fontWeight: 500,
          letterSpacing: "-0.02em",
          whiteSpace: "pre",
          lineHeight: 1,
        }}
      >
        <span style={{ color: "var(--kura-fg-subtle)" }}>$ </span>
        <span style={{ color: "var(--kura-fg)" }}>{CMD.slice(0, typed)}</span>
        {!ran && caretOn && <span style={{ color: "var(--kura-fg-muted)" }}>▍</span>}
      </div>
      <svg
        width={1920}
        height={1080}
        viewBox="0 0 1920 1080"
        style={{ position: "absolute", inset: 0 }}
        aria-hidden
      >
        {FILES.slice(0, files).map((p, i) => {
          const at = B(RUN + 0.5 + i * 0.25);
          const s = spr(f, at, "snap");
          const cy = 520 + i * 84;
          const close = clamp(spr(f, at + 3, "land"));
          return (
            <g key={p} transform={`translate(0 ${(1 - s) * 10})`}>
              <circle cx={136} cy={cy - 15} r={mix(G.DOT, G.DONE, close) * 3.4} fill={K.muted} />
              <text
                x={192}
                y={cy}
                style={{ fontFamily: MONO, fontSize: 46, letterSpacing: "-0.02em" }}
              >
                <tspan fill="var(--kura-fg-subtle)">components/kura/</tspan>
                <tspan fill="var(--kura-fg)">{p}</tspan>
              </text>
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
}
