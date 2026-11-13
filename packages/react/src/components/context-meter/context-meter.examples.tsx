"use client";

import { ArrowUp, Paperclip } from "lucide-react";
import * as React from "react";
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

/** Each turn adds about 6k tokens of conversation; watch the window fill past the warning line. */
export function ContextMeterFull() {
  const [turns, setTurns] = React.useState(0);
  React.useEffect(() => {
    if (turns >= 11) return;
    const id = setTimeout(() => setTurns((t) => t + 1), turns === 0 ? 1000 : 650);
    return () => clearTimeout(id);
  }, [turns]);
  const segments = BASE.map((s) =>
    s.id === "history" ? { ...s, tokens: s.tokens + turns * 6_200 } : s,
  );
  return (
    <ContextPanel
      max={200_000}
      segments={segments}
      warningAt={0.7}
      dangerAt={0.9}
      footer="Older turns are summarized at 90%."
      className="w-full max-w-[320px]"
    />
  );
}

const THREADS = [
  { title: "Onboarding emails", used: 52_000 },
  { title: "Q3 data migration", used: 98_500 },
  { title: "Incident review: checkout", used: 121_900 },
];

export function ContextMeterThresholds() {
  return (
    <section
      aria-label="Threads"
      className="flex w-full max-w-sm flex-col rounded-kura-xl bg-kura-surface pb-1.5 shadow-kura-surface"
    >
      <div className="flex h-11 items-center gap-2.5 px-4">
        <span className="font-semibold text-[13px] text-kura-fg tracking-[-0.01em]">Threads</span>
        <span className="font-kura-mono text-[12px] text-kura-fg-subtle tabular-nums">
          {THREADS.length}
        </span>
      </div>
      <ul className="flex flex-col">
        {THREADS.map((t) => (
          <li
            key={t.title}
            className="mx-1.5 flex h-9 items-center justify-between gap-4 rounded-[9px] pr-0.5 pl-2.5 text-[13px] text-kura-fg"
          >
            <span className="min-w-0 truncate">{t.title}</span>
            <ContextMeter max={128_000} used={t.used} label={t.title} className="shrink-0" />
          </li>
        ))}
      </ul>
    </section>
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
