import type * as React from "react";
import { cn } from "../../lib/cn";

export type AgentStatus =
  | "queued"
  | "running"
  | "waiting"
  | "done"
  | "failed"
  | "skipped"
  | "paused";

export interface StatusGlyphProps extends Omit<React.ComponentProps<"span">, "children"> {
  /** The state to draw. */
  status: AgentStatus;
  /** 13 / 15 / 20px. Default "md". */
  size?: "sm" | "md" | "lg";
  /** Spoken text for the state. Default: the state name ("Running"). Pass null when nearby text already says it. */
  label?: string | null;
}

const SPOKEN: Record<AgentStatus, string> = {
  queued: "Queued",
  running: "Running",
  waiting: "Waiting for you",
  done: "Done",
  failed: "Failed",
  skipped: "Skipped",
  paused: "Paused",
};

const PX = { sm: 13, md: 15, lg: 20 } as const;

// Every glyph sits in a 15-unit box. The ring is eight dots on a true circle, so at 13–15px it
// reads as a ring, not as a dotted square; the marks inside it share its dot size.
const C = 7.5;
const R = 5.4;
const DOT = 1.25;
type Dot = readonly [x: number, y: number, r?: number];
/** The ring, clockwise from twelve o'clock: the path the running light travels. */
const RING: readonly Dot[] = Array.from({ length: 8 }, (_, i) => {
  const a = (i / 8) * Math.PI * 2;
  return [C + Math.sin(a) * R, C - Math.cos(a) * R] as const;
});
const step = 2.55;
const MARKS: Record<Exclude<AgentStatus, "running">, readonly Dot[]> = {
  queued: RING,
  // The ring with a centre that blinks (the centre is drawn last).
  waiting: [...RING, [C, C, 1.7]],
  // The ring, closed into one solid disc: finished.
  done: [[C, C, 5.6]],
  failed: [
    [C, C],
    [C - step, C - step],
    [C - 2 * step, C - 2 * step],
    [C + step, C - step],
    [C + 2 * step, C - 2 * step],
    [C - step, C + step],
    [C - 2 * step, C + 2 * step],
    [C + step, C + step],
    [C + 2 * step, C + 2 * step],
  ],
  skipped: [
    [C - 3.6, C],
    [C, C],
    [C + 3.6, C],
  ],
  paused: [
    [C - 2.3, C - 3.2],
    [C - 2.3, C],
    [C - 2.3, C + 3.2],
    [C + 2.3, C - 3.2],
    [C + 2.3, C],
    [C + 2.3, C + 3.2],
  ],
};

const TONE: Record<AgentStatus, string> = {
  queued: "text-kura-fg-subtle",
  running: "text-kura-fg",
  waiting: "text-kura-ember",
  done: "text-kura-fg-muted",
  failed: "text-kura-danger-text",
  skipped: "text-kura-fg-subtle",
  paused: "text-kura-fg-muted",
};

/**
 * One status vocabulary for every agent surface, drawn in dots: queued is a ring of eight dots,
 * running is a light chasing round that ring, waiting on a person is an ember ring with a
 * blinking centre, done is a solid disc, failed a cross, skipped a dash and
 * paused two bars.
 */
export function StatusGlyph({ status, size = "md", label, className, ...props }: StatusGlyphProps) {
  const px = PX[size];
  const spoken = label === undefined ? SPOKEN[status] : label;
  const dots: React.ReactNode[] = [];
  if (status === "running") {
    RING.forEach(([x, y], i) => {
      dots.push(
        <circle
          key={i}
          cx={x}
          cy={y}
          r={DOT}
          style={{ animationDelay: `${i * 150}ms` }}
          className={cn(
            "animate-kura-chase fill-current opacity-20 motion-reduce:animate-none",
            // Held still, the light rests on the first quarter of the ring.
            i < 3 && "motion-reduce:opacity-100",
          )}
        />,
      );
    });
  } else {
    const marks = MARKS[status];
    marks.forEach(([x, y, r], i) => {
      const centre = status === "waiting" && i === marks.length - 1;
      dots.push(
        <circle
          key={i}
          cx={x}
          cy={y}
          r={r ?? DOT}
          className={cn("fill-current", centre && "animate-kura-blink motion-reduce:animate-none")}
        />,
      );
    });
  }
  const shared = {
    "data-slot": "status-glyph",
    "data-status": status,
    className: cn("inline-grid shrink-0 place-items-center", TONE[status], className),
    style: { width: px, height: px },
    ...props,
  };
  const glyph = (
    <svg viewBox="0 0 15 15" width={px} height={px} aria-hidden>
      {dots}
    </svg>
  );
  return spoken ? (
    <span role="img" aria-label={spoken} {...shared}>
      {glyph}
    </span>
  ) : (
    <span aria-hidden {...shared}>
      {glyph}
    </span>
  );
}
