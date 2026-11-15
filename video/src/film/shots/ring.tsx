import type * as React from "react";
import { AbsoluteFill } from "remotion";
import { clamp, E, mix, spr, tw } from "../ease";
import { chase, G, RING } from "../glyph";
import { K } from "../palette";
import { type Cam, camera, discMatrix, FOCAL, lerpCam } from "../proj";
import { useF } from "../shot";
import { B } from "../timing";
import { RING_C, U } from "./words";

/**
 * 0:05. The status ring, 960 px, running: the light chases round it (the library's own loop) while
 * the camera lays the ring down into depth and orbits it, then snaps back face-on. On the beat it
 * closes into one disc: done.
 *
 * Sequence-relative: frame 0 is beat 10.
 */
export const RING_FROM = 10;

const DONE_AT_BEAT = 13;

export function Ring({ done = true }: { done?: boolean }) {
  const f = useF();
  const DONE_AT = done ? DONE_AT_BEAT : 1e6;
  const face: Cam = { tx: 0, ty: 0, tz: 0, dist: FOCAL, sx: RING_C.x, sy: RING_C.y };
  const laid: Cam = {
    tx: 0,
    ty: 0,
    tz: 0,
    dist: 1150,
    yaw: 18,
    pitch: 50,
    roll: -18,
    sx: 960,
    sy: 540,
  };
  const back = spr(f, B(12), "snap");
  const out = tw(f, B(10), B(11.9), 0, 1, E.inOut);
  const cam = f < B(12) ? lerpCam(face, laid, out) : lerpCam(laid, face, clamp(back, 0, 1.08));
  // On done the disc slides right, to where the next shot's tile will be.
  const slide = spr(f, B(DONE_AT), "land");
  cam.sx = mix(cam.sx ?? 960, 1440, clamp(slide, 0, 1.05));
  const project = camera(cam);

  const ms = ((f - B(RING_FROM)) * 1000) / 60;
  const close = spr(f, B(DONE_AT), "land");
  const nodes: React.ReactNode[] = [];
  // Unlit ring positions: the dot-off of the glyph's 15-unit box would be noise here, so only the
  // eight dots are drawn, as the library draws them.
  RING.forEach((p, i) => {
    const x = mix(p.x * U, 0, clamp(close));
    const y = mix(p.y * U, 0, clamp(close));
    const r = mix(G.DOT * U, G.DONE * U, close);
    const running = f < B(DONE_AT) ? chase(i, ms) : 1;
    const { matrix, visible } = discMatrix(project, { x, y, z: 0 }, r);
    if (!visible) return;
    const fill = f < B(DONE_AT) ? K.fg : K.muted;
    nodes.push(<circle key={i} r={1} transform={matrix} fill={fill} opacity={running} />);
  });
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" aria-hidden>
        {nodes}
      </svg>
    </AbsoluteFill>
  );
}
