"use client";

import { ArrowUp, Paperclip } from "lucide-react";
import * as React from "react";
import { Button } from "../button";
import { IconButton } from "../icon-button";
import { ContextMeter, ContextPanel, type ContextSegment } from "./context-meter";

const BASE: ContextSegment[] = [
  { id: "system", label: "System prompt", tokens: 3_400 },
  { id: "tools", label: "Tool definitions", tokens: 11_800 },
  { id: "files", label: "Attached files", tokens: 38_600 },
  { id: "history", label: "Conversation", tokens: 30_410 },
];

/** The window as one hundred dots, one per percent, shaded by what is using it. */
export function ContextMeterMinimal() {
  return <ContextPanel max={200_000} segments={BASE} className="w-full max-w-[320px]" />;
}

export function ContextMeterFull() {
  const [logs, setLogs] = React.useState(0);
  const segments = BASE.map((s) =>
    s.id === "files" ? { ...s, tokens: s.tokens + logs * 24_000 } : s,
  );
  return (
    <div className="flex w-full max-w-md flex-col rounded-kura-xl bg-kura-surface shadow-kura-surface">
      <div className="flex flex-col gap-0.5 px-4 pt-3.5 pb-3">
        <span className="truncate font-semibold text-[13px] text-kura-fg tracking-[-0.01em]">
          Auth middleware refactor
        </span>
        <span className="text-[12.5px] text-kura-fg-subtle">32 turns · 200k context window</span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-2.5 pb-2.5">
        <ContextMeter
          max={200_000}
          segments={segments}
          valueDisplay="tokens"
          warningAt={0.7}
          dangerAt={0.9}
          footer="Files count once per turn; tool definitions are cached."
        />
        <div className="flex items-center gap-1.5">
          {logs > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setLogs(0)}>
              Clear
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={() => setLogs((n) => n + 1)}>
            <Paperclip /> Attach a log
          </Button>
        </div>
      </div>
    </div>
  );
}

const THREADS = [
  { title: "Onboarding emails", used: 52_000 },
  { title: "Q3 data migration", used: 98_500 },
  { title: "Incident review: checkout", used: 121_900 },
];

export function ContextMeterThresholds() {
  return (
    <ul className="flex w-full max-w-md flex-col">
      {THREADS.map((t) => (
        <li
          key={t.title}
          className="flex h-10 items-center justify-between gap-4 text-[13px] text-kura-fg"
        >
          <span className="min-w-0 truncate">{t.title}</span>
          <ContextMeter max={128_000} used={t.used} label={t.title} className="shrink-0" />
        </li>
      ))}
    </ul>
  );
}

export function ContextMeterInComposer() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-2 rounded-kura-xl bg-kura-surface p-3 shadow-kura-surface">
      <p className="min-h-12 px-1 text-[14px] text-kura-fg-subtle">Ask a follow-up…</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <IconButton label="Attach files" size="sm" icon={<Paperclip />} />
          <ContextMeter max={200_000} segments={BASE} />
        </div>
        <IconButton label="Send" variant="primary" size="sm" icon={<ArrowUp />} />
      </div>
    </div>
  );
}
