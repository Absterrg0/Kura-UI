"use client";

import { Mic, MicOff, PhoneOff } from "lucide-react";
import * as React from "react";
import { useAudioAnalyser } from "../../hooks/use-audio-analyser";
import { Button } from "../button";
import { IconButton } from "../icon-button";
import { AgentOrb, type AgentOrbState } from "./agent-orb";

export function AgentOrbMinimal() {
  return <AgentOrb className="size-48" />;
}

const states: AgentOrbState[] = ["idle", "listening", "thinking", "speaking", "error"];
const densities = [13, 19, 27] as const;

export function AgentOrbFull() {
  const [state, setState] = React.useState<AgentOrbState>("speaking");
  const [dots, setDots] = React.useState<number>(19);
  // Simulated audio for the demo; pass `source: micStream` in a real app.
  const analyser = useAudioAnalyser({ simulate: "speech" });
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-5">
      <AgentOrb state={state} dots={dots} analyser={analyser} className="size-64" />
      <div
        role="radiogroup"
        aria-label="Agent state"
        className="flex flex-wrap justify-center gap-1"
      >
        {states.map((s) => (
          <Button
            key={s}
            size="xs"
            variant={s === state ? "secondary" : "ghost"}
            role="radio"
            aria-checked={s === state}
            onClick={() => setState(s)}
            className="capitalize"
          >
            {s}
          </Button>
        ))}
      </div>
      <div role="radiogroup" aria-label="Dots across" className="flex items-center gap-1">
        {densities.map((d) => (
          <Button
            key={d}
            size="xs"
            variant={d === dots ? "secondary" : "ghost"}
            role="radio"
            aria-checked={d === dots}
            aria-label={`${d} dots across`}
            onClick={() => setDots(d)}
            className="font-kura-mono"
          >
            {d}
          </Button>
        ))}
      </div>
    </div>
  );
}

export function AgentOrbStates() {
  const analyser = useAudioAnalyser({ simulate: "speech" });
  return (
    <div className="grid w-full grid-cols-5 gap-2">
      {states.map((s) => (
        <figure key={s} className="flex flex-col items-center gap-1">
          <AgentOrb state={s} analyser={analyser} announce={false} className="w-full max-w-32" />
          <figcaption className="text-kura-fg-subtle text-xs capitalize">{s}</figcaption>
        </figure>
      ))}
    </div>
  );
}

const script: Array<{ state: AgentOrbState; ms: number; caption: string }> = [
  { state: "listening", ms: 3200, caption: "Listening…" },
  { state: "thinking", ms: 2400, caption: "Checking your calendar…" },
  { state: "speaking", ms: 4200, caption: "You're free after 3pm on Thursday." },
];

export function AgentOrbVoiceSession() {
  const [step, setStep] = React.useState(0);
  const [muted, setMuted] = React.useState(false);
  const analyser = useAudioAnalyser({ simulate: "speech" });
  const current = script[step % script.length]!;
  React.useEffect(() => {
    const id = setTimeout(() => setStep((s) => s + 1), current.ms);
    return () => clearTimeout(id);
  }, [current]);
  const state: AgentOrbState = muted && current.state === "listening" ? "idle" : current.state;
  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-kura-xl bg-kura-surface p-6 shadow-kura-surface">
      <AgentOrb
        state={state}
        analyser={analyser}
        label={muted ? "Muted" : undefined}
        className="size-44"
      />
      <p className="flex h-10 items-center text-center text-[13px] text-kura-fg-muted" aria-hidden>
        {current.caption}
      </p>
      <div className="flex items-center gap-2">
        <IconButton
          label={muted ? "Unmute" : "Mute"}
          variant="secondary"
          size="lg"
          aria-pressed={muted}
          icon={muted ? <MicOff /> : <Mic />}
          onClick={() => setMuted((m) => !m)}
        />
        <IconButton label="End call" variant="secondary" size="lg" icon={<PhoneOff />} />
      </div>
    </div>
  );
}
