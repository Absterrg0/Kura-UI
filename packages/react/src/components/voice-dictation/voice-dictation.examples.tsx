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
import { VoiceDictation } from "./voice-dictation";

export function VoiceDictationMinimal() {
  const [value, setValue] = React.useState("");
  const [interim, setInterim] = React.useState("");
  return (
    <div className="w-full max-w-xl">
      <Composer value={value} onValueChange={setValue} onSubmit={() => setValue("")}>
        {/* Words land in the placeholder while you speak, and in the field when you stop. */}
        <ComposerInput placeholder={interim || "Type or dictate…"} />
        <ComposerToolbar>
          <ComposerTools>
            <ComposerAttachButton />
          </ComposerTools>
          <ComposerActions>
            <VoiceDictation
              simulate="Find three cafés near the office that open before seven."
              autoStart
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

interface Note {
  id: number;
  at: string;
  text: string;
}

export function VoiceDictationFull() {
  const [notes, setNotes] = React.useState<Note[]>([]);
  return (
    <div className="flex w-full max-w-md flex-col gap-5">
      <VoiceDictation
        simulate="Remind me to send Priya the revised contract after the design review tomorrow."
        autoStart
        mode="toggle"
        hotkey={["mod", "shift", "d"]}
        lang="en-US"
        showTranscript
        transcriptPlaceholder="Listening…"
        onTranscript={(text) =>
          setNotes((list) => [
            {
              id: Date.now(),
              at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              text,
            },
            ...list,
          ])
        }
      />
      {notes.length > 0 && (
        <ul aria-label="Dictated notes" className="flex flex-col gap-3 px-1">
          {notes.map((note) => (
            <li key={note.id} className="flex animate-kura-fade-in gap-3 text-[13px] leading-5">
              <span className="shrink-0 font-kura-mono text-[12px] text-kura-fg-subtle tabular-nums">
                {note.at}
              </span>
              <span className="text-kura-fg">{note.text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function VoiceDictationInComposer() {
  const [value, setValue] = React.useState("Summarise the incident timeline, then");
  return (
    <div className="w-full max-w-xl">
      <Composer value={value} onValueChange={setValue} onSubmit={() => setValue("")}>
        <ComposerInput placeholder="Hold the mic and speak…" />
        <ComposerToolbar>
          <ComposerTools>
            <ComposerAttachButton />
          </ComposerTools>
          <ComposerActions>
            {/* Push to talk: press and hold the mic (or Space on it); let go to append. */}
            <VoiceDictation
              simulate="draft a short note for the status page."
              mode="hold"
              showTranscript={false}
              hotkey={null}
              onTranscript={(text) => setValue((v) => (v ? `${v.trimEnd()} ${text}` : text))}
            />
            <ComposerSubmit />
          </ComposerActions>
        </ComposerToolbar>
      </Composer>
    </div>
  );
}
