"use client";

import * as React from "react";

/**
 * Colour plumbing for shaders: CSS colour strings (tokens, OKLCH, hex, rgb…) → linear-light RGB
 * and OKLab, resolved against the live theme. Shaders cannot read CSS variables, so components
 * resolve them here and re-resolve when the theme flips.
 */

export type Vec3 = [number, number, number];

export interface ResolvedColor {
  /** Linear-light sRGB, 0–1 (clamped to gamut). */
  linear: Vec3;
  /** OKLab (L 0–1, a/b roughly ±0.4). Blend in this space for even, band-free gradients. */
  oklab: Vec3;
  alpha: number;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function oklabToLinear([L, a, b]: Vec3): Vec3 {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    clamp01(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    clamp01(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    clamp01(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}

export function linearToOklab([r, g, b]: Vec3): Vec3 {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function num(token: string | undefined, percentScale = 1): number {
  if (!token || token === "none") return 0;
  if (token.endsWith("%")) return (Number.parseFloat(token) / 100) * percentScale;
  return Number.parseFloat(token);
}

function hue(token: string | undefined): number {
  if (!token || token === "none") return 0;
  const v = Number.parseFloat(token);
  if (token.endsWith("rad")) return (v * 180) / Math.PI;
  if (token.endsWith("turn")) return v * 360;
  if (token.endsWith("grad")) return v * 0.9;
  return v;
}

/** Parse a concrete CSS colour (no `var()`) into linear RGB. Returns null for unknown syntax. */
export function parseColor(input: string): { linear: Vec3; alpha: number } | null {
  const str = input.trim().toLowerCase();
  if (str.startsWith("#")) {
    let hex = str.slice(1);
    if (hex.length === 3 || hex.length === 4) hex = [...hex].map((c) => c + c).join("");
    if (hex.length !== 6 && hex.length !== 8) return null;
    const v = Number.parseInt(hex, 16);
    if (Number.isNaN(v)) return null;
    const has = hex.length === 8;
    const n = has ? v >>> 8 : v;
    return {
      linear: [
        srgbToLinear(((n >> 16) & 255) / 255),
        srgbToLinear(((n >> 8) & 255) / 255),
        srgbToLinear((n & 255) / 255),
      ],
      alpha: has ? (v & 255) / 255 : 1,
    };
  }
  const match = /^([a-z-]+)\((.*)\)$/.exec(str);
  if (!match) return null;
  const fn = match[1];
  const [body = "", alphaPart] = (match[2] ?? "").split("/");
  const parts = body.replace(/,/g, " ").trim().split(/\s+/);
  let alpha = alphaPart ? num(alphaPart.trim()) : 1;
  if (fn === "rgb" || fn === "rgba") {
    if (!alphaPart && parts.length === 4) alpha = num(parts[3]);
    const c = (t: string | undefined) => srgbToLinear(clamp01(num(t, 255) / 255));
    return { linear: [c(parts[0]), c(parts[1]), c(parts[2])], alpha };
  }
  if (fn === "oklch" || fn === "oklab") {
    const L = num(parts[0]);
    let a: number;
    let b: number;
    if (fn === "oklch") {
      const C = num(parts[1], 0.4);
      const h = (hue(parts[2]) * Math.PI) / 180;
      a = C * Math.cos(h);
      b = C * Math.sin(h);
    } else {
      a = num(parts[1], 0.4);
      b = num(parts[2], 0.4);
    }
    return { linear: oklabToLinear([L, a, b]), alpha };
  }
  if (fn === "color") {
    const space = parts.shift();
    const [r, g, b] = [num(parts[0]), num(parts[1]), num(parts[2])];
    if (space === "srgb") return { linear: [r, g, b].map(srgbToLinear) as Vec3, alpha };
    if (space === "srgb-linear") return { linear: [r, g, b], alpha };
    if (space === "display-p3") {
      const [pr, pg, pb] = [r, g, b].map(srgbToLinear) as Vec3;
      return {
        linear: [
          clamp01(1.2249 * pr - 0.2247 * pg),
          clamp01(-0.042 * pr + 1.0419 * pg),
          clamp01(-0.0197 * pr - 0.0786 * pg + 1.0979 * pb),
        ],
        alpha,
      };
    }
  }
  return null;
}

let canvasCtx: CanvasRenderingContext2D | null | undefined;

/**
 * Resolve any CSS colour — including `var(--kura-accent)`, named colours and `color-mix()` — in
 * the context of `host` (so theme classes apply). Falls back to mid-gray if the browser cannot.
 */
export function resolveColor(value: string, host: Element): ResolvedColor {
  let parsed = parseColor(value);
  if (!parsed && typeof document !== "undefined") {
    const probe = document.createElement("span");
    probe.style.cssText = "position:absolute;width:0;height:0;visibility:hidden;";
    probe.style.color = value;
    host.appendChild(probe);
    const computed = getComputedStyle(probe).color;
    probe.remove();
    parsed = parseColor(computed);
    if (!parsed) {
      if (canvasCtx === undefined) {
        canvasCtx = document.createElement("canvas").getContext("2d", {
          willReadFrequently: true,
        });
      }
      if (canvasCtx) {
        canvasCtx.clearRect(0, 0, 1, 1);
        canvasCtx.fillStyle = computed;
        canvasCtx.fillRect(0, 0, 1, 1);
        const [r = 0, g = 0, b = 0, a = 255] = canvasCtx.getImageData(0, 0, 1, 1).data;
        parsed = {
          linear: [srgbToLinear(r / 255), srgbToLinear(g / 255), srgbToLinear(b / 255)],
          alpha: a / 255,
        };
      }
    }
  }
  const linear = parsed?.linear ?? [0.2, 0.2, 0.2];
  return { linear, oklab: linearToOklab(linear), alpha: parsed?.alpha ?? 1 };
}

/**
 * A counter that bumps whenever the document theme may have changed: `class`, `data-theme` or
 * `style` on <html>/<body>, or the OS colour scheme. Use it as an effect dependency.
 */
export function useThemeVersion(): number {
  const [version, setVersion] = React.useState(0);
  React.useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    const mo = new MutationObserver(bump);
    const opts = { attributes: true, attributeFilter: ["class", "data-theme", "style"] };
    mo.observe(document.documentElement, opts);
    if (document.body) mo.observe(document.body, opts);
    const mql = window.matchMedia?.("(prefers-color-scheme: dark)");
    mql?.addEventListener?.("change", bump);
    return () => {
      mo.disconnect();
      mql?.removeEventListener?.("change", bump);
    };
  }, []);
  return version;
}

/**
 * Resolve `colors` against `hostRef` whenever they or the theme change. Returns a ref (read it
 * inside shader uniform functions) and the theme version (use it to redraw static frames).
 */
export function useResolvedColors(
  hostRef: React.RefObject<Element | null>,
  colors: readonly string[],
): { colors: React.RefObject<ResolvedColor[]>; version: number } {
  const version = useThemeVersion();
  const resolved = React.useRef<ResolvedColor[]>([]);
  const key = colors.join("|");
  // biome-ignore lint/correctness/useExhaustiveDependencies: `key` captures `colors`; `version` re-resolves on theme change.
  React.useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    resolved.current = colors.map((c) => resolveColor(c, host));
  }, [key, version, hostRef]);
  return { colors: resolved, version };
}

/** GLSL: OKLab → linear sRGB, linear → sRGB transfer, and interleaved-gradient-noise dither. */
export const GLSL_COLOR = /* glsl */ `
vec3 oklabToLinear(vec3 c) {
  float l = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z;
  float m = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z;
  float s = c.x - 0.0894841775 * c.y - 1.2914855480 * c.z;
  l = l * l * l; m = m * m * m; s = s * s * s;
  return vec3(
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s);
}
vec3 linearToSrgb(vec3 c) {
  c = clamp(c, 0.0, 1.0);
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}
float ign(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
vec3 dither(vec3 c) { return c + (ign(gl_FragCoord.xy) - 0.5) / 255.0; }
`;
