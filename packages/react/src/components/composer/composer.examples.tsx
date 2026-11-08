"use client";

import { ChartLine, Code, FileText, Globe, Lightbulb, Mail } from "lucide-react";
import * as React from "react";
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
      className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-kura-lg px-2.5 font-medium text-[13px] text-kura-fg-muted outline-none transition-[background-color,color,box-shadow] duration-(--kura-duration-fast) ease-kura-out hover:bg-kura-hover hover:text-kura-fg focus-visible:shadow-kura-focus aria-pressed:bg-kura-active aria-pressed:text-kura-fg [&_svg]:size-3.5"
    >
      {icon}
      {children}
    </button>
  );
}

export function ComposerFull() {
  const [value, setValue] = React.useState("");
  const [status, setStatus] = React.useState<ComposerStatus>("idle");
  const [model, setModel] = React.useState("sonnet");
  const [search, setSearch] = React.useState(true);
  const [think, setThink] = React.useState(false);
  const [last, setLast] = React.useState<ComposerMessage | null>(null);
  const timers = React.useRef<ReturnType<typeof setTimeout>[]>([]);

  const clear = React.useCallback(() => {
    for (const t of timers.current) clearTimeout(t);
    timers.current = [];
  }, []);
  React.useEffect(() => clear, [clear]);

  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <Composer
        value={value}
        onValueChange={setValue}
        status={status}
        maxLength={2000}
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
        <ComposerInput placeholder="Message Kura — paste or drop files" minRows={2} maxRows={10} />
        <ComposerToolbar>
          <ComposerTools>
            <ComposerAttachButton />
            <ModelPicker models={models} value={model} onValueChange={setModel} side="top" />
            <ToolToggle pressed={search} onPressedChange={setSearch} icon={<Globe />}>
              Search
            </ToolToggle>
            <ToolToggle pressed={think} onPressedChange={setThink} icon={<Lightbulb />}>
              Think
            </ToolToggle>
          </ComposerTools>
          <ComposerActions>
            <ComposerHint />
            <ComposerSubmit />
          </ComposerActions>
        </ComposerToolbar>
      </Composer>
      <p className="min-h-4 px-1 text-kura-fg-subtle text-xs" aria-live="polite">
        {status === "submitted"
          ? "Sending…"
          : status === "streaming"
            ? "Responding — press Esc to stop"
            : last
              ? `Sent “${last.text.slice(0, 48)}${last.text.length > 48 ? "…" : ""}”${
                  last.attachments.length ? ` with ${last.attachments.length} file(s)` : ""
                }`
              : "Enter to send · Shift+Enter for a new line"}
      </p>
    </div>
  );
}

export function ComposerStates() {
  return (
    <div className="flex w-full max-w-xl flex-col gap-4">
      <Composer defaultValue="Summarise the attached incident report" status="submitted">
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
      <Composer disabled placeholder="Upgrade to continue the conversation" />
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
        <h3 className="font-medium text-2xl text-kura-fg tracking-tight">
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
