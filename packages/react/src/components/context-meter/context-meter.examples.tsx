"use client";

import { ArrowUp, Plus } from "lucide-react";
import * as React from "react";
import { Button } from "../button";
import { IconButton } from "../icon-button";
import { ContextMeter, type ContextSegment } from "./context-meter";

export function ContextMeterMinimal() {
  return <ContextMeter used={84_210} max={200_000} />;
}

const BASE: ContextSegment[] = [
  { id: "system", label: "System prompt", tokens: 3_400 },
  { id: "tools", label: "Tool definitions", tokens: 11_800 },
  { id: "files", label: "Attached files", tokens: 38_600 },
  { id: "history", label: "Conversation", tokens: 30_410 },
];

export function ContextMeterFull() {
  const [history, setHistory] = React.useState(30_410);
  const segments = BASE.map((s) => (s.id === "history" ? { ...s, tokens: history } : s));
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center gap-6">
        <ContextMeter
          max={200_000}
          segments={segments}
          variant="ring"
          valueDisplay="percent"
          warningAt={0.7}
          dangerAt={0.9}
          label="Context"
        />
        <ContextMeter
          max={200_000}
          segments={segments}
          variant="bar"
          valueDisplay="tokens"
          footer="Files count once per turn; tool definitions are cached."
        />
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={() => setHistory((h) => h + 24_000)}>
          <Plus /> Add 24k tokens
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setHistory(30_410)}>
          Reset
        </Button>
      </div>
    </div>
  );
}

export function ContextMeterThresholds() {
  return (
    <div className="flex flex-col items-start gap-3">
      <ContextMeter max={128_000} used={52_000} variant="bar" />
      <ContextMeter max={128_000} used={98_500} variant="bar" />
      <ContextMeter max={128_000} used={121_900} variant="bar" />
    </div>
  );
}

export function ContextMeterInComposer() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-2 rounded-kura-xl bg-kura-surface p-3 shadow-kura-sm">
      <p className="min-h-12 px-1 text-[15px] text-kura-fg-subtle">Ask a follow-up…</p>
      <div className="flex items-center justify-between">
        <ContextMeter max={200_000} segments={BASE} />
        <IconButton
          label="Send"
          variant="primary"
          size="sm"
          icon={<ArrowUp />}
          className="rounded-full"
        />
      </div>
    </div>
  );
}
