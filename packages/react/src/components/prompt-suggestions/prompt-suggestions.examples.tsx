"use client";

import { RefreshCw } from "lucide-react";
import * as React from "react";
import { Button } from "../button";
import {
  Composer,
  ComposerActions,
  ComposerAttachButton,
  ComposerInput,
  ComposerSubmit,
  ComposerToolbar,
  ComposerTools,
} from "../composer";
import { type PromptSuggestion, PromptSuggestions } from "./prompt-suggestions";

export function PromptSuggestionsMinimal() {
  return (
    <PromptSuggestions
      variant="chips"
      suggestions={[
        { title: "Fix the failing test" },
        { title: "Review my diff" },
        { title: "Update the changelog" },
        { title: "Explain this stack trace" },
      ]}
      onSelect={(prompt) => console.log(prompt)}
    />
  );
}

// What you would hand a coding agent: a task and where to do it. No icons; the words are enough.
const sets: PromptSuggestion[][] = [
  [
    {
      id: "tests",
      title: "Fix the failing test",
      description: "login.test.ts fails on expired sessions since the auth refactor",
    },
    {
      id: "migrate",
      title: "Migrate a call site",
      description: "Replace fetchUser() with the auth client in src/routes",
    },
    {
      id: "review",
      title: "Review my diff",
      description: "Look for missing error handling before I open the PR",
    },
    {
      id: "trace",
      title: "Explain a stack trace",
      description: "TypeError: cannot read properties of undefined (reading 'user')",
    },
  ],
  [
    {
      id: "deps",
      title: "Upgrade a dependency",
      description: "Move to React 19 and fix what breaks",
    },
    {
      id: "docs",
      title: "Write the README section",
      description: "Document the new session API with one example",
    },
    {
      id: "perf",
      title: "Find the slow query",
      description: "The account page takes two seconds to load",
    },
    {
      id: "cleanup",
      title: "Remove dead code",
      description: "Delete src/legacy once nothing imports it",
    },
  ],
];

export function PromptSuggestionsFull() {
  const [set, setSet] = React.useState(0);
  return (
    <div className="flex w-full max-w-xl flex-col items-end gap-2">
      <PromptSuggestions
        variant="cards"
        label="Try one of these"
        stagger={0.05}
        suggestions={sets[set] ?? []}
        onSelect={(prompt) => console.log(prompt)}
        className="w-full"
      />
      <Button variant="ghost" size="xs" onClick={() => setSet((s) => (s + 1) % sets.length)}>
        <RefreshCw />
        More ideas
      </Button>
    </div>
  );
}

const starters: PromptSuggestion[] = [
  { title: "Fix the failing test in login.test.ts" },
  { title: "Write tests for the billing service" },
  { title: "Review my diff before I open the PR" },
];

export function PromptSuggestionsEmptyChat() {
  const [value, setValue] = React.useState("");
  const input = React.useRef<HTMLTextAreaElement>(null);
  return (
    <div className="flex w-full max-w-xl flex-col gap-5">
      <p className="text-balance text-center font-semibold text-[19px] text-kura-fg tracking-[-0.022em]">
        What should we work on?
      </p>
      <Composer value={value} onValueChange={setValue} onSubmit={() => {}}>
        <ComposerInput ref={input} placeholder="Ask anything…" />
        <ComposerToolbar>
          <ComposerTools>
            <ComposerAttachButton />
          </ComposerTools>
          <ComposerActions>
            <ComposerSubmit />
          </ComposerActions>
        </ComposerToolbar>
      </Composer>
      <PromptSuggestions
        variant="list"
        className="px-2"
        suggestions={starters}
        onSelect={(prompt) => {
          setValue(prompt);
          input.current?.focus();
        }}
      />
    </div>
  );
}
