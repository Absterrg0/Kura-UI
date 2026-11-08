"use client";

import { ArtifactCard } from "@kura-ui/react/artifact-card";
import { Composer } from "@kura-ui/react/composer";
import { Message } from "@kura-ui/react/message";
import { Reasoning } from "@kura-ui/react/reasoning";
import { ToolCall } from "@kura-ui/react/tool-call";
import { Globe } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/cn";
import { Seal } from "./seal";

/**
 * The hero: one agent turn printed as a proof sheet, built entirely from Kura components.
 * It plays through thinking → tool call → artifact → answer, then starts over.
 */
const SCRIPT = [
  { at: 0, phase: "asked" },
  { at: 700, phase: "thinking" },
  { at: 3300, phase: "searching" },
  { at: 5300, phase: "writing" },
  { at: 8800, phase: "done" },
  { at: 14500, phase: "restart" },
] as const;
type Phase = (typeof SCRIPT)[number]["phase"];
const ORDER: Phase[] = ["asked", "thinking", "searching", "writing", "done"];

function usePhase(): [Phase, number] {
  const [phase, setPhase] = React.useState<Phase>("asked");
  const [run, setRun] = React.useState(0);
  // biome-ignore lint/correctness/useExhaustiveDependencies: `run` restarts the script
  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPhase("done");
      return;
    }
    const timers = SCRIPT.map(({ at, phase: p }) =>
      setTimeout(() => (p === "restart" ? setRun((r) => r + 1) : setPhase(p)), at),
    );
    return () => timers.forEach(clearTimeout);
  }, [run]);
  return [phase, run];
}

function useProgress(active: boolean, ms: number) {
  const [p, setP] = React.useState(0);
  React.useEffect(() => {
    if (!active) return;
    setP(0);
    const start = performance.now();
    const id = setInterval(() => {
      const t = Math.min(1, (performance.now() - start) / ms);
      setP(t);
      if (t >= 1) clearInterval(id);
    }, 120);
    return () => clearInterval(id);
  }, [active, ms]);
  return p;
}

export function HeroProof({ className }: { className?: string }) {
  const [phase, run] = usePhase();
  const at = (p: Phase) => ORDER.indexOf(phase) >= ORDER.indexOf(p);
  const writing = phase === "writing";
  const progress = useProgress(writing, 3300);

  return (
    <figure className={cn("relative", className)} aria-label="A Kura agent turn, playing live">
      {/* Binder clip holding the proof to the page. */}
      <svg
        aria-hidden
        viewBox="0 0 120 44"
        className="absolute -top-5 left-1/2 z-10 w-28 -translate-x-1/2 drop-shadow-[0_3px_3px_oklch(0.2_0.01_80/0.25)]"
      >
        <path
          d="M38 22 C38 6 82 6 82 22"
          fill="none"
          className="stroke-kura-fg-subtle"
          strokeWidth="3.5"
        />
        <path d="M18 24 h84 l-8 18 h-68 z" className="fill-kura-ink" />
        <path d="M24 27 h72" className="stroke-kura-fg-inverted/25" strokeWidth="1.5" />
      </svg>

      <div className="print print-keyline relative rounded-[10px] px-5 pt-9 pb-5 sm:px-7">
        <div className="flex items-center justify-between pb-5 font-kura-mono text-[10.5px] text-kura-fg-subtle uppercase tracking-[0.14em]">
          <span>Proof · one turn</span>
          <span className="flex items-center gap-1.5">
            <span
              className={cn(
                "size-1.5 rounded-full",
                phase === "done" ? "bg-kura-fg-subtle" : "animate-kura-pulse bg-kura-accent",
              )}
            />
            {phase === "done" ? "Settled" : "Live"}
          </span>
        </div>

        <div key={run} className="flex min-h-[452px] flex-col gap-4">
          <Message from="user">Rebuild our pricing page around three plans, not four.</Message>

          <Message from="assistant" name="Kura" status={phase === "done" ? "idle" : "streaming"}>
            {at("thinking") && (
              <Reasoning
                active={phase === "thinking"}
                autoCollapse
                className="animate-kura-fade-in"
              >
                Team and Business overlap below fifty seats. Fold them, keep Free, and make the
                middle plan the obvious one.
              </Reasoning>
            )}
            {at("searching") && (
              <ToolCall
                variant="inline"
                name="search_web"
                title={
                  phase === "searching" ? "Reading competitor pricing" : "Read competitor pricing"
                }
                icon={<Globe />}
                status={phase === "searching" ? "running" : "success"}
                summary="6 pages"
                className="animate-kura-fade-in"
              />
            )}
            {at("writing") && (
              <ArtifactCard
                variant="compact"
                kind="web"
                title="pricing.tsx"
                status={writing ? "generating" : "ready"}
                statusText={progress < 0.5 ? "Laying out three plans…" : "Writing the comparison…"}
                progress={writing ? progress : undefined}
                meta="React · 3 plans · 212 lines"
                onOpen={() => {}}
                className="w-full animate-kura-fade-in"
              />
            )}
            {phase === "done" && (
              <p className="animate-kura-fade-in">
                Three plans, with Team as the default. The FAQ now answers seat changes up front.
              </p>
            )}
          </Message>

          <div className="mt-auto">
            <Composer
              placeholder="Ask for a change…"
              status={phase === "done" || phase === "asked" ? "idle" : "streaming"}
              onStop={() => {}}
            />
          </div>
        </div>
      </div>

      <Seal
        glyph="蔵"
        tilt={-9}
        className="absolute -right-4 -bottom-5 size-16 opacity-95 mix-blend-multiply dark:mix-blend-normal"
      />
    </figure>
  );
}
