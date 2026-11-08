"use client";

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
