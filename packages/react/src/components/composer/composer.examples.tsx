"use client";

import { ChartLine, Code, FileText, Globe, Lightbulb, Mail } from "lucide-react";
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
      className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-kura-md px-2.5 font-medium text-[13px] text-kura-fg-muted outline-none transition-[background-color,color,box-shadow] duration-(--kura-duration-fast) ease-kura-out hover:bg-kura-hover hover:text-kura-fg focus-visible:shadow-kura-focus aria-pressed:bg-kura-surface aria-pressed:text-kura-fg aria-pressed:shadow-[inset_0_0_0_1px_var(--kura-border)] [&_svg]:size-3.5 [&_svg]:stroke-[1.75]"
    >
      {icon}
      {children}
    </button>
  );
}

/** A hairline between toolbar groups. */
function Rule() {
  return <span aria-hidden className="mx-1 h-4 w-px shrink-0 bg-kura-border" />;
}

const brief: AttachmentItem[] = [
  { id: "csv", name: "q3-churn-by-plan.csv", type: "text/csv", size: 1_840_000 },
  {
    id: "memo",
    name: "pricing-memo-aug.pdf",
    type: "application/pdf",
    size: 412_000,
    status: "uploading",
    progress: 0.35,
  },
];

export function ComposerFull() {
  const [value, setValue] = React.useState(
    "Compare churn by plan in the CSV with the August pricing change in the memo. Flag any plan that moved more than two points.",
  );
  const [attachments, setAttachments] = React.useState<AttachmentItem[]>(brief);
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

  // Simulate the memo finishing its upload.
  const uploading = attachments.some((a) => a.status === "uploading");
  React.useEffect(() => {
    if (!uploading) return;
    const id = setInterval(() => {
      setAttachments((list) =>
        list.map((a) => {
          if (a.status !== "uploading") return a;
          const progress = (a.progress ?? 0) + 0.16;
          return progress >= 1
            ? { ...a, status: "ready", progress: undefined }
            : { ...a, progress };
        }),
      );
    }, 420);
    return () => clearInterval(id);
  }, [uploading]);

  const busy = status === "submitted" || status === "streaming";

  return (
    <div className="flex w-full max-w-xl flex-col gap-2.5">
      <Composer
        value={value}
        onValueChange={setValue}
        attachments={attachments}
        onAttachmentsChange={setAttachments}
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
        <ComposerInput
          placeholder="Ask about these files, or drop in more"
          minRows={2}
          maxRows={10}
        />
        <ComposerToolbar>
          <ComposerTools>
            <ComposerAttachButton />
            <ModelPicker models={models} value={model} onValueChange={setModel} side="top" />
            <Rule />
            <ToolToggle pressed={search} onPressedChange={setSearch} icon={<Globe />}>
              Search
            </ToolToggle>
            <ToolToggle pressed={think} onPressedChange={setThink} icon={<Lightbulb />}>
              Think
            </ToolToggle>
          </ComposerTools>
          <ComposerActions>
            <ComposerHint showAt={0.5} />
            <ComposerSubmit />
          </ComposerActions>
        </ComposerToolbar>
      </Composer>
      <div className="flex min-h-4 items-center justify-between gap-4 px-1 font-kura-mono text-[10px] text-kura-fg-subtle uppercase tracking-[0.12em]">
        <p className="flex min-w-0 items-center gap-2" aria-live="polite">
          {busy && (
            <span
              aria-hidden
              className="size-1.5 shrink-0 animate-kura-pulse rounded-full bg-kura-accent motion-reduce:animate-none"
            />
          )}
          <span className="truncate">
            {status === "submitted"
              ? "Sent · waiting for Sonnet"
              : status === "streaming"
                ? "Writing — Esc to stop"
                : last
                  ? `Sent${last.attachments.length ? ` with ${last.attachments.length} ${last.attachments.length === 1 ? "file" : "files"}` : ""} · answered`
                  : uploading
                    ? "Uploading pricing-memo-aug.pdf…"
                    : "Ready"}
          </span>
        </p>
        <p className="hidden shrink-0 sm:block">Enter send · Shift+Enter new line</p>
      </div>
    </div>
  );
}

function StateLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-1 pb-1.5 font-kura-mono text-[10px] text-kura-fg-subtle uppercase tracking-[0.14em]">
      {children}
    </p>
  );
}

export function ComposerStates() {
  return (
    <div className="flex w-full max-w-xl flex-col gap-5">
      <div>
        <StateLabel>Submitted · waiting for the first token</StateLabel>
        <Composer
          defaultValue="Summarise the attached incident report for the on-call channel"
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
        <StateLabel>Streaming · over the limit</StateLabel>
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
        <Composer disabled placeholder="This thread is read-only — start a new one to continue" />
      </div>
    </div>
  );
}

/** A short vermilion brush stroke under a heading, as on a seal-marked page. */
function BrushRule() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 120 8"
      className="-mt-1 h-2 w-24 text-kura-shu"
      preserveAspectRatio="none"
    >
      <path
        d="M2 5.2C14 3.6 30 2.8 52 2.9c22 .1 40 .9 58 1.6 3 .1 6.5.6 8 1.5-1.6.8-5 .9-8 .8-19-.4-37-.7-58-.6-20 .1-35 .5-47 1.1-1.8.1-3.4-.5-3-1.5Z"
        fill="currentColor"
      />
    </svg>
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
    <div className="flex w-full max-w-xl flex-col items-center gap-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="font-kura-mono text-[10px] text-kura-fg-subtle uppercase tracking-[0.14em]">
          New thread · Opus 5.5
        </p>
        <h3 className="text-balance font-kura-display text-[34px] text-kura-fg leading-[1.05] tracking-[-0.01em]">
          What are we working on?
        </h3>
        <BrushRule />
        <p className="text-kura-fg-muted text-sm">Type, dictate, or begin from one of these.</p>
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
