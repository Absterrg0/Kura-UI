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

export function VoiceDictationFull() {
  const [notes, setNotes] = React.useState<string[]>([]);
  const [status, setStatus] = React.useState<VoiceDictationStatus>("idle");
  const [mode, setMode] = React.useState<"toggle" | "hold">("toggle");
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex rounded-kura-md bg-kura-surface-sunken p-0.5 text-xs shadow-kura-xs">
          {(["toggle", "hold"] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
              className="cursor-pointer rounded-kura-sm px-2.5 py-1 text-kura-fg-muted capitalize outline-none transition-colors duration-(--kura-duration-fast) focus-visible:shadow-kura-focus aria-pressed:bg-kura-surface aria-pressed:text-kura-fg aria-pressed:shadow-kura-xs"
            >
              {m}
            </button>
          ))}
        </div>
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
        onTranscript={(text) => setNotes((n) => [text, ...n])}
      />
      <p className="text-kura-fg-subtle text-xs capitalize" aria-live="polite">
        Status: {status}
      </p>
      <ul aria-label="Dictated notes" className="flex flex-col gap-2">
        {notes.length === 0 && (
          <li className="rounded-kura-lg bg-kura-surface-sunken px-3.5 py-3 text-kura-fg-subtle text-sm">
            Dictated notes appear here.
          </li>
        )}
        {notes.map((note, i) => (
          <li
            key={`${i}-${note}`}
            className="animate-kura-rise-in rounded-kura-lg bg-kura-surface px-3.5 py-3 text-kura-fg text-sm leading-6 shadow-kura-sm"
          >
            {note}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function VoiceDictationInComposer() {
  const [value, setValue] = React.useState("");
  const [interim, setInterim] = React.useState("");
  return (
    <div className="w-full max-w-xl">
      <Composer value={value} onValueChange={setValue} onSubmit={() => setValue("")}>
        <ComposerInput placeholder={interim || "Type or dictate…"} />
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
