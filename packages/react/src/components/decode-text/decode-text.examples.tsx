"use client";

import { RotateCcw } from "lucide-react";
import * as React from "react";
import { Button } from "../button";
import { DecodeText } from "./decode-text";

export function DecodeTextMinimal() {
  return <DecodeText className="font-kura-mono text-kura-fg text-sm">Agent online</DecodeText>;
}

const lines = [
  "Plan ready: 3 steps, 2 files",
  "Migration applied to staging",
  "All 214 tests passing",
];

export function DecodeTextFull() {
  const [i, setI] = React.useState(0);
  const [runs, setRuns] = React.useState(0);
  return (
    <div className="flex w-full max-w-md flex-col items-start gap-5">
      <DecodeText
        as="h3"
        trigger={runs}
        duration={1400}
        spread={8}
        className="font-kura-mono font-medium text-kura-fg text-xl tracking-tight"
      >
        {lines[i % lines.length]!}
      </DecodeText>
      <DecodeText
        as="p"
        startOn="view"
        duration={900}
        glyphs="01"
        className="font-kura-mono text-kura-fg-muted text-xs"
      >
        sha 9f3c2e1 · 412 ms · 1,284 tokens
      </DecodeText>
      <DecodeText as="p" duration={1200} className="font-kura-display text-kura-fg text-xl">
        Proportional type keeps its width while decoding.
      </DecodeText>
      <div className="flex gap-1.5">
        <Button size="sm" variant="secondary" onClick={() => setI((v) => v + 1)}>
          Next message
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setRuns((r) => r + 1)}>
          <RotateCcw /> Replay
        </Button>
      </div>
    </div>
  );
}

export function DecodeTextAgentHandshake() {
  const [connected, setConnected] = React.useState(false);
  return (
    <div className="relative flex w-full max-w-sm flex-col gap-3 rounded-kura-lg bg-kura-surface-raised p-4 shadow-kura-sm">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-1 rounded-kura-sm border border-kura-border-subtle"
      />
      <div className="flex items-center justify-between">
        <span className="font-kura-mono text-[10px] text-kura-fg-subtle uppercase tracking-[0.14em]">
          Remote agent
        </span>
        <span
          className="size-1.5 rounded-full bg-kura-accent transition-colors duration-(--kura-duration-base) data-[on=false]:bg-kura-gray-8"
          data-on={connected}
          aria-hidden
        />
      </div>
      <div role="status" aria-live="polite" className="font-kura-mono text-kura-fg text-sm">
        <DecodeText trigger={connected} duration={1100}>
          {connected ? "Connected to build-runner-07" : "Not connected"}
        </DecodeText>
      </div>
      <Button
        size="sm"
        variant={connected ? "secondary" : "primary"}
        onClick={() => setConnected((c) => !c)}
      >
        {connected ? "Disconnect" : "Connect"}
      </Button>
    </div>
  );
}
