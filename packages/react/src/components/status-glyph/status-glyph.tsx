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
  /** 14 / 16 / 20px. Default "md". */
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

const PX = { sm: 14, md: 16, lg: 20 } as const;

/**
 * One status vocabulary for every agent surface: queued (hollow ring), running (a turning arc in the
 * signal colour), waiting on you (amber ring with a dot), done (green check), failed (red cross),
 * skipped (dashed ring) and paused (two bars). Drawn in SVG so it stays crisp at 14–20px.
 */
export function StatusGlyph({ status, size = "md", label, className, ...props }: StatusGlyphProps) {
  const px = PX[size];
  const spoken = label === undefined ? SPOKEN[status] : label;
  const glyph = (
    <svg viewBox="0 0 16 16" width={px} height={px} fill="none" aria-hidden>
      {status === "queued" && (
        <circle cx="8" cy="8" r="6" className="stroke-kura-border-strong" strokeWidth="1.5" />
      )}
      {status === "skipped" && (
        <circle
          cx="8"
          cy="8"
          r="6"
          className="stroke-kura-fg-subtle"
          strokeWidth="1.5"
          strokeDasharray="2.2 2.6"
        />
      )}
      {status === "running" && (
        <>
          <circle cx="8" cy="8" r="6" className="stroke-kura-accent-subtle" strokeWidth="1.75" />
          <path
            d="M8 2a6 6 0 0 1 6 6"
            className="origin-center animate-kura-spin stroke-kura-accent motion-reduce:animate-none"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </>
      )}
      {status === "waiting" && (
        <>
          <circle cx="8" cy="8" r="6" className="stroke-kura-warning" strokeWidth="1.5" />
          <circle
            cx="8"
            cy="8"
            r="2.25"
            className="animate-kura-pulse fill-kura-warning motion-reduce:animate-none"
          />
        </>
      )}
      {status === "paused" && (
        <>
          <circle cx="8" cy="8" r="6" className="stroke-kura-border-strong" strokeWidth="1.5" />
          <path
            d="M6.6 5.8v4.4M9.4 5.8v4.4"
            className="stroke-kura-fg-muted"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </>
      )}
      {status === "done" && (
        <>
          <circle cx="8" cy="8" r="7" className="fill-kura-success" />
          <path
            d="m5.2 8.2 1.9 1.9 3.8-4"
            className="stroke-kura-surface"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
      {status === "failed" && (
        <>
          <circle cx="8" cy="8" r="7" className="fill-kura-danger" />
          <path
            d="m5.8 5.8 4.4 4.4m0-4.4-4.4 4.4"
            className="stroke-kura-surface"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
  const shared = {
    "data-slot": "status-glyph",
    "data-status": status,
    className: cn("inline-grid shrink-0 place-items-center", className),
    style: { width: px, height: px },
    ...props,
  };
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
