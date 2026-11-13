"use client";

import * as React from "react";
import type { AttachmentItem } from "../attachment";
import { ModelPicker, type ModelPickerModel } from "../model-picker";
import { type PromptSuggestion, PromptSuggestions } from "../prompt-suggestions";
import { VoiceDictation } from "../voice-dictation";
import {
  Composer,
  ComposerActions,
  ComposerAttachButton,
  ComposerAttachments,
  ComposerHint,
  ComposerInput,
  type ComposerMessage,
  type ComposerStatus,
  ComposerSubmit,
  ComposerToolbar,
  ComposerTools,
} from "./composer";

export function ComposerMinimal() {
  return (
    <div className="w-full max-w-xl">
      <Composer
        defaultValue="Why does the like button lag on slow networks?"
        placeholder="Ask anything…"
        onSubmit={(m) => console.log(m.text)}
      />
    </div>
  );
}

const models: ModelPickerModel[] = [
  {
    id: "opus",
    name: "Claude Opus 5.5",
    provider: "Anthropic",
    description: "Most capable for complex, multi-step work.",
    capabilities: ["vision", "tools", "reasoning"],
    contextWindow: 1_000_000,
    speed: 1,
    cost: 3,
  },
  {
    id: "sonnet",
    name: "Claude Sonnet 5.5",
    provider: "Anthropic",
    description: "Balanced speed and intelligence.",
    capabilities: ["vision", "tools", "reasoning"],
    contextWindow: 1_000_000,
    speed: 2,
    cost: 2,
  },
  {
    id: "haiku",
    name: "Claude Haiku 4.5",
    provider: "Anthropic",
    description: "Fastest, for quick answers.",
    capabilities: ["vision", "tools"],
    contextWindow: 200_000,
    speed: 3,
    cost: 1,
  },
];

function ToolToggle({
  pressed,
  onPressedChange,
  children,
}: {
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={() => onPressedChange(!pressed)}
      // Off it is bare text; on it is a raised key, like a pressed segment.
      className="inline-flex h-8 cursor-pointer items-center rounded-[9px] px-2.5 font-medium text-[13px] text-kura-fg-muted outline-hidden transition-[background-color,color,box-shadow] duration-(--kura-duration-fast) ease-kura-snap hover:bg-kura-hover hover:text-kura-fg focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-kura-ring aria-pressed:bg-kura-raised aria-pressed:text-kura-fg aria-pressed:shadow-kura-raised"
    >
      {children}
    </button>
  );
}

const boardFiles: AttachmentItem[] = [
  { id: "deck", name: "q3-board-deck.pdf", type: "application/pdf", size: 4_820_000 },
  { id: "cohorts", name: "churn-by-cohort.csv", type: "text/csv", size: 312_000 },
];

export function ComposerFull() {
  const [value, setValue] = React.useState(
    "Check the churn figures on slide 7 against the cohort CSV and flag anything that doesn’t reconcile.",
  );
  const [status, setStatus] = React.useState<ComposerStatus>("idle");
  const [model, setModel] = React.useState("sonnet");
  const [search, setSearch] = React.useState(false);
  const [think, setThink] = React.useState(true);
  const timers = React.useRef<ReturnType<typeof setTimeout>[]>([]);

  const clear = React.useCallback(() => {
    for (const t of timers.current) clearTimeout(t);
    timers.current = [];
  }, []);
  React.useEffect(() => clear, [clear]);

  return (
    <div className="w-full max-w-xl">
      <Composer
        value={value}
        onValueChange={setValue}
        defaultAttachments={boardFiles}
        status={status}
        maxLength={4000}
        accept="image/*,.pdf,.csv,.md,.txt,.ts,.tsx"
        maxFiles={6}
        maxFileSize={20 * 1024 * 1024}
        submitKey="enter"
        clearOnSubmit
        onSubmit={(message: ComposerMessage) => {
          console.log(message.text, message.attachments);
          setStatus("submitted");
          timers.current.push(setTimeout(() => setStatus("streaming"), 1200));
          timers.current.push(setTimeout(() => setStatus("idle"), 4200));
        }}
        onStop={() => {
          clear();
          setStatus("idle");
        }}
      >
        <ComposerAttachments max={4} />
        <ComposerInput
          placeholder="Ask about these files, or drop more…"
          minRows={2}
          maxRows={10}
        />
        <ComposerToolbar>
          <ComposerTools>
            <ComposerAttachButton />
            <ModelPicker models={models} value={model} onValueChange={setModel} side="top" />
            <ToolToggle pressed={think} onPressedChange={setThink}>
              Think
            </ToolToggle>
            <ToolToggle pressed={search} onPressedChange={setSearch}>
              Search
            </ToolToggle>
          </ComposerTools>
          <ComposerActions>
            <ComposerHint showAt={0.8} />
            <ComposerSubmit />
          </ComposerActions>
        </ComposerToolbar>
      </Composer>
    </div>
  );
}

function StateLabel({ children }: { children: React.ReactNode }) {
  return <p className="px-4 pb-2 text-[12.5px] text-kura-fg-subtle">{children}</p>;
}

export function ComposerStates() {
  return (
    <div className="flex w-full max-w-xl flex-col gap-5">
      <div>
        <StateLabel>Waiting for the first token</StateLabel>
        <Composer
          defaultValue="Summarize the attached incident report for the #eng-oncall channel."
          status="submitted"
        >
          <ComposerInput />
          <ComposerToolbar>
            <ComposerTools>
              <ComposerAttachButton />
            </ComposerTools>
            <ComposerActions>
              <ComposerSubmit />
            </ComposerActions>
          </ComposerToolbar>
        </Composer>
      </div>
      <div>
        <StateLabel>Streaming, near the limit</StateLabel>
        <Composer
          defaultValue="Draft release notes for v2.4 — keep it under 200 words and lead with the breaking change to the auth middleware."
          status="streaming"
          maxLength={120}
        >
          <ComposerInput />
          <ComposerToolbar>
            <ComposerTools>
              <ComposerAttachButton />
            </ComposerTools>
            <ComposerActions>
              <ComposerHint />
              <ComposerSubmit />
            </ComposerActions>
          </ComposerToolbar>
        </Composer>
      </div>
      <div>
        <StateLabel>Over the limit</StateLabel>
        <Composer
          defaultValue="Draft release notes for v2.4 — keep it under 200 words, lead with the breaking change to the auth middleware, and thank the contributors."
          maxLength={120}
        >
          <ComposerInput />
          <ComposerToolbar>
            <ComposerTools>
              <ComposerAttachButton />
            </ComposerTools>
            <ComposerActions>
              <ComposerHint />
              <ComposerSubmit />
            </ComposerActions>
          </ComposerToolbar>
        </Composer>
      </div>
      <div>
        <StateLabel>Disabled</StateLabel>
        <Composer
          disabled
          placeholder="You’ve reached this week’s Opus limit. Resets Monday at 09:00."
        />
      </div>
    </div>
  );
}

const starters: PromptSuggestion[] = [
  {
    title: "Analyze a CSV",
    prompt: "Find the three biggest drivers of churn in the attached CSV.",
  },
  {
    title: "Summarize a doc",
    prompt: "Summarize this doc in five bullets for an exec audience.",
  },
  {
    title: "Review a diff",
    prompt: "Review this diff for bugs and missing tests.",
  },
  {
    title: "Draft a reply",
    prompt: "Draft a friendly reply that moves the meeting to next week.",
  },
];

export function ComposerNewChat() {
  const [value, setValue] = React.useState("");
  const [interim, setInterim] = React.useState("");
  const [model, setModel] = React.useState("opus");
  const [status, setStatus] = React.useState<ComposerStatus>("idle");
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const timer = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  React.useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-5">
      <h3 className="text-center font-semibold text-[19px] text-kura-fg tracking-[-0.022em]">
        What are we working on?
      </h3>
      <Composer
        value={value}
        onValueChange={setValue}
        status={status}
        accept="image/*,.pdf,.csv,.md,.txt"
        className="w-full"
        onSubmit={() => {
          setStatus("submitted");
          timer.current = setTimeout(() => setStatus("idle"), 1400);
        }}
        onStop={() => {
          clearTimeout(timer.current);
          setStatus("idle");
        }}
      >
        <ComposerAttachments />
        <ComposerInput ref={inputRef} placeholder={interim || "Message Kura…"} minRows={2} />
        <ComposerToolbar>
          <ComposerTools>
            <ComposerAttachButton />
            <ModelPicker models={models} value={model} onValueChange={setModel} side="top" />
          </ComposerTools>
          <ComposerActions>
            <VoiceDictation
              simulate="Compare our Q3 pricing page with the two closest competitors."
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
      <PromptSuggestions
        variant="chips"
        label="Starting points"
        suggestions={starters}
        disabled={status !== "idle"}
        onSelect={(prompt) => {
          setValue(prompt);
          inputRef.current?.focus();
        }}
        className="justify-center"
      />
    </div>
  );
}
