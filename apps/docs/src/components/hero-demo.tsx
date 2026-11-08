"use client";

import { IconButton } from "@kura-ui/react/icon-button";
import { KbdShortcut } from "@kura-ui/react/kbd-shortcut";
import { ShaderCanvas } from "@kura-ui/react/shader-canvas";
import { ShimmerText } from "@kura-ui/react/shimmer-text";
import { ArrowUp, Check, Mic, Paperclip } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/cn";

const silk = /* glsl */ `
uniform vec3 u_a; uniform vec3 u_b; uniform vec3 u_c;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) { vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y); }
float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a*noise(p); p *= 2.03; a *= 0.5; } return v; }
void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec2 p = uv * vec2(u_resolution.x / u_resolution.y, 1.0) * 1.8;
  float t = u_time * 0.08;
  vec2 q = vec2(fbm(p + t), fbm(p - t + 4.0));
  vec2 r = vec2(fbm(p + 2.2*q + vec2(1.7, 9.2) + t), fbm(p + 2.2*q + vec2(8.3, 2.8)));
  r += (u_pointer - 0.5) * 0.25;
  float f = fbm(p + 2.4*r);
  vec3 col = mix(u_a, u_b, smoothstep(0.25, 0.85, f));
  col = mix(col, u_c, smoothstep(0.6, 1.1, length(q)) * 0.8);
  col += 0.035 * (hash(gl_FragCoord.xy + u_time) - 0.5);
  fragColor = vec4(col, 1.0);
}`;

const steps = ["Reading the codebase…", "Searching 24 sources…", "Drafting the component…"];

export function HeroDemo() {
  const [step, setStep] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % (steps.length + 1)), 2200);
    return () => clearInterval(id);
  }, []);
  const done = step === steps.length;

  return (
    <div className="relative isolate overflow-hidden rounded-kura-2xl shadow-kura-lg">
      <ShaderCanvas
        fragmentShader={silk}
        uniforms={{ u_a: [0.04, 0.07, 0.065], u_b: [0.1, 0.48, 0.41], u_c: [0.93, 0.91, 0.85] }}
        staticTime={6}
        maxDpr={1.5}
        className="absolute inset-0 -z-10"
      />
      <div className="flex min-h-[420px] flex-col justify-end p-4 sm:p-6">
        <div className="flex flex-col gap-3 rounded-kura-xl bg-kura-overlay p-3 shadow-kura-lg backdrop-blur-2xl backdrop-saturate-150">
          <ol className="flex flex-col gap-1.5 px-1 pt-1 text-sm" aria-label="Agent steps">
            {steps.map((label, i) => {
              const state = done || i < step ? "done" : i === step ? "active" : "pending";
              return (
                <li
                  key={label}
                  data-state={state}
                  className={cn(
                    "flex items-center gap-2.5 transition-opacity duration-(--kura-duration-base)",
                    state === "pending" && "opacity-40",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-4 items-center justify-center rounded-full",
                      state === "done"
                        ? "bg-kura-accent-subtle text-kura-accent-text"
                        : "bg-kura-surface-sunken",
                    )}
                  >
                    {state === "done" ? (
                      <Check className="size-2.5" strokeWidth={3} />
                    ) : state === "active" ? (
                      <span className="size-1.5 animate-kura-pulse rounded-full bg-kura-accent" />
                    ) : null}
                  </span>
                  {state === "active" ? (
                    <ShimmerText>{label}</ShimmerText>
                  ) : (
                    <span className={state === "done" ? "text-kura-fg-muted" : ""}>
                      {label.replace("…", "")}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
          <div className="rounded-kura-lg bg-kura-surface p-2 shadow-kura-sm">
            <p className="px-1.5 pt-1 pb-3 text-kura-fg-subtle text-sm">
              Build a voice composer with a live waveform…
            </p>
            <div className="flex items-center gap-1">
              <IconButton label="Attach" icon={<Paperclip />} size="sm" />
              <IconButton label="Dictate" icon={<Mic />} size="sm" shortcut={["mod", "d"]} />
              <KbdShortcut
                keys={["mod", "enter"]}
                label="Send"
                className="ml-auto hidden sm:inline-flex"
                variant="ghost"
              />
              <IconButton
                label="Send"
                icon={<ArrowUp />}
                size="sm"
                variant="primary"
                className="ml-2 rounded-full"
                shortcut={["mod", "enter"]}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
