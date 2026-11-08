"use client";

import { ArrowUp, Paperclip } from "lucide-react";
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
  const [logs, setLogs] = React.useState(0);
  const segments = BASE.map((s) =>
    s.id === "files" ? { ...s, tokens: s.tokens + logs * 24_000 } : s,
  );
  return (
    <div className="flex w-full max-w-md flex-col rounded-kura-xl bg-kura-surface shadow-kura-sm">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate font-medium text-kura-fg text-sm tracking-[-0.01em]">
            Auth middleware refactor
          </span>
          <span className="text-kura-fg-subtle text-xs">32 turns · 200k context window</span>
        </div>
        <ContextMeter
          max={200_000}
          segments={segments}
          variant="ring"
          valueDisplay="percent"
          warningAt={0.7}
          dangerAt={0.9}
          label="Context"
        />
      </div>
      <div className="flex items-center justify-between gap-3 px-4 py-3 shadow-[inset_0_1px_0_var(--kura-border-subtle)]">
        <ContextMeter
          max={200_000}
          segments={segments}
          variant="bar"
          valueDisplay="tokens"
          className="-ml-1.5"
          footer="Files count once per turn; tool definitions are cached."
        />
        <div className="flex items-center gap-1">
          {logs > 0 && (
            <Button variant="ghost" size="xs" onClick={() => setLogs(0)}>
              Clear
            </Button>
          )}
          <Button variant="secondary" size="xs" onClick={() => setLogs((n) => n + 1)}>
            <Paperclip /> Attach server.log
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
          className="flex h-10 items-center justify-between gap-4 text-[13px] text-kura-fg shadow-[inset_0_-1px_0_var(--kura-border-subtle)] last:shadow-none"
        >
          <span className="min-w-0 truncate">{t.title}</span>
          <ContextMeter max={128_000} used={t.used} variant="bar" label={t.title} />
        </li>
      ))}
    </ul>
  );
}

export function ContextMeterInComposer() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-2 rounded-kura-xl bg-kura-surface p-3 shadow-kura-sm">
      <p className="min-h-12 px-1 text-[15px] text-kura-fg-subtle">Ask a follow-up…</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <IconButton label="Attach files" size="sm" icon={<Paperclip />} />
          <ContextMeter max={200_000} segments={BASE} />
        </div>
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
