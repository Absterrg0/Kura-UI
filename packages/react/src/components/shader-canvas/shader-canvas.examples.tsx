"use client";

import { ArrowRight, Telescope } from "lucide-react";
import * as React from "react";
import { Button } from "../button";
import { ShaderCanvas } from "./shader-canvas";

const gradient = /* glsl */ `
void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec3 sumi = vec3(0.09, 0.082, 0.067);
  vec3 washi = vec3(0.93, 0.9, 0.84);
  float t = 0.5 + 0.5 * sin(u_time * 0.5 + uv.x * 2.4 + uv.y * 1.6);
  fragColor = vec4(mix(sumi, washi, smoothstep(0.0, 1.0, t)), 1.0);
}`;

export function ShaderCanvasMinimal() {
  return (
    <ShaderCanvas fragmentShader={gradient} className="h-48 w-full max-w-md rounded-kura-md" />
  );
}

const inkWash = /* glsl */ `
uniform vec3 u_colorA;
uniform vec3 u_colorB;
uniform vec3 u_colorC;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.02; a *= 0.5; }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec2 p = uv * vec2(u_resolution.x / u_resolution.y, 1.0) * 2.2;
  float t = u_time * 0.12;
  vec2 q = vec2(fbm(p + t), fbm(p - t + 3.1));
  vec2 r = vec2(fbm(p + 2.0 * q + vec2(1.7, 9.2) + t), fbm(p + 2.0 * q + vec2(8.3, 2.8)));
  r += (u_pointer - 0.5) * 0.35;
  float f = fbm(p + 2.5 * r);
  vec3 col = mix(u_colorA, u_colorB, smoothstep(0.2, 0.8, f));
  col = mix(col, u_colorC, smoothstep(0.55, 1.0, length(q)));
  col += 0.04 * (hash(gl_FragCoord.xy + u_time) - 0.5); // grain
  fragColor = vec4(col, 1.0);
}`;

export function ShaderCanvasFull() {
  const [paused, setPaused] = React.useState(false);
  const [speed, setSpeed] = React.useState(1);
  return (
    <div className="flex w-full max-w-lg flex-col gap-3">
      <ShaderCanvas
        fragmentShader={inkWash}
        uniforms={{
          u_colorA: [0.93, 0.9, 0.84], // washi
          u_colorB: [0.72, 0.69, 0.63], // diluted ink
          u_colorC: [0.09, 0.082, 0.067], // sumi
        }}
        paused={paused}
        speed={speed}
        maxDpr={1.5}
        staticTime={4}
        className="h-64 w-full rounded-kura-md shadow-kura-md"
      />
      <div className="flex items-center gap-2">
        <Button size="sm" variant="secondary" onClick={() => setPaused((p) => !p)}>
          {paused ? "Play" : "Pause"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setSpeed((s) => (s >= 4 ? 0.5 : s * 2))}>
          Speed ×{speed}
        </Button>
      </div>
    </div>
  );
}

const inkHills = /* glsl */ `
uniform vec3 u_ink;
uniform vec3 u_shu;
uniform vec3 u_paper;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float aspect = u_resolution.x / u_resolution.y;
  vec2 p = vec2(uv.x * aspect, uv.y);
  float t = u_time * 0.05;

  // Washi, with a little fibre.
  vec3 col = u_paper * (0.97 + 0.03 * fbm(p * vec2(40.0, 6.0)));

  // A shu sun, leaning a touch toward the pointer.
  vec2 c = vec2(0.7 * aspect + (u_pointer.x - 0.5) * 0.05, 0.6 + 0.015 * sin(u_time * 0.4));
  float sun = smoothstep(0.215, 0.205, length(p - c));
  col = mix(col, u_shu, sun * 0.92);

  // Three ridges of ink wash, far to near: darker at the ridge, misting out below.
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float h = 0.58 - fi * 0.17 + 0.16 * (fbm(vec2(p.x * (1.2 + fi * 0.5) + t * (1.0 + fi), fi * 7.3)) - 0.5);
    float body = smoothstep(h + 0.004, h - 0.004, uv.y);
    float wash = mix(0.45, 1.0, smoothstep(h - 0.28, h, uv.y));
    float ink = (0.22 + fi * 0.3) * wash;
    col = mix(col, u_ink, body * ink);
  }

  col += 0.02 * (hash(gl_FragCoord.xy + u_time) - 0.5); // grain
  fragColor = vec4(col, 1.0);
}`;

export function ShaderCanvasFeatureCard() {
  return (
    <article className="flex w-full max-w-md flex-col rounded-kura-md bg-kura-surface-raised p-1 shadow-kura-md">
      <div className="relative h-48 overflow-hidden rounded-[5px] shadow-[inset_0_0_0_1px_var(--kura-border-subtle)]">
        <ShaderCanvas
          fragmentShader={inkHills}
          uniforms={{
            u_ink: [0.09, 0.082, 0.067],
            u_shu: [0.86, 0.33, 0.15],
            u_paper: [0.93, 0.9, 0.84],
          }}
          maxDpr={1.5}
          staticTime={6}
          className="absolute inset-0"
        />
        <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-kura-xs bg-kura-surface-raised px-2 py-1 font-kura-mono text-[10px] text-kura-fg uppercase tracking-[0.14em] shadow-kura-xs">
          <Telescope className="size-3" strokeWidth={1.75} aria-hidden />
          Deep research
        </span>
      </div>
      <div className="flex flex-col gap-5 px-5 pt-5 pb-5">
        <div className="flex flex-col gap-2">
          <h3 className="font-kura-display text-[24px] text-kura-fg leading-[1.1] tracking-[-0.01em]">
            Hand off the reading, keep the judgement.
          </h3>
          <p className="text-kura-fg-muted text-sm leading-relaxed">
            Kura searches, reads and cross-checks dozens of sources, then brings back a cited brief
            you can question line by line.
          </p>
        </div>
        <dl className="grid grid-cols-3 border-kura-border border-t pt-3 font-kura-mono tabular-nums">
          <div className="flex flex-col gap-1">
            <dt className="text-[10px] text-kura-fg-subtle uppercase tracking-[0.14em]">
              Typical run
            </dt>
            <dd className="text-kura-fg text-xs">4–6 min</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-[10px] text-kura-fg-subtle uppercase tracking-[0.14em]">Sources</dt>
            <dd className="text-kura-fg text-xs">30–60</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-[10px] text-kura-fg-subtle uppercase tracking-[0.14em]">
              Included
            </dt>
            <dd className="text-kura-fg text-xs">25 / month</dd>
          </div>
        </dl>
        <div className="flex items-center gap-2">
          <Button>
            Start a brief
            <ArrowRight />
          </Button>
          <Button variant="ghost">See an example</Button>
        </div>
      </div>
    </article>
  );
}
