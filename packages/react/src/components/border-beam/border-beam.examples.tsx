"use client";

import { FileCode2, Square } from "lucide-react";
import * as React from "react";
import { Button } from "../button";
import { ShimmerText } from "../shimmer-text";
import { BorderBeam } from "./border-beam";

export function BorderBeamMinimal() {
  return (
    <div className="relative w-full max-w-sm rounded-kura-xl bg-kura-surface p-5 text-sm shadow-kura-sm">
      <p className="font-medium text-kura-fg">Indexing workspace</p>
      <p className="text-kura-fg-muted">The beam marks a container the agent is working in.</p>
      <BorderBeam />
    </div>
  );
}

export function BorderBeamFull() {
  const [active, setActive] = React.useState(true);
  const [glow, setGlow] = React.useState(true);
  const [fast, setFast] = React.useState(false);
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-5">
      <div className="relative flex h-40 w-full flex-col justify-between rounded-kura-lg bg-kura-surface-raised p-4 shadow-kura-sm">
        <p className="text-kura-fg-muted text-sm">Ask the agent to change something…</p>
        <div className="flex items-center justify-between text-kura-fg-subtle text-xs">
          <span className="font-kura-mono text-[10px] uppercase tracking-[0.14em]">
            {active ? "Editing 3 files" : "Idle"}
          </span>
          <span className="font-kura-mono tabular-nums">⌘↵</span>
        </div>
        <BorderBeam active={active} glow={glow} duration={fast ? 3 : 7} size={0.3} width={1.5} />
        <BorderBeam active={active} duration={fast ? 3 : 7} size={0.18} offset={0.5} />
      </div>
      <div className="flex flex-wrap justify-center gap-1.5">
        <Button
          size="sm"
          variant="secondary"
          aria-pressed={active}
          onClick={() => setActive((v) => !v)}
        >
          {active ? "Stop" : "Start"}
        </Button>
        <Button size="sm" variant="ghost" aria-pressed={glow} onClick={() => setGlow((v) => !v)}>
          Bleed {glow ? "on" : "off"}
        </Button>
        <Button size="sm" variant="ghost" aria-pressed={fast} onClick={() => setFast((v) => !v)}>
          {fast ? "3s lap" : "7s lap"}
        </Button>
      </div>
    </div>
  );
}

export function BorderBeamAgentTask() {
  const [running, setRunning] = React.useState(true);
  return (
    <div className="relative flex w-full max-w-md items-center gap-3 rounded-kura-lg bg-kura-surface p-3 shadow-kura-sm">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-kura-md bg-kura-accent-subtle text-kura-accent-text">
        <FileCode2 className="size-4" />
      </span>
      <div className="min-w-0 flex-1 text-sm" role="status" aria-live="polite">
        <p className="truncate font-medium text-kura-fg">auth/session.ts</p>
        {running ? (
          <ShimmerText className="text-xs">Refactoring token refresh…</ShimmerText>
        ) : (
          <span className="text-kura-fg-muted text-xs">Stopped by you</span>
        )}
      </div>
      <Button size="sm" variant="secondary" onClick={() => setRunning((r) => !r)}>
        {running ? <Square className="size-3 fill-current" /> : null}
        {running ? "Stop" : "Resume"}
      </Button>
      <BorderBeam active={running} glow duration={5} />
    </div>
  );
}
