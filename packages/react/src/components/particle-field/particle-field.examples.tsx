"use client";

import * as React from "react";
import { Button } from "../button";
import { ShimmerText } from "../shimmer-text";
import { ParticleField, type ParticleFieldShape } from "./particle-field";

export function ParticleFieldMinimal() {
  return (
    <ParticleField className="h-64 w-full rounded-kura-xl bg-kura-surface-sunken shadow-kura-sm" />
  );
}

export function ParticleFieldFull() {
  const [converge, setConverge] = React.useState(false);
  const [shape, setShape] = React.useState<ParticleFieldShape>("ring");
  const [paused, setPaused] = React.useState(false);
  return (
    <div className="flex w-full max-w-2xl flex-col gap-4">
      <ParticleField
        converge={converge}
        shape={shape}
        paused={paused}
        linkDistance={120}
        speed={1.2}
        className="aspect-[16/9] w-full rounded-kura-xl bg-kura-surface-sunken text-kura-fg-muted shadow-kura-md"
      />
      <div className="flex flex-wrap items-center gap-1.5">
        <Button
          size="sm"
          variant={converge ? "accent" : "secondary"}
          aria-pressed={converge}
          onClick={() => setConverge((c) => !c)}
        >
          {converge ? "Release" : "Converge"}
        </Button>
        {(["ring", "point"] as const).map((s) => (
          <Button
            key={s}
            size="sm"
            variant={s === shape ? "secondary" : "ghost"}
            aria-pressed={s === shape}
            onClick={() => setShape(s)}
            className="capitalize"
          >
            {s}
          </Button>
        ))}
        <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setPaused((p) => !p)}>
          {paused ? "Play" : "Pause"}
        </Button>
      </div>
    </div>
  );
}

export function ParticleFieldGenerating() {
  const [generating, setGenerating] = React.useState(false);
  React.useEffect(() => {
    if (!generating) return;
    const id = setTimeout(() => setGenerating(false), 4000);
    return () => clearTimeout(id);
  }, [generating]);
  return (
    <ParticleField
      converge={generating}
      className="flex h-80 w-full flex-col items-center justify-center gap-3 rounded-kura-2xl bg-kura-surface text-center shadow-kura-md"
    >
      <div role="status" aria-live="polite" className="h-6 text-sm">
        {generating ? (
          <ShimmerText>Generating your workspace…</ShimmerText>
        ) : (
          <span className="text-kura-fg-muted">Describe a workspace and Kura sets it up.</span>
        )}
      </div>
      <Button onClick={() => setGenerating(true)} disabled={generating}>
        Generate
      </Button>
    </ParticleField>
  );
}
