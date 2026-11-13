"use client";

import {
  Bot,
  Database,
  FileSearch,
  FolderGit2,
  KeyRound,
  MessageSquarePlus,
  Monitor,
  Moon,
  Palette,
  Play,
  Rocket,
  Square,
  Sun,
  Workflow,
} from "lucide-react";
import * as React from "react";
import { Button } from "../button";
import { KbdShortcut } from "../kbd-shortcut";
import { CommandPalette, type CommandPaletteItem, CommandPaletteTrigger } from "./command-palette";

export function CommandPaletteMinimal() {
  return (
    <div className="w-72">
      <CommandPalette
        hotkey={null}
        trigger={<CommandPaletteTrigger shortcut={null} />}
        items={[
          { id: "new", label: "New chat", icon: <MessageSquarePlus /> },
          { id: "search", label: "Search files", icon: <FileSearch /> },
          { id: "deploy", label: "Deploy preview", icon: <Rocket /> },
        ]}
      />
    </div>
  );
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function buildItems(log: (s: string) => void): CommandPaletteItem[] {
  return [
    {
      id: "run-agent",
      label: "Run agent",
      description: "on the current task",
      icon: <Play />,
      group: "Agent",
      shortcut: ["mod", "enter"],
      onSelect: () => log("Agent started"),
    },
    {
      id: "stop-agent",
      label: "Stop agent",
      icon: <Square />,
      group: "Agent",
      shortcut: ["mod", "."],
      onSelect: () => log("Agent stopped"),
    },
    {
      id: "switch-agent",
      label: "Switch agent…",
      icon: <Bot />,
      group: "Agent",
      placeholder: "Pick an agent…",
      children: [
        {
          id: "agent-research",
          label: "Researcher",
          description: "web + citations",
          onSelect: () => log("Researcher"),
        },
        {
          id: "agent-coder",
          label: "Coder",
          description: "repo + terminal",
          onSelect: () => log("Coder"),
        },
        {
          id: "agent-analyst",
          label: "Analyst",
          description: "SQL + charts",
          onSelect: () => log("Analyst"),
        },
      ],
    },
    {
      id: "workflows",
      label: "Run workflow…",
      icon: <Workflow />,
      group: "Agent",
      loadChildren: async () => {
        await wait(1200);
        return [
          { id: "wf-triage", label: "Triage new issues", onSelect: () => log("Triage running") },
          { id: "wf-digest", label: "Weekly digest", onSelect: () => log("Digest running") },
          { id: "wf-migrate", label: "Migrate schema", disabled: true },
        ];
      },
    },
    {
      id: "context-repo",
      label: "Add repository",
      icon: <FolderGit2 />,
      group: "Context",
      keywords: ["github", "git"],
      onSelect: () => log("Repository added"),
    },
    {
      id: "context-db",
      label: "Connect database",
      icon: <Database />,
      group: "Context",
      keywords: ["postgres", "sql"],
      onSelect: () => log("Database connected"),
    },
    {
      id: "theme",
      label: "Change theme…",
      icon: <Palette />,
      group: "Settings",
      children: [
        { id: "theme-light", label: "Light", icon: <Sun />, onSelect: () => log("Light theme") },
        { id: "theme-dark", label: "Dark", icon: <Moon />, onSelect: () => log("Dark theme") },
        {
          id: "theme-system",
          label: "System",
          icon: <Monitor />,
          onSelect: () => log("System theme"),
        },
      ],
    },
    {
      id: "keys",
      label: "API keys",
      icon: <KeyRound />,
      group: "Settings",
      shortcut: ["mod", ","],
      onSelect: () => log("API keys"),
    },
  ];
}

export function CommandPaletteFull() {
  const [open, setOpen] = React.useState(false);
  const [last, setLast] = React.useState("Nothing run yet");
  const [recent, setRecent] = React.useState<string[]>(["context-repo", "run-agent"]);
  const items = React.useMemo(() => buildItems(setLast), []);
  return (
    <div className="flex flex-col items-center gap-3">
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Open palette
      </Button>
      <CommandPalette
        items={items}
        open={open}
        onOpenChange={setOpen}
        // ⌘K belongs to the page this example sits on, so the palette takes ⌘J here.
        hotkey={["mod", "j"]}
        recent={recent}
        onRecentChange={setRecent}
        recentLimit={3}
        placeholder="Run an agent, add context, change settings…"
        emptyMessage="No commands match"
        label="Agent commands"
      />
      <KbdShortcut keys={["mod", "j"]} label="or press" className="pointer-coarse:hidden" />
      <p className="text-kura-fg-subtle text-xs" aria-live="polite">
        {last}
      </p>
    </div>
  );
}

const files = [
  "src/app/page.tsx",
  "src/app/layout.tsx",
  "src/lib/auth.ts",
  "src/lib/billing/invoice.ts",
  "src/components/chat/composer.tsx",
  "src/components/chat/message-list.tsx",
  "README.md",
];

export function CommandPaletteAsyncSearch() {
  const [results, setResults] = React.useState<CommandPaletteItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = (q: string) => {
    if (timer.current) clearTimeout(timer.current);
    if (!q.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    timer.current = setTimeout(() => {
      setResults(
        files
          .filter((f) => f.toLowerCase().includes(q.toLowerCase().split(" ")[0] ?? ""))
          .map((f) => ({
            id: f,
            label: f.split("/").pop() ?? f,
            description: f,
            icon: <FileSearch />,
            group: "Files",
          })),
      );
      setLoading(false);
    }, 500);
  };

  return (
    <div className="w-80">
      <CommandPalette
        hotkey={null}
        trigger={<CommandPaletteTrigger placeholder="Search the codebase…" shortcut={null} />}
        items={results}
        loading={loading}
        onQueryChange={search}
        placeholder="Type a file name…"
        emptyMessage="Type to search 7 files"
      />
    </div>
  );
}
