"use client";

import * as React from "react";
import { Button } from "../button";
import { Grain } from "../grain";
import { Aurora, type AuroraPreset } from "./aurora";

export function AuroraMinimal() {
  return <Aurora className="h-72 w-full rounded-kura-xl bg-kura-canvas shadow-kura-sm" />;
}

const presets: AuroraPreset[] = ["signal", "sumi", "ai", "matcha"];

export function AuroraFull() {
  const [preset, setPreset] = React.useState<AuroraPreset>("ai");
  const [intensity, setIntensity] = React.useState(0.85);
  const [stars, setStars] = React.useState(true);
  const [paused, setPaused] = React.useState(false);
  return (
    <div className="flex w-full max-w-2xl flex-col gap-4">
      <Aurora
        colors={preset}
        intensity={intensity}
        stars={stars}
        paused={paused}
        className="aspect-[16/9] w-full rounded-kura-xl bg-kura-surface-sunken shadow-kura-md"
      />
      <div className="flex flex-wrap items-center gap-1.5">
        {presets.map((p) => (
          <Button
            key={p}
            size="sm"
            variant={p === preset ? "secondary" : "ghost"}
            aria-pressed={p === preset}
            onClick={() => setPreset(p)}
            className="capitalize"
          >
            {p}
          </Button>
        ))}
        <span className="ml-auto flex gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            aria-pressed={stars}
            onClick={() => setStars((s) => !s)}
          >
            Stars {stars ? "on" : "off"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setPaused((p) => !p)}>
            {paused ? "Play" : "Pause"}
          </Button>
        </span>
      </div>
      <label className="flex max-w-xs flex-col gap-1.5 text-kura-fg-muted text-xs">
        Intensity {intensity.toFixed(2)}
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={intensity}
          onChange={(e) => setIntensity(Number(e.target.value))}
          className="accent-kura-accent"
        />
      </label>
    </div>
  );
}

export function AuroraSignIn() {
  return (
    <Aurora
      intensity={0.7}
      className="flex min-h-96 w-full flex-col items-center justify-start gap-3 rounded-kura-lg bg-kura-canvas px-6 pt-12 text-center shadow-kura-md"
    >
      <span className="relative z-10 font-kura-mono text-[11px] text-kura-fg-subtle uppercase tracking-[0.14em]">
        Overnight · 23:00 – 07:00
      </span>
      <h2 className="relative z-10 text-balance font-kura-display text-4xl text-kura-fg leading-[1.05]">
        Your agents worked through the night.
      </h2>
      <p className="relative z-10 max-w-sm text-kura-fg-muted text-sm leading-relaxed">
        Sign in to review 14 finished tasks and 2 waiting for approval.
      </p>
      <div className="relative z-10 mt-2 flex gap-2">
        <Button>Sign in</Button>
        <Button variant="secondary">Create account</Button>
      </div>
      <Grain opacity={0.18} />
    </Aurora>
  );
}
