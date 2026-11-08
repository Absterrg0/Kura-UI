"use client";

import { ArrowRight, Telescope } from "lucide-react";
import * as React from "react";
import { Button } from "../button";
import { ShaderCanvas } from "./shader-canvas";

const gradient = /* glsl */ `
void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec3 a = vec3(0.07, 0.44, 0.38);
  vec3 b = vec3(0.93, 0.92, 0.88);
  float t = 0.5 + 0.5 * sin(u_time * 0.6 + uv.x * 3.0 + uv.y * 2.0);
  fragColor = vec4(mix(a, b, t), 1.0);
}`;

export function ShaderCanvasMinimal() {
  return (
    <ShaderCanvas fragmentShader={gradient} className="h-48 w-full max-w-md rounded-kura-xl" />
  );
}

const silk = /* glsl */ `
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
        fragmentShader={silk}
        uniforms={{
          u_colorA: [0.05, 0.09, 0.08],
          u_colorB: [0.12, 0.55, 0.47],
          u_colorC: [0.92, 0.9, 0.84],
        }}
        paused={paused}
        speed={speed}
        maxDpr={1.5}
        staticTime={4}
        className="h-64 w-full rounded-kura-xl shadow-kura-md"
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

const ribbons = /* glsl */ `
uniform vec3 u_deep;
uniform vec3 u_jade;
uniform vec3 u_mist;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float aspect = u_resolution.x / u_resolution.y;
  float x = uv.x * aspect;
  float t = u_time * 0.2;

  // Deep base with a slow jade bloom that leans toward the pointer.
  vec2 bloom = vec2(0.5 + 0.25 * sin(t * 0.7), 0.35) * 0.6 + u_pointer * 0.4;
  float halo = smoothstep(0.9, 0.0, length((uv - bloom) * vec2(aspect * 0.6, 1.0)));
  vec3 col = mix(u_deep, u_jade * 0.7, halo * 0.75);

  // Three silk ribbons drifting across the band.
  float glow = 0.0;
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float y = 0.5 + 0.2 * sin(x * (0.9 + fi * 0.3) + t * (1.0 + fi * 0.35) + fi * 2.1)
                  + 0.07 * sin(x * 2.6 - t * 1.6 + fi * 1.3);
    float d = abs(uv.y - y);
    glow += (0.012 + 0.006 * fi) / (d + 0.012) * (0.9 - fi * 0.2);
  }
  col = mix(col, u_jade, clamp(glow * 0.45, 0.0, 1.0));
  col = mix(col, u_mist, smoothstep(1.2, 3.0, glow));
  col += 0.025 * (hash(gl_FragCoord.xy + u_time) - 0.5); // grain
  fragColor = vec4(col, 1.0);
}`;

export function ShaderCanvasFeatureCard() {
  return (
    <article className="relative isolate flex w-full max-w-md flex-col overflow-hidden rounded-kura-2xl bg-kura-surface shadow-kura-md">
      <div className="relative h-44">
        <ShaderCanvas
          fragmentShader={ribbons}
          uniforms={{
            u_deep: [0.035, 0.09, 0.08],
            u_jade: [0.12, 0.6, 0.5],
            u_mist: [0.86, 0.95, 0.9],
          }}
          maxDpr={1.5}
          staticTime={6}
          className="absolute inset-0"
        />
        <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-kura-overlay px-2.5 py-1 font-medium text-kura-fg text-xs shadow-kura-xs backdrop-blur-xl">
          <Telescope className="size-3.5" aria-hidden />
          Deep research
        </span>
      </div>
      <div className="flex flex-col gap-4 p-5">
        <div className="flex flex-col gap-1.5">
          <h3 className="font-medium text-kura-fg text-lg tracking-tight">
            Hand off the reading, keep the judgement
          </h3>
          <p className="text-kura-fg-muted text-sm leading-relaxed">
            Kura searches, reads and cross-checks dozens of sources, then brings back a cited brief
            you can question line by line.
          </p>
        </div>
        <dl className="flex gap-6 font-kura-mono text-xs tabular-nums">
          <div className="flex flex-col gap-0.5">
            <dt className="text-kura-fg-subtle">Typical run</dt>
            <dd className="text-kura-fg">4–6 min</dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-kura-fg-subtle">Sources</dt>
            <dd className="text-kura-fg">30–60</dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-kura-fg-subtle">Included</dt>
            <dd className="text-kura-fg">25 / month</dd>
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
