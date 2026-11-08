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
import { CommandPalette, type CommandPaletteItem, CommandPaletteTrigger } from "./command-palette";

export function CommandPaletteMinimal() {
  return (
    <div className="w-72">
      <CommandPalette
        hotkey={null}
        trigger={<CommandPaletteTrigger />}
        items={[
          { id: "new", label: "New thread", icon: <MessageSquarePlus /> },
          { id: "search", label: "Search files", icon: <FileSearch /> },
          { id: "deploy", label: "Deploy a preview", icon: <Rocket /> },
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
    <div className="flex w-full max-w-lg flex-col gap-2.5">
      <div className="flex items-center gap-4 rounded-kura-md bg-kura-surface py-2 pr-2 pl-4 shadow-kura-xs">
        <div className="flex shrink-0 flex-col gap-0.5">
          <span className="font-kura-mono text-[10px] text-kura-fg-subtle uppercase tracking-[0.14em]">
            Workspace
          </span>
          <span className="font-medium text-kura-fg text-sm">Support triage</span>
        </div>
        <CommandPaletteTrigger
          placeholder="Run an agent, add context…"
          onClick={() => setOpen(true)}
          className="flex-1"
        />
      </div>
      <CommandPalette
        items={items}
        open={open}
        onOpenChange={setOpen}
        hotkey={["mod", "k"]}
        recent={recent}
        onRecentChange={setRecent}
        recentLimit={3}
        placeholder="Run an agent, add context, change settings…"
        emptyMessage="No commands match"
        label="Agent commands"
      />
      <p
        className="flex justify-between gap-3 px-1 font-kura-mono text-[10px] text-kura-fg-subtle uppercase tracking-[0.12em]"
        aria-live="polite"
      >
        <span>Last command</span>
        <span className="text-kura-fg-muted normal-case tracking-normal">{last}</span>
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
        trigger={
          <CommandPaletteTrigger placeholder="Search the codebase…" shortcut={["mod", "p"]} />
        }
        items={results}
        loading={loading}
        onQueryChange={search}
        placeholder="Type a file name…"
        emptyMessage="Type to search 7 files"
      />
    </div>
  );
}
