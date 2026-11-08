"use client";

import {
  AlignLeft,
  Bug,
  Code,
  Eraser,
  Globe,
  Languages,
  ListTodo,
  MessageSquarePlus,
  PenLine,
  TestTube,
} from "lucide-react";
import * as React from "react";
import {
  Composer,
  ComposerActions,
  ComposerAttachButton,
  ComposerHint,
  ComposerInput,
  ComposerSubmit,
  ComposerToolbar,
  ComposerTools,
} from "../composer";
import { KbdShortcut } from "../kbd-shortcut";
import { type SlashCommand, SlashCommandMenu } from "./slash-command-menu";

const basic: SlashCommand[] = [
  { id: "summarize", label: "Summarize", insert: "Summarize the following:\n" },
  { id: "translate", label: "Translate", insert: "Translate into " },
  { id: "explain", label: "Explain", insert: "Explain like I'm new to this: " },
];

export function SlashCommandMenuMinimal() {
  const ref = React.useRef<HTMLTextAreaElement>(null);
  return (
    <div className="w-full max-w-md">
      <textarea
        ref={ref}
        aria-label="Prompt"
        placeholder="Type / for commands"
        rows={3}
        className="w-full resize-none rounded-kura-md bg-kura-surface-sunken px-3.5 py-3 text-sm leading-6 shadow-[inset_0_0_0_1px_var(--kura-border-subtle)] outline-none placeholder:text-kura-fg-subtle focus-visible:shadow-kura-focus"
      />
      <SlashCommandMenu textareaRef={ref} commands={basic} />
    </div>
  );
}

const commands: SlashCommand[] = [
  {
    id: "summarize",
    label: "Summarize",
    description: "Condense text into key points",
    icon: <AlignLeft />,
    group: "Write",
    keywords: ["tldr", "shorten"],
    insert: "Summarize the following in 5 bullet points:\n",
  },
  {
    id: "rewrite",
    label: "Rewrite",
    description: "Change tone, length or clarity",
    icon: <PenLine />,
    group: "Write",
    insert: "Rewrite this to be clearer and more concise:\n",
  },
  {
    id: "translate",
    label: "Translate",
    description: "Into any language",
    icon: <Languages />,
    group: "Write",
    insert: "Translate into ",
  },
  {
    id: "explain",
    label: "Explain code",
    description: "Walk through what a snippet does",
    icon: <Code />,
    group: "Code",
    insert: "Explain this code step by step:\n```\n\n```",
  },
  {
    id: "debug",
    label: "Debug",
    description: "Find the cause of an error",
    icon: <Bug />,
    group: "Code",
    keywords: ["fix", "error", "stack trace"],
    insert: "Here is an error. Find the root cause:\n",
  },
  {
    id: "tests",
    label: "Write tests",
    description: "Unit tests for the selected function",
    icon: <TestTube />,
    group: "Code",
    insert: "Write Vitest unit tests for:\n",
  },
  {
    id: "plan",
    label: "Plan",
    description: "Break a goal into steps first",
    icon: <ListTodo />,
    group: "Agent",
    insert: "Before doing anything, write a step-by-step plan for: ",
  },
  {
    id: "search",
    label: "Search the web",
    description: "Ground the answer in fresh sources",
    icon: <Globe />,
    group: "Agent",
    disabled: true,
  },
  {
    id: "new",
    label: "New chat",
    icon: <MessageSquarePlus />,
    group: "Session",
    shortcut: ["mod", "shift", "o"],
  },
  { id: "clear", label: "Clear input", icon: <Eraser />, group: "Session" },
];

export function SlashCommandMenuFull() {
  const ref = React.useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = React.useState("");
  const [log, setLog] = React.useState("Type / at the start of a line");
  const id = React.useId();
  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      <label
        htmlFor={id}
        className="px-1 font-kura-mono text-[10px] text-kura-fg-subtle uppercase tracking-[0.14em]"
      >
        Instructions for the triage agent
      </label>
      <textarea
        id={id}
        ref={ref}
        value={value}
        onChange={(e) => setValue(e.currentTarget.value)}
        placeholder="Write instructions… try /sum or /debug"
        rows={4}
        className="w-full resize-none rounded-kura-md bg-kura-surface-sunken px-3.5 py-3 text-sm leading-6 shadow-[inset_0_0_0_1px_var(--kura-border-subtle)] outline-none placeholder:text-kura-fg-subtle focus-visible:shadow-kura-focus"
      />
      <SlashCommandMenu
        textareaRef={ref}
        commands={commands}
        trigger="/"
        side="auto"
        emptyMessage="No matching command"
        onOpenChange={(open) => setLog(open ? "Menu open" : "Menu closed")}
        onSelect={(command, { query }) => {
          if (command.id === "clear") setValue("");
          setLog(`Ran /${command.label}${query ? ` (typed “/${query}”)` : ""}`);
        }}
      />
      <p className="px-1 font-kura-mono text-[11px] text-kura-fg-subtle" aria-live="polite">
        {log}
      </p>
    </div>
  );
}

export function SlashCommandMenuInComposer() {
  const ref = React.useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = React.useState("");
  return (
    <div className="flex w-full max-w-xl flex-col gap-2">
      <Composer value={value} onValueChange={setValue} onSubmit={() => {}}>
        <ComposerInput ref={ref} placeholder="Ask about the release, or type / for commands" />
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
      <SlashCommandMenu
        textareaRef={ref}
        commands={commands}
        side="top"
        onSelect={(command) => {
          if (command.id === "clear") setValue("");
        }}
      />
      <div className="flex gap-4 px-1 text-kura-fg-subtle">
        <KbdShortcut keys={["/"]} label="Commands" variant="ghost" />
        <KbdShortcut keys={["enter"]} label="Send" variant="ghost" />
      </div>
    </div>
  );
}
