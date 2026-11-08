"use client";

import * as React from "react";
import { Button } from "../button";
import { ShimmerText } from "../shimmer-text";
import {
  ParticleField,
  type ParticleFieldShape,
  type ParticleFieldVariant,
} from "./particle-field";

export function ParticleFieldMinimal() {
  return (
    <ParticleField className="h-64 w-full rounded-kura-lg bg-kura-surface text-kura-fg-muted shadow-kura-sm" />
  );
}

export function ParticleFieldFull() {
  const [converge, setConverge] = React.useState(false);
  const [shape, setShape] = React.useState<ParticleFieldShape>("point");
  const [variant, setVariant] = React.useState<ParticleFieldVariant>("halftone");
  const [paused, setPaused] = React.useState(false);
  return (
    <div className="flex w-full max-w-2xl flex-col gap-4">
      <ParticleField
        variant={variant}
        converge={converge}
        shape={shape}
        paused={paused}
        linkDistance={120}
        speed={1.2}
        className="aspect-[16/9] w-full rounded-kura-lg bg-kura-surface-raised text-kura-fg shadow-kura-md"
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
        <span aria-hidden className="mx-1 h-4 w-px bg-kura-border" />
        {(["halftone", "constellation"] as const).map((v) => (
          <Button
            key={v}
            size="sm"
            variant={v === variant ? "secondary" : "ghost"}
            aria-pressed={v === variant}
            onClick={() => setVariant(v)}
            className="capitalize"
          >
            {v}
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
      shape="point"
      count={40}
      className="flex h-80 w-full items-end justify-center rounded-kura-lg bg-kura-surface p-6 text-kura-fg-muted shadow-kura-md"
    >
      <div className="relative flex w-full max-w-sm flex-col items-center gap-3 rounded-kura-md bg-kura-surface-raised px-5 py-4 text-center shadow-kura-sm">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-1 rounded-kura-sm border border-kura-border-subtle"
        />
        <div role="status" aria-live="polite" className="flex h-7 items-center text-sm">
          {generating ? (
            <ShimmerText>Generating your workspace…</ShimmerText>
          ) : (
            <span className="font-kura-display text-kura-fg text-lg">
              Describe a workspace and Kura sets it up.
            </span>
          )}
        </div>
        <Button size="sm" onClick={() => setGenerating(true)} disabled={generating}>
          Generate
        </Button>
      </div>
    </ParticleField>
  );
}
