"use client";

import { ArrowRight } from "lucide-react";
import * as React from "react";
import { Button } from "../button";
import { MeshGradient, type MeshGradientPreset } from "./mesh-gradient";

export function MeshGradientMinimal() {
  return <MeshGradient className="h-64 w-full rounded-kura-xl shadow-kura-sm" />;
}

const presets: MeshGradientPreset[] = ["signal", "paper", "graphite", "dusk", "ember", "glacier"];

function Slider({
  label,
  value,
  onChange,
  max = 1,
  step = 0.05,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  max?: number;
  step?: number;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-kura-fg-muted text-xs">
      <span className="flex justify-between">
        {label}
        <span className="font-kura-mono text-kura-fg-subtle tabular-nums">{value.toFixed(2)}</span>
      </span>
      <input
        type="range"
        min={0}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="accent-kura-accent"
      />
    </label>
  );
}

export function MeshGradientFull() {
  const [preset, setPreset] = React.useState<MeshGradientPreset>("dusk");
  const [distortion, setDistortion] = React.useState(0.6);
  const [swirl, setSwirl] = React.useState(0.35);
  const [speed, setSpeed] = React.useState(1);
  const [grain, setGrain] = React.useState(0.15);
  const [paused, setPaused] = React.useState(false);
  return (
    <div className="flex w-full max-w-2xl flex-col gap-4">
      <MeshGradient
        colors={preset}
        distortion={distortion}
        swirl={swirl}
        speed={speed}
        grain={grain}
        paused={paused}
        seed={2}
        className="aspect-[16/9] w-full rounded-kura-xl shadow-kura-md"
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
        <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setPaused((v) => !v)}>
          {paused ? "Play" : "Pause"}
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
        <Slider label="Distortion" value={distortion} onChange={setDistortion} />
        <Slider label="Swirl" value={swirl} onChange={setSwirl} />
        <Slider label="Speed" value={speed} onChange={setSpeed} max={3} step={0.1} />
        <Slider label="Grain" value={grain} onChange={setGrain} />
      </div>
    </div>
  );
}

export function MeshGradientHero() {
  return (
    <MeshGradient
      colors="signal"
      distortion={0.7}
      swirl={0.3}
      className="flex min-h-80 w-full flex-col items-start justify-end gap-4 rounded-kura-2xl p-8 shadow-kura-md"
    >
      <span className="rounded-full bg-kura-overlay px-2.5 py-1 font-medium text-kura-accent-text text-xs shadow-kura-xs backdrop-blur-xl">
        Agents · Beta
      </span>
      <h2 className="max-w-md text-balance font-medium text-3xl text-kura-fg tracking-tight">
        Hand off the busywork. Keep the judgement.
      </h2>
      <p className="max-w-sm text-kura-fg-muted text-sm leading-relaxed">
        Kura agents read your repo, plan the change and wait for your approval before touching
        anything.
      </p>
      <Button>
        Start a run <ArrowRight />
      </Button>
    </MeshGradient>
  );
}
