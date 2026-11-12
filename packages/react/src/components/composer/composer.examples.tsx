"use client";

import { ChartLine, Code, FileText, Globe, Lightbulb, Mail } from "lucide-react";
import * as React from "react";
import type { AttachmentItem } from "../attachment";
import { KbdShortcut } from "../kbd-shortcut";
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
      <Composer placeholder="Ask anything…" onSubmit={(m) => console.log(m.text)} />
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
  icon,
  children,
}: {
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={() => onPressedChange(!pressed)}
      className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-kura-lg px-2.5 font-medium text-[13px] text-kura-fg-muted outline-hidden transition-[background-color,color,box-shadow] duration-(--kura-duration-fast) ease-kura-out hover:bg-kura-hover hover:text-kura-fg focus-visible:shadow-kura-focus aria-pressed:bg-kura-active aria-pressed:text-kura-fg aria-pressed:shadow-[inset_0_0_0_1px_var(--kura-border-subtle)] [&_svg]:size-3.5"
    >
      {icon}
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
  const [last, setLast] = React.useState<ComposerMessage | null>(null);
  const timers = React.useRef<ReturnType<typeof setTimeout>[]>([]);

  const clear = React.useCallback(() => {
    for (const t of timers.current) clearTimeout(t);
    timers.current = [];
  }, []);
  React.useEffect(() => clear, [clear]);

  return (
    <div className="flex w-full max-w-xl flex-col gap-2.5">
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
        onSubmit={(message) => {
          setLast(message);
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
            <span aria-hidden className="mx-0.5 h-4 w-px bg-kura-border" />
            <ToolToggle pressed={think} onPressedChange={setThink} icon={<Lightbulb />}>
              Think
            </ToolToggle>
            <ToolToggle pressed={search} onPressedChange={setSearch} icon={<Globe />}>
              Search
            </ToolToggle>
          </ComposerTools>
          <ComposerActions>
            <ComposerHint showAt={0.8} />
            <ComposerSubmit />
          </ComposerActions>
        </ComposerToolbar>
      </Composer>
      <div className="flex min-h-5 items-center justify-between gap-3 px-1.5">
        <p className="truncate text-kura-fg-subtle text-xs" aria-live="polite">
          {status === "submitted"
            ? "Sending…"
            : status === "streaming"
              ? "Responding · Esc to stop"
              : last
                ? `Sent with ${last.attachments.length} ${last.attachments.length === 1 ? "file" : "files"}`
                : "Kura reads attachments in full; tables over 50k rows are sampled."}
        </p>
        <div className="hidden shrink-0 items-center gap-3 sm:flex">
          <KbdShortcut keys={["enter"]} label="Send" variant="ghost" />
          <KbdShortcut keys={["shift", "enter"]} label="New line" variant="ghost" />
        </div>
      </div>
    </div>
  );
}

function StateLabel({ children }: { children: React.ReactNode }) {
  return <p className="px-1.5 pb-1.5 font-medium text-kura-fg-subtle text-xs">{children}</p>;
}

export function ComposerStates() {
  return (
    <div className="flex w-full max-w-xl flex-col gap-5">
      <div>
        <StateLabel>Submitted — waiting for the first token</StateLabel>
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
        <StateLabel>Streaming, close to the character limit</StateLabel>
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
    icon: <ChartLine />,
  },
  {
    title: "Summarize a doc",
    prompt: "Summarize this doc in five bullets for an exec audience.",
    icon: <FileText />,
  },
  {
    title: "Review a diff",
    prompt: "Review this diff for bugs and missing tests.",
    icon: <Code />,
  },
  {
    title: "Draft a reply",
    prompt: "Draft a friendly reply that moves the meeting to next week.",
    icon: <Mail />,
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
      <div className="flex flex-col items-center gap-1 text-center">
        <h3 className="font-medium text-2xl text-kura-fg tracking-[-0.02em]">
          What are we working on?
        </h3>
        <p className="text-kura-fg-muted text-sm">
          Start typing, dictate, or pick a starting point.
        </p>
      </div>
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
