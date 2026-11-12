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

// Each state is a 5×5 dot pattern, row by row.
const PATTERN: Record<Exclude<AgentStatus, "running">, readonly string[]> = {
  queued: ["01110", "10001", "10001", "10001", "01110"],
  waiting: ["01110", "10001", "10101", "10001", "01110"],
  done: ["01110", "11111", "11111", "11111", "01110"],
  failed: ["10001", "01010", "00100", "01010", "10001"],
  skipped: ["00000", "00000", "11111", "00000", "00000"],
  paused: ["00000", "01010", "01010", "01010", "00000"],
};

// The ring, clockwise from the top: the path the running light travels.
// biome-ignore format: a 5×5 ring reads better as two rows of pairs
const RING: readonly (readonly [number, number])[] = [
  [1, 0], [2, 0], [3, 0], [4, 1], [4, 2], [4, 3],
  [3, 4], [2, 4], [1, 4], [0, 3], [0, 2], [0, 1],
];

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
 * One status vocabulary for every agent surface, drawn as a 5×5 dot matrix: queued is a hollow
 * ring, running is a light chasing round that ring, waiting on a person is an ember ring with a
 * blinking centre, done is a solid disc, failed a cross, skipped a dash and paused two bars.
 */
export function StatusGlyph({ status, size = "md", label, className, ...props }: StatusGlyphProps) {
  const px = PX[size];
  const spoken = label === undefined ? SPOKEN[status] : label;
  const dots: React.ReactNode[] = [];
  if (status === "running") {
    RING.forEach(([x, y], i) => {
      dots.push(
        <circle
          key={`${x}-${y}`}
          cx={1.5 + x * 3}
          cy={1.5 + y * 3}
          r={1.1}
          style={{ animationDelay: `${i * 100}ms` }}
          className={cn(
            "animate-kura-chase fill-current opacity-20 motion-reduce:animate-none",
            // Held still, the light rests on the first quarter of the ring.
            i < 4 && "motion-reduce:opacity-100",
          )}
        />,
      );
    });
  } else {
    PATTERN[status].forEach((row, y) => {
      for (let x = 0; x < 5; x++) {
        if (row[x] !== "1") continue;
        const centre = status === "waiting" && x === 2 && y === 2;
        dots.push(
          <circle
            key={`${x}-${y}`}
            cx={1.5 + x * 3}
            cy={1.5 + y * 3}
            r={1.1}
            className={cn(
              "fill-current",
              centre && "animate-kura-blink motion-reduce:animate-none",
            )}
          />,
        );
      }
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
