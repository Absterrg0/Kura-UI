import * as React from "react";
import { GLIDE, mix, tween } from "./anim";
import { boxIn } from "./camera";

/**
 * A pointer that lives in the camera's world: it glides from an offset to the centre of a
 * target element (measured each frame, before paint) and can wear the agent's name tag,
 * drawn as the site's agent demo draws it.
 */

type El = () => HTMLElement | null | undefined;

function offsetIn(el: HTMLElement, root: HTMLElement, anchor = { x: 0.5, y: 0.5 }) {
  const b = boxIn(el, root);
  return { x: b.x + b.w * anchor.x, y: b.y + b.h * anchor.y };
}

export type Leg = {
  target: El;
  at: number;
  dur: number;
  dx?: number;
  dy?: number;
  /** Where in the target's box when the target is not a button (default its centre). */
  anchor?: { x: number; y: number };
};

export function Pointer({
  frame,
  legs,
  target,
  from,
  enter,
  arrive,
  leave,
  tag,
  note,
}: {
  frame: number;
  /** Successive moves (agent pointer). */
  legs?: Leg[];
  /** One move (a person's pointer): from `from` (offset from the target) to the target. */
  target?: El;
  from?: { x: number; y: number };
  enter: number;
  arrive?: number;
  leave: number;
  tag?: string;
  note?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useLayoutEffect(() => {
    const node = ref.current;
    // Measured against the element the pointer sits in: an ancestor's ref is not attached yet
    // when a freshly mounted child's layout effect runs.
    const r = node?.parentElement;
    if (!node || !r) return;
    let pos = { x: 0, y: 0 };
    if (legs?.length) {
      const first = legs[0]!.target();
      if (!first) return;
      const p0 = offsetIn(first, r, first.tagName === "BUTTON" ? undefined : legs[0]!.anchor);
      pos = { x: p0.x + (from?.x ?? 0), y: p0.y + (from?.y ?? 0) };
      for (const leg of legs) {
        if (frame < leg.at) break;
        const el = leg.target();
        if (!el) continue;
        const p = offsetIn(el, r, el.tagName === "BUTTON" ? undefined : leg.anchor);
        const k = tween(frame, leg.at, leg.at + leg.dur, 0, 1, GLIDE);
        pos = { x: mix(pos.x, p.x + (leg.dx ?? 0), k), y: mix(pos.y, p.y + (leg.dy ?? 0), k) };
      }
    } else if (target) {
      const el = target();
      if (!el) return;
      const p = offsetIn(el, r);
      const k = tween(frame, enter, arrive ?? enter + 40, 0, 1, GLIDE);
      pos = { x: mix(p.x + (from?.x ?? 0), p.x, k), y: mix(p.y + (from?.y ?? 0), p.y, k) };
    }
    node.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
  });
  const o = tween(frame, enter, enter + 10) * (1 - tween(frame, leave, leave + 12));
  if (o <= 0) return null;
  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute top-0 left-0 z-20"
      style={{ opacity: o }}
    >
      <svg viewBox="0 0 16 20" className="-mt-px -ml-px h-5 w-4" style={{ overflow: "visible" }}>
        <path
          d="M1 1 L1 15.5 L4.9 11.9 L7.6 18 L10.2 16.9 L7.6 10.9 L13 10.9 Z"
          fill="var(--kura-fg)"
          stroke="var(--kura-canvas)"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
      </svg>
      {tag && (
        <span className="absolute top-4 left-3.5 inline-flex">
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-kura-ink py-[3px] pr-2 pl-1.5 font-kura-mono text-[11px] text-kura-fg-inverted shadow-kura-popover">
            <span className="size-1.5 rounded-full bg-kura-fg-inverted/80" />
            {tag}
            {note ? <span className="opacity-60">· {note}</span> : null}
          </span>
        </span>
      )}
    </div>
  );
}

/** Each press: a ring of dots spreading from the pointer's tip. */
export function Ripple({ frame, at, target }: { frame: number; at: number; target: El }) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useLayoutEffect(() => {
    const node = ref.current;
    const r = node?.parentElement;
    const el = target();
    if (!node || !r || !el) return;
    const p = offsetIn(el, r);
    node.style.transform = `translate(${p.x}px, ${p.y}px)`;
  });
  const k = tween(frame, at, at + 32);
  if (frame < at || k >= 1) return null;
  const rad = mix(7, 24, k);
  return (
    <div ref={ref} aria-hidden className="pointer-events-none absolute top-0 left-0 z-10">
      <svg width={1} height={1} style={{ overflow: "visible" }}>
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return (
            <circle
              key={i}
              cx={Math.cos(a) * rad}
              cy={Math.sin(a) * rad}
              r={1}
              fill="var(--kura-fg)"
              opacity={1 - k}
            />
          );
        })}
      </svg>
    </div>
  );
}
