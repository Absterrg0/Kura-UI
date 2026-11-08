"use client";

import * as React from "react";
import {
  Composer,
  ComposerActions,
  ComposerAttachButton,
  ComposerInput,
  ComposerSubmit,
  ComposerToolbar,
  ComposerTools,
} from "../composer";
import { KbdShortcut } from "../kbd-shortcut";
import { VoiceDictation, type VoiceDictationStatus } from "./voice-dictation";

export function VoiceDictationMinimal() {
  return (
    <div className="w-full max-w-md">
      <VoiceDictation simulate onTranscript={(text) => console.log(text)} />
    </div>
  );
}

const STATUS_LABEL: Record<VoiceDictationStatus, string> = {
  idle: "Ready",
  requesting: "Asking for the mic",
  listening: "Listening",
  processing: "Transcribing",
  denied: "Mic blocked",
  unsupported: "Unsupported",
  error: "Failed",
};

const clock = (d: Date) =>
  `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

export function VoiceDictationFull() {
  const [notes, setNotes] = React.useState<{ text: string; at: string }[]>([]);
  const [status, setStatus] = React.useState<VoiceDictationStatus>("idle");
  const [mode, setMode] = React.useState<"toggle" | "hold">("toggle");
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <fieldset className="flex rounded-kura-md bg-kura-surface-sunken p-0.5 text-xs shadow-[inset_0_0_0_1px_var(--kura-border-subtle)]">
          <legend className="sr-only">Dictation mode</legend>
          {(["toggle", "hold"] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
              className="cursor-pointer rounded-kura-sm px-2.5 py-1 text-kura-fg-muted outline-none transition-colors duration-(--kura-duration-fast) focus-visible:shadow-kura-focus aria-pressed:bg-kura-surface-raised aria-pressed:text-kura-fg aria-pressed:shadow-kura-xs"
            >
              {m === "toggle" ? "Click to talk" : "Hold to talk"}
            </button>
          ))}
        </fieldset>
        <KbdShortcut keys={["mod", "shift", "d"]} label={mode === "hold" ? "Hold" : "Toggle"} />
      </div>
      <VoiceDictation
        simulate="Remind me to send Priya the revised contract after the design review tomorrow."
        mode={mode}
        hotkey={["mod", "shift", "d"]}
        lang="en-US"
        showTranscript
        transcriptPlaceholder="Speak — your words appear here"
        onStatusChange={setStatus}
        onTranscript={(text) => setNotes((n) => [{ text, at: clock(new Date()) }, ...n])}
      />
      <section aria-label="Dictated notes" className="flex flex-col">
        <div className="flex items-baseline justify-between border-kura-border border-b pb-2 font-kura-mono text-[10px] text-kura-fg-subtle uppercase tracking-[0.14em]">
          <span>Notes to self · {notes.length}</span>
          <span aria-live="polite">{STATUS_LABEL[status]}</span>
        </div>
        {notes.length === 0 ? (
          <p className="py-5 font-kura-display text-[18px] text-kura-fg-muted">
            Nothing dictated yet.
          </p>
        ) : (
          <ul className="flex flex-col">
            {notes.map((note, i) => (
              <li
                key={`${i}-${note.text}`}
                className="flex animate-kura-rise-in gap-4 border-kura-border-subtle border-b py-3 text-kura-fg text-sm leading-6"
              >
                <span className="pt-0.5 font-kura-mono text-[11px] text-kura-fg-subtle tabular-nums">
                  {note.at}
                </span>
                <span className="min-w-0 flex-1">{note.text}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export function VoiceDictationInComposer() {
  const [value, setValue] = React.useState("");
  const [interim, setInterim] = React.useState("");
  return (
    <div className="w-full max-w-xl">
      <Composer value={value} onValueChange={setValue} onSubmit={() => setValue("")}>
        <ComposerInput placeholder={interim || "Ask about your calendar, or dictate…"} />
        <ComposerToolbar>
          <ComposerTools>
            <ComposerAttachButton />
          </ComposerTools>
          <ComposerActions>
            <VoiceDictation
              simulate="Find three cafés near the office that open before seven."
              showTranscript={false}
              hotkey={null}
              onInterim={setInterim}
              onStatusChange={(s) => s === "idle" && setInterim("")}
              onTranscript={(text) => setValue((v) => (v ? `${v.trimEnd()} ${text}` : text))}
            />
            <ComposerSubmit />
          </ComposerActions>
        </ComposerToolbar>
      </Composer>
    </div>
  );
}
