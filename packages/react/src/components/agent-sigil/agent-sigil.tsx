import type * as React from "react";
import { cn } from "../../lib/cn";

export interface AgentSigilProps extends Omit<React.ComponentProps<"span">, "children"> {
  /** The agent's name. The same name always draws the same face. */
  name: string;
  /** 22 / 30 / 40px. Default "md". */
  size?: "sm" | "md" | "lg";
  /** Draw only the dots, without the raised tile. Default false. */
  bare?: boolean;
  /** Spoken name. Leave it out when the name is written next to the sigil (the usual case). */
  label?: string;
}

// The face is half the tile, and its pitch is a whole number of pixels at every size (2, 3, 4px),
// so all 25 positions render as identical dots instead of smudging between pixels.
const SIZE = {
  sm: { box: "size-[22px] rounded-[7px]", px: 10 },
  md: { box: "size-[30px] rounded-[9px]", px: 15 },
  lg: { box: "size-10 rounded-[11px]", px: 20 },
} as const;
// In the 15-unit face: a 3-unit pitch and the rails' dot radius (1.1 at 6px pitch).
const PITCH = 3;
const DOT = 1.1;

/**
 * The 5×5 pattern for a name, row by row. Mirrored left to right so it reads as a face; redrawn
 * until it is neither sparse nor solid.
 */
export function agentSigilPattern(name: string): boolean[] {
  let seed = 2166136261;
  for (let i = 0; i < name.length; i++) seed = Math.imul(seed ^ name.charCodeAt(i), 16777619);
  const next = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let attempt = 0; attempt < 12; attempt++) {
    const half = Array.from({ length: 15 }, () => next() < 0.5);
    const cells = Array.from({ length: 25 }, (_, i) => {
      const x = i % 5;
      return half[Math.floor(i / 5) * 3 + (x < 3 ? x : 4 - x)] === true;
    });
    const lit = cells.filter(Boolean).length;
    if (lit >= 9 && lit <= 16) return cells;
  }
  // A plain ring, in the unlikely case nothing balanced came up.
  return Array.from({ length: 25 }, (_, i) => {
    const x = i % 5;
    const y = Math.floor(i / 5);
    return (
      (x === 0 || x === 4 || y === 0 || y === 4) && !((x === 0 || x === 4) && (y === 0 || y === 4))
    );
  });
}

/**
 * A face for an agent: a symmetric 5×5 dot sigil generated from its name, in a small raised tile.
 * The same name always gives the same sigil, so people learn to recognise their agents.
 */
export function AgentSigil({
  name,
  size = "md",
  bare = false,
  label,
  className,
  ...props
}: AgentSigilProps) {
  const cells = agentSigilPattern(name);
  const { box, px } = SIZE[size];
  // Centre what is lit, so a face that leaves its top or bottom row empty still sits in the
  // middle of the tile. (Faces are mirrored, so they are already centred across.)
  const rows = cells.flatMap((on, i) => (on ? [Math.floor(i / 5)] : []));
  const minY = Math.min(...rows);
  const maxY = Math.max(...rows);
  const dy = ((4 - maxY - minY) / 2) * PITCH;
  const shared = {
    "data-slot": "agent-sigil",
    "data-size": size,
    className: cn(
      "inline-grid shrink-0 place-items-center text-kura-fg",
      !bare && "bg-kura-raised shadow-kura-raised",
      !bare && box,
      className,
    ),
    ...props,
  };
  const dots = (
    <svg viewBox="0 0 15 15" width={px} height={px} aria-hidden>
      {cells.map((on, i) =>
        on ? (
          <circle
            key={`${i % 5}-${Math.floor(i / 5)}`}
            cx={PITCH / 2 + (i % 5) * PITCH}
            cy={PITCH / 2 + Math.floor(i / 5) * PITCH + dy}
            r={DOT}
            className="fill-current"
          />
        ) : null,
      )}
    </svg>
  );
  return label ? (
    <span role="img" aria-label={label} {...shared}>
      {dots}
    </span>
  ) : (
    <span aria-hidden {...shared}>
      {dots}
    </span>
  );
}
