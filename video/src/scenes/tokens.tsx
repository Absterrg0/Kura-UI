import { AbsoluteFill, Easing, useCurrentFrame } from "remotion";
import { clamp01, GLIDE, hash, mix, tween } from "../lib/anim";
import { Headline } from "../lib/type";

/**
 * 0:00–0:10. One live dot emits tokens, a row, then a wall of them; the wall falls into the one
 * thing most apps draw for all that work: a grey spinner.
 */

export const X0 = 160;
const PITCH = 24;
const COLS = 67;
const ROW_Y = 612;
const ROWS = 16;
/** Where the wall falls to: the spinner, which the next shot turns into the glyph. */
export const SPINNER = { x: 1420, y: 540, r: 46 } as const;

/** Tokens emitted by frame f: a slow start on the eighth notes, then a run that keeps speeding up. */
function emitted(f: number) {
  if (f < 24) return 0;
  if (f < 144) return Math.floor((f - 24) / 15) + 1; // 8 tokens, one per eighth note
  const u = f - 144;
  // Accelerating: about 1 per 4 frames at first; the wall is full just as it falls (f400).
  return Math.min(COLS * ROWS, 8 + Math.floor(0.25 * u + 0.000546 * u ** 2.6));
}

const FALL_AT = 412;

export function Tokens() {
  const frame = useCurrentFrame();
  const n = emitted(frame);
  const dots: React.ReactNode[] = [];
  const fallen = frame >= FALL_AT;

  for (let i = 0; i < n; i++) {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    let x = X0 + col * PITCH;
    let y = ROW_Y + row * PITCH;
    let o = 1;
    let r = 4.2;
    if (fallen) {
      // Nearest the spinner falls first; each dot accelerates in (no overshoot), shrinking.
      const d = Math.hypot(x - SPINNER.x, y - SPINNER.y);
      const start = FALL_AT + (d / 1500) * 26 + hash(i) * 6;
      const p = tween(frame, start, start + 22, 0, 1, Easing.bezier(0.55, 0, 1, 0.45));
      x = mix(x, SPINNER.x, p);
      y = mix(y, SPINNER.y, p);
      r = mix(4.2, 1.6, p);
      o = 1 - clamp01((p - 0.7) / 0.3);
      if (o <= 0) continue;
    }
    // The newest dots are the brightest; the run behind them settles to ink-2.
    const age = n - 1 - i;
    const tone = age < 1 ? 1 : age < 40 ? mix(1, 0.62, age / 40) : 0.62;
    dots.push(<circle key={i} cx={x} cy={y} r={r} fill="var(--kura-fg)" opacity={o * tone} />);
  }

  // The live edge: the next token's place, pulsing (kura-dot-pulse, 1.1 s).
  const live = !fallen && n < COLS * ROWS;
  const pulse = 0.25 + 0.75 * (0.5 + 0.5 * Math.cos((frame / 66) * Math.PI * 2));
  const lx = X0 + (n % COLS) * PITCH;
  const ly = ROW_Y + Math.floor(n / COLS) * PITCH;

  // The film opens close on the first dot and pulls back as the tokens start to come.
  const zoom = 1 + 3.2 * (1 - tween(frame, 10, 150, 0, 1, GLIDE));
  const opening = `translate(${X0} ${ROW_Y}) scale(${zoom}) translate(${-X0} ${-ROW_Y})`;

  // The spinner, after the fall: a faint track with a quarter arc running round it.
  const spin = tween(frame, 448, 462);
  const angle = (frame - 448) * 7.5;
  const C = 2 * Math.PI * SPINNER.r;

  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} className="absolute inset-0" aria-hidden>
        <g transform={opening}>{dots}</g>
        {live && (
          <g transform={opening}>
            <circle cx={lx} cy={ly} r={4.2} fill="var(--kura-fg)" opacity={pulse} />
          </g>
        )}
        {spin > 0 && (
          <g opacity={spin}>
            <circle
              cx={SPINNER.x}
              cy={SPINNER.y}
              r={SPINNER.r}
              fill="none"
              stroke="var(--kura-fg-subtle)"
              strokeOpacity={0.18}
              strokeWidth={7}
            />
            <circle
              cx={SPINNER.x}
              cy={SPINNER.y}
              r={SPINNER.r}
              fill="none"
              stroke="var(--kura-fg-subtle)"
              strokeWidth={7}
              strokeLinecap="round"
              strokeDasharray={`${C * 0.26} ${C}`}
              transform={`rotate(${angle} ${SPINNER.x} ${SPINNER.y})`}
            />
          </g>
        )}
      </svg>
      {spin > 0 && (
        <div
          className="absolute font-kura-sans text-kura-fg-subtle"
          style={{
            left: SPINNER.x + SPINNER.r + 34,
            top: SPINNER.y - 22,
            fontSize: 36,
            letterSpacing: "-0.01em",
            opacity: spin,
          }}
        >
          Thinking…
        </div>
      )}

      <Headline text="Agents work in tokens." at={40} out={226} style={pos(372)} />
      <Headline text="Thousands a minute." at={250} out={404} style={pos(372)} muted={[1, 2]} />
      <Headline text="Most apps show you this." at={452} style={pos(468)} size={92} />
    </AbsoluteFill>
  );
}

function pos(top: number): React.CSSProperties {
  return { position: "absolute", left: X0 - 6, top };
}
