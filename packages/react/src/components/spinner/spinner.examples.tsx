"use client";

import { FileText, FolderGit2, HardDrive, ListTodo, RotateCw } from "lucide-react";
import * as React from "react";
import { Button } from "../button";
import { StatusGlyph } from "../status-glyph";
import { Spinner } from "./spinner";

export function SpinnerMinimal() {
  return <Spinner />;
}

export function SpinnerFull() {
  return (
    <div className="flex items-center gap-6 text-kura-fg-muted">
      <Spinner size="sm" label="Loading small" />
      <Spinner size="md" label="Loading medium" />
      <Spinner size="lg" label="Loading large" />
      <span className="inline-flex items-center gap-2 text-sm">
        <Spinner size="sm" label={null} /> Fetching models…
      </span>
    </div>
  );
}

type SourceStatus = "synced" | "syncing" | "error";

const initialSources: Array<{
  id: string;
  name: string;
  detail: string;
  icon: React.ReactNode;
  status: SourceStatus;
}> = [
  {
    id: "drive",
    name: "Product specs",
    detail: "Drive · 1,204 files",
    icon: <HardDrive />,
    status: "synced",
  },
  {
    id: "wiki",
    name: "Team wiki",
    detail: "Notion · 386 pages",
    icon: <FileText />,
    status: "syncing",
  },
  {
    id: "repo",
    name: "kura-ui/kura",
    detail: "GitHub · main",
    icon: <FolderGit2 />,
    status: "synced",
  },
  {
    id: "issues",
    name: "Roadmap issues",
    detail: "Linear · access expired",
    icon: <ListTodo />,
    status: "error",
  },
];

export function SpinnerSourcesList() {
  const [sources, setSources] = React.useState(initialSources);
  const [syncingAll, setSyncingAll] = React.useState(false);
  const syncing = sources.some((s) => s.status === "syncing");
  const timers = React.useRef<ReturnType<typeof setTimeout>[]>([]);
  React.useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Let the initial "Team wiki" sync finish so the demo settles.
  React.useEffect(() => {
    const id = setTimeout(
      () => setSources((all) => all.map((s) => (s.id === "wiki" ? { ...s, status: "synced" } : s))),
      3200,
    );
    return () => clearTimeout(id);
  }, []);

  const settle = (id: string, ms: number) =>
    timers.current.push(
      setTimeout(
        () => setSources((all) => all.map((s) => (s.id === id ? { ...s, status: "synced" } : s))),
        ms,
      ),
    );
  const syncOne = (id: string) => {
    setSources((all) => all.map((s) => (s.id === id ? { ...s, status: "syncing" } : s)));
    settle(id, 1800);
  };
  // Re-index healthy sources; one that needs reconnecting stays put until the user acts.
  const syncAll = () => {
    const healthy = sources.filter((s) => s.status !== "error");
    setSources((all) => all.map((s) => (s.status === "error" ? s : { ...s, status: "syncing" })));
    for (const [i, s] of healthy.entries()) settle(s.id, 900 + i * 650);
    setSyncingAll(true);
    timers.current.push(setTimeout(() => setSyncingAll(false), 900 + healthy.length * 650));
  };

  return (
    <section
      aria-labelledby="sources-title"
      className="flex w-full max-w-md flex-col rounded-kura-xl bg-kura-surface shadow-kura-sm"
    >
      <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-2">
        <div className="flex flex-col gap-0.5">
          <h3 id="sources-title" className="font-medium text-kura-fg text-sm">
            Knowledge sources
          </h3>
          <p className="text-kura-fg-muted text-xs" aria-live="polite">
            {syncing ? "Syncing — answers may miss recent changes" : "Indexed 2 minutes ago"}
          </p>
        </div>
        <Button variant="secondary" size="sm" loading={syncingAll} onClick={syncAll}>
          Sync now
        </Button>
      </div>
      <ul className="flex flex-col p-1.5">
        {sources.map((source) => (
          <li
            key={source.id}
            data-status={source.status}
            className="flex items-center gap-3 rounded-kura-md px-2.5 py-2"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-kura-md bg-kura-surface-sunken text-kura-fg-muted shadow-kura-xs [&_svg]:size-4">
              {source.icon}
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate font-medium text-[13px] text-kura-fg">{source.name}</span>
              <span className="truncate text-kura-fg-subtle text-xs">{source.detail}</span>
            </span>
            {source.status === "error" ? (
              <Button
                variant="outline"
                size="xs"
                aria-label={`Reconnect ${source.name}`}
                onClick={() => syncOne(source.id)}
              >
                <RotateCw />
                Reconnect
              </Button>
            ) : (
              <span className="inline-flex shrink-0 items-center gap-1.5 text-kura-fg-muted text-xs">
                {source.status === "syncing" ? (
                  <Spinner size="sm" label={null} />
                ) : (
                  <StatusGlyph status="done" size="sm" label={null} />
                )}
                {source.status === "syncing" ? "Indexing…" : "Up to date"}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
