"use client";

import {
  BookOpen,
  Bug,
  Calendar,
  ChartLine,
  FlaskConical,
  Mail,
  Plane,
  RefreshCw,
  Scale,
  Telescope,
} from "lucide-react";
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
        { title: "Summarize a PDF" },
        { title: "Write a SQL query" },
        { title: "Plan a sprint" },
        { title: "Explain a regex" },
      ]}
      onSelect={(prompt) => console.log(prompt)}
    />
  );
}

const sets: PromptSuggestion[][] = [
  [
    {
      id: "trip",
      title: "Plan a trip",
      description: "Four slow days in Kyoto in early April",
      icon: <Plane />,
    },
    {
      id: "metrics",
      title: "Analyze metrics",
      description: "Why did weekly actives dip after the release?",
      icon: <ChartLine />,
    },
    {
      id: "email",
      title: "Draft an email",
      description: "Decline a meeting without closing the door",
      icon: <Mail />,
    },
    {
      id: "bug",
      title: "Debug a crash",
      description: "TypeError: cannot read properties of undefined",
      icon: <Bug />,
    },
  ],
  [
    {
      id: "learn",
      title: "Teach me",
      description: "How transformers attend, with a tiny example",
      icon: <BookOpen />,
    },
    {
      id: "compare",
      title: "Compare options",
      description: "Postgres vs. SQLite for a local-first app",
      icon: <Scale />,
    },
    {
      id: "research",
      title: "Research",
      description: "What changed in the EU AI Act this year",
      icon: <Telescope />,
    },
    {
      id: "week",
      title: "Plan my week",
      description: "Fit deep work around six meetings",
      icon: <Calendar />,
    },
  ],
];

export function PromptSuggestionsFull() {
  const [set, setSet] = React.useState(0);
  const [picked, setPicked] = React.useState<string | null>(null);
  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <PromptSuggestions
        variant="cards"
        label="Try one of these"
        stagger={0.05}
        suggestions={sets[set] ?? []}
        onSelect={(prompt) => setPicked(prompt)}
      />
      <div className="flex items-center justify-between gap-3 px-1">
        <p className="min-w-0 truncate text-kura-fg-subtle text-xs" aria-live="polite">
          {picked ? `Prompt: ${picked}` : "Pick a card"}
        </p>
        <Button variant="ghost" size="xs" onClick={() => setSet((s) => (s + 1) % sets.length)}>
          <RefreshCw />
          More ideas
        </Button>
      </div>
    </div>
  );
}

const starters: PromptSuggestion[] = [
  { title: "Summarize this week's customer feedback", icon: <ChartLine /> },
  { title: "Write tests for the billing service", icon: <FlaskConical /> },
  { title: "Draft a launch announcement", icon: <Mail /> },
];

export function PromptSuggestionsEmptyChat() {
  const [value, setValue] = React.useState("");
  const input = React.useRef<HTMLTextAreaElement>(null);
  return (
    <div className="flex w-full max-w-xl flex-col gap-5">
      <p className="text-balance text-center font-medium text-2xl text-kura-fg tracking-tight">
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
        suggestions={starters}
        onSelect={(prompt) => {
          setValue(prompt);
          input.current?.focus();
        }}
      />
    </div>
  );
}
