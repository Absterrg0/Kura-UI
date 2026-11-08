import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { CatalogCategory } from "./catalog-types";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
export const REACT_DIR = join(ROOT, "packages/react");
export const SRC = join(REACT_DIR, "src");
export const COMPONENTS_DIR = join(SRC, "components");
export const DOCS_DIR = join(ROOT, "apps/docs");
export const DOCS_PUBLIC = join(DOCS_DIR, "public");
export const DOCS_GENERATED = join(DOCS_DIR, "src/generated");

/** Public docs/registry origin. Override with KURA_SITE_URL when deploying elsewhere. */
export const SITE_URL = (process.env.KURA_SITE_URL ?? "https://kuro.abstergo.fyi").replace(
  /\/$/,
  "",
);
export const NPM_PACKAGE = "@kura-ui/react";

/** Slugs that would collide with package.json export keys or docs routes. */
export const RESERVED_SLUGS = [
  "utils",
  "hooks",
  "styles.css",
  "package.json",
  "index",
  "lib",
  "styles",
];

/** npm packages that are always present (peer deps) and never listed as dependencies. */
export const IMPLICIT_PACKAGES = ["react", "react-dom"];

export const CATEGORIES: CatalogCategory[] = [
  {
    id: "agent",
    title: "Agent",
    description: "Runs, plans, fleets of subagents, traces, approvals, checkpoints and queues.",
  },
  {
    id: "workspace",
    title: "Workspace",
    description: "The terminal, diffs, files and browser an agent works in, made reviewable.",
  },
  {
    id: "conversation",
    title: "Conversation",
    description: "Messages, reasoning, streaming output, code, citations and artifacts.",
  },
  {
    id: "input",
    title: "Input",
    description: "The composer and the pickers and menus around it.",
  },
  {
    id: "voice",
    title: "Voice",
    description: "Dictation, audio visualisation and voice-agent state.",
  },
  { id: "feedback", title: "Feedback", description: "Thinking and working indicators." },
  {
    id: "primitives",
    title: "Primitives",
    description:
      "Internal building blocks the other components are made from. Not listed in the docs.",
  },
];

/**
 * Components planned for Kura (being built in parallel). `related` may reference these before
 * they exist without a warning. Remove nothing from here; add new plans freely.
 */
export const PLANNED_SLUGS = [
  "composer",
  "voice-dictation",
  "audio-waveform",
  "model-picker",
  "slash-command-menu",
  "attachment",
  "prompt-suggestions",
  "command-palette",
  "message",
  "streaming-text",
  "reasoning",
  "tool-call",
  "agent-timeline",
  "code-block",
  "citation",
  "context-meter",
  "approval-prompt",
  "artifact-card",
  "agent-orb",
  "thinking-indicator",
  "run-header",
  "task-list",
  "terminal",
  "diff-view",
  "file-changes",
  "trace-waterfall",
  "agent-fleet",
  "checkpoints",
  "browser-session",
  "prompt-queue",
];
