"use client";

import * as React from "react";
import { Button } from "../button";
import { MeshGradient } from "../mesh-gradient";
import { Grain, type GrainBlend } from "./grain";

export function GrainMinimal() {
  return (
    <div className="relative h-48 w-full max-w-md overflow-hidden rounded-kura-xl bg-[radial-gradient(120%_90%_at_20%_10%,var(--kura-accent-subtle),var(--kura-gray-3))] shadow-kura-sm">
      <Grain />
    </div>
  );
}

const blends: GrainBlend[] = ["overlay", "soft-light", "multiply", "screen", "normal"];

export function GrainFull() {
  const [blend, setBlend] = React.useState<GrainBlend>("overlay");
  const [opacity, setOpacity] = React.useState(0.3);
  const [scale, setScale] = React.useState(1);
  const [animated, setAnimated] = React.useState(false);
  return (
    <div className="flex w-full max-w-xl flex-col gap-4">
      <div className="grid h-56 grid-cols-2 overflow-hidden rounded-kura-xl shadow-kura-sm">
        {["bg-kura-accent", "bg-kura-gray-12"].map((bg) => (
          <div key={bg} className={`relative ${bg}`}>
            <Grain opacity={opacity} blend={blend} scale={scale} animated={animated} fps={12} />
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {blends.map((b) => (
          <Button
            key={b}
            size="xs"
            variant={b === blend ? "secondary" : "ghost"}
            aria-pressed={b === blend}
            onClick={() => setBlend(b)}
          >
            {b}
          </Button>
        ))}
        <Button
          size="xs"
          variant="ghost"
          className="ml-auto"
          aria-pressed={animated}
          onClick={() => setAnimated((a) => !a)}
        >
          Flicker {animated ? "on" : "off"}
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-6 text-kura-fg-muted text-xs">
        <label className="flex flex-col gap-1.5">
          Opacity {opacity.toFixed(2)}
          <input
            type="range"
            min={0}
            max={0.6}
            step={0.01}
            value={opacity}
            onChange={(e) => setOpacity(Number(e.target.value))}
            className="accent-kura-accent"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          Scale {scale.toFixed(1)}
          <input
            type="range"
            min={0.5}
            max={3}
            step={0.1}
            value={scale}
            onChange={(e) => setScale(Number(e.target.value))}
            className="accent-kura-accent"
          />
        </label>
      </div>
    </div>
  );
}

export function GrainOnGradient() {
  return (
    <MeshGradient
      colors="signal"
      className="flex h-64 w-full items-end rounded-kura-2xl p-6 shadow-kura-md"
    >
      <p className="relative z-10 max-w-xs font-medium text-kura-fg text-lg tracking-[-0.01em]">
        A little grain turns a gradient into a print.
      </p>
      <Grain opacity={0.22} blend="overlay" />
    </MeshGradient>
  );
}
