import * as React from "react";
import { GLIDE, mix, tween } from "./anim";

/**
 * A camera over a "world" of real DOM. Shots name a target (a measured element, or a point),
 * a scale, and where on screen the target should sit. Between shots the scale travels in log
 * space and the position follows the scale, so a zoom stays anchored on what it is leaving.
 * Positions come from layout offsets (unaffected by transforms) and are applied in a layout
 * effect, so the frame is measured and framed before it is painted: no state, no flicker.
 */

export type Point = { x: number; y: number };
export type Shot = {
  /** Frame (in the scene) this move starts. */
  at: number;
  /** Frames the move takes. */
  dur: number;
  /** A measured element name, or a fixed world point. */
  target: string | Point;
  /** Where in the target, 0..1 of its box (default centre). */
  anchor?: Point;
  scale: number;
  /** Where on screen the target sits (default the centre of the frame). */
  screen?: Point;
  ease?: (t: number) => number;
};

type Cam = { c: Point; s: number; screen: Point };

/** Where `el` sits inside `root`, in root's own (untransformed) pixels. */
export function boxIn(el: HTMLElement, root: HTMLElement) {
  const r = root.getBoundingClientRect();
  const e = el.getBoundingClientRect();
  const k = root.offsetWidth ? r.width / root.offsetWidth : 1;
  return {
    x: (e.left - r.left) / k,
    y: (e.top - r.top) / k,
    w: e.width / k,
    h: e.height / k,
  };
}

export function Camera({
  frame,
  shots,
  targets,
  children,
  width = 1920,
  height = 1080,
}: {
  frame: number;
  shots: Shot[];
  /** Name → a function returning the element to measure. */
  targets: Record<string, () => HTMLElement | null | undefined>;
  children: React.ReactNode;
  width?: number;
  height?: number;
}) {
  const world = React.useRef<HTMLDivElement>(null);
  React.useLayoutEffect(() => {
    const root = world.current;
    if (!root) return;
    const resolve = (shot: Shot): Cam => {
      const screen = shot.screen ?? { x: width / 2, y: height / 2 };
      const a = shot.anchor ?? { x: 0.5, y: 0.5 };
      if (typeof shot.target !== "string") return { c: shot.target, s: shot.scale, screen };
      const el = targets[shot.target]?.();
      if (!el) return { c: { x: 0, y: 0 }, s: shot.scale, screen };
      const o = boxIn(el, root);
      return {
        c: { x: o.x + o.w * a.x, y: o.y + o.h * a.y },
        s: shot.scale,
        screen,
      };
    };
    let cam = resolve(shots[0]!);
    for (const shot of shots.slice(1)) {
      if (frame < shot.at) break;
      const next = resolve(shot);
      const p = tween(frame, shot.at, shot.at + shot.dur, 0, 1, shot.ease ?? GLIDE);
      const s = Math.exp(mix(Math.log(cam.s), Math.log(next.s), p));
      const q =
        Math.abs(cam.s - next.s) < 1e-6 ? p : (1 / s - 1 / cam.s) / (1 / next.s - 1 / cam.s);
      cam = {
        s,
        c: { x: mix(cam.c.x, next.c.x, q), y: mix(cam.c.y, next.c.y, q) },
        screen: { x: mix(cam.screen.x, next.screen.x, p), y: mix(cam.screen.y, next.screen.y, p) },
      };
    }
    root.style.transform = `translate(${cam.screen.x}px, ${cam.screen.y}px) scale(${cam.s}) translate(${-cam.c.x}px, ${-cam.c.y}px)`;
  });
  return (
    <div
      ref={world}
      style={{ position: "absolute", left: 0, top: 0, transformOrigin: "0 0" }}
      data-slot="film-camera"
    >
      {children}
    </div>
  );
}
