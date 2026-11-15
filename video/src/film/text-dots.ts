import * as React from "react";
import { continueRender, delayRender } from "remotion";
import { loadFonts } from "../lib/fonts";

/**
 * A word as a dot matrix: the glyphs are rasterised once in a canvas with the film's own face
 * (Geist), then sampled on a square grid. Coordinates are relative to the text's left end on its
 * baseline, the same origin an SVG <text x y> uses, so type and dots line up exactly.
 */
export type TextDots = { pts: { x: number; y: number }[]; width: number };

const cache = new Map<string, TextDots>();

function sample(text: string, size: number, pitch: number, weight: number, tracking: number) {
  const pad = Math.ceil(size * 0.4);
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  const font = `${weight} ${size}px Geist`;
  ctx.font = font;
  (ctx as unknown as { letterSpacing: string }).letterSpacing = `${tracking * size}px`;
  const width = ctx.measureText(text).width;
  c.width = Math.ceil(width + pad * 2);
  c.height = Math.ceil(size * 1.6);
  ctx.font = font;
  (ctx as unknown as { letterSpacing: string }).letterSpacing = `${tracking * size}px`;
  ctx.fillStyle = "#fff";
  const base = Math.round(size * 1.15);
  ctx.fillText(text, pad, base);
  const img = ctx.getImageData(0, 0, c.width, c.height).data;
  const pts: { x: number; y: number }[] = [];
  // Grid aligned to the baseline, so a row of dots always sits on it.
  for (let gy = base - pitch / 2; gy > 0; gy -= pitch) collect(gy);
  for (let gy = base + pitch / 2; gy < c.height; gy += pitch) collect(gy);
  function collect(gy: number) {
    for (let gx = pad + pitch / 2; gx < c.width; gx += pitch) {
      // Coverage of the cell's centre region.
      let hit = 0;
      let n = 0;
      for (let dy = -pitch * 0.2; dy <= pitch * 0.2; dy += pitch * 0.2)
        for (let dx = -pitch * 0.2; dx <= pitch * 0.2; dx += pitch * 0.2) {
          const x = Math.round(gx + dx);
          const y = Math.round(gy + dy);
          n++;
          if (img[(y * c.width + x) * 4 + 3] > 110) hit++;
        }
      if (hit / n >= 0.5) pts.push({ x: gx - pad, y: gy - base });
    }
  }
  pts.sort((a, b) => a.x - b.x || a.y - b.y);
  return { pts, width };
}

export function useTextDots(
  text: string,
  size: number,
  pitch: number,
  { weight = 600, tracking = -0.045 }: { weight?: number; tracking?: number } = {},
): TextDots | null {
  const key = `${text}|${size}|${pitch}|${weight}|${tracking}`;
  const [res, setRes] = React.useState<TextDots | null>(() => cache.get(key) ?? null);
  const [handle] = React.useState(() => (cache.has(key) ? null : delayRender(`dots: ${text}`)));
  React.useEffect(() => {
    if (res) return;
    let live = true;
    loadFonts().then(() => {
      const r = cache.get(key) ?? sample(text, size, pitch, weight, tracking);
      cache.set(key, r);
      if (live) setRes(r);
      if (handle !== null) continueRender(handle);
    });
    return () => {
      live = false;
    };
  }, [key, res, handle, text, size, pitch, weight, tracking]);
  return res;
}

const widths = new Map<string, number>();
/** Advance width of `text` in Geist at `size` (null until the face has loaded). */
export function useTextWidth(text: string, size: number, weight = 600, tracking = -0.045) {
  const key = `${text}|${size}|${weight}|${tracking}`;
  const [w, setW] = React.useState<number | null>(() => widths.get(key) ?? null);
  const [handle] = React.useState(() => (widths.has(key) ? null : delayRender(`measure: ${text}`)));
  React.useEffect(() => {
    if (w != null) return;
    let live = true;
    loadFonts().then(() => {
      const ctx = document.createElement("canvas").getContext("2d")!;
      ctx.font = `${weight} ${size}px Geist`;
      (ctx as unknown as { letterSpacing: string }).letterSpacing = `${tracking * size}px`;
      const m = ctx.measureText(text).width;
      widths.set(key, m);
      if (live) setW(m);
      if (handle !== null) continueRender(handle);
    });
    return () => {
      live = false;
    };
  }, [key, w, handle, text, size, weight, tracking]);
  return w;
}
