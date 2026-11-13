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
import { ModelPicker, type ModelPickerModel } from "./model-picker";

const models: ModelPickerModel[] = [
  {
    id: "claude-opus-5-5",
    name: "Claude Opus 5.5",
    provider: "Anthropic",
    description: "Most capable. Long-horizon agentic work, deep research and hard code.",
    capabilities: ["vision", "tools", "reasoning", "files"],
    contextWindow: 1_000_000,
    speed: 1,
    cost: 3,
    badge: "New",
  },
  {
    id: "claude-sonnet-5-5",
    name: "Claude Sonnet 5.5",
    provider: "Anthropic",
    description: "The everyday default. Strong reasoning at a fraction of the latency.",
    capabilities: ["vision", "tools", "reasoning", "files"],
    contextWindow: 1_000_000,
    speed: 2,
    cost: 2,
  },
  {
    id: "claude-haiku-4-5",
    name: "Claude Haiku 4.5",
    provider: "Anthropic",
    description: "Fastest. Great for classification, extraction and sub-agents.",
    capabilities: ["vision", "tools"],
    contextWindow: 200_000,
    speed: 3,
    cost: 1,
  },
  {
    id: "gpt-5",
    name: "GPT-5",
    provider: "OpenAI",
    description: "General-purpose flagship with adjustable reasoning effort.",
    capabilities: ["vision", "tools", "reasoning", "web"],
    contextWindow: 400_000,
    speed: 2,
    cost: 2,
  },
  {
    id: "gpt-5-mini",
    name: "GPT-5 mini",
    provider: "OpenAI",
    description: "Smaller and cheaper, tuned for well-defined tasks.",
    capabilities: ["vision", "tools"],
    contextWindow: 400_000,
    speed: 3,
    cost: 1,
  },
  {
    id: "gemini-2-5-pro",
    name: "Gemini 2.5 Pro",
    provider: "Google",
    description: "Native audio and video understanding with a very long context.",
    capabilities: ["vision", "audio", "tools", "reasoning"],
    contextWindow: 1_000_000,
    speed: 2,
    cost: 2,
  },
  {
    id: "llama-4-maverick",
    name: "Llama 4 Maverick",
    provider: "Open weights",
    description: "Self-hostable mixture-of-experts model.",
    capabilities: ["vision"],
    contextWindow: 1_000_000,
    speed: 3,
    cost: 1,
  },
  {
    id: "mistral-large",
    name: "Mistral Large",
    provider: "Open weights",
    description: "Unavailable on the free plan.",
    capabilities: ["tools"],
    contextWindow: 128_000,
    speed: 2,
    cost: 2,
    badge: "Pro",
    disabled: true,
  },
];

export function ModelPickerMinimal() {
  return <ModelPicker models={models.slice(0, 3)} />;
}

export function ModelPickerFull() {
  const [model, setModel] = React.useState("claude-sonnet-5-5");
  const [open, setOpen] = React.useState(false);
  const current = models.find((m) => m.id === model);
  return (
    <div className="flex flex-col items-center gap-3">
      <ModelPicker
        models={models}
        value={model}
        onValueChange={(id) => setModel(id)}
        open={open}
        onOpenChange={setOpen}
        searchable
        size="md"
        side="bottom"
        align="center"
        placeholder="Choose a model"
        searchPlaceholder="Search by name, provider or capability…"
        emptyMessage="No models match"
        showDetails
      />
      <p className="text-kura-fg-subtle text-xs" aria-live="polite">
        Using <span className="font-kura-mono text-kura-fg-muted">{current?.id}</span>
      </p>
    </div>
  );
}

export function ModelPickerInComposer() {
  const [model, setModel] = React.useState("claude-opus-5-5");
  return (
    <div className="w-full max-w-xl">
      <Composer onSubmit={() => {}}>
        <ComposerInput placeholder="Plan a migration from REST to GraphQL…" />
        <ComposerToolbar>
          <ComposerTools>
            <ComposerAttachButton />
            <ModelPicker models={models} value={model} onValueChange={setModel} side="top" />
          </ComposerTools>
          <ComposerActions>
            <ComposerSubmit />
          </ComposerActions>
        </ComposerToolbar>
      </Composer>
    </div>
  );
}
