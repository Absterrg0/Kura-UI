import { StatusGlyph } from "@kura/components/status-glyph";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { GLIDE, mix, settle, tween } from "../lib/anim";
import { Headline } from "../lib/type";
import { SPINNER, X0 } from "./tokens";

/**
 * 0:10–0:18. The spinner's arc becomes the light chasing round the site's hero glyph (a 25×25
 * dot matrix, ring of radius 9), which then lives through running → needs you → done. The done
 * disc swells until its dots touch: the next shot opens on the real glyph at the same size.
 */

const N = 25;
const C = (N - 1) / 2;
const RING = 9;
export const PITCH = 26;
export const CENTRE = { x: SPINNER.x, y: SPINNER.y };

const INK: [number, number, number] = [242, 243, 244];
const EMBER: [number, number, number] = [255, 107, 44];
/** `fg-muted`, the colour of a done glyph: the swollen disc settles to it before the cut. */
const MUTED: [number, number, number] = [164, 167, 173];

/** The states and when each begins, in frames into the shot. */
export const GLYPH_AT = { waiting: 210, done: 390, swell: 440, end: 480 } as const;

// The ring: a midpoint circle, one dot thick with no clumps on the diagonals (as the site draws it).
const ringMask = new Uint8Array(N * N);
{
  let x = RING;
  let y = 0;
  let err = 1 - RING;
  while (x >= y) {
    for (const [px, py] of [
      [x, y],
      [y, x],
      [-y, x],
      [-x, y],
      [-x, -y],
      [-y, -x],
      [y, -x],
      [x, -y],
    ] as const)
      ringMask[(C + py) * N + (C + px)] = 1;
    y++;
    if (err < 0) err += 2 * y + 1;
    else {
      x--;
      err += 2 * (y - x) + 1;
    }
  }
}

type Target = [light: number, warm: number];

function running(i: number, ang: number, t: number): Target {
  if (!ringMask[i]) return [0, 0];
  // The head starts where the spinner's arc ended, and goes round once every 1.6 s.
  const head = ((33.6 + t * 225) * Math.PI) / 180;
  const behind = (((head - ang) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const tail = Math.max(0, 1 - behind / (Math.PI * 1.3));
  return [0.28 + 0.72 * tail ** 1.6, 0];
}

function waiting(i: number, d: number, t: number): Target {
  if (ringMask[i]) return [0.95, 1];
  if (d <= 2.3) {
    // The centre blinks (kura-blink, 1.1 s), eased so it breathes rather than strobes.
    const blink = (Math.sin((t * Math.PI * 2) / 1.1 - Math.PI / 2) + 1) / 2;
    return [0.3 + 0.7 * blink, 1];
  }
  return [0, 0];
}

function done(i: number, d: number, t: number): Target {
  // The disc fills from the centre out in 0.8 s.
  const reach = Math.min(RING, (t / 0.8) * RING);
  return d <= reach || ringMask[i] ? [1, 0] : [0, 0];
}

export function Glyph() {
  const frame = useCurrentFrame();
  const t = frame / 60;

  // Zoom: from the spinner's size to the full matrix.
  const z0 = SPINNER.r / (RING * PITCH);
  const zoom = Math.exp(mix(Math.log(z0), 0, tween(frame, 36, 132, 0, 1, GLIDE)));
  const pitch = PITCH * zoom;
  const matrix = tween(frame, 70, 130);
  const swell = tween(frame, GLYPH_AT.swell, GLYPH_AT.end - 4);

  const dots: React.ReactNode[] = [];
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const i = y * N + x;
      const dx = x - C;
      const dy = y - C;
      const d = Math.hypot(dx, dy);
      const ang = (Math.atan2(dx, -dy) + Math.PI * 2) % (Math.PI * 2);
      const run = running(i, ang, t);
      const wait = waiting(i, d, t - GLYPH_AT.waiting / 60);
      const fin = done(i, d, t - GLYPH_AT.done / 60);
      // Each change of state eases over 18 frames, so one state melts into the next.
      const a = tween(frame, GLYPH_AT.waiting, GLYPH_AT.waiting + 18);
      const b = tween(frame, GLYPH_AT.done, GLYPH_AT.done + 18);
      const light = mix(mix(run[0], wait[0], a), fin[0], b);
      const warm = mix(mix(run[1], wait[1], a), fin[1], b);
      const cx = CENTRE.x + dx * pitch;
      const cy = CENTRE.y + dy * pitch;
      const fade = Math.max(0, 1 - (d / (C * 1.32)) ** 3);
      const off = 0.13 * fade * (1 - light) * matrix * (1 - swell);
      if (off > 0.004)
        dots.push(
          <circle key={`o${i}`} cx={cx} cy={cy} r={pitch * 0.13} fill="#ffffff" opacity={off} />,
        );
      if (light < 0.01) continue;
      const r = Math.round(mix(mix(INK[0], EMBER[0], warm), MUTED[0], swell));
      const g = Math.round(mix(mix(INK[1], EMBER[1], warm), MUTED[1], swell));
      const bl = Math.round(mix(mix(INK[2], EMBER[2], warm), MUTED[2], swell));
      const rad = mix(pitch * (0.2 + 0.15 * light), pitch * 0.56, swell * light);
      dots.push(
        <circle
          key={`l${i}`}
          cx={cx}
          cy={cy}
          r={rad}
          fill={`rgb(${r},${g},${bl})`}
          opacity={Math.min(1, light)}
        />,
      );
    }

  const status = frame < GLYPH_AT.waiting ? "running" : frame < GLYPH_AT.done ? "waiting" : "done";
  const since = status === "running" ? 0 : status === "waiting" ? GLYPH_AT.waiting : GLYPH_AT.done;
  const swap = settle(frame, since, 170);
  const caption = tween(frame, 70, 84) * (1 - tween(frame, 396, 410));

  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} className="absolute inset-0" aria-hidden>
        {dots}
      </svg>
      <Headline
        text="Kura draws the work."
        at={24}
        out={396}
        size={96}
        style={{ position: "absolute", left: X0 - 6, top: 388 }}
      />
      <div
        className="absolute flex items-center gap-6 font-kura-mono text-kura-fg-subtle"
        style={{ left: X0, top: 556, fontSize: 30, opacity: caption }}
      >
        <span
          style={{ transform: "scale(2.4)", transformOrigin: "center", display: "inline-flex" }}
        >
          <StatusGlyph status={status} size="md" label={null} />
        </span>
        <code style={{ marginLeft: 8, whiteSpace: "nowrap" }}>
          {"<StatusGlyph status="}
          <span
            style={{
              display: "inline-block",
              color: status === "waiting" ? "var(--kura-ember-text)" : "var(--kura-fg)",
              opacity: tween(frame, since, since + 8),
              transform: `translateY(${(1 - swap) * 10}px)`,
            }}
          >
            "{status}"
          </span>
          {" />"}
        </code>
      </div>
    </AbsoluteFill>
  );
}
