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
  {
    id: "summarize",
    label: "Summarize",
    description: "Condense text into key points",
    icon: <AlignLeft />,
    insert: "Summarize the following:\n",
  },
  {
    id: "rewrite",
    label: "Rewrite",
    description: "Change tone, length or clarity",
    icon: <PenLine />,
    insert: "Rewrite this to be clearer:\n",
  },
  {
    id: "debug",
    label: "Debug",
    description: "Find the cause of an error",
    icon: <Bug />,
    insert: "Here is an error. Find the root cause:\n",
  },
  {
    id: "plan",
    label: "Plan",
    description: "Break a goal into steps first",
    icon: <ListTodo />,
    insert: "Before doing anything, write a step-by-step plan for: ",
  },
];

export function SlashCommandMenuMinimal() {
  const ref = React.useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = React.useState("/");
  return (
    // Room above the composer for the menu, which opens upward from the caret.
    <div className="w-full max-w-xl pt-60">
      <Composer value={value} onValueChange={setValue} onSubmit={() => setValue("")}>
        <ComposerInput ref={ref} placeholder="Ask anything, or type / for commands" />
        <ComposerToolbar>
          <ComposerTools>
            <ComposerAttachButton />
          </ComposerTools>
          <ComposerActions>
            <ComposerSubmit />
          </ComposerActions>
        </ComposerToolbar>
      </Composer>
      {/* defaultOpen: the draft already ends in "/", so the menu starts open. */}
      <SlashCommandMenu textareaRef={ref} commands={basic} side="top" defaultOpen />
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
  const [log, setLog] = React.useState("");
  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      {/* Any textarea works: here a plain well. */}
      <textarea
        ref={ref}
        aria-label="Prompt"
        value={value}
        onChange={(e) => setValue(e.currentTarget.value)}
        placeholder="Write a message… try /sum or /debug"
        rows={4}
        className="w-full resize-none rounded-kura-lg bg-kura-surface-sunken px-3.5 py-3 text-[14px] text-kura-fg leading-6 shadow-kura-sunk outline-hidden placeholder:text-kura-fg-subtle focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-kura-ring focus-visible:outline-offset-2"
      />
      <SlashCommandMenu
        textareaRef={ref}
        commands={commands}
        trigger="/"
        side="auto"
        emptyMessage="No matching command"
        onSelect={(command, { query }) => {
          if (command.id === "clear") setValue("");
          setLog(`Ran /${command.label}${query ? ` (typed “/${query}”)` : ""}`);
        }}
      />
      <p className="min-h-4 px-1 text-kura-fg-subtle text-xs" aria-live="polite">
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
        <ComposerInput ref={ref} placeholder="Ask anything, or type / for commands" />
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
      <div className="flex gap-3 px-1">
        <KbdShortcut keys={["/"]} label="Commands" variant="ghost" />
        <KbdShortcut keys={["enter"]} label="Send" variant="ghost" />
      </div>
    </div>
  );
}
