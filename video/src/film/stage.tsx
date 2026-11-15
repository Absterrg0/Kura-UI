import * as React from "react";
import { AbsoluteFill } from "remotion";

/**
 * Real components on the film's graphite. A component's own sheet is `--kura-surface`, one step
 * above the canvas: right on a page, too dim on a film frame. On stage the sheet steps up to the
 * raised surface and keycaps to the raised-hover surface (both Kura tokens), so a staged
 * component reads at a glance. Wells stay sunken, so code reads darker than its sheet.
 */
export const LIFT = {
  "--color-kura-surface": "var(--kura-surface-raised)",
  "--color-kura-surface-raised": "var(--kura-raised-hover)",
} as React.CSSProperties;

/**
 * A real component staged in space: laid out at `zoom` (crisp text), turned in perspective about
 * its centre. Bigger than the frame by default; no chrome.
 */
export function Stage({
  children,
  width,
  zoom = 3,
  x = 960,
  y = 540,
  z = 0,
  rx = 0,
  ry = 0,
  rz = 0,
  perspective = 2200,
  lift = true,
  origin = "50% 50%",
}: {
  children: React.ReactNode;
  width: number;
  zoom?: number;
  x?: number;
  y?: number;
  z?: number;
  rx?: number;
  ry?: number;
  rz?: number;
  perspective?: number;
  lift?: boolean;
  origin?: string;
}) {
  return (
    <AbsoluteFill style={{ perspective, perspectiveOrigin: "50% 50%" }}>
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          transformStyle: "preserve-3d",
          transform: `translate(-50%, -50%) translate3d(0, 0, ${z}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)`,
          transformOrigin: origin,
          ...(lift ? LIFT : null),
        }}
      >
        <div style={{ zoom, width }}>{children}</div>
      </div>
    </AbsoluteFill>
  );
}

type Anchor = {
  ox: number;
  oy: number;
  w: number;
  h: number;
  W: number;
  H: number;
  t: { x: number; y: number }[];
};
const anchors = new Map<string, Anchor>();

/**
 * A component held by one of its own parts: the element matching `selector` is pinned to screen
 * point (px, py) and the whole component is scaled by `scale` about it (a flat 2D scale, so text
 * is painted at its final size). Used for pull-backs that start on a control and end on the whole
 * component. The part's offset is measured once from the DOM.
 */
export function Anchored({
  id,
  children,
  width,
  zoom = 3,
  selector,
  px,
  py,
  scale,
  rotate = 0,
  lift = true,
  onMeasured,
  targets = [],
}: {
  onMeasured?: () => void;
  /** More parts to measure (offsets from the anchor, layout px), e.g. a button a pointer aims at. */
  targets?: string[];
  id: string;
  children: React.ReactNode;
  width: number;
  zoom?: number;
  selector: string;
  px: number;
  py: number;
  scale: number;
  rotate?: number;
  lift?: boolean;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [a, setA] = React.useState(() => anchors.get(id) ?? null);
  // biome-ignore lint/correctness/useExhaustiveDependencies: an anchor's targets are fixed per id
  React.useLayoutEffect(() => {
    if (a || !ref.current) return;
    const el = ref.current.querySelector(selector);
    if (!el) return;
    const R = ref.current.getBoundingClientRect();
    const A = el.getBoundingClientRect();
    // Measured with scale 1 and no rotation (see below), so offsets are layout px.
    const m = {
      ox: A.left + A.width / 2 - R.left,
      oy: A.top + A.height / 2 - R.top,
      w: A.width,
      h: A.height,
      W: R.width,
      H: R.height,
      t: targets.map((sel) => {
        const T = ref.current?.querySelector(sel)?.getBoundingClientRect();
        return T
          ? {
              x: T.left + T.width / 2 - A.left - A.width / 2,
              y: T.top + T.height / 2 - A.top - A.height / 2,
            }
          : { x: 0, y: 0 };
      }),
    };
    anchors.set(id, m);
    setA(m);
    onMeasured?.();
  }, [a, id, selector, onMeasured]);
  return (
    // overflow: clip, not hidden: a component that scrolls a part into view must not move the stage.
    <AbsoluteFill style={{ overflow: "clip" }}>
      <div
        ref={ref}
        style={{
          position: "absolute",
          left: a ? px - a.ox : 0,
          top: a ? py - a.oy : 0,
          transformOrigin: a ? `${a.ox}px ${a.oy}px` : "0 0",
          transform: a ? `scale(${scale}) rotate(${rotate}deg)` : "none",
          visibility: a ? "visible" : "hidden",
          ...(lift ? LIFT : null),
        }}
      >
        <div style={{ zoom, width }}>{children}</div>
      </div>
    </AbsoluteFill>
  );
}

/** Re-renders the caller once an Anchored it owns has measured itself (pass the callback on). */
export function useRemeasure() {
  const [, set] = React.useState(0);
  return React.useCallback(() => set((n) => n + 1), []);
}

/** The measured size of an anchor (layout px at scale 1), once known. */
export const anchorOf = (id: string) => anchors.get(id) ?? null;

/** Screen position of target `i` of an anchored component pinned at (px, py) at `scale`. */
export function targetOf(id: string, i: number, px: number, py: number, scale: number) {
  const a = anchors.get(id);
  const t = a?.t[i];
  if (!t) return { x: px, y: py };
  return { x: px + t.x * scale, y: py + t.y * scale };
}

/** A person's pointer: the plain arrow. */
export function HandPointer({
  x,
  y,
  size = 1,
  press = 0,
}: {
  x: number;
  y: number;
  size?: number;
  press?: number;
}) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 20"
      width={16 * 3.2 * size}
      height={20 * 3.2 * size}
      style={{
        position: "absolute",
        left: x - 3 * size,
        top: y - 3 * size,
        overflow: "visible",
        transform: `scale(${1 - 0.1 * press})`,
        transformOrigin: "3px 3px",
      }}
    >
      <path
        d="M1 1 L1 15.5 L4.9 11.9 L7.6 18 L10.2 16.9 L7.6 10.9 L13 10.9 Z"
        fill="var(--kura-fg)"
        stroke="var(--kura-canvas)"
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * The agent's pointer, as the docs draw it: the ink arrow with the agent's name on a tag, and what
 * it is doing after a dot.
 */
export function AgentPointer({
  x,
  y,
  note,
  size = 1,
  press = 0,
  flip = false,
}: {
  /** Near the right edge of the frame the tag hangs to the left of the arrow: above it, or below. */
  flip?: boolean | "below";
  x: number;
  y: number;
  note?: string;
  size?: number;
  press?: number;
}) {
  const s = 3.2 * size;
  return (
    <div aria-hidden style={{ position: "absolute", left: x - 3 * size, top: y - 3 * size }}>
      <svg
        viewBox="0 0 16 20"
        width={16 * s}
        height={20 * s}
        style={{
          overflow: "visible",
          transform: `scale(${1 - 0.1 * press})`,
          transformOrigin: "3px 3px",
        }}
      >
        <path
          d="M1 1 L1 15.5 L4.9 11.9 L7.6 18 L10.2 16.9 L7.6 10.9 L13 10.9 Z"
          fill="var(--kura-fg)"
          stroke="var(--kura-canvas)"
          strokeWidth={1.2}
          strokeLinejoin="round"
        />
      </svg>
      <div
        style={{
          position: "absolute",
          ...(flip === "below"
            ? { right: 4 * s, top: 21 * s }
            : flip
              ? { right: 2 * s, bottom: 6 * s }
              : { left: 14 * s, top: 15 * s }),
          display: "flex",
          alignItems: "center",
          gap: 8 * size,
          whiteSpace: "nowrap",
          background: "var(--kura-ink)",
          color: "var(--kura-fg-inverted)",
          borderRadius: 6 * size,
          padding: `${5 * size}px ${12 * size}px ${5 * size}px ${10 * size}px`,
          fontFamily: "'Geist Mono', ui-monospace, monospace",
          fontSize: 26 * size,
          fontWeight: 500,
          letterSpacing: "-0.01em",
        }}
      >
        <span
          style={{
            width: 9 * size,
            height: 9 * size,
            borderRadius: 99,
            background: "var(--kura-fg-inverted)",
            opacity: 0.8,
          }}
        />
        Kura
        {note ? <span style={{ opacity: 0.6 }}>· {note}</span> : null}
      </div>
    </div>
  );
}
